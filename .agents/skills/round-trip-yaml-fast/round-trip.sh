#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "${SCRIPT_DIR}/../../.." && pwd)"

# shellcheck source=../_shared/round-trip-config-dirs.sh
. "${REPO_DIR}/.agents/skills/_shared/round-trip-config-dirs.sh"

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
  ./.agents/skills/round-trip-yaml-fast/round-trip.sh
  ./.agents/skills/round-trip-yaml-fast/round-trip.sh --diff-index N
  ./.agents/skills/round-trip-yaml-fast/round-trip.sh --triage [--batch-size N] [--start-index K]
  ./.agents/skills/round-trip-yaml-fast/round-trip.sh --triage --all-configs [--batch-size N] [--start-index K]

Параметры:
  --diff-index N   Показать один diff по 1-based номеру.
  --triage         Показать пачку diff'ов.
  --all-configs    Проверить все конфигурационные каталоги, не останавливаться на первом diff/error.
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

NKDK_XML_DIR="${NKDK_XML_DIR:-${NKDK_XML_REPO}}"
if [ ! -d "${NKDK_XML_DIR}" ]; then
  die "NKDK_XML_DIR ('${NKDK_XML_DIR}') не существует или не каталог"
fi
NKDK_XML_DIR="$(cd "${NKDK_XML_DIR}" && pwd)"
NKDK_XML_REPO="$(cd "${NKDK_XML_REPO}" && pwd)"

if command -v nkdk &>/dev/null; then
  NKDK=(nkdk)
elif [ -f "${REPO_DIR}/packages/cli/src/cli.ts" ]; then
  NKDK=(pnpm -s --dir "${REPO_DIR}/packages/cli" exec tsx src/cli.ts)
else
  die "команда nkdk не найдена"
fi

OUTPUT_DIR="$(mktemp -d "${TMPDIR:-/tmp}/round-trip-yaml-fast.XXXXXX")"
trap 'rm -rf "${OUTPUT_DIR}"' EXIT

echo "=== round-trip-yaml-fast.sh ==="
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
done < <(round_trip_collect_run_dirs "${NKDK_XML_DIR}")

if [ "${#RUN_DIRS[@]}" -eq 0 ]; then
  die "в NKDK_XML_DIR ('${NKDK_XML_DIR}') не найдено конфигурационных каталогов"
fi

parse_diff_count() {
  awk '
    $0 == "=== DIFF_COUNT ===" { getline; print; exit }
  ' "$1"
}

parse_checked_count() {
  awk '
    /^checked: / { sub(/^checked: /, ""); print; exit }
  ' "$1"
}

parse_error_count() {
  awk '
    /^errors: / { sub(/^errors: /, ""); print; exit }
  ' "$1"
}

TOTAL_CHECKED_COUNT="0"
TOTAL_DIFF_COUNT="0"
TOTAL_ERROR_COUNT="0"
RUN_OUTPUT_FILES=()
RUN_OUTPUT_DIRS=()
RUN_OUTPUT_EXIT_CODES=()
ACTIVE_XML_DIR=""

