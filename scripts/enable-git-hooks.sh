#!/usr/bin/env sh
# Point this repo at versioned hooks (strip Cursor tags and Co-authored-by from commits).
cd "$(dirname "$0")/.." || exit 1
if ! git rev-parse --git-dir >/dev/null 2>&1; then
  echo "Not a git repository." >&2
  exit 1
fi
git config core.hooksPath .githooks
echo "Set core.hooksPath=.githooks — commit-msg will drop Co-authored-by and Cursor attribution lines."
