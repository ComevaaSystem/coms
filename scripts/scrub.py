#!/usr/bin/env python3
"""Blocking scrub: refuses publication while client data remains in the repository.

Two layers:
- Blocklist tokens (client names, people, domains, known real figures). The list
  is NEVER committed: it lives in .scrub/blocklist.txt (gitignored) locally, or
  in the SCRUB_BLOCKLIST env var (one token per line) in CI. Matching is
  accent-insensitive and case-insensitive, on word boundaries; a long word matches
  through a short run of separators between its letters, the words of a multi-word
  token through any short run between them, and a figure through its thousands
  separators.
- Hard patterns that are sensitive by shape alone (ad account ids, HubSpot and
  Google Ads ids). Euro amounts are reported as warnings for human review, not
  blocked: a regex cannot know whether a figure comes from a real account.

Only UTF-8 text leaves. A blob the scrub cannot read as text (an image, a PDF, an Office
file, an Excel or Mac CSV, a UTF-16 export) is refused as such: each of those formats
can carry a client name in a way a text scan misses, and this repository holds only
text. Convert it to UTF-8 text first.

Four scopes, each of them paths AND content:
- Default: the index, what the next commit and CI hold.
- --tree <rev>: the tree of a commit, read from git objects without checking it out.
- --commits <rev-list args>: what a set of commits ADDS: added lines (and a name split
  across an added line and its neighbour), every path they touch, messages, author and
  committer. The pre-push hook calls it on the commits about to leave: the repository is
  public, and a pushed commit stays readable even once its branch is gone (a pull
  request keeps refs/pull/N/head). Removed lines are not scanned, they were already
  public, and scanning them would refuse the very commit that removes a leak.
- --stdin: free text (ref names, a tag message, a pull request title).

Exit 1 on any blocklist or pattern hit. Warnings never block. In GitHub Actions, where
the logs of a public repository are public, a hit never prints the token, the line, nor
the path (which can itself carry the client name): only a short hash of the path.

Known limit: CI runs the pull request's own copy of this file. A pull request that
edits the guard judges itself, and gets a human read before its merge.
"""

import argparse
import base64
import binascii
import hashlib
import html
import os
import re
import subprocess
import sys
import unicodedata
from urllib.parse import unquote_plus

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# The pre-push hook refuses a scrub that does not answer this: an older checkout of
# scripts/scrub.py would ignore --commits and pass on the tree alone.
HANDSHAKE = "scrub-guard-3"

HARD_PATTERNS = [
    ("meta ad account id", re.compile(r"\bact[_=]\d{6,}\b")),
    ("google ads customer id", re.compile(r"\b\d{3}-\d{3}-\d{4}\b")),
    ("google ads url id", re.compile(r"\b(?:__c|ocid|customer_id)=\d{9,10}\b")),
    ("hubspot portal id", re.compile(r"\bportal[_ -]?id\D{0,3}\d{6,}\b", re.I)),
    ("hubspot account url", re.compile(r"hubspot\.com/[a-z-]+/\d{5,}", re.I)),
]

WARN_PATTERNS = [
    # Bounded runs: an unbounded one is quadratic on a long line of numbers (chart data).
    ("euro amount, check provenance", re.compile(r"(?<![\d.,])\d[\d\s.,]{2,30}\s?(?:€|EUR)(?!\w)|€\s?\d")),
]

# Punctuation that may split a name: "Blue-Sky", "blue__sky", "Blue.Sky".
PUNCT = r"!-/:-@\[-`{-~«»‐-―…·•"
# Between two words of a token: up to three spaces or marks ("Blue - Sky"). Glued is
# allowed only when the glued form is long enough to be unambiguous: "C&A" glued is "ca".
SEPARATOR = rf"[\s{PUNCT}]{{0,3}}"
REQUIRED_SEPARATOR = rf"[\s{PUNCT}]{{1,3}}"
# Inside one word: marks anywhere ("Du-pont"), or the same separator between every letter
# ("D u p o n t", "D.u.p.o.n.t"), but never a single space, which turns "Dupont" into
# "du pont" and "Laplace" into "la place". A word shorter than LONG_WORD matches only as
# written: with anything inside, "isa" would match "is a".
MARKS = rf"[{PUNCT}]{{0,2}}"
LONG_WORD = 6
# Between the digit groups of a figure: a thousands separator, only before a group of three
# ("6 900", "6,900", "12_000"), so never "69,00", "20:24" or "2/6". A decimal part keeps
# its mark: "2,6" is not "26".
THOUSANDS = r"[ .,'’_]?"
PUBLIC_LOG = os.environ.get("GITHUB_ACTIONS") == "true"


