#!/bin/sh

set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
REPO_ROOT="$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

if ! command -v git >/dev/null 2>&1; then
  echo "setup-hooks: git is not installed; skipping hook setup."
  exit 0
fi

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "setup-hooks: not in a git work tree; skipping hook setup."
  exit 0
fi

if git config core.hooksPath .githooks; then
  echo "setup-hooks: configured git hooks path: $(git config --get core.hooksPath)"
else
  echo "setup-hooks: failed to configure core.hooksPath; run: git config core.hooksPath .githooks"
fi
