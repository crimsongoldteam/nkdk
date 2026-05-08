#!/usr/bin/env bash
# ==============================================================================
# round-trip-fix.sh — автоматическая починка round-trip диффов через агента
#
# Алгоритм (одна итерация):
#   1. Очистить YAML-каталог
#   2. nkdk import XML_REPO YAML_DIR        (XML → YAML)
#   3. nkdk sync  YAML_DIR XML_REPO         (YAML → XML поверх эталона)
#   4. Взять первый файл с диффом (по алфавиту)
#   5. Передать дифф агенту (claude -p)
#   6. Проверить, что агент закоммитил; при неудаче — откатить
#   7. Откатить XML-репо к исходному состоянию (git restore .)
#   8. Повторить до исчезновения диффов или исчерпания лимита
#
# Переменные окружения:
#   NKDK_XML_REPO  (обязательная) — путь к git-репо с XML-выгрузкой
#   NKDK_YAML_DIR  (обязательная) — путь к промежуточному YAML-каталогу
#   MAX_ITERATIONS (необязательная, по умолчанию 50) — лимит итераций
#
# Использование:
#   NKDK_XML_REPO=/path/to/config NKDK_YAML_DIR=/tmp/yaml ./scripts/round-trip-fix.sh
# ==============================================================================
set -euo pipefail

# ── Проверка обязательных переменных ─────────────────────────────────────────

if [ -z "${NKDK_XML_REPO:-}" ]; then
  echo "Ошибка: переменная NKDK_XML_REPO не задана" >&2
  exit 1
fi
if [ -z "${NKDK_YAML_DIR:-}" ]; then
  echo "Ошибка: переменная NKDK_YAML_DIR не задана" >&2
  exit 1
fi
if ! git -C "${NKDK_XML_REPO}" rev-parse --git-dir &>/dev/null; then
  echo "Ошибка: NKDK_XML_REPO ('${NKDK_XML_REPO}') не находится внутри git-репозитория" >&2
  exit 1
fi

MAX_ITERATIONS="${MAX_ITERATIONS:-50}"
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

PROMPT_FILE="$(mktemp /tmp/round-trip-prompt.XXXXXX)"
trap 'rm -f "${PROMPT_FILE}"' EXIT

# ── Сводка ────────────────────────────────────────────────────────────────────

echo "=== Round-trip fix cycle ==="
echo "XML репо:       ${NKDK_XML_REPO}"
echo "YAML каталог:   ${NKDK_YAML_DIR}"
echo "nkdk:           ${NKDK}"
echo "Лимит:          ${MAX_ITERATIONS} итераций"
echo ""

success=0
skipped=0

# ── Основной цикл ─────────────────────────────────────────────────────────────

for ((i=1; i<=MAX_ITERATIONS; i++)); do
  echo "--- Итерация ${i}/${MAX_ITERATIONS} ---"

  # 1. Очистить YAML-каталог
  rm -rf "${NKDK_YAML_DIR:?}"
  mkdir -p "${NKDK_YAML_DIR}"

  # 2. XML → YAML
  echo "[import] XML → YAML..."
  ${NKDK} import "${NKDK_XML_REPO}" "${NKDK_YAML_DIR}"

  # 3. YAML → XML
  echo "[sync]   YAML → XML..."
  ${NKDK} sync "${NKDK_YAML_DIR}" "${NKDK_XML_REPO}"

  # 4. Проверить наличие диффов
  FIRST_DIFF_FILE="$(set +o pipefail; git -C "${NKDK_XML_REPO}" -c core.quotepath=false diff --name-only --relative -- . | sort | head -1)"

  if [ -z "${FIRST_DIFF_FILE}" ]; then
    echo ""
    echo "=== УСПЕХ: диффов нет после ${i} итерации(-й)! ==="
    echo "Успешных починок: ${success}"
    exit 0
  fi

  echo "[diff]   Первый файл: ${FIRST_DIFF_FILE}"

  # 5. Взять первый hunk диффа (первые 100 строк)
  DIFF_TEXT="$(set +o pipefail; git -C "${NKDK_XML_REPO}" -c core.quotepath=false diff --relative -- "${FIRST_DIFF_FILE}" | head -100)"

  # 6. Сформировать промпт агенту
  cat > "${PROMPT_FILE}" << PROMPT_EOF