def fold(text: str) -> str:
    """Lowercase, accents removed, invisible format characters (zero-width space...) and
    whitespace runs turned into one space: they separate words, they never glue them."""
    out = []
    for c in unicodedata.normalize("NFKD", text.lower()):
        cat = unicodedata.category(c)
        if cat == "Mn":
            continue
        out.append(" " if cat == "Cf" else c)
    return re.sub(r"\s+", " ", "".join(out))


def git_bytes(*args: str) -> bytes:
    # Paths are never quoted nor recomposed, attributes cannot hide a file's content, a
    # root commit always shows its diff and messages come out in UTF-8, whatever the
    # user's configuration says.
    pinned = (
        "core.quotepath=false", "core.precomposeunicode=false", "core.attributesFile=/dev/null",
        "log.showRoot=true", "i18n.logOutputEncoding=UTF-8",
    )
    cmd = ["git"]
    for option in pinned:
        cmd += ["-c", option]
    return subprocess.run([*cmd, *args], cwd=REPO, capture_output=True, check=True).stdout


def git(*args: str) -> str:
    return git_bytes(*args).decode("utf-8", errors="replace")


def blocklist_file() -> str:
    # In a linked worktree, the list sits next to the main working tree.
    local = os.path.join(REPO, ".scrub", "blocklist.txt")
    if os.path.exists(local):
        return local
    common = git("rev-parse", "--path-format=absolute", "--git-common-dir").strip()
    return os.path.join(os.path.dirname(common), ".scrub", "blocklist.txt")


def load_blocklist() -> list[str]:
    raw = os.environ.get("SCRUB_BLOCKLIST", "")
    if not raw:
        path = blocklist_file()
        if os.path.exists(path):
            with open(path, encoding="utf-8") as f:
                raw = f.read()
    tokens = [fold(line.strip()) for line in raw.splitlines()]
    return [t for t in tokens if t.strip() and not t.startswith("#")]


def figure_pattern(digits: str) -> str:
    groups = []
    while len(digits) > 3:
        groups.insert(0, digits[-3:])
        digits = digits[:-3]
    groups.insert(0, digits)
    return THOUSANDS.join(re.escape(g) for g in groups)


class Patterns:
    """Builds one alternation; each spaced-out word gets its own group name, so the
    separator it starts with must repeat between every letter."""

    def __init__(self):
        self.n = 0

    def word(self, word: str) -> str:
        if word.isdigit():
            return figure_pattern(word)
        if len(word) < LONG_WORD:
            return re.escape(word)
        self.n += 1
        g = f"s{self.n}"
        chars = [re.escape(c) for c in word]
        marks = MARKS.join(chars)
        spaced = chars[0] + rf"(?P<{g}>[\s{PUNCT}]{{1,2}})" + f"(?P={g})".join(chars[1:]) if len(chars) > 1 else chars[0]
        return f"(?:{marks}|{spaced})"

    def token(self, token: str) -> str | None:
        words = [w for w in re.split(r"[\W_]+", token) if w]
        if not words:
            return None
        if all(w.isdigit() for w in words):
            out = figure_pattern(words[0])
            for w in words[1:]:
                out += (THOUSANDS if len(w) == 3 else "[.,]") + figure_pattern(w)
            return out
        joiner = SEPARATOR if sum(len(w) for w in words) >= LONG_WORD else REQUIRED_SEPARATOR
        return joiner.join(self.word(w) for w in words)


