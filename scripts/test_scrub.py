#!/usr/bin/env python3
"""The publication guard, exercised on a disposable repository with a made-up client.

The pre-push hook and the scrub are the only things standing between a client name and a
public, permanent commit. A guard nobody runs rots silently: this runs in CI next to the
scrub itself. No real blocklist is needed: the fake client is drawn at random on each
run and injected through SCRUB_BLOCKLIST. Every fixture the scrub would recognise (the
fake name, an ad account id...) is built at run time: written out in this file, it would
trip the very scrub that reads this file.
"""

import os
import random
import shutil
import struct
import subprocess
import tempfile
import unittest
import zipfile

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_rng = random.Random()
_letters = "bcdfghjklmnpqrstvwxz"
# An "e" in the first word, so an accented spelling of the same name can be written.
A = "".join(_rng.choice(_letters) for _ in range(2)) + "e" + "".join(_rng.choice(_letters) for _ in range(3))
A_ACCENT = A.replace("e", "é", 1)
B = "".join(_rng.choice(_letters) for _ in range(6))
FAKE = A + B                                  # the blocklist token, one word
TWO_WORDS = f"{A} {B}"                        # the same client, as a two-word token
NAME = A.capitalize() + B.capitalize()        # how it is written in a document
AD_ACCOUNT = "act" + "_" + "1" * 9
GOOGLE_ID = "-".join(("123", "456", "7890"))
PORTAL = "portal" + "_id: " + "7" * 8
HUBSPOT_URL = "app.hubspot" + ".com/contacts/" + "4" * 7
GOOGLE_URL = "ocid" + "=" + "5" * 10
GUARD = ("scripts/scrub.py", "scripts/install-hooks.sh", "scripts/scan-ref.sh", ".githooks/pre-push")
IDENTITY = {"GIT_AUTHOR_NAME": "Test Author", "GIT_AUTHOR_EMAIL": "author@example.invalid",
            "GIT_COMMITTER_NAME": "Test Committer", "GIT_COMMITTER_EMAIL": "committer@example.invalid"}


class Guard(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp(prefix="scrub-")
        self.env = {
            **os.environ, **IDENTITY,
            "SCRUB_BLOCKLIST": FAKE,
            "GIT_CONFIG_NOSYSTEM": "1", "GIT_CONFIG_GLOBAL": os.devnull, "GITHUB_ACTIONS": "",
        }
        self.origin = os.path.join(self.tmp, "origin.git")
        self.work = os.path.join(self.tmp, "work")
        self.git(self.tmp, "init", "-q", "--bare", "-b", "main", self.origin)
        self.git(self.tmp, "clone", "-q", self.origin, self.work)
        self.copy_guard()
        self.assertEqual(self.run_in_work("sh", "scripts/install-hooks.sh").returncode, 0)
        self.write("README.md", "public method\n")
        self.git(self.work, "add", "-A")
        self.git(self.work, "commit", "-q", "-m", "init")
        self.assertEqual(self.push("HEAD:main").returncode, 0)

    def tearDown(self):
        shutil.rmtree(self.tmp, ignore_errors=True)

    def copy_guard(self):
        for f in GUARD:
            os.makedirs(os.path.dirname(os.path.join(self.work, f)), exist_ok=True)
            shutil.copy2(os.path.join(REPO, f), os.path.join(self.work, f))

    def git(self, cwd, *args):
        return subprocess.run(["git", *args], cwd=cwd, env=self.env, check=True, capture_output=True, text=True)

    def run_in_work(self, *cmd, stdin=None, env=None, cwd=None):
        return subprocess.run(list(cmd), cwd=cwd or self.work, env=env or self.env, capture_output=True, input=stdin)

    def push(self, *args, cwd=None):
        return subprocess.run(["git", "push", "-q", "origin", *args], cwd=cwd or self.work, env=self.env, capture_output=True, text=True)

    def write(self, name, data):
        path = os.path.join(self.work, name)
        os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
        if isinstance(data, str):
            data = data.encode("utf-8")
        with open(path, "wb") as f:
            f.write(data)

    def commit(self, name, data, message="change"):
        self.write(name, data)
        self.git(self.work, "add", name)
        self.git(self.work, "commit", "-q", "-m", message)

    def reset(self):
        self.git(self.work, "reset", "-q", "--hard", "origin/main")

    def remote_has(self, ref):
        return subprocess.run(["git", "rev-parse", "--verify", "-q", ref], cwd=self.origin, capture_output=True).returncode == 0

    def refused(self, *push_args, why="blocklist token"):
        r = self.push(*(push_args or ("HEAD:main",)))
        out = r.stdout + r.stderr
        self.assertNotEqual(r.returncode, 0, out)
        self.assertIn("Nothing leaves", out)
        self.assertIn(why, out)
        self.assertNotIn("Traceback", out)
        return r

    def leaves(self, *push_args):
        r = self.push(*(push_args or ("HEAD:main",)))
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)

    def scrub(self, *args, env=None, stdin=None):
        return self.run_in_work("python3", "scripts/scrub.py", *args, env=env, stdin=stdin)

    def published_then_edited(self, name, before, after, attributes=None):
        """An existing, already public file receives the line: the diff path, not the
        whole-file path a new file takes."""
        self.env["SCRUB_BLOCKLIST"] = "unrelatedtoken"
        if attributes:
            self.commit(".gitattributes", attributes)
        self.commit(name, before)
        self.leaves()
        self.env["SCRUB_BLOCKLIST"] = FAKE
        self.commit(name, after)


