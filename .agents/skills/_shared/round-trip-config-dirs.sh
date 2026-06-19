#!/usr/bin/env bash

ROUND_TRIP_KNOWN_XML_DIRS=("Catalogs" "Documents" "DocumentNumerators" "Sequences" "Enums")

round_trip_is_config_dir() {
  local candidate="$1"
  local xml_dir

  for xml_dir in "${ROUND_TRIP_KNOWN_XML_DIRS[@]}"; do
    if [ -d "${candidate}/${xml_dir}" ]; then
      return 0
    fi
  done

  return 1
}

round_trip_collect_run_dirs() {
  local root="$1"
  local child

  if round_trip_is_config_dir "${root}"; then
    printf '%s\n' "${root}"
    return 0
  fi

  while IFS= read -r child; do
    if round_trip_is_config_dir "${child}"; then
      printf '%s\n' "${child}"
    fi
  done < <(find "${root}" -mindepth 1 -maxdepth 1 -type d | sort)
}

round_trip_sanitize_path_segment() {
  printf '%s' "$1" | sed 's#[^A-Za-z0-9._-]#_#g'
}

round_trip_config_rel_path() {
  local dir="$1"
  local repo="$2"
  repo="${repo%/}"

  if [ "${dir}" = "${repo}" ]; then
    printf '.'
    return 0
  fi

  printf '%s' "${dir#${repo}/}"
}
