#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "${SCRIPT_DIR}/../../.." && pwd)"

MODE="single"
DIFF_INDEX="1"
BATCH_SIZE="5"
START_INDEX="1"
DIFF_INDEX_SET="0"
BATCH_SIZE_SET="0"
START_INDEX_SET="0"
ALL_CONFIGS="0"

usage() {
  cat <<'USAGE'
Использование:
  ./.agents/skills/round-trip-yaml/round-trip.sh
  ./.agents/skills/round-trip-yaml/round-trip.sh --diff-index N
  ./.agents/skills/round-trip-yaml/round-trip.sh --triage [--batch-size N] [--start-index K]
  ./.agents/skills/round-trip-yaml/round-trip.sh --triage --all-configs [--batch-size N] [--start-index K]

Параметры:
  --diff-index N   Показать один diff по 1-based номеру из отсортированного списка.
  --triage         Показать пачку diff'ов для информационного анализа.
  --all-configs    Проверить все конфигурационные каталоги, не останавливаться на первом diff.
  --batch-size N   Размер triage-пачки. По умолчанию 5.
  --start-index K  1-based номер первого diff'а в triage-пачке. По умолчанию 1.
  -h, --help       Показать эту справку.
USAGE
}

die() {
  echo "Ошибка: $*" >&2
  exit 1
}

is_positive_integer() {
  [[ "${1:-}" =~ ^[1-9][0-9]*$ ]]
}

KNOWN_XML_DIRS=("Catalogs" "Documents" "DocumentNumerators" "Sequences" "Enums")
REFERENCE_ONLY_XML_FILES=("Ext/ParentConfigurations.bin")

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
    if [ "${rel}" = "." ] || [ "${#RUN_DIRS[@]}" -le 1 ]; then
      printf '%s' "${yaml_root}"
      return 0
    fi

    printf '%s/%s' "${yaml_root}" "$(sanitize_path_segment "${rel}")"
    return 0
  fi

  printf '%s/round-trip-yaml/%s' "${TMPDIR:-/tmp}" "$(sanitize_path_segment "${rel}")"
}

xml_tmp_dir_for() {
  local active_dir="$1"
  local rel

  rel="$(config_rel_path "${active_dir}")"
  printf '%s/round-trip-yaml-xml/%s' "${TMPDIR:-/tmp}" "$(sanitize_path_segment "${rel}")"
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

move_dir_contents() {
  local source_dir="$1"
  local target_dir="$2"

  ensure_safe_dir "${source_dir}"
  ensure_safe_dir "${target_dir}"
  [ -d "${source_dir}" ] || die "каталог-источник не существует: ${source_dir}"
  mkdir -p "${target_dir}"
  find "${source_dir}" -mindepth 1 -maxdepth 1 ! -name .git -exec mv {} "${target_dir}/" \;
}

preserve_reference_only_files() {
  local reference_dir="$1"
  local output_dir="$2"
  local relative_path
  local source_path
  local target_path

  for relative_path in "${REFERENCE_ONLY_XML_FILES[@]}"; do
    source_path="${reference_dir%/}/${relative_path}"
    target_path="${output_dir%/}/${relative_path}"

    [ -f "${source_path}" ] || continue
    [ ! -e "${target_path}" ] || continue

    mkdir -p "$(dirname "${target_path}")"
    cp -p "${source_path}" "${target_path}"
    echo "[xml] Сохранён reference-only файл: ${relative_path}"
  done
}

run_nkdk() {
  echo "[command] $*"
  "$@"
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --diff-index)
      [ "$#" -ge 2 ] || die "--diff-index требует значение"
      is_positive_integer "$2" || die "--diff-index должен быть положительным целым числом"
      DIFF_INDEX="$2"
      DIFF_INDEX_SET="1"
      shift 2
      ;;
    --triage)
      MODE="triage"
      shift
      ;;
    --all-configs)
      ALL_CONFIGS="1"
      shift
      ;;
    --batch-size)
      [ "$#" -ge 2 ] || die "--batch-size требует значение"
      is_positive_integer "$2" || die "--batch-size должен быть положительным целым числом"
      BATCH_SIZE="$2"
      BATCH_SIZE_SET="1"
      shift 2
      ;;
    --start-index)
      [ "$#" -ge 2 ] || die "--start-index требует значение"
      is_positive_integer "$2" || die "--start-index должен быть положительным целым числом"
      START_INDEX="$2"
      START_INDEX_SET="1"
      shift 2
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

