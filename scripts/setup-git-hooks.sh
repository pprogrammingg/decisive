#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
hooks_dir="${root}/.githooks"

chmod +x "${hooks_dir}/commit-msg"
git -C "${root}" config core.hooksPath .githooks

echo "Git hooks enabled (core.hooksPath=.githooks)"
echo "Commit format: <EPIC_CODE>-<TASK> : <description>  (e.g. UX001-1 : ...)"
echo "Epic codes: ${root}/roadmap.json"