def blocklist_regex(blocklist: list[str]) -> re.Pattern:
    patterns = Patterns()
    variants = [p for p in (patterns.token(t) for t in blocklist) if p]
    return re.compile(r"(?<![a-z0-9])(?:" + "|".join(variants) + r")(?![a-z0-9])")


TAG = re.compile(r"<[^>\n]{0,200}>")
# An image or a file carried inside a text file: it is read like a committed one, so an
# embedded image is refused as "not UTF-8 text" and embedded text is scanned.
DATA_URI = re.compile(r"data:[\w.+-]+/[\w.+-]+(?:;[\w=.-]+)*;base64,([A-Za-z0-9+/=_-]+)")
BASE64_RUN = re.compile(r"[A-Za-z0-9+/_-]{24,}={0,2}")
MAX_DEPTH = 2


def unbase64(s: str) -> bytes | None:
    s = s + "=" * (-len(s) % 4)
    for decode in (base64.b64decode, base64.urlsafe_b64decode):
        try:
            return decode(s.encode(), validate=True) if decode is base64.b64decode else decode(s.encode())
        except (binascii.Error, ValueError):
            continue
    return None
JSON_ESCAPE = re.compile(r"\\u([0-9a-fA-F]{4})")


def variants(text: str) -> list[str]:
    """The text, and the text as a URL, an HTML page or a JSON string would carry it."""
    out = [text]
    decoded = text
    for _ in range(3):
        again = unquote_plus(decoded)
        if again == decoded:
            break
        decoded = again
    for candidate in (decoded, html.unescape(text), TAG.sub(" ", html.unescape(text)),
                      JSON_ESCAPE.sub(lambda m: chr(int(m.group(1), 16)), text)):
        if candidate not in out:
            out.append(candidate)
    return out


def text_of(data: bytes) -> str | None:
    """The blob as text, or None when it is not UTF-8 text the scrub can read."""
    if data.startswith(b"\xef\xbb\xbf"):
        data = data[3:]
    try:
        text = data.decode("utf-8")
    except UnicodeDecodeError:
        return None
    return None if re.search(r"[\x00-\x08\x0b\x0e-\x1f\x7f]", text) else text


def lines_of(text: str) -> list[str]:
    # Git splits on \n only: splitlines() would also break on \r, \f, U+2028... and the
    # piece after the break, not starting with "+", would go unscanned.
    return text.split("\n")