class WhatNeverLeaves(Guard):
    def test_a_client_name_in_a_file(self):
        self.commit("deck.md", f"Case study: {A.capitalize()}-{B.capitalize()} doubled its leads\n")
        self.refused()

    def test_a_client_name_added_to_an_existing_file(self):
        self.published_then_edited("deck.md", "intro\nend\n", f"intro\n{NAME} doubled its leads\nend\n")
        self.refused()

    def test_a_leak_added_then_removed(self):
        self.commit("deck.md", f"{FAKE}\n")
        self.commit("deck.md", "anonymised\n", message="scrub")
        self.refused()

    def test_a_line_starting_with_two_plus_signs(self):
        self.published_then_edited("pros.md", "intro\nend\n", f"intro\n++ {NAME} figures\nend\n")
        self.commit("pros.md", "intro\nend\n", message="scrub")
        self.refused()

    def test_a_new_branch(self):
        self.git(self.work, "switch", "-q", "-c", "feature")
        self.commit("notes.md", f"{FAKE.upper()} figures\n")
        self.refused("feature")
        self.assertFalse(self.remote_has("refs/heads/feature"))

    def test_a_commit_message(self):
        self.commit("notes.md", "neutral\n", message=f"Deck for {NAME}")
        self.refused()

    def test_an_author_or_committer(self):
        for var, value in (("GIT_AUTHOR_NAME", f"Jane from {NAME}"), ("GIT_AUTHOR_EMAIL", f"j@{FAKE}.com"),
                           ("GIT_COMMITTER_NAME", NAME), ("GIT_COMMITTER_EMAIL", f"x@{FAKE}.fr")):
            self.env[var] = value
            self.commit("notes.md", f"neutral {var}\n")
            self.env[var] = IDENTITY[var]
            self.refused()
            self.reset()

    def test_a_path_with_neutral_content(self):
        for i, path in enumerate((f"{FAKE}.md", f"docs/{A}%20{B}.md", f"docs/{A}&amp;{B}.md", f"{A_ACCENT}-{B}.md")):
            self.commit(path, "neutral\n")
            self.refused(why="in the path")
            self.reset()

    def test_an_empty_file_in_a_client_folder(self):
        self.commit(f"clients/{FAKE}/.gitkeep", "")
        self.refused(why="in the path")

    def test_a_pure_rename_to_a_client_path(self):
        self.commit("neutral.md", "neutral\n")
        self.leaves()
        self.git(self.work, "mv", "neutral.md", f"{FAKE}.md")
        self.git(self.work, "commit", "-q", "-m", "rename")
        self.refused(why="in the path")

    def test_a_path_that_is_not_utf8(self):
        blob = self.run_in_work("git", "hash-object", "-w", "--stdin", stdin=b"neutral\n").stdout.decode().strip()
        # Bytes, not str: a str would reach git as the UTF-8 "ÿ", a valid name.
        subprocess.run([b"git", b"update-index", b"--add", b"--cacheinfo", b"100644," + blob.encode() + b",notes\xff.md"],
                       cwd=self.work, env=self.env, check=True)
        self.git(self.work, "commit", "-q", "-m", "odd name")
        self.refused(why="not UTF-8")

    def test_anything_the_scrub_cannot_read_as_text(self):
        # Each of these can carry a client name where a text scan misses it: none leaves,
        # clean or not.
        docx = os.path.join(self.tmp, "deck.docx")
        with zipfile.ZipFile(docx, "w") as z:
            z.writestr("word/document.xml", "<w:t>neutral</w:t>")
        with open(docx, "rb") as f:
            docx_bytes = f.read()
        exif_title = "neutral".encode("utf-16-le")
        jpeg = b"\xff\xd8\xff\xe1" + struct.pack(">H", len(exif_title) + 8) + b"Exif\x00\x00" + exif_title + b"\xff\xd9"
        samples = {
            "mac.csv": "Société;Budget\rDupont;6900\r".encode("mac_roman"),
            "excel.csv": "Société;Dupont\n".encode("cp1252"),
            "export.csv": "Société\nDupont\n".encode("utf-16"),
            "export-le.csv": "Société\nDupont\n".encode("utf-16-le"),
            "cover.png": b"\x89PNG\r\n\x1a\n\x00\x00\x00\x0dIHDR" + b"\x00" * 13,
            "photo.jpg": jpeg,
            "deck.docx": docx_bytes,
            "guide.pdf": b"%PDF-1.7\n1 0 obj\n<< /Filter /FlateDecode >>\nstream\n\x78\x9c\x03\x00\x00\x00\x00\x01\nendstream\n",
            "escape.txt": b"neutral \x1b[31m text\n",
        }
        for name, data in samples.items():
            self.commit(name, data)
            self.refused(why="not UTF-8 text")
            self.reset()

    def test_text_after_a_form_feed_a_line_separator_or_a_carriage_return(self):
        for i, sep in enumerate(("\x0c", " ", "\r", "\u0085")):
            self.commit(f"n{i}.md", f"intro{sep}{FAKE}\n")
            self.refused()
            self.reset()

    def test_a_file_hidden_by_gitattributes(self):
        for i, attrs in enumerate(("*.md -diff\n", "*.md binary\n")):
            self.published_then_edited(f"hidden{i}.md", "intro\nend\n", f"intro\n{FAKE}\nend\n", attributes=attrs)
            self.refused()
            self.reset()

    def test_spelling_variants(self):
        self.env["SCRUB_BLOCKLIST"] = TWO_WORDS
        for i, variant in enumerate((NAME, f"{A}_{B}", f"{A_ACCENT.capitalize()} {B}", f"{A} - {B}", f"{A} – {B}",
                                     f"{A}  {B}", f"{A}​{B}", f"{A}%20{B}", f"{A}%2520{B}", f"{A}+{B}",
                                     f"{A}&#32;{B}", f"{A}\\u0020{B}", f"{A}<br>{B}", f"{A[:3]}.{A[3:]} {B}")):
            self.commit(f"v{i}.md", f"see {variant} here\n")
            self.refused()
            self.reset()

    def test_a_zero_width_space_does_not_glue_a_name_to_the_word_before(self):
        self.commit("zw.md", f"by​{NAME}\n")
        self.refused()

    def test_a_name_wrapped_across_two_lines(self):
        self.env["SCRUB_BLOCKLIST"] = TWO_WORDS
        for i, text in enumerate((f"a case study by {A}\n{B}, in figures\n",
                                  f"  - a case study by {A}\n    {B} in figures\n",
                                  f"- by {A} \n  {B}\n",
                                  f"> quoted {A}\n> {B}\n",
                                  f"// written by {A}\n// {B}\n",
                                  f"1. by {A}\n2. {B}\n",
                                  f'"by {A} " +\n  "{B}"\n',
                                  f"by {A}<br>\n{B}\n")):
            self.commit(f"w{i}.md", text)
            self.refused()
            self.reset()

    def test_a_name_completed_by_a_new_line_under_an_existing_one(self):
        self.env["SCRUB_BLOCKLIST"] = "unrelatedtoken"
        self.commit("story.md", f"intro\nCase study written by {A}\n")
        self.leaves()
        self.env["SCRUB_BLOCKLIST"] = TWO_WORDS
        self.commit("story.md", f"intro\nCase study written by {A}\n{B}, with the figures\n")
        self.refused()

    def test_a_merge_brings_its_side(self):
        self.git(self.work, "switch", "-q", "-c", "side")
        self.commit("side.md", f"{FAKE}\n")
        self.git(self.work, "switch", "-q", "main")
        self.commit("main.md", "neutral\n")
        self.git(self.work, "merge", "-q", "--no-ff", "-m", "merge", "side")
        r = self.scrub("--commits", "HEAD^!")
        self.assertEqual(r.returncode, 1, r.stdout)

    def test_an_orphan_root_commit(self):
        self.env["GIT_CONFIG_PARAMETERS"] = "'log.showroot'='false'"
        self.git(self.work, "switch", "-q", "--orphan", "fresh")
        self.copy_guard()
        self.write("notes.md", f"{FAKE}\n")
        self.git(self.work, "add", "notes.md", *GUARD)
        self.git(self.work, "commit", "-q", "-m", "root")
        self.refused("fresh")

    def test_hard_patterns_in_content_path_and_text(self):
        for i, pattern in enumerate((AD_ACCOUNT, GOOGLE_ID, PORTAL, HUBSPOT_URL, GOOGLE_URL)):
            self.commit(f"p{i}.md", f"see {pattern}\n")
            self.refused(why="hubspot account url" if "hubspot" in pattern else " id")
            self.reset()
        self.commit(f"accounts/{AD_ACCOUNT}.md", "neutral\n")
        self.refused(why="in the path")
        r = self.scrub("--stdin", stdin=f"{GOOGLE_ID}\n".encode())
        self.assertEqual(r.returncode, 1)

    def test_a_figure_with_or_without_its_thousands_separator(self):
        self.env["SCRUB_BLOCKLIST"] = "6900"
        for i, text in enumerate(("6900", "6 900 €", "6.900", "6 900", "6 900")):
            self.commit(f"f{i}.md", f"budget {text}\n")
            self.refused()
            self.reset()

    def test_a_client_name_in_the_branch_name(self):
        self.git(self.work, "switch", "-q", "-c", f"deck-{FAKE}")
        self.commit("notes.md", "neutral\n")
        self.refused(f"deck-{FAKE}", why="ref name")

    def test_annotated_and_nested_tag_messages(self):
        self.git(self.work, "tag", "-a", "v1", "-m", f"Release for {NAME}")
        self.refused("v1", why="tag message")
        self.git(self.work, "tag", "-a", "inner", "-m", f"for {NAME}")
        self.git(self.work, "tag", "-a", "outer", "-m", "neutral", "inner")
        self.refused("outer", why="tag message")

    def test_a_tag_on_a_blob_or_a_tree(self):
        blob = self.run_in_work("git", "hash-object", "-w", "--stdin", stdin=f"{NAME}\n".encode()).stdout.decode().strip()
        self.git(self.work, "tag", "notes", blob)
        self.refused("notes", why="only commits")
        self.git(self.work, "tag", "snap", "HEAD^{tree}")
        self.refused("snap", why="only commits")

    def test_a_ref_outside_branches_and_tags(self):
        self.refused("HEAD:refs/notes/x", why="only branches and tags")

    def test_a_push_to_a_url_instead_of_a_remote(self):
        self.commit("notes.md", "neutral\n")
        r = subprocess.run(["git", "push", "-q", self.origin, "HEAD:main"], cwd=self.work, env=self.env, capture_output=True, text=True)
        self.assertNotEqual(r.returncode, 0)
        self.assertIn("named remote", r.stderr)

    def test_a_commit_already_on_another_remote_is_not_public_here(self):
        perso = os.path.join(self.tmp, "perso.git")
        self.git(self.tmp, "init", "-q", "--bare", perso)
        self.git(self.work, "remote", "add", "perso", perso)
        self.commit("private.md", f"{FAKE}\n")
        self.git(self.work, "push", "-q", "--no-verify", "perso", "HEAD:refs/heads/main")
        self.git(self.work, "fetch", "-q", "perso")
        self.refused()

    def test_without_a_blocklist(self):
        self.env["SCRUB_BLOCKLIST"] = ""
        self.commit("notes.md", "A generic method, no client.\n")
        self.refused(why="no blocklist")

    def test_from_a_checkout_without_the_guard(self):
        # An old commit has neither .githooks/pre-push nor the new scrub: the stub in
        # the git directory, which a checkout cannot remove, refuses.
        self.git(self.work, "rm", "-q", "-r", ".githooks", "scripts")
        self.git(self.work, "commit", "-q", "-m", "old layout")
        self.refused(why="no .githooks/pre-push")

    def test_from_a_checkout_with_an_old_scrub(self):
        self.write("scripts/scrub.py", "import sys\nprint('scrub: clean')\nsys.exit(0)\n")
        self.git(self.work, "commit", "-q", "-am", "old scrub")
        self.refused(why="too old")

    def test_the_installer_refuses_a_global_hooks_path(self):
        cfg = os.path.join(self.tmp, "global.gitconfig")
        with open(cfg, "w") as f:
            f.write("[core]\n\thooksPath = /nonexistent\n")
        r = self.run_in_work("sh", "scripts/install-hooks.sh", env={**self.env, "GIT_CONFIG_GLOBAL": cfg})
        self.assertNotEqual(r.returncode, 0)
        self.assertIn(b"bypass the guard", r.stderr)


