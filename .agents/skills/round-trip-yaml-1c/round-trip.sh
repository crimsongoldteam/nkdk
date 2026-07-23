#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "${SCRIPT_DIR}/../../.." && pwd)"

usage() {
  cat <<'USAGE'
Использование:
  ./skills/round-trip-yaml-1c/round-trip.sh

Что делает:
  1. nkdk.import_from_xml через настоящий MCP stdio server
  2. nkdk.sync_to_xml через настоящий MCP stdio server
  3. ibcmd infobase create --data <data> --db-path <db-path> --import <tmp-xml-dir> --apply --force

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

Ограничения:
  Скрипт не меняет активный XML-каталог и не использует --reference.
  Поддерживается только файловая база 1С.
USAGE
}

die() {
  echo "Ошибка: $*" >&2
  exit 1
}

KNOWN_XML_DIRS=("Catalogs" "Documents" "DocumentNumerators" "Sequences" "Enums")

is_config_dir() {
  local candidate="$1"
  local xml_dir

  for xml_dir in "${KNOWN_XML_DIRS[@]}"; do
    if [ -d "${candidate}/${xml_dir}" ]; then
      return 0
    fi
  done

  return 1
}

collect_run_dirs() {
  local root="$1"
  local child

  if is_config_dir "${root}"; then
    printf '%s\n' "${root}"
    return 0
  fi

  while IFS= read -r child; do
    if is_config_dir "${child}"; then
      printf '%s\n' "${child}"
    fi
  done < <(find "${root}" -mindepth 1 -maxdepth 1 -type d | sort)
}

sanitize_path_segment() {
  printf '%s' "$1" | sed 's#[^A-Za-z0-9._-]#_#g'
}

