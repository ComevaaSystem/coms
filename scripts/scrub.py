#!/usr/bin/env python3
"""Blocking scrub: refuses publication while client data remains in the tree.

Two layers:
- Blocklist tokens (client names, people, domains, known real figures). The list
  is NEVER committed: it lives in .scrub/blocklist.txt (gitignored) locally, or
  in the SCRUB_BLOCKLIST env var (one token per line) in CI. Matching is
  accent-insensitive and case-insensitive, on word boundaries.
- Hard patterns that are sensitive by shape alone (ad account ids, HubSpot
  portal ids). Euro amounts are reported as warnings for human review, not
  blocked: a regex cannot know whether a figure comes from a real account.

Exit 1 on any blocklist or pattern hit. Warnings never block.
"""

import os
import re
import subprocess
import sys
import unicodedata

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BLOCKLIST_FILE = os.path.join(REPO, ".scrub", "blocklist.txt")

HARD_PATTERNS = [
    ("meta ad account id", re.compile(r"\bact_\d{6,}\b")),
    ("google ads customer id", re.compile(r"\b\d{3}-\d{3}-\d{4}\b")),
    ("hubspot portal id", re.compile(r"\bportal[_ -]?id\D{0,3}\d{6,}\b", re.I)),
]

WARN_PATTERNS = [
    ("euro amount, check provenance", re.compile(r"\b\d[\d  .,]{2,}\s?(?:€|EUR)\b|\b€\s?\d[\d .,]*\b")),
]


def fold(text: str) -> str:
    return "".join(
        c for c in unicodedata.normalize("NFD", text.lower()) if unicodedata.category(c) != "Mn"
    )


def load_blocklist() -> list[str]:
    raw = os.environ.get("SCRUB_BLOCKLIST", "")
    if not raw and os.path.exists(BLOCKLIST_FILE):
        with open(BLOCKLIST_FILE, encoding="utf-8") as f:
            raw = f.read()
    tokens = [fold(line.strip()) for line in raw.splitlines()]
    return [t for t in tokens if t and not t.startswith("#")]


def tracked_files() -> list[str]:
    out = subprocess.run(
        ["git", "ls-files"], cwd=REPO, capture_output=True, text=True, check=True
    ).stdout.splitlines()
    return [f for f in out if not f.startswith(".scrub/")]


def main() -> int:
    blocklist = load_blocklist()
    if not blocklist:
        print("scrub: EMPTY BLOCKLIST (.scrub/blocklist.txt or SCRUB_BLOCKLIST). Refusing to pass on nothing.")
        return 1

    block_re = re.compile(
        r"(?<![a-z0-9])(?:" + "|".join(re.escape(t) for t in blocklist) + r")(?![a-z0-9])"
    )

    hits, warns = [], []
    for path in tracked_files():
        full = os.path.join(REPO, path)
        try:
            with open(full, encoding="utf-8") as f:
                lines = f.readlines()
        except (UnicodeDecodeError, IsADirectoryError, FileNotFoundError):
            continue
        for i, line in enumerate(lines, 1):
            folded = fold(line)
            m = block_re.search(folded)
            if m:
                hits.append(f"{path}:{i}: blocklist token '{m.group(0)}'")
            for label, pat in HARD_PATTERNS:
                if pat.search(line):
                    hits.append(f"{path}:{i}: {label}")
            for label, pat in WARN_PATTERNS:
                if pat.search(line):
                    warns.append(f"{path}:{i}: {label}: {line.strip()[:80]}")

    for w in warns:
        print(f"WARN  {w}")
    for h in hits:
        print(f"BLOCK {h}")
    if hits:
        print(f"\nscrub: {len(hits)} blocking hit(s). Publication refused.")
        return 1
    print(f"scrub: clean ({len(warns)} warning(s) to review).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
