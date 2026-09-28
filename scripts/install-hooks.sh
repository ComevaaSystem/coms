#!/bin/sh
# Installs the publication guard once per clone. The stub lives in the git directory, not
# in the working tree: checking out a commit from before the guard cannot remove it, and
# when that checkout has no .githooks/pre-push the stub refuses instead of letting the
# push through. The default hooks directory moves with the clone and serves its linked
# worktrees; a core.hooksPath set anywhere would silently route around it, so it is
# refused here.
set -e
git config --local --unset core.hooksPath 2>/dev/null || true
if other=$(git config --show-origin --get core.hooksPath); then
  echo "install-hooks: core.hooksPath is set ($other) and would bypass the guard. Remove it, then rerun." >&2
  exit 1
fi
hooks="$(git rev-parse --path-format=absolute --git-common-dir)/hooks"
mkdir -p "$hooks"
cat > "$hooks/pre-push" <<'STUB'
#!/bin/sh
hook="$(git rev-parse --show-toplevel)/.githooks/pre-push"
[ -f "$hook" ] || { echo "pre-push: this checkout has no .githooks/pre-push. Nothing leaves." >&2; exit 1; }
exec sh "$hook" "$@"
STUB
chmod +x "$hooks/pre-push"
echo "Publication guard installed: $hooks/pre-push"
