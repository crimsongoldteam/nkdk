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
  done < <(find "${root}" -mindepth 1 -maxdepth 1 \( -type d -o -type l \) | sort)
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

round_trip_load_dotenv_preserving_env() {
  local dotenv_file="$1"
  local name
  local had_var
  local saved_var

  shift
  [ -f "${dotenv_file}" ] || return 0

  for name in "$@"; do
    had_var="__round_trip_had_${name}"
    saved_var="__round_trip_saved_${name}"
    if [ "${!name+x}" ]; then
      printf -v "${had_var}" '%s' "1"
      printf -v "${saved_var}" '%s' "${!name}"
    else
      printf -v "${had_var}" '%s' "0"
    fi
  done

  set -a
  # shellcheck disable=SC1090
  . "${dotenv_file}"
  set +a

  for name in "$@"; do
    had_var="__round_trip_had_${name}"
    saved_var="__round_trip_saved_${name}"
    if [ "${!had_var}" = "1" ]; then
      printf -v "${name}" '%s' "${!saved_var}"
      export "${name}"
      unset "${saved_var}"
    fi
    unset "${had_var}"
  done
}
