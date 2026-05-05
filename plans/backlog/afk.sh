#!/bin/bash
set -eo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"

if [ -z "$1" ]; then
  echo "Usage: $0 <iterations>"
  exit 1
fi

require_sandbox

# jq filter to extract streaming text from assistant messages
stream_text='select(.type == "assistant").message.content[]? | select(.type == "text").text // empty | gsub("\n"; "\r\n") | . + "\r\n\n"'

# jq filter to extract final result
final_result='select(.type == "result").result // empty'

for ((i=1; i<=$1; i++)); do
  tmpfile=$(mktemp)
  trap "rm -f $tmpfile" EXIT

  issues=$(gh issue list --state open --search "-label:round-trip" --json number,title,body,comments)
  ralph_commits=$(git log --grep="RALPH" -n 10 --format="%H%n%ad%n%B---" --date=short 2>/dev/null || echo "No RALPH commits found")

  echo ">>> iteration $i/$1: claude started, waiting for first event..." >&2

  printf '%s Previous RALPH commits: %s @plans/backlog/prompt.md' "$issues" "$ralph_commits" \
  | docker sandbox exec -i \
    --env-file "$REPO_ROOT/.env" \
    -w "$REPO_ROOT" \
    "$SANDBOX_NAME" \
    claude --dangerously-skip-permissions \
    --verbose \
    --print \
    --output-format stream-json \
  | grep --line-buffered '^{' \
  | tee "$tmpfile" \
  | jq --unbuffered -rj "$stream_text"

  result=$(jq -r "$final_result" "$tmpfile")

  if [[ "$result" == *"<promise>COMPLETE</promise>"* ]]; then
    echo "Ralph complete after $i iterations."
    exit 0
  fi
done
