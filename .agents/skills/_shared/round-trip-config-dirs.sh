#!/usr/bin/env bash

round_trip_is_config_dir() {
  local candidate="$1"
  [ -f "${candidate}/Configuration.xml" ]
}

round_trip_collect_run_dirs() {
  local root="$1"
  local configuration_file

  if round_trip_is_config_dir "${root}"; then
    printf '%s\n' "${root}"
    return 0
  fi

  while IFS= read -r configuration_file; do
    dirname "${configuration_file}"
  done < <(find "${root}" -mindepth 2 -type f -name Configuration.xml | sort)
}

round_trip_sanitize_path_segment() {
  case "$1" in
    .|..)
      printf 'root'
      return 0
      ;;
  esac
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

round_trip_component_path() {
  local dir="$1"
  local repo="$2"
  local relative_path

  relative_path="$(round_trip_config_rel_path "${dir}" "${repo}")"
  case "${relative_path}" in
    .|cf)
      printf 'cf'
      ;;
    *)
      printf '%s' "${relative_path}"
      ;;
  esac
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
