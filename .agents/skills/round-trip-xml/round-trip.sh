#!/usr/bin/env bash
# ==============================================================================
# round-trip.sh — тонкий раннер short round-trip для skill round-trip-xml
#
# Контракт:
#   Читает NKDK_XML_REPO (обяз.) и NKDK_XML_DIR (опц., = NKDK_XML_REPO) из .env
#   в корне проекта. Отдаёт stdout-протокол для AI:
#     - по умолчанию: первый alphabetically diff-файл в XML-репо;
#     - --diff-index N: один выбранный diff-файл;
#     - --triage --batch-size N [--start-index K]: пачка diff-файлов;
#     - --all-configs: не останавливаться на первом каталоге с diff;
#     - либо сообщение «round-trip чистый», если расхождений нет
#
# Охраны:
#   - рабочее дерево nakidka-core должно быть чистым (защита от запуска вручную);
#   - NKDK_XML_REPO обязан быть git-репо;
#   - NKDK_XML_DIR обязан существовать.
#
# Использование (обычно вызывает skill, не человек):
#   ./.agents/skills/round-trip-xml/round-trip.sh
#   ./.agents/skills/round-trip-xml/round-trip.sh --diff-index 3
#   ./.agents/skills/round-trip-xml/round-trip.sh --triage --batch-size 5
#   ./.agents/skills/round-trip-xml/round-trip.sh --triage --batch-size 5 --start-index 6
#   ./.agents/skills/round-trip-xml/round-trip.sh --triage --all-configs --batch-size 20
# ==============================================================================
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
  ./.agents/skills/round-trip-xml/round-trip.sh
  ./.agents/skills/round-trip-xml/round-trip.sh --diff-index N
  ./.agents/skills/round-trip-xml/round-trip.sh --triage [--batch-size N] [--start-index K]
  ./.agents/skills/round-trip-xml/round-trip.sh --triage --all-configs [--batch-size N] [--start-index K]

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

# ── Загрузка .env ────────────────────────────────────────────────────────────

if [ -f "${REPO_DIR}/.env" ]; then
  # shellcheck disable=SC1091
  set -a
  . "${REPO_DIR}/.env"
  set +a
fi

# ── Проверка переменных окружения ────────────────────────────────────────────

if [ -z "${NKDK_XML_REPO:-}" ]; then
  echo "Ошибка: переменная NKDK_XML_REPO не задана (ни в окружении, ни в .env)" >&2
  exit 1
fi
if ! git -C "${NKDK_XML_REPO}" rev-parse --git-dir &>/dev/null; then
  echo "Ошибка: NKDK_XML_REPO ('${NKDK_XML_REPO}') не является git-репозиторием" >&2
  exit 1
fi

NKDK_XML_DIR="${NKDK_XML_DIR:-${NKDK_XML_REPO}}"
if [ ! -d "${NKDK_XML_DIR}" ]; then
  echo "Ошибка: NKDK_XML_DIR ('${NKDK_XML_DIR}') не существует или не каталог" >&2
  exit 1
fi
NKDK_XML_DIR="$(cd "${NKDK_XML_DIR}" && pwd)"

# ── Guard: чистое рабочее дерево nakidka-core ────────────────────────────────

if [ -n "$(git -C "${REPO_DIR}" status --porcelain)" ]; then
  echo "Ошибка: рабочее дерево nakidka-core не чистое." >&2
  echo "Сохрани или откати изменения перед запуском reproducer'а." >&2
  git -C "${REPO_DIR}" status --short >&2
  exit 1
fi

# ── Поиск команды nkdk ────────────────────────────────────────────────────────

if command -v nkdk &>/dev/null; then
  NKDK="nkdk"
elif [ -f "${REPO_DIR}/packages/cli/src/cli.ts" ]; then
  NKDK="pnpm -s --dir ${REPO_DIR}/packages/cli exec tsx src/cli.ts"
else
  echo "Ошибка: команда nkdk не найдена" >&2
  exit 1
fi

# ── Сводка ────────────────────────────────────────────────────────────────────

echo "=== round-trip.sh ==="
echo "XML репо:    ${NKDK_XML_REPO}"
echo "XML каталог: ${NKDK_XML_DIR}"
echo "nkdk:        ${NKDK}"
echo "mode:        ${MODE}"
echo "all configs: ${ALL_CONFIGS}"
if [ "${MODE}" = "single" ]; then
  echo "diff index:  ${DIFF_INDEX}"