for i in "${!RUN_DIRS[@]}"; do
  RUN_XML_DIR="${RUN_DIRS[$i]}"
  OUTPUT_FILE="${OUTPUT_DIR}/run-${i}.out"
  NKDK_EXIT="0"
  if "${NKDK[@]}" round-trip-yaml-fast "${RUN_XML_DIR}" >"${OUTPUT_FILE}"; then
    NKDK_EXIT="0"
  else
    NKDK_EXIT="$?"
  fi

  if [ "${NKDK_EXIT}" -ne 0 ] && ! grep -q '^=== ROUND_TRIP_YAML_FAST ===$' "${OUTPUT_FILE}"; then
    cat "${OUTPUT_FILE}"
    exit "${NKDK_EXIT}"
  fi

  RUN_DIFF_COUNT="$(parse_diff_count "${OUTPUT_FILE}")"
  RUN_DIFF_COUNT="${RUN_DIFF_COUNT:-0}"
  is_positive_integer "${RUN_DIFF_COUNT}" || [ "${RUN_DIFF_COUNT}" = "0" ] || die "не удалось прочитать DIFF_COUNT"

  RUN_CHECKED_COUNT="$(parse_checked_count "${OUTPUT_FILE}")"
  RUN_CHECKED_COUNT="${RUN_CHECKED_COUNT:-0}"
  is_positive_integer "${RUN_CHECKED_COUNT}" || [ "${RUN_CHECKED_COUNT}" = "0" ] || die "не удалось прочитать checked"

  RUN_ERROR_COUNT="$(parse_error_count "${OUTPUT_FILE}")"
  RUN_ERROR_COUNT="${RUN_ERROR_COUNT:-0}"
  is_positive_integer "${RUN_ERROR_COUNT}" || [ "${RUN_ERROR_COUNT}" = "0" ] || die "не удалось прочитать errors"

  TOTAL_CHECKED_COUNT="$((TOTAL_CHECKED_COUNT + RUN_CHECKED_COUNT))"
  TOTAL_DIFF_COUNT="$((TOTAL_DIFF_COUNT + RUN_DIFF_COUNT))"
  TOTAL_ERROR_COUNT="$((TOTAL_ERROR_COUNT + RUN_ERROR_COUNT))"
  RUN_OUTPUT_FILES+=("${OUTPUT_FILE}")
  RUN_OUTPUT_DIRS+=("${RUN_XML_DIR}")
  RUN_OUTPUT_EXIT_CODES+=("${NKDK_EXIT}")

  if [ "${RUN_DIFF_COUNT}" -gt 0 ] || [ "${RUN_ERROR_COUNT}" -gt 0 ]; then
    ACTIVE_XML_DIR="${RUN_XML_DIR}"
    if [ "${ALL_CONFIGS}" != "1" ]; then
      break
    fi
  fi
done

if [ -z "${ACTIVE_XML_DIR}" ]; then
  LAST_RUN_INDEX="$((${#RUN_DIRS[@]} - 1))"
  ACTIVE_XML_DIR="${RUN_DIRS[${LAST_RUN_INDEX}]}"
fi

CHECKED_COUNT="${TOTAL_CHECKED_COUNT}"
DIFF_COUNT="${TOTAL_DIFF_COUNT}"
ERROR_COUNT="${TOTAL_ERROR_COUNT}"

echo "=== ACTIVE_XML_DIR ==="
echo "${ACTIVE_XML_DIR}"
echo ""
echo "=== CHECKED ==="
echo "${CHECKED_COUNT}"
echo ""
echo "=== DIFF_COUNT ==="
echo "${DIFF_COUNT}"
echo ""
echo "=== ERROR_COUNT ==="
echo "${ERROR_COUNT}"
echo ""
echo "=== RUN_DIR_COUNT ==="
echo "${#RUN_OUTPUT_FILES[@]}"

if [ "${DIFF_COUNT}" -eq 0 ] && [ "${ERROR_COUNT}" -eq 0 ]; then
  echo ""
  echo "=== Round-trip YAML fast чистый: диффов нет ==="
  exit 0
fi

if [ "${DIFF_COUNT}" -eq 0 ]; then
  RESULT_EXIT="0"
  for i in "${!RUN_OUTPUT_FILES[@]}"; do
    if [ "${RUN_OUTPUT_EXIT_CODES[$i]}" -ne 0 ]; then
      RESULT_EXIT="${RUN_OUTPUT_EXIT_CODES[$i]}"
    fi
    awk -v active_dir="${RUN_OUTPUT_DIRS[$i]}" '
      $0 == "=== ERRORS ===" {
        print ""
        print "=== ERRORS ==="
        print "ACTIVE_XML_DIR: " active_dir
        selected = 1
        next
      }
      selected { print }
    ' "${RUN_OUTPUT_FILES[$i]}"
  done
  exit "${RESULT_EXIT}"
fi