class WhatLeaves(Guard):
    def test_a_clean_commit(self):
        self.commit("notes.md", "A generic method, no client.\n")
        self.leaves()

    def test_a_clean_edit_to_an_existing_file(self):
        self.published_then_edited("deck.md", "intro\nend\n", "intro\na generic line\nend\n")
        self.leaves()

    def test_a_short_token_matches_only_as_written(self):
        self.env["SCRUB_BLOCKLIST"] = "isa"
        self.commit("notes.md", "this is a test, and xisay is another word\n")
        self.leaves()

    def test_a_figure_is_not_a_time_a_decimal_nor_part_of_a_bigger_number(self):
        self.env["SCRUB_BLOCKLIST"] = "2024\n6900\n2,6"
        self.commit("notes.md", "at 20:24, a budget of 12024, 69,00 €, the date 20/24, a ratio 2/6\n")
        self.leaves()

    def test_removing_a_line_that_was_already_public(self):
        # The leak predates the guard: the commit that removes it must be able to leave.
        self.env["SCRUB_BLOCKLIST"] = "unrelatedtoken"
        self.commit("old.md", f"{FAKE}\n")
        self.leaves()
        self.env["SCRUB_BLOCKLIST"] = FAKE
        self.commit("old.md", "anonymised\n", message="anonymise")
        self.leaves()

    def test_deleting_a_leaked_branch(self):
        self.git(self.work, "switch", "-q", "-c", f"deck-{FAKE}")
        self.commit("notes.md", f"{FAKE}\n")
        self.git(self.work, "push", "-q", "--no-verify", "origin", f"deck-{FAKE}")
        self.leaves("--delete", f"deck-{FAKE}")
        self.assertFalse(self.remote_has(f"refs/heads/deck-{FAKE}"))

    def test_a_lightweight_tag_on_a_published_commit(self):
        self.git(self.work, "tag", "v0", "HEAD")
        self.leaves("v0")

    def test_from_a_linked_worktree(self):
        with open(os.path.join(self.work, ".git", "info", "exclude"), "a") as f:
            f.write(".scrub/\n")
        os.makedirs(os.path.join(self.work, ".scrub"))
        with open(os.path.join(self.work, ".scrub", "blocklist.txt"), "w") as f:
            f.write(FAKE + "\n")
        env = {k: v for k, v in self.env.items() if k != "SCRUB_BLOCKLIST"}
        wt = os.path.join(self.tmp, "wt")
        subprocess.run(["git", "worktree", "add", "-q", "-b", "wt", wt], cwd=self.work, env=env, check=True)
        subprocess.run(["git", "commit", "-q", "--allow-empty", "-m", "from a worktree"], cwd=wt, env=env, check=True)
        r = subprocess.run(["git", "push", "-q", "origin", "wt"], cwd=wt, env=env, capture_output=True, text=True)
        self.assertEqual(r.returncode, 0, r.stderr)


