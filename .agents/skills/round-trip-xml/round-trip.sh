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

usage() {
  cat <<'USAGE'
Использование:
  ./.agents/skills/round-trip-xml/round-trip.sh
  ./.agents/skills/round-trip-xml/round-trip.sh --diff-index N
  ./.agents/skills/round-trip-xml/round-trip.sh --triage [--batch-size N] [--start-index K]

Параметры:
  --diff-index N   Показать один diff по 1-based номеру из отсортированного списка.
  --triage         Показать пачку diff'ов для информационного анализа.
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
echo ""

# ── Чистый старт XML-репо ────────────────────────────────────────────────────

echo "[restore] Откат XML-репо к HEAD..."
git -C "${NKDK_XML_DIR}" restore .

# ── Short round-trip ─────────────────────────────────────────────────────────

echo "[round-trip] Запуск short-round-trip-test..."
${NKDK} short-round-trip-test "${NKDK_XML_DIR}"

# ── Первый файл с диффом ─────────────────────────────────────────────────────

FIRST_DIFF_FILE="$(set +o pipefail; git -C "${NKDK_XML_DIR}" -c core.quotepath=false diff --name-only --relative -- . | sort | head -1)"

if [ -z "${FIRST_DIFF_FILE}" ]; then
  echo ""
  echo "=== Round-trip чистый: диффов нет ==="
  exit 0
fi

echo ""
echo "=== FIRST_DIFF_FILE ==="
echo "${FIRST_DIFF_FILE}"
echo ""
echo "=== FULL_DIFF ==="
git -C "${NKDK_XML_DIR}" -c core.quotepath=false diff --relative -- "${FIRST_DIFF_FILE}"