class Scan:
    def __init__(self, blocklist: list[str]):
        self.block_re = blocklist_regex(blocklist)
        self.hits: list[str] = []
        self.warns: list[str] = []

    @staticmethod
    def where(label: str, path: str) -> str:
        shown = "path#" + hashlib.sha1(path.encode()).hexdigest()[:8] if PUBLIC_LOG else path
        return f"{label} {shown}".strip()

    def token(self, m: re.Match) -> str:
        return "" if PUBLIC_LOG else f" '{m.group(0)}'"

    def search(self, text: str) -> re.Match | None:
        for v in variants(text):
            m = self.block_re.search(fold(v))
            if m:
                return m
        return None

    def embedded(self, where: str, n: int, text: str, depth: int) -> None:
        if depth >= MAX_DEPTH:
            return
        for m in DATA_URI.finditer(text):
            data = unbase64(m.group(1))
            if data is not None:
                self.blob(f"{where}:{n} (embedded file)", data, warn=False, depth=depth + 1)
        # Any other base64 run that decodes to text is text; one that decodes to bytes is
        # left alone, hashes and ids look like base64 too.
        for m in BASE64_RUN.finditer(text):
            data = unbase64(m.group(0))
            decoded = text_of(data) if data else None
            if decoded:
                self.text(f"{where}:{n} (base64)", decoded, depth=depth + 1)

    def line(self, where: str, n: int, text: str, warn: bool, depth: int = 0) -> None:
        self.embedded(where, n, text, depth)
        m = self.search(text)
        if m:
            self.hits.append(f"{where}:{n}: blocklist token{self.token(m)}")
        for label, pat in HARD_PATTERNS:
            if any(pat.search(v) for v in variants(text)):
                self.hits.append(f"{where}:{n}: {label}")
        if warn:
            for label, pat in WARN_PATTERNS:
                if pat.search(text):
                    self.warns.append(f"{where}:{n}: {label}" + ("" if PUBLIC_LOG else f": {text.strip()[:80]}"))

    def pair(self, where: str, n: int, first: str, second: str) -> None:
        """A name wrapped across two lines: only a match that spans the break counts, one
        inside either line is that line's own business. Comment and list markers, tags
        and punctuation at the break are dropped."""
        a = re.sub(r"[\W_]+$", "", fold(TAG.sub(" ", first)))
        b = re.sub(r"^(?:[\W_]+|\d{1,3}[.)])+", "", fold(TAG.sub(" ", second)))
        if not a or not b:
            return
        for m in self.block_re.finditer(f"{a} {b}"):
            if m.start() < len(a) < m.end():
                self.hits.append(f"{where}:{n}: blocklist token across two lines{self.token(m)}")
                return

    def sequence(self, where: str, seq: list[tuple[int, str, bool]], warn: bool = False, depth: int = 0) -> None:
        """seq: (line number, text, is it new). New lines are scanned alone; a pair is
        scanned when at least one of its two lines is new."""
        for i, (n, text, new) in enumerate(seq):
            if new:
                self.line(where, n, text, warn, depth)
            if i and (new or seq[i - 1][2]):
                self.pair(where, n, seq[i - 1][1], text)

    def text(self, where: str, text: str, warn: bool = False, depth: int = 0) -> None:
        self.sequence(where, [(i, t, True) for i, t in enumerate(lines_of(text), 1)], warn, depth)

    def blob(self, where: str, data: bytes, warn: bool = True, depth: int = 0) -> None:
        text = text_of(data)
        if text is None:
            self.hits.append(f"{where}: not UTF-8 text, the scrub cannot read it: convert it to text before it leaves")
        else:
            self.text(where, text, warn, depth)

    def path(self, label: str, path: str) -> None:
        m = self.search(path)
        if m:
            self.hits.append(f"{self.where(label, path)}: blocklist token in the path{self.token(m)}")
        for name, pat in HARD_PATTERNS:
            if any(pat.search(v) for v in variants(path)):
                self.hits.append(f"{self.where(label, path)}: {name} in the path")

    def raw_path(self, label: str, raw: bytes) -> str:
        try:
            path = raw.decode("utf-8")
        except UnicodeDecodeError:
            path = raw.decode("utf-8", errors="replace")
            self.hits.append(f"{self.where(label, path)}: a path that is not UTF-8")
        self.path(label, path)
        return path

    def report(self, scope: str) -> int:
        for w in dict.fromkeys(self.warns):
            print(f"WARN  {w}")
        hits = list(dict.fromkeys(self.hits))
        for h in hits:
            print(f"BLOCK {h}")
        if hits:
            print(f"\nscrub: {len(hits)} blocking hit(s) in {scope}. Publication refused, nothing leaves.")
            return 1
        print(f"scrub: {scope} clean ({len(self.warns)} warning(s) to review).")
        return 0


def scan_entries(scan: Scan, listing: bytes, index: bool) -> None:
    """Content read from git objects, never from the disk: a symlink's target and a file
    whose name is not UTF-8 are read like any other; a submodule is only a path."""
    for entry in listing.split(b"\0"):
        if not entry:
            continue
        meta, raw = entry.split(b"\t", 1)
        if index:
            mode, obj, _stage = meta.decode().split()
        else:
            mode, _kind, obj = meta.decode().split()
        if raw.startswith(b".scrub/"):
            continue
        path = scan.raw_path("", raw)
        if mode != "160000":
            scan.blob(scan.where("", path), git_bytes("cat-file", "blob", obj))


def base_of(sha: str) -> str:
    """The first parent, or the empty tree for a root commit: a merge is read against its
    first parent (the combined diff hides what one side brought, and that side is what
    becomes public with the merge), and a root commit adds everything it holds."""
    parents = git("rev-list", "--parents", "-n", "1", sha).split()[1:]
    return parents[0] if parents else git("hash-object", "-t", "tree", "/dev/null").strip()