class TreeScans(Guard):
    """The required CI step reads the index; --tree reads a commit. Each is tested on the
    content and on the path separately, so neither can go missing unnoticed."""

    def check(self, name, data, why, code=1):
        self.write(name, data)
        self.git(self.work, "add", name)
        self.git(self.work, "commit", "-q", "-m", "x")
        for args in ([], ["--tree", "HEAD"]):
            r = self.scrub(*args)
            out = r.stdout.decode() + r.stderr.decode()
            self.assertEqual(r.returncode, code, (args, out))
            self.assertIn(why, out, args)
            self.assertNotIn("Traceback", out)
        self.reset()

    def test_content_with_a_neutral_path(self):
        self.check("deck.md", f"{NAME}\n", "blocklist token")

    def test_a_path_with_empty_content(self):
        self.check(f"clients/{FAKE}/.gitkeep", "", "in the path")

    def test_an_ad_account_id_in_content(self):
        self.check("deck.md", f"{AD_ACCOUNT}\n", "meta ad account id")

    def test_a_file_that_is_not_utf8(self):
        self.check("legacy.txt", b"Soci\xe9t\xe9 Dupont\n", "not UTF-8 text")

    def test_a_symlink_target(self):
        os.symlink(f"../clients/{FAKE}/deck.md", os.path.join(self.work, "link.md"))
        self.git(self.work, "add", "link.md")
        self.git(self.work, "commit", "-q", "-m", "link")
        for args in ([], ["--tree", "HEAD"]):
            self.assertEqual(self.scrub(*args).returncode, 1, args)

    def test_a_submodule_is_a_path_not_a_crash(self):
        head = self.git(self.work, "rev-parse", "HEAD").stdout.strip()
        self.git(self.work, "update-index", "--add", "--cacheinfo", f"160000,{head},vendor/lib")
        self.git(self.work, "commit", "-q", "-m", "submodule")
        for args in ([], ["--tree", "HEAD"], ["--commits", "HEAD^!"]):
            r = self.scrub(*args)
            self.assertEqual(r.returncode, 0, (args, r.stdout, r.stderr))
            self.assertNotIn(b"Traceback", r.stderr)


