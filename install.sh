#!/bin/sh
# Links every skill of this repo into ~/.claude/skills so Claude Code sees them.
# Re-run after a git pull: existing links are refreshed, foreign folders are kept.
set -e
here=$(cd "$(dirname "$0")" && pwd)
dest="${CLAUDE_SKILLS_DIR:-$HOME/.claude/skills}"
mkdir -p "$dest"
for skill in "$here"/skills/*/; do
  name=$(basename "$skill")
  if [ -e "$dest/$name" ] && [ ! -L "$dest/$name" ]; then
    echo "skip   $name (a folder already exists in $dest, not a link)"
    continue
  fi
  ln -sfn "$skill" "$dest/$name"
  echo "linked $name"
done
echo "Open Claude Code and type /understand."