Ты работаешь в репозитории nakidka-core (${REPO_DIR}).

При round-trip (XML → YAML → XML) обнаружен дифф.
Файл в XML-выгрузке: ${FIRST_DIFF_FILE}

Дифф (первый hunk):
${DIFF_TEXT}

ЗАДАЧА: Найди причину этого диффа и исправь её в rules.ts.

ПРАВИЛА (обязательные):
- Правь ТОЛЬКО файлы в packages/core (в основном rules.ts, при необходимости types.ts)
- XML-фикстуры в __fixtures__/ — неизменяемы (правило проекта из AGENTS.md)
- Не пиши новые функции fromXML/toXML/fromYAML/toYAML — используй только rules.ts
- Перед коммитом ОБЯЗАТЕЛЬНО прогони гейт: pnpm -w typecheck && pnpm --filter @nakidka/core test
- Если гейт красный — откати правку (git restore .), не коммить
- Если гейт зелёный — закоммить, используя скилл /commit (Conventional Commits + gitmoji на русском)

ПРОЦЕСС: Изучи кодовую базу сам — rules.ts, types.ts, соответствующие фикстуры в packages/core.
Локализуй причину. Внеси минимальную правку. Прогони гейт. Если зелёный — закоммить.
PROMPT_EOF

  # 7. Запустить агента
  HEAD_BEFORE="$(git -C "${REPO_DIR}" rev-parse HEAD)"

  ITER_LOG="/tmp/round-trip-fix-iter-${i}.log"
  echo "[agent]  Запускаю Claude для: ${FIRST_DIFF_FILE}"
  echo "[agent]  Живой лог: tail -f ${ITER_LOG}"
  (cd "${REPO_DIR}" && claude --dangerously-skip-permissions --verbose --output-format stream-json -p "$(cat "${PROMPT_FILE}")") 2>&1 \
    | tee "${ITER_LOG}" \
    | while IFS= read -r line; do
        text="$(printf '%s' "$line" | sed -n 's/.*"type":"text".*"text":"\([^"]*\)".*/\1/p' | head -c 200)"
        [ -n "$text" ] && echo "[agent]  ${text}"
      done || true

  # 8. Проверить результат: HEAD сдвинулся И рабочее дерево чистое
  HEAD_AFTER="$(git -C "${REPO_DIR}" rev-parse HEAD)"
  DIRTY="$(git -C "${REPO_DIR}" status --porcelain 2>/dev/null || echo "")"

  if [ "${HEAD_BEFORE}" != "${HEAD_AFTER}" ] && [ -z "${DIRTY}" ]; then
    COMMIT_MSG="$(git -C "${REPO_DIR}" log -1 --oneline)"
    echo "[ok]     Агент закоммитил: ${COMMIT_MSG}"
    success=$((success + 1))
  else
    echo "[skip]   Агент не закоммитил (HEAD не сдвинулся или рабочее дерево грязное)."
    # Откатить незакоммиченные изменения в основном репо
    git -C "${REPO_DIR}" reset --hard HEAD
    git -C "${REPO_DIR}" restore . 2>/dev/null || true
    skipped=$((skipped + 1))
  fi

  # 9. Откатить XML-репо к исходному состоянию
  echo "[restore] Откат XML-выгрузки..."
  git -C "${NKDK_XML_REPO}" restore .

  echo ""
done

# ── Лимит исчерпан ────────────────────────────────────────────────────────────

echo "=== ЛИМИТ ИСЧЕРПАН: ${MAX_ITERATIONS} итераций завершено ==="
echo "Успешных починок: ${success}, пропущено: ${skipped}"
echo "В XML-репо ещё остались диффы. Проверьте вручную:"
echo "  git -C '${NKDK_XML_REPO}' diff"
exit 1