class ScanRef(Guard):
    """scan-ref.sh is the alarm's only logic: it reads a ref as GitHub holds it."""

    def scan_ref(self, ref):
        clone = os.path.join(self.tmp, "ci")
        shutil.rmtree(clone, ignore_errors=True)
        self.git(self.tmp, "clone", "-q", self.origin, clone)
        self.git(clone, "fetch", "-q", "--tags", "origin")
        return subprocess.run(["sh", os.path.join(self.work, "scripts/scan-ref.sh"), ref], cwd=clone, env=self.env, capture_output=True)

    def pushed(self, *args):
        self.git(self.work, "push", "-q", "--no-verify", "origin", *args)

    def test_a_branch_that_adds_the_name(self):
        self.git(self.work, "switch", "-q", "-c", "feature")
        self.commit("notes.md", f"{FAKE}\n")
        self.pushed("feature")
        self.assertEqual(self.scan_ref("refs/remotes/origin/feature").returncode, 1)

    def test_an_annotated_tag_message(self):
        self.git(self.work, "tag", "-a", "v1", "-m", f"Release for {NAME}")
        self.pushed("v1")
        self.assertEqual(self.scan_ref("refs/tags/v1").returncode, 1)

    def test_a_tag_on_a_blob(self):
        blob = self.run_in_work("git", "hash-object", "-w", "--stdin", stdin=b"neutral\n").stdout.decode().strip()
        self.git(self.work, "tag", "notes", blob)
        self.pushed("notes")
        self.assertEqual(self.scan_ref("refs/tags/notes").returncode, 1)

    def test_a_clean_branch(self):
        self.git(self.work, "switch", "-q", "-c", "clean")
        self.commit("notes.md", "neutral\n")
        self.pushed("clean")
        r = self.scan_ref("refs/remotes/origin/clean")
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)