config_rel_path() {
  local dir="$1"
  local repo="${NKDK_XML_REPO%/}"

  if [ "${dir}" = "${repo}" ]; then
    printf '.'
    return 0
  fi

  printf '%s' "${dir#${repo}/}"
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

mcp_project_dir_for() {
  local active_dir="$1"
  local rel
  rel="$(config_rel_path "${active_dir}")"
  printf '%s/round-trip-yaml-1c-mcp-project/%s' "${TMPDIR:-/tmp}" "$(sanitize_path_segment "${rel}")"
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

prepare_mcp_project() {
  local project_dir="$1"
  local yaml_dir="$2"
  ensure_safe_dir "${project_dir}"
  rm -rf "${project_dir}"
  mkdir -p "${project_dir}"
  ln -s "${yaml_dir}" "${project_dir}/cf"
}

write_mcp_input() {
  local path="$1"
  local xml_dir="$2"
  local project_dir="$3"
  node -e 'const fs=require("fs"); fs.writeFileSync(process.argv[1], JSON.stringify({xmlDir:process.argv[2],projectDir:process.argv[3],componentPath:"cf",allowWrite:true})+"\n")' \
    "${path}" "${xml_dir}" "${project_dir}"
}

run_mcp_tool() {
  local tool="$1"
  local input="$2"
  local output="$3"
  node "${MCP_CALL}" "${tool}" --input "${input}" --output "${output}"
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
  fi

  local exit_code="$?"
  emit_error "${stage}" "${command_text}" "${exit_code}" "${log_file}"
  return "${exit_code}"
}

ibcmd_command_text() {
  local text

  text="${IBCMD_BIN} infobase create --data=${NKDK_1C_DATA} --db-path=${NKDK_1C_DB_PATH} --import=${TMP_XML_DIR} --apply --force"
  if [ -n "${NKDK_1C_USER:-}" ]; then
    text="${text} --user=${NKDK_1C_USER}"
  fi
  if [ -n "${NKDK_1C_PASSWORD:-}" ]; then
    text="${text} --password=***"
  fi
  printf '%s' "${text}"
}

while [ "$#" -gt 0 ]; do
  case "$1" in
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

if [ -n "$(git -C "${REPO_DIR}" status --porcelain)" ]; then
  echo "Ошибка: рабочее дерево nkdk не чистое." >&2
  echo "Сохрани или откати изменения перед запуском round-trip-yaml-1c." >&2
  git -C "${REPO_DIR}" status --short >&2
  exit 1
fi

MCP_CALL="${REPO_DIR}/.agents/tools/mcp/call.mjs"
[ -x "${MCP_CALL}" ] || die "локальный MCP-клиент не найден: ${MCP_CALL}"

IBCMD_BIN="${NKDK_1C_IBCMD:-ibcmd}"
if ! command -v "${IBCMD_BIN}" &>/dev/null; then
  die "команда ibcmd не найдена: ${IBCMD_BIN}"
fi

RUN_DIRS=()
while IFS= read -r run_dir; do
  RUN_DIRS+=("${run_dir}")
done < <(collect_run_dirs "${NKDK_XML_DIR}")

if [ "${#RUN_DIRS[@]}" -eq 0 ]; then
  die "в NKDK_XML_DIR ('${NKDK_XML_DIR}') не найдено конфигурационных каталогов"
fi

ACTIVE_XML_DIR="${RUN_DIRS[0]}"
YAML_DIR="$(yaml_dir_for "${ACTIVE_XML_DIR}")"
TMP_XML_DIR="$(xml_tmp_dir_for "${ACTIVE_XML_DIR}")"
MCP_PROJECT_DIR="$(mcp_project_dir_for "${ACTIVE_XML_DIR}")"
IMPORT_LOG="${TMPDIR:-/tmp}/round-trip-yaml-1c-import.log"
SYNC_LOG="${TMPDIR:-/tmp}/round-trip-yaml-1c-sync.log"
IBCMD_LOG="${TMPDIR:-/tmp}/round-trip-yaml-1c-ibcmd.log"
IMPORT_INPUT="${TMPDIR:-/tmp}/round-trip-yaml-1c-import.json"
IMPORT_OUTPUT="${TMPDIR:-/tmp}/round-trip-yaml-1c-import-output.json"
SYNC_INPUT="${TMPDIR:-/tmp}/round-trip-yaml-1c-sync.json"
SYNC_OUTPUT="${TMPDIR:-/tmp}/round-trip-yaml-1c-sync-output.json"

echo "=== round-trip-yaml-1c.sh ==="
echo "ACTIVE_XML_DIR: ${ACTIVE_XML_DIR}"
echo "YAML_DIR: ${YAML_DIR}"
echo "TMP_XML_DIR: ${TMP_XML_DIR}"
echo "MCP_PROJECT_DIR: ${MCP_PROJECT_DIR}"
echo "IBCMD_COMMAND: $(ibcmd_command_text)"
echo ""

echo "[yaml] Очистка временного YAML-каталога: ${YAML_DIR}"
rm -rf "${YAML_DIR}"
mkdir -p "${YAML_DIR}"
prepare_mcp_project "${MCP_PROJECT_DIR}" "${YAML_DIR}"

echo "[xml] Очистка временного XML-каталога без reference: ${TMP_XML_DIR}"
clear_dir_contents "${TMP_XML_DIR}"

write_mcp_input "${IMPORT_INPUT}" "${ACTIVE_XML_DIR}" "${MCP_PROJECT_DIR}"
IMPORT_COMMAND="node ${MCP_CALL} nkdk.import_from_xml --input ${IMPORT_INPUT}"
if ! run_logged "import" "${IMPORT_COMMAND}" "${IMPORT_LOG}" run_mcp_tool nkdk.import_from_xml "${IMPORT_INPUT}" "${IMPORT_OUTPUT}"; then
  exit 1
fi

write_mcp_input "${SYNC_INPUT}" "${TMP_XML_DIR}" "${MCP_PROJECT_DIR}"
SYNC_COMMAND="node ${MCP_CALL} nkdk.sync_to_xml --input ${SYNC_INPUT}"
if ! run_logged "sync" "${SYNC_COMMAND}" "${SYNC_LOG}" run_mcp_tool nkdk.sync_to_xml "${SYNC_INPUT}" "${SYNC_OUTPUT}"; then
  exit 1
fi

IBCMD_ARGS=("${IBCMD_BIN}" infobase create --data="${NKDK_1C_DATA}" --db-path="${NKDK_1C_DB_PATH}" --import="${TMP_XML_DIR}" --apply --force)
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
