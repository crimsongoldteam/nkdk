#!/usr/bin/env bash

round_trip_collect_diff_files() {
  local active_dir="$1"
  {
    git -C "${active_dir}" -c core.quotepath=false diff --name-only --relative -- .
    git -C "${active_dir}" -c core.quotepath=false ls-files --others --exclude-standard -- .
  } | LC_ALL=C sort -u
}

round_trip_diff_text() {
  local active_dir="$1"
  local relative_file="$2"
  if git -C "${active_dir}" ls-files --error-unmatch -- "${relative_file}" >/dev/null 2>&1; then
    git -C "${active_dir}" -c core.quotepath=false diff --relative -- "${relative_file}"
    return
  fi
  local status=0
  git -C "${active_dir}" -c core.quotepath=false diff --no-index -- /dev/null "${relative_file}" || status=$?
  [ "${status}" -eq 1 ] || return "${status}"
}