class PublicLogs(Guard):
    def test_ci_never_prints_the_token_the_line_or_the_path(self):
        env = {**self.env, "GITHUB_ACTIONS": "true"}
        self.commit(f"clients/{FAKE}/deck.md", f"{NAME} 12 000 € budget\n")
        for args in ([], ["--commits", "HEAD^!"], ["--tree", "HEAD"]):
            local = self.scrub(*args).stdout.decode()
            self.assertIn("12 000", local, args)            # the warning exists locally...
            r = self.scrub(*args, env=env)
            self.assertEqual(r.returncode, 1, args)
            out = (r.stdout + r.stderr).decode().lower()
            self.assertIn("euro amount", out, args)
            self.assertNotIn(FAKE, out, args)
            self.assertNotIn("12 000", out, args)           # ...but never its line in public
        r = self.scrub("--stdin", stdin=f"{NAME}\n".encode(), env=env)
        self.assertEqual(r.returncode, 1)
        self.assertNotIn(FAKE, (r.stdout + r.stderr).decode().lower())


class TheRepositoryItself(unittest.TestCase):
    def test_this_repository_passes_its_own_hard_patterns(self):
        # A fixture written out in full (an ad account id...) would fail the required
        # check with the real blocklist; this says so before the pull request does.
        token = "".join(_rng.choice(_letters) for _ in range(14))
        env = {**os.environ, "SCRUB_BLOCKLIST": token, "GITHUB_ACTIONS": ""}
        r = subprocess.run(["python3", "scripts/scrub.py"], cwd=REPO, env=env, capture_output=True, text=True)
        self.assertEqual(r.returncode, 0, r.stdout)
        self.assertNotIn("BLOCK", r.stdout)


if __name__ == "__main__":
    unittest.main()
