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

usage() {
  cat <<'USAGE'
Использование:
  ./.agents/skills/round-trip-yaml-fast/round-trip.sh
  ./.agents/skills/round-trip-yaml-fast/round-trip.sh --diff-index N
  ./.agents/skills/round-trip-yaml-fast/round-trip.sh --triage [--batch-size N] [--start-index K]

Параметры:
  --diff-index N   Показать один diff по 1-based номеру.
  --triage         Показать пачку diff'ов.
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

OUTPUT_FILE="$(mktemp "${TMPDIR:-/tmp}/round-trip-yaml-fast.XXXXXX")"
trap 'rm -f "${OUTPUT_FILE}"' EXIT

echo "=== round-trip-yaml-fast.sh ==="
echo "XML репо:    ${NKDK_XML_REPO}"
echo "XML каталог: ${NKDK_XML_DIR}"
echo "nkdk:        ${NKDK[*]}"
echo "mode:        ${MODE}"
if [ "${MODE}" = "single" ]; then
  echo "diff index:  ${DIFF_INDEX}"
else
  echo "batch size:  ${BATCH_SIZE}"
  echo "start index: ${START_INDEX}"
fi
echo ""

if ! "${NKDK[@]}" round-trip-yaml-fast "${NKDK_XML_DIR}" >"${OUTPUT_FILE}"; then
  cat "${OUTPUT_FILE}"
  exit 1
fi

DIFF_COUNT="$(
  awk '
    $0 == "=== DIFF_COUNT ===" { getline; print; exit }
  ' "${OUTPUT_FILE}"
)"
DIFF_COUNT="${DIFF_COUNT:-0}"
is_positive_integer "${DIFF_COUNT}" || [ "${DIFF_COUNT}" = "0" ] || die "не удалось прочитать DIFF_COUNT"

echo "=== ACTIVE_XML_DIR ==="
echo "${NKDK_XML_DIR}"
echo ""
echo "=== DIFF_COUNT ==="
echo "${DIFF_COUNT}"

if [ "${DIFF_COUNT}" -eq 0 ]; then
  echo ""
  echo "=== Round-trip YAML fast чистый: диффов нет ==="
  exit 0
fi

emit_single_diff() {
  local index="$1"

  awk -v target="${index}" -v active_dir="${NKDK_XML_DIR}" '
    $0 == "=== DIFF ===" {
      current += 1
      selected = current == target
      if (selected) {
        print ""
        print "=== SELECTED_DIFF_INDEX ==="
        print target
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
      print "=== SELECTED_XML_FILE_ABS ==="
      print active_dir "/" file
      print ""
      print "=== FULL_DIFF ==="
      next
    }
    selected && /^xmlFileAbs: / { next }
    selected { print }
  ' "${OUTPUT_FILE}"
}

emit_triage_diffs() {
  local start="$1"
  local end="$2"

  awk -v start="${start}" -v end="${end}" -v active_dir="${NKDK_XML_DIR}" '
    $0 == "=== DIFF ===" {
      current += 1
      selected = current >= start && current <= end
      if (selected) {
        print ""
        print "=== TRIAGE_DIFF ==="
        print "INDEX: " current
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
  ' "${OUTPUT_FILE}"
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
