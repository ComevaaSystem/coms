#!/bin/sh
# Scrubs one ref as GitHub holds it: its name, every tag message on the way to its commit,
# and the commits it has that main does not. Used by alerte.yml on each push and, hourly,
# on every ref (a ref whose commit predates the alarm starts no push run of its own).
ref="$1"
rc=0
printf '%s\n' "$ref" | python3 scripts/scrub.py --stdin || rc=1
obj=$(git rev-parse "$ref")
while [ "$(git cat-file -t "$obj")" = tag ]; do
  git cat-file -p "$obj" | python3 scripts/scrub.py --stdin || rc=1
  obj=$(git cat-file -p "$obj" | sed -n 's/^object //p' | head -n 1)
done
if [ "$(git cat-file -t "$obj")" != commit ]; then
  echo "scan-ref: a ref points at a $(git cat-file -t "$obj"), not at a commit." >&2
  exit 1
fi
python3 scripts/scrub.py --commits "$obj" --not origin/main || rc=1
exit $rc
