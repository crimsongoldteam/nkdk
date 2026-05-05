#!/usr/bin/env bash
# ==============================================================================
# round-trip.sh — тонкий раннер short round-trip для skill round-trip-xml
#
# Контракт:
#   Читает NKDK_XML_REPO (обяз.) и NKDK_XML_DIR (опц., = NKDK_XML_REPO) из .env
#   в корне проекта. Отдаёт stdout-протокол для AI:
#     - путь к первому alphabetically diff-файлу в XML-репо
#     - полный diff файла
#     - либо сообщение «round-trip чистый», если расхождений нет
#
# Охраны:
#   - рабочее дерево nakidka-core должно быть чистым (защита от запуска вручную);
#   - NKDK_XML_REPO обязан быть git-репо;
#   - NKDK_XML_DIR обязан существовать.
#
# Использование (обычно вызывает skill, не человек):
#   ./.claude/skills/round-trip-xml/round-trip.sh
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "${SCRIPT_DIR}/../../.." && pwd)"

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