def scan_commits(scan: Scan, rev_args: list[str]) -> None:
    for sha in git("rev-list", *rev_args).split():
        short, base = sha[:8], base_of(sha)
        scan.blob(f"{short} message", git_bytes("log", "-1", "--format=%B", sha), warn=False)
        scan.blob(f"{short} author", git_bytes("log", "-1", "--format=%an%n%ae%n%cn%n%ce", sha), warn=False)
        # Every file the commit adds or changes, empty ones included: a client-named
        # folder holding only a .gitkeep has no content line to catch it.
        tokens = git_bytes("diff-tree", "-r", "-z", "--no-renames", base, sha).split(b"\0")
        for meta, raw in zip(tokens[0::2], tokens[1::2]):
            old_mode, new_mode, old_obj, new_obj, status = meta.decode().lstrip(":").split()
            if status == "D":
                continue
            path = scan.raw_path(short, raw)
            if new_mode == "160000":  # a submodule: nothing of it is in this repository
                continue
            where = scan.where(short, path)
            data = git_bytes("cat-file", "blob", new_obj)
            # A new file, a type change (a submodule or a symlink becoming a file) or
            # anything not text is read whole: there is no text diff to lean on.
            if status in ("A", "T") or old_mode in ("160000", "120000") or text_of(data) is None:
                scan.blob(where, data)
            else:
                scan.sequence(where, added_with_context(old_obj, new_obj), warn=True)


HUNK = re.compile(r"@@ -\S+ \+(\d+)")


def added_with_context(old_obj: str, new_obj: str) -> list[tuple[int, str, bool]]:
    """Added lines of one file, with one line of context: a name split across an added
    line and an existing neighbour is caught, a name inside the neighbour alone is not
    this commit's doing. The two blobs are diffed by id: no path, so no pathspec that a
    name the filesystem rewrites could miss."""
    diff = git("diff", "--unified=1", "--no-color", "--no-ext-diff", "--text", "--no-textconv", old_obj, new_obj)
    seq, in_header, n = [], True, 0
    for line in lines_of(diff):
        if line.startswith("diff --git "):
            in_header = True
        elif line.startswith("@@"):
            # "--- " and "+++ " are headers only before the first hunk: a content line
            # "++ something" shows as "+++ something" and must stay content.
            in_header = False
            n = int(HUNK.match(line).group(1))
            seq.append((n, "", False))  # hunk boundary: no pair across hunks
        elif in_header:
            continue
        elif line.startswith("+"):
            seq.append((n, line[1:], True))
            n += 1
        elif line.startswith(" "):
            seq.append((n, line[1:], False))
            n += 1
    return seq


def main() -> int:
    parser = argparse.ArgumentParser()
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--commits", nargs=argparse.REMAINDER, help="rev-list arguments")
    group.add_argument("--tree", metavar="REV")
    group.add_argument("--stdin", action="store_true")
    group.add_argument("--handshake", action="store_true")
    args = parser.parse_args()

    if args.handshake:
        print(HANDSHAKE)
        return 0

    blocklist = load_blocklist()
    if not blocklist:
        print("scrub: EMPTY BLOCKLIST (.scrub/blocklist.txt or SCRUB_BLOCKLIST). Refusing to pass on nothing.")
        return 1
    scan = Scan(blocklist)

    if args.commits is not None:
        if not args.commits:
            print("scrub: --commits needs rev-list arguments.")
            return 1
        scan_commits(scan, args.commits)
        return scan.report("the commits")
    if args.tree:
        scan_entries(scan, git_bytes("ls-tree", "-r", "-z", "--full-tree", args.tree), index=False)
        return scan.report("the tree")
    if args.stdin:
        # Fails closed like a file: a tag message in Latin-1 is refused, not half-read.
        scan.blob("text", sys.stdin.buffer.read(), warn=False)
        return scan.report("the text")
    scan_entries(scan, git_bytes("ls-files", "-s", "-z"), index=True)
    return scan.report("the index")


if __name__ == "__main__":
    sys.exit(main())
