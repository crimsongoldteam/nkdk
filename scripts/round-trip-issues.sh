#!/usr/bin/env bash
# ==============================================================================
# round-trip-issues.sh — short round-trip XML→модель→XML + GitHub issues
#
# Алгоритм:
#   1. Проверка NKDK_XML_REPO
#   2. git restore . — гарантия чистого старта
#   3. nkdk short-round-trip-test <xml-repo> — round-trip без YAML-слоя
#   4. Найти первый файл с диффом (по алфавиту)
#   5. Если диффов нет — вывести «round-trip чистый» и выйти
#   6. Иначе — передать дифф ИИ для группировки по узлам и заведения issues
#   7. Показать список свежих issues с меткой round-trip
#   (Дифф в XML-репо НЕ откатывается — можно изучить вручную)
#
# Переменные окружения:
#   NKDK_XML_REPO (обязательная) — путь к git-репо с XML-выгрузкой
#   NKDK_XML_DIR  (опциональная) — путь к подкаталогу с XML-выгрузкой
#                                  (по умолчанию совпадает с NKDK_XML_REPO)
#
# Использование:
#   NKDK_XML_REPO=/path/to/repo \
#   NKDK_XML_DIR=/path/to/repo/subdir \
#     ./scripts/round-trip-issues.sh
# ==============================================================================
set -euo pipefail

# ── Проверка обязательных переменных ─────────────────────────────────────────

if [ -z "${NKDK_XML_REPO:-}" ]; then
  echo "Ошибка: переменная NKDK_XML_REPO не задана" >&2
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

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

# ── Поиск команды nkdk ────────────────────────────────────────────────────────

if command -v nkdk &>/dev/null; then
  NKDK="nkdk"
elif [ -f "${REPO_DIR}/packages/cli/src/cli.ts" ]; then
  NKDK="pnpm -s --dir ${REPO_DIR}/packages/cli exec tsx src/cli.ts"
else
  echo "Ошибка: команда nkdk не найдена." >&2
  exit 1
fi

# ── Временный файл для промпта ────────────────────────────────────────────────

PROMPT_FILE="$(mktemp /tmp/round-trip-issues-prompt.XXXXXX)"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
LOG_FILE="/tmp/round-trip-issues-${TIMESTAMP}.log"
trap 'rm -f "${PROMPT_FILE}"' EXIT

# ── Сводка ────────────────────────────────────────────────────────────────────

echo "=== Round-trip issues ==="
echo "XML репо:  ${NKDK_XML_REPO}"
echo "XML каталог: ${NKDK_XML_DIR}"
echo "nkdk:      ${NKDK}"
echo "Лог:       ${LOG_FILE}"
echo ""

# ── 1. Чистый старт ──────────────────────────────────────────────────────────

echo "[restore] Откат XML-репо к HEAD..."
git -C "${NKDK_XML_DIR}" restore .

# ── 2. Short round-trip ───────────────────────────────────────────────────────

echo "[round-trip] Запуск short-round-trip-test..."
${NKDK} short-round-trip-test "${NKDK_XML_DIR}"

# ── 3. Найти первый файл с диффом ─────────────────────────────────────────────

FIRST_DIFF_FILE="$(set +o pipefail; git -C "${NKDK_XML_DIR}" -c core.quotepath=false diff --name-only --relative -- . | sort | head -1)"

if [ -z "${FIRST_DIFF_FILE}" ]; then
  echo ""
  echo "=== Round-trip чистый: диффов нет ==="
  exit 0
fi

echo "[diff] Первый файл с расхождением: ${FIRST_DIFF_FILE}"

# ── 4. Полный дифф файла ──────────────────────────────────────────────────────

DIFF_TEXT="$(git -C "${NKDK_XML_DIR}" -c core.quotepath=false diff --relative -- "${FIRST_DIFF_FILE}")"

# ── 5. Промпт для ИИ ─────────────────────────────────────────────────────────

cat > "${PROMPT_FILE}" << PROMPT_EOF
Ты работаешь в репозитории nakidka-core (${REPO_DIR}).

При short round-trip (XML → модель → XML, без YAML-слоя) обнаружены расхождения.
Файл в XML-репо: ${FIRST_DIFF_FILE}

Полный дифф файла:
${DIFF_TEXT}

ЗАДАЧА: Сгруппировать расхождения по конкретным узлам XML (один узел = одна группа) и завести GitHub issues.

ПРАВИЛА:
- Заводить issues в репозитории crimsongoldteam/nkdk через: gh issue create --repo crimsongoldteam/nkdk
- Метка: round-trip (--label round-trip)
- Не больше 4 issues за прогон; если групп больше — выбрать 4 самых важных
- Группировать по конкретному узлу (тег + ключевые атрибуты), а НЕ по типу узла или по hunk-ам
- Ничего не исправлять в коде, не коммитить

Для каждой группы определить:
- Конкретный узел: тег + ключевые атрибуты (name, uuid или аналогичные) + читаемая локализация
  (например: «Реквизит Контрагент справочника Контрагенты»)
- XPath-путь к узлу в файле
- Исходный XML-фрагмент из HEAD (готовый как фикстура для воспроизведения)
- XML-фрагмент после round-trip (что получилось)
- Описание отклонения
- Предположение о причине в packages/core (rules.ts соответствующего типа)

Шаблон тела каждого issue (на русском):

## Контекст
Файл: <путь к файлу>
Узел: <читаемая локализация> (<XPath>)

## XML до round-trip
\`\`\`xml
<исходный фрагмент>
\`\`\`

## XML после round-trip
\`\`\`xml
<фрагмент после round-trip>
\`\`\`

## Описание отклонения
<что именно изменилось>

## Предполагаемая причина
<файл и место в packages/core>
PROMPT_EOF

# ── 6. Запустить ИИ ───────────────────────────────────────────────────────────

echo "[agent] Запускаю Claude для анализа: ${FIRST_DIFF_FILE}"
echo "[agent] Живой лог: tail -f ${LOG_FILE}"
(cd "${REPO_DIR}" && claude --dangerously-skip-permissions --verbose --output-format stream-json -p "$(cat "${PROMPT_FILE}")") 2>&1 \
  | tee "${LOG_FILE}" \
  | while IFS= read -r line; do
      text="$(printf '%s' "$line" | sed -n 's/.*"type":"text".*"text":"\([^"]*\)".*/\1/p' | head -c 200)"
      [ -n "$text" ] && echo "[agent]  ${text}"
    done || true

# ── 7. Показать свежие issues ─────────────────────────────────────────────────

echo ""
echo "=== Свежие issues с меткой round-trip ==="
gh issue list --repo crimsongoldteam/nkdk --label round-trip --state open --limit 10 \
  --json number,title,createdAt \
  --jq '.[] | "#\(.number) \(.title) (\(.createdAt[:10]))"' \
  || echo "(gh не настроен или нет issues)"