else
  echo "batch size:  ${BATCH_SIZE}"
  echo "start index: ${START_INDEX}"
fi
echo ""

# ── Чистый старт XML-репо ────────────────────────────────────────────────────

RUN_DIRS=()
while IFS= read -r run_dir; do
  RUN_DIRS+=("${run_dir}")
done < <(collect_run_dirs "${NKDK_XML_DIR}")

if [ "${#RUN_DIRS[@]}" -eq 0 ]; then
  die "в NKDK_XML_DIR ('${NKDK_XML_DIR}') не найдено конфигурационных каталогов"
fi

echo "[restore] Откат XML-репо к HEAD..."
git -C "${NKDK_XML_REPO}" restore .

# ── Short round-trip ─────────────────────────────────────────────────────────

DIFF_FILES=()
DIFF_FILE_DIRS=()
ACTIVE_XML_DIR=""

for RUN_XML_DIR in "${RUN_DIRS[@]}"; do
  echo "[round-trip] Запуск short-round-trip-test: ${RUN_XML_DIR}"
  ${NKDK} short-round-trip-test "${RUN_XML_DIR}"

  CURRENT_DIFF_FILES=()
  while IFS= read -r diff_file; do
    CURRENT_DIFF_FILES+=("${diff_file}")
  done < <(git -C "${RUN_XML_DIR}" -c core.quotepath=false diff --name-only --relative -- . | sort)

  if [ "${#CURRENT_DIFF_FILES[@]}" -gt 0 ]; then
    ACTIVE_XML_DIR="${RUN_XML_DIR}"
    for diff_file in "${CURRENT_DIFF_FILES[@]}"; do
      DIFF_FILES+=("${diff_file}")
      DIFF_FILE_DIRS+=("${RUN_XML_DIR}")
    done
    if [ "${ALL_CONFIGS}" != "1" ]; then
      break
    fi
  fi
done

if [ -z "${ACTIVE_XML_DIR}" ]; then
  ACTIVE_XML_DIR="${RUN_DIRS[${#RUN_DIRS[@]} - 1]}"
fi

DIFF_COUNT="${#DIFF_FILES[@]}"

if [ "${DIFF_COUNT}" -eq 0 ]; then
  echo ""
  echo "=== Round-trip чистый: диффов нет ==="
  echo "Проверено каталогов: ${#RUN_DIRS[@]}"
  exit 0
fi

xml_file_abs() {
  local relative_path="$1"
  local active_dir="${2:-${ACTIVE_XML_DIR}}"
  echo "${active_dir%/}/${relative_path}"
}

emit_single_diff() {
  local index="$1"
  local file="$2"
  local active_dir="${3:-${ACTIVE_XML_DIR}}"

  echo ""
  echo "=== ACTIVE_XML_DIR ==="
  echo "${active_dir}"
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
  git -C "${active_dir}" -c core.quotepath=false diff --relative -- "${file}"
}

emit_triage_diff() {
  local index="$1"
  local file="$2"
  local active_dir="${3:-${ACTIVE_XML_DIR}}"

  echo ""
  echo "=== TRIAGE_DIFF ==="
  echo "INDEX: ${index}"
  echo "ACTIVE_XML_DIR: ${active_dir}"
  echo "FILE: ${file}"
  echo "XML_FILE_ABS: $(xml_file_abs "${file}" "${active_dir}")"
  echo "--- DIFF ---"
  git -C "${active_dir}" -c core.quotepath=false diff --relative -- "${file}"
}

if [ "${MODE}" = "single" ]; then
  if [ "${DIFF_INDEX}" -gt "${DIFF_COUNT}" ]; then
    die "--diff-index ${DIFF_INDEX} выходит за пределы списка diff'ов (${DIFF_COUNT})"
  fi

  SELECTED_DIFF_FILE="${DIFF_FILES[$((DIFF_INDEX - 1))]}"
  SELECTED_DIFF_DIR="${DIFF_FILE_DIRS[$((DIFF_INDEX - 1))]}"
  emit_single_diff "${DIFF_INDEX}" "${SELECTED_DIFF_FILE}" "${SELECTED_DIFF_DIR}"
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
  emit_triage_diff "${i}" "${TRIAGE_DIFF_FILE}" "${TRIAGE_DIFF_DIR}"
done
