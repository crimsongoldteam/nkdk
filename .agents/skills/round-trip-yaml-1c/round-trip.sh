#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "${SCRIPT_DIR}/../../.." && pwd)"

# shellcheck source=../_shared/round-trip-config-dirs.sh
. "${REPO_DIR}/.agents/skills/_shared/round-trip-config-dirs.sh"

ALL_CONFIGS="0"

usage() {
  cat <<'USAGE'
Использование:
  ./.agents/skills/round-trip-yaml-1c/round-trip.sh
  ./.agents/skills/round-trip-yaml-1c/round-trip.sh --all-configs

Что делает:
  1. nkdk import <xml-dir> <yaml-dir>
  2. nkdk sync <yaml-dir> <tmp-xml-dir> без --reference
  3. очистка и создание свежей файловой базы через ibcmd infobase create
  4. ibcmd infobase config import --data <data> --db-path <db-path> <tmp-xml-dir>

Обязательные .env:
  NKDK_XML_REPO       Git-репозиторий XML-выгрузки.
  NKDK_XML_DIR        XML-каталог конфигурации для проверки.
  NKDK_1C_DATA        Каталог данных автономного сервера.
  NKDK_1C_DB_PATH     Каталог файловой базы 1С.

Опциональные .env:
  NKDK_ROUND_TRIP_YAML_DIR  Базовый каталог временного YAML.
  NKDK_1C_IBCMD             Команда ibcmd. По умолчанию ibcmd.
  NKDK_1C_USER              Пользователь ИБ. Если пустой, не передаётся.
  NKDK_1C_PASSWORD          Пароль ИБ. Если пустой, не передаётся.

Параметры:
  --all-configs    Проверить все конфигурационные каталоги, не останавливаться после первого успешного.
  -h, --help       Показать эту справку.

Ограничения:
  Скрипт не меняет активный XML-каталог и не использует --reference.
  Поддерживается только файловая база 1С.
  Каталог файловой базы очищается перед каждым прогоном.
USAGE
}

die() {
  echo "Ошибка: $*" >&2
  exit 1
}

sanitize_path_segment() {
  round_trip_sanitize_path_segment "$1"
}

config_rel_path() {
  round_trip_config_rel_path "$1" "${NKDK_XML_REPO}"
}

yaml_dir_for() {
  local active_dir="$1"
  local rel
  local yaml_root="${NKDK_ROUND_TRIP_YAML_DIR:-}"

  rel="$(config_rel_path "${active_dir}")"
  if [ -n "${yaml_root}" ]; then
    yaml_root="${yaml_root%/}"
    printf '%s/%s' "${yaml_root}" "$(sanitize_path_segment "${rel}")"
    return 0
  fi

  printf '%s/round-trip-yaml-1c/%s' "${TMPDIR:-/tmp}" "$(sanitize_path_segment "${rel}")"
}

xml_tmp_dir_for() {
  local active_dir="$1"
  local rel

  rel="$(config_rel_path "${active_dir}")"
  printf '%s/round-trip-yaml-1c-xml/%s' "${TMPDIR:-/tmp}" "$(sanitize_path_segment "${rel}")"
}

ensure_safe_dir() {
  local dir="$1"

  if [ -z "${dir}" ] || [ "${dir}" = "/" ]; then
    die "небезопасный каталог для очистки: '${dir}'"
  fi
}

clear_dir_contents() {
  local dir="$1"

  ensure_safe_dir "${dir}"
  mkdir -p "${dir}"
  find "${dir}" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
}

emit_error() {
  local stage="$1"
  local command_text="$2"
  local exit_code="$3"
  local log_file="$4"

  echo ""
  echo "=== Ошибка загрузки в 1С ==="
  echo "STAGE: ${stage}"
  echo "ACTIVE_XML_DIR: ${ACTIVE_XML_DIR}"
  echo "YAML_DIR: ${YAML_DIR}"
  echo "TMP_XML_DIR: ${TMP_XML_DIR}"
  echo "COMMAND: ${command_text}"
  echo "EXIT_CODE: ${exit_code}"
  echo "LOG:"
  cat "${log_file}"
}