emit_single_diff() {
  local target="$1"
  local seen="0"
  local i
  local output_file
  local active_dir
  local local_diff_count
  local local_target

  for i in "${!RUN_OUTPUT_FILES[@]}"; do
    output_file="${RUN_OUTPUT_FILES[$i]}"
    active_dir="${RUN_OUTPUT_DIRS[$i]}"
    local_diff_count="$(parse_diff_count "${output_file}")"
    local_diff_count="${local_diff_count:-0}"
    if [ "${target}" -gt "${seen}" ] && [ "${target}" -le "$((seen + local_diff_count))" ]; then
      local_target="$((target - seen))"
      awk -v target="${local_target}" -v global_index="${target}" -v active_dir="${active_dir}" '
        $0 == "=== DIFF ===" {
          current += 1
          selected = current == target
          if (selected) {
            print ""
            print "=== SELECTED_DIFF_INDEX ==="
            print global_index
            print ""
            print "=== SELECTED_DIFF ==="
          }
          next
        }
        selected && /^file: / {
          file = substr($0, 7)
          print "=== SELECTED_DIFF_FILE ==="
          print file
          print ""
          print "=== ACTIVE_XML_DIR ==="
          print active_dir
          print ""
          print "=== SELECTED_XML_FILE_ABS ==="
          print active_dir "/" file
          print ""
          print "=== FULL_DIFF ==="
          next
        }
        selected && /^xmlFileAbs: / { next }
        selected { print }
      ' "${output_file}"
      return 0
    fi
    seen="$((seen + local_diff_count))"
  done
}

emit_triage_diffs() {
  local start="$1"
  local end="$2"
  local index

  for ((index = start; index <= end; index++)); do
    emit_triage_diff "${index}"
  done
}

emit_triage_diff() {
  local target="$1"
  local seen="0"
  local i
  local output_file
  local active_dir
  local local_diff_count
  local local_target

  for i in "${!RUN_OUTPUT_FILES[@]}"; do
    output_file="${RUN_OUTPUT_FILES[$i]}"
    active_dir="${RUN_OUTPUT_DIRS[$i]}"
    local_diff_count="$(parse_diff_count "${output_file}")"
    local_diff_count="${local_diff_count:-0}"
    if [ "${target}" -gt "${seen}" ] && [ "${target}" -le "$((seen + local_diff_count))" ]; then
      local_target="$((target - seen))"
      awk -v target="${local_target}" -v global_index="${target}" -v active_dir="${active_dir}" '
        $0 == "=== DIFF ===" {
          current += 1
          selected = current == target
          if (selected) {
            print ""
            print "=== TRIAGE_DIFF ==="
            print "INDEX: " global_index
            print "ACTIVE_XML_DIR: " active_dir
          }
          next
        }
        selected && /^file: / {
          file = substr($0, 7)
          print "FILE: " file
          print "XML_FILE_ABS: " active_dir "/" file
          print "--- DIFF ---"
          next
        }
        selected && /^xmlFileAbs: / { next }
        selected { print }
      ' "${output_file}"
      return 0
    fi
    seen="$((seen + local_diff_count))"
  done
}

if [ "${MODE}" = "single" ]; then
  if [ "${DIFF_INDEX}" -gt "${DIFF_COUNT}" ]; then
    die "--diff-index ${DIFF_INDEX} выходит за пределы списка diff'ов (${DIFF_COUNT})"
  fi

  emit_single_diff "${DIFF_INDEX}"
  exit 0
fi

TRIAGE_START="${START_INDEX}"
TRIAGE_END="$((START_INDEX + BATCH_SIZE - 1))"
if [ "${TRIAGE_END}" -gt "${DIFF_COUNT}" ]; then
  TRIAGE_END="${DIFF_COUNT}"
fi

echo ""
echo "=== TRIAGE_RANGE ==="
echo "${TRIAGE_START}-${TRIAGE_END}"

if [ "${TRIAGE_START}" -gt "${DIFF_COUNT}" ]; then
  echo ""
  echo "=== TRIAGE_EMPTY ==="
  echo "--start-index ${TRIAGE_START} выходит за пределы списка diff'ов (${DIFF_COUNT})"
  exit 0
fi

emit_triage_diffs "${TRIAGE_START}" "${TRIAGE_END}"