if [ "${MODE}" = "triage" ] && [ "${DIFF_INDEX_SET}" = "1" ]; then
  die "--diff-index нельзя использовать вместе с --triage"
fi

if [ "${MODE}" = "single" ] && [ "${BATCH_SIZE_SET}" = "1" ]; then
  die "--batch-size доступен только вместе с --triage"
fi

if [ "${MODE}" = "single" ] && [ "${START_INDEX_SET}" = "1" ]; then
  die "--start-index доступен только вместе с --triage"
fi

if [ -f "${REPO_DIR}/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  . "${REPO_DIR}/.env"
  set +a
fi

if [ -z "${NKDK_XML_REPO:-}" ]; then
  die "переменная NKDK_XML_REPO не задана (ни в окружении, ни в .env)"
fi

if ! git -C "${NKDK_XML_REPO}" rev-parse --git-dir &>/dev/null; then
  die "NKDK_XML_REPO ('${NKDK_XML_REPO}') не является git-репозиторием"
fi

NKDK_XML_DIR="${NKDK_XML_DIR:-${NKDK_XML_REPO}}"
if [ ! -d "${NKDK_XML_DIR}" ]; then
  die "NKDK_XML_DIR ('${NKDK_XML_DIR}') не существует или не каталог"
fi
NKDK_XML_DIR="$(cd "${NKDK_XML_DIR}" && pwd)"
NKDK_XML_REPO="$(cd "${NKDK_XML_REPO}" && pwd)"

if [ -n "$(git -C "${REPO_DIR}" status --porcelain)" ]; then
  echo "Ошибка: рабочее дерево nakidka-core не чистое." >&2
  echo "Сохрани или откати изменения перед запуском round-trip-yaml." >&2
  git -C "${REPO_DIR}" status --short >&2
  exit 1
fi

if command -v nkdk &>/dev/null; then
  NKDK=(nkdk)
elif [ -f "${REPO_DIR}/packages/cli/src/cli.ts" ]; then
  NKDK=(pnpm -s --dir "${REPO_DIR}/packages/cli" exec tsx src/cli.ts)
else
  die "команда nkdk не найдена"
fi

echo "=== round-trip-yaml.sh ==="
echo "XML репо:    ${NKDK_XML_REPO}"
echo "XML каталог: ${NKDK_XML_DIR}"
echo "nkdk:        ${NKDK[*]}"
echo "mode:        ${MODE}"
echo "all configs: ${ALL_CONFIGS}"
if [ "${MODE}" = "single" ]; then
  echo "diff index:  ${DIFF_INDEX}"
else
  echo "batch size:  ${BATCH_SIZE}"
  echo "start index: ${START_INDEX}"
fi
echo ""

RUN_DIRS=()
while IFS= read -r run_dir; do
  RUN_DIRS+=("${run_dir}")
done < <(collect_run_dirs "${NKDK_XML_DIR}")

if [ "${#RUN_DIRS[@]}" -eq 0 ]; then
  die "в NKDK_XML_DIR ('${NKDK_XML_DIR}') не найдено конфигурационных каталогов"
fi

DIFF_FILES=()
DIFF_FILE_DIRS=()
DIFF_FILE_YAML_DIRS=()
DIFF_TEXTS=()
ACTIVE_XML_DIR=""
ACTIVE_YAML_DIR=""

for RUN_XML_DIR in "${RUN_DIRS[@]}"; do
  RUN_YAML_DIR="$(yaml_dir_for "${RUN_XML_DIR}")"
  RUN_XML_TMP_DIR="$(xml_tmp_dir_for "${RUN_XML_DIR}")"

  echo "[restore] Откат XML-репо к HEAD..."
  git -C "${NKDK_XML_REPO}" restore .

  echo "[yaml] Очистка временного YAML-каталога: ${RUN_YAML_DIR}"
  rm -rf "${RUN_YAML_DIR}"
  mkdir -p "${RUN_YAML_DIR}"

  echo "[xml] Очистка временного XML-каталога: ${RUN_XML_TMP_DIR}"
  clear_dir_contents "${RUN_XML_TMP_DIR}"

  echo "[round-trip] XML -> YAML: ${RUN_XML_DIR}"
  if ! run_nkdk "${NKDK[@]}" import "${RUN_XML_DIR}" "${RUN_YAML_DIR}"; then
    echo "=== ROUND_TRIP_ERROR ==="
    echo "STAGE: import"
    echo "ACTIVE_XML_DIR: ${RUN_XML_DIR}"
    echo "YAML_DIR: ${RUN_YAML_DIR}"
    echo "XML_TMP_DIR: ${RUN_XML_TMP_DIR}"
    exit 1
  fi

  echo "[round-trip] YAML -> временный XML: ${RUN_YAML_DIR}"
  if ! run_nkdk "${NKDK[@]}" sync "${RUN_YAML_DIR}" "${RUN_XML_TMP_DIR}" --reference "${RUN_XML_DIR}"; then
    echo "=== ROUND_TRIP_ERROR ==="
    echo "STAGE: sync"
    echo "ACTIVE_XML_DIR: ${RUN_XML_DIR}"
    echo "YAML_DIR: ${RUN_YAML_DIR}"
    echo "XML_TMP_DIR: ${RUN_XML_TMP_DIR}"
    exit 1
  fi

  preserve_reference_only_files "${RUN_XML_DIR}" "${RUN_XML_TMP_DIR}"

  echo "[xml] Замена XML-каталога результатом временного XML: ${RUN_XML_DIR}"
  clear_dir_contents "${RUN_XML_DIR}"
  move_dir_contents "${RUN_XML_TMP_DIR}" "${RUN_XML_DIR}"

  CURRENT_DIFF_FILES=()
  while IFS= read -r diff_file; do
    CURRENT_DIFF_FILES+=("${diff_file}")
  done < <(git -C "${RUN_XML_DIR}" -c core.quotepath=false diff --name-only --relative -- . | sort)

  if [ "${#CURRENT_DIFF_FILES[@]}" -gt 0 ]; then
    ACTIVE_XML_DIR="${RUN_XML_DIR}"
    ACTIVE_YAML_DIR="${RUN_YAML_DIR}"
    for diff_file in "${CURRENT_DIFF_FILES[@]}"; do
      diff_text="$(git -C "${RUN_XML_DIR}" -c core.quotepath=false diff --relative -- "${diff_file}")"
      DIFF_FILES+=("${diff_file}")
      DIFF_FILE_DIRS+=("${RUN_XML_DIR}")
      DIFF_FILE_YAML_DIRS+=("${RUN_YAML_DIR}")
      DIFF_TEXTS+=("${diff_text}")
    done
    if [ "${ALL_CONFIGS}" != "1" ]; then
      break
    fi
  fi
done

if [ -z "${ACTIVE_XML_DIR}" ]; then
  ACTIVE_XML_DIR="${RUN_DIRS[${#RUN_DIRS[@]} - 1]}"
  ACTIVE_YAML_DIR="$(yaml_dir_for "${ACTIVE_XML_DIR}")"
fi

xml_file_abs() {
  local relative_path="$1"
  local active_dir="${2:-${ACTIVE_XML_DIR}}"
  echo "${active_dir%/}/${relative_path}"
}

DIFF_COUNT="${#DIFF_FILES[@]}"

emit_single_diff() {
  local index="$1"
  local file="$2"
  local active_dir="$3"
  local yaml_dir="$4"
  local diff_text="$5"

  echo ""
  echo "=== ACTIVE_XML_DIR ==="
  echo "${active_dir}"
  echo ""
  echo "=== YAML_DIR ==="
  echo "${yaml_dir}"
  echo ""
  echo "=== DIFF_COUNT ==="
  echo "${DIFF_COUNT}"
  echo ""
  echo "=== SELECTED_DIFF_INDEX ==="
  echo "${index}"
  echo ""
  echo "=== SELECTED_DIFF_FILE ==="
  echo "${file}"
  echo ""
  echo "=== SELECTED_XML_FILE_ABS ==="
  xml_file_abs "${file}" "${active_dir}"
  echo ""
  echo "=== FULL_DIFF ==="
  printf '%s\n' "${diff_text}"
}

emit_triage_diff() {
  local index="$1"
  local file="$2"
  local active_dir="$3"
  local yaml_dir="$4"
  local diff_text="$5"

  echo ""
  echo "=== TRIAGE_DIFF ==="
  echo "INDEX: ${index}"
  echo "ACTIVE_XML_DIR: ${active_dir}"
  echo "YAML_DIR: ${yaml_dir}"
  echo "FILE: ${file}"
  echo "XML_FILE_ABS: $(xml_file_abs "${file}" "${active_dir}")"
  echo "--- DIFF ---"
  printf '%s\n' "${diff_text}"
}

if [ "${DIFF_COUNT}" -eq 0 ]; then
  echo ""
  echo "=== ACTIVE_XML_DIR ==="
  echo "${ACTIVE_XML_DIR}"
  echo ""
  echo "=== YAML_DIR ==="
  echo "${ACTIVE_YAML_DIR}"
  echo ""
  echo "=== Round-trip чистый: диффов нет ==="
  echo "Проверено каталогов: ${#RUN_DIRS[@]}"
  exit 0
fi

if [ "${MODE}" = "single" ]; then
  if [ "${DIFF_INDEX}" -gt "${DIFF_COUNT}" ]; then
    die "--diff-index ${DIFF_INDEX} выходит за пределы списка diff'ов (${DIFF_COUNT})"
  fi

  SELECTED_DIFF_FILE="${DIFF_FILES[$((DIFF_INDEX - 1))]}"
  SELECTED_DIFF_DIR="${DIFF_FILE_DIRS[$((DIFF_INDEX - 1))]}"
  SELECTED_YAML_DIR="${DIFF_FILE_YAML_DIRS[$((DIFF_INDEX - 1))]}"
  SELECTED_DIFF_TEXT="${DIFF_TEXTS[$((DIFF_INDEX - 1))]}"
  emit_single_diff "${DIFF_INDEX}" "${SELECTED_DIFF_FILE}" "${SELECTED_DIFF_DIR}" "${SELECTED_YAML_DIR}" "${SELECTED_DIFF_TEXT}"
  exit 0
fi

TRIAGE_START="${START_INDEX}"
TRIAGE_END="$((START_INDEX + BATCH_SIZE - 1))"
if [ "${TRIAGE_END}" -gt "${DIFF_COUNT}" ]; then
  TRIAGE_END="${DIFF_COUNT}"
fi

echo ""
echo "=== DIFF_COUNT ==="
echo "${DIFF_COUNT}"
echo ""
echo "=== TRIAGE_RANGE ==="
echo "${TRIAGE_START}-${TRIAGE_END}"

if [ "${TRIAGE_START}" -gt "${DIFF_COUNT}" ]; then
  echo ""
  echo "=== TRIAGE_EMPTY ==="
  echo "--start-index ${TRIAGE_START} выходит за пределы списка diff'ов (${DIFF_COUNT})"
  exit 0
fi

for ((i = TRIAGE_START; i <= TRIAGE_END; i++)); do
  TRIAGE_DIFF_FILE="${DIFF_FILES[$((i - 1))]}"
  TRIAGE_DIFF_DIR="${DIFF_FILE_DIRS[$((i - 1))]}"
  TRIAGE_YAML_DIR="${DIFF_FILE_YAML_DIRS[$((i - 1))]}"
  TRIAGE_DIFF_TEXT="${DIFF_TEXTS[$((i - 1))]}"
  emit_triage_diff "${i}" "${TRIAGE_DIFF_FILE}" "${TRIAGE_DIFF_DIR}" "${TRIAGE_YAML_DIR}" "${TRIAGE_DIFF_TEXT}"
done