run_logged() {
  local stage="$1"
  local command_text="$2"
  local log_file="$3"
  shift 3

  echo "[command] ${command_text}"
  if "$@" >"${log_file}" 2>&1; then
    cat "${log_file}"
    return 0
  else
    local exit_code="$?"
    emit_error "${stage}" "${command_text}" "${exit_code}" "${log_file}"
    return "${exit_code}"
  fi
}

ibcmd_create_command_text() {
  printf '%s' "${IBCMD_BIN} infobase create --data=${NKDK_1C_DATA} --db-path=${NKDK_1C_DB_PATH}"
}

ibcmd_command_text() {
  local text

  text="${IBCMD_BIN} infobase config import --data=${NKDK_1C_DATA} --db-path=${NKDK_1C_DB_PATH}"
  if [ -n "${NKDK_1C_USER:-}" ]; then
    text="${text} --user=${NKDK_1C_USER}"
  fi
  if [ -n "${NKDK_1C_PASSWORD:-}" ]; then
    text="${text} --password=***"
  fi
  text="${text} ${TMP_XML_DIR}"
  printf '%s' "${text}"
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --all-configs)
      ALL_CONFIGS="1"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      die "неизвестный параметр: $1"
      ;;
  esac
done

if [ -f "${REPO_DIR}/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  . "${REPO_DIR}/.env"
  set +a
fi

[ -n "${NKDK_XML_REPO:-}" ] || die "переменная NKDK_XML_REPO не задана"
[ -n "${NKDK_XML_DIR:-}" ] || die "переменная NKDK_XML_DIR не задана"
[ -n "${NKDK_1C_DATA:-}" ] || die "переменная NKDK_1C_DATA не задана"
[ -n "${NKDK_1C_DB_PATH:-}" ] || die "переменная NKDK_1C_DB_PATH не задана"

if ! git -C "${NKDK_XML_REPO}" rev-parse --git-dir &>/dev/null; then
  die "NKDK_XML_REPO ('${NKDK_XML_REPO}') не является git-репозиторием"
fi

[ -d "${NKDK_XML_DIR}" ] || die "NKDK_XML_DIR ('${NKDK_XML_DIR}') не существует или не каталог"
[ -d "${NKDK_1C_DATA}" ] || die "NKDK_1C_DATA ('${NKDK_1C_DATA}') не существует или не каталог"
[ -d "${NKDK_1C_DB_PATH}" ] || die "NKDK_1C_DB_PATH ('${NKDK_1C_DB_PATH}') не существует или не каталог"

NKDK_XML_DIR="$(cd "${NKDK_XML_DIR}" && pwd)"
NKDK_XML_REPO="$(cd "${NKDK_XML_REPO}" && pwd)"
NKDK_1C_DATA="$(cd "${NKDK_1C_DATA}" && pwd)"
NKDK_1C_DB_PATH="$(cd "${NKDK_1C_DB_PATH}" && pwd)"

if command -v nkdk &>/dev/null; then
  NKDK=(nkdk)
elif [ -f "${REPO_DIR}/packages/cli/src/cli.ts" ]; then
  NKDK=(pnpm -s --dir "${REPO_DIR}/packages/cli" exec tsx src/cli.ts)
else
  die "команда nkdk не найдена"
fi

IBCMD_BIN="${NKDK_1C_IBCMD:-ibcmd}"
if ! command -v "${IBCMD_BIN}" &>/dev/null; then
  die "команда ibcmd не найдена: ${IBCMD_BIN}"
fi

RUN_DIRS=()
while IFS= read -r run_dir; do
  RUN_DIRS+=("${run_dir}")
done < <(round_trip_collect_run_dirs "${NKDK_XML_DIR}")

if [ "${#RUN_DIRS[@]}" -eq 0 ]; then
  die "в NKDK_XML_DIR ('${NKDK_XML_DIR}') не найдено конфигурационных каталогов"
fi

run_one_config() {
  ACTIVE_XML_DIR="$1"
  YAML_DIR="$(yaml_dir_for "${ACTIVE_XML_DIR}")"
  TMP_XML_DIR="$(xml_tmp_dir_for "${ACTIVE_XML_DIR}")"
  IMPORT_LOG="${TMPDIR:-/tmp}/round-trip-yaml-1c-import.log"
  SYNC_LOG="${TMPDIR:-/tmp}/round-trip-yaml-1c-sync.log"
  CREATE_INFOBASE_LOG="${TMPDIR:-/tmp}/round-trip-yaml-1c-create-infobase.log"
  IBCMD_LOG="${TMPDIR:-/tmp}/round-trip-yaml-1c-ibcmd.log"

  echo "=== round-trip-yaml-1c.sh ==="
  echo "ACTIVE_XML_DIR: ${ACTIVE_XML_DIR}"
  echo "YAML_DIR: ${YAML_DIR}"
  echo "TMP_XML_DIR: ${TMP_XML_DIR}"
  echo "IBCMD_COMMAND: $(ibcmd_command_text)"
  echo ""

  echo "[yaml] Очистка временного YAML-каталога: ${YAML_DIR}"
  rm -rf "${YAML_DIR}"
  mkdir -p "${YAML_DIR}"

  echo "[xml] Очистка временного XML-каталога без reference: ${TMP_XML_DIR}"
  clear_dir_contents "${TMP_XML_DIR}"

  IMPORT_COMMAND="${NKDK[*]} import ${ACTIVE_XML_DIR} ${YAML_DIR}"
  if ! run_logged "import" "${IMPORT_COMMAND}" "${IMPORT_LOG}" "${NKDK[@]}" import "${ACTIVE_XML_DIR}" "${YAML_DIR}"; then
    exit 1
  fi

  SYNC_COMMAND="${NKDK[*]} sync ${YAML_DIR} ${TMP_XML_DIR}"
  if ! run_logged "sync" "${SYNC_COMMAND}" "${SYNC_LOG}" "${NKDK[@]}" sync "${YAML_DIR}" "${TMP_XML_DIR}"; then
    exit 1
  fi

  echo "[1c] Очистка файловой базы: ${NKDK_1C_DB_PATH}"
  clear_dir_contents "${NKDK_1C_DB_PATH}"

  CREATE_INFOBASE_ARGS=("${IBCMD_BIN}" infobase create --data="${NKDK_1C_DATA}" --db-path="${NKDK_1C_DB_PATH}")
  if ! run_logged "create-infobase" "$(ibcmd_create_command_text)" "${CREATE_INFOBASE_LOG}" "${CREATE_INFOBASE_ARGS[@]}"; then
    exit 1
  fi

  IBCMD_ARGS=("${IBCMD_BIN}" infobase config import --data="${NKDK_1C_DATA}" --db-path="${NKDK_1C_DB_PATH}")
  if [ -n "${NKDK_1C_USER:-}" ]; then
    IBCMD_ARGS+=(--user="${NKDK_1C_USER}")
  fi
  if [ -n "${NKDK_1C_PASSWORD:-}" ]; then
    IBCMD_ARGS+=(--password="${NKDK_1C_PASSWORD}")
  fi
  IBCMD_ARGS+=("${TMP_XML_DIR}")

  if ! run_logged "ibcmd" "$(ibcmd_command_text)" "${IBCMD_LOG}" "${IBCMD_ARGS[@]}"; then
    exit 1
  fi

  echo ""
  echo "=== Загрузка в 1С прошла успешно ==="
  echo "ACTIVE_XML_DIR: ${ACTIVE_XML_DIR}"
  echo "YAML_DIR: ${YAML_DIR}"
  echo "TMP_XML_DIR: ${TMP_XML_DIR}"
}

if [ "${ALL_CONFIGS}" = "1" ]; then
  CHECKED_CONFIGS="0"
  for RUN_XML_DIR in "${RUN_DIRS[@]}"; do
    run_one_config "${RUN_XML_DIR}"
    CHECKED_CONFIGS="$((CHECKED_CONFIGS + 1))"
  done
  echo ""
  echo "=== Проверка всех конфигураций в 1С прошла успешно ==="
  echo "Проверено каталогов: ${CHECKED_CONFIGS}"
  exit 0
fi

run_one_config "${RUN_DIRS[0]}"
