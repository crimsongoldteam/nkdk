# Round-trip XML Triage Batch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an informational triage mode to `round-trip-xml` so the user can request a numbered batch of XML round-trip diffs with absolute XML paths and concise analysis.

**Architecture:** Keep `round-trip.sh` as a thin runner: it parses CLI options, runs the existing short round-trip command, lists changed XML files, and prints either one selected diff or a batch. Keep categorization and human-readable summaries in `SKILL.md`, where the AI can inspect code and diff context without turning triage into implementation.

**Tech Stack:** Bash, git diff protocol, Codex skill Markdown, local `nkdk short-round-trip-test`.

---

## File Structure

- Modify: `.agents/skills/round-trip-xml/round-trip.sh`
  - Responsibility: command-line parsing, diff selection, absolute XML file paths, single-diff and triage output protocols.
- Modify: `.agents/skills/round-trip-xml/SKILL.md`
  - Responsibility: document when to use triage, how to call the runner, how to summarize each batch item, and how single reproducer mode uses `--diff-index`.
- Reference only: `docs/superpowers/specs/2026-05-06-round-trip-triage-batch-design.md`
  - Responsibility: approved design source. Do not modify it during implementation unless the design changes.

## Task 1: Add CLI Parsing To The Runner

**Files:**
- Modify: `.agents/skills/round-trip-xml/round-trip.sh`

- [ ] **Step 1: Update the header contract**

Replace the current contract block at the top of `.agents/skills/round-trip-xml/round-trip.sh` with this text:

```bash
# Контракт:
#   Читает NKDK_XML_REPO (обяз.) и NKDK_XML_DIR (опц., = NKDK_XML_REPO) из .env
#   в корне проекта. Отдаёт stdout-протокол для AI:
#     - по умолчанию: первый alphabetically diff-файл в XML-репо;
#     - --diff-index N: один выбранный diff-файл;
#     - --triage --batch-size N [--start-index K]: пачка diff-файлов;
#     - либо сообщение «round-trip чистый», если расхождений нет.
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
```

- [ ] **Step 2: Add parser variables and helpers after `REPO_DIR`**

Insert this block immediately after:

```bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "${SCRIPT_DIR}/../../.." && pwd)"
```

Code to insert:

```bash
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
```

- [ ] **Step 3: Parse arguments before `.env` loading**

Insert this block after the helper functions from Step 2 and before the `# ── Загрузка .env` section:

```bash
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
```

- [ ] **Step 4: Run syntax check**

Run:

```bash
bash -n .agents/skills/round-trip-xml/round-trip.sh
```

Expected: command exits with code 0 and prints nothing.

- [ ] **Step 5: Commit parser change**

Run:

```bash
git add .agents/skills/round-trip-xml/round-trip.sh
git commit -m "feat: :sparkles: добавить параметры round-trip XML"
```

Expected: commit succeeds and contains only `.agents/skills/round-trip-xml/round-trip.sh`.

## Task 2: Replace First-Diff Logic With Single And Triage Emitters

**Files:**
- Modify: `.agents/skills/round-trip-xml/round-trip.sh`

- [ ] **Step 1: Make `NKDK_XML_DIR` absolute after validation**

Find this block:

```bash
NKDK_XML_DIR="${NKDK_XML_DIR:-${NKDK_XML_REPO}}"
if [ ! -d "${NKDK_XML_DIR}" ]; then
  echo "Ошибка: NKDK_XML_DIR ('${NKDK_XML_DIR}') не существует или не каталог" >&2
  exit 1
fi
```

Replace it with:

```bash
NKDK_XML_DIR="${NKDK_XML_DIR:-${NKDK_XML_REPO}}"
if [ ! -d "${NKDK_XML_DIR}" ]; then
  echo "Ошибка: NKDK_XML_DIR ('${NKDK_XML_DIR}') не существует или не каталог" >&2
  exit 1
fi
NKDK_XML_DIR="$(cd "${NKDK_XML_DIR}" && pwd)"
```

- [ ] **Step 2: Replace the summary block with mode-aware output**

Find this block:

```bash
echo "=== round-trip.sh ==="
echo "XML репо:    ${NKDK_XML_REPO}"
echo "XML каталог: ${NKDK_XML_DIR}"
echo "nkdk:        ${NKDK}"
echo ""
```

Replace it with:

```bash
echo "=== round-trip.sh ==="
echo "XML репо:    ${NKDK_XML_REPO}"
echo "XML каталог: ${NKDK_XML_DIR}"
echo "nkdk:        ${NKDK}"
echo "mode:        ${MODE}"
if [ "${MODE}" = "single" ]; then
  echo "diff index:  ${DIFF_INDEX}"
else
  echo "batch size:  ${BATCH_SIZE}"
  echo "start index: ${START_INDEX}"
fi
echo ""
```

- [ ] **Step 3: Replace the first-diff section with diff list emitters**

Replace everything from this comment to the end of file:

```bash
# ── Первый файл с диффом ─────────────────────────────────────────────────────
```

with this complete block:

```bash
# ── Файлы с диффом ───────────────────────────────────────────────────────────

mapfile -t DIFF_FILES < <(git -C "${NKDK_XML_DIR}" -c core.quotepath=false diff --name-only --relative -- . | sort)
DIFF_COUNT="${#DIFF_FILES[@]}"

if [ "${DIFF_COUNT}" -eq 0 ]; then
  echo ""
  echo "=== Round-trip чистый: диффов нет ==="
  exit 0
fi

xml_file_abs() {
  local relative_path="$1"
  echo "${NKDK_XML_DIR%/}/${relative_path}"
}

emit_single_diff() {
  local index="$1"
  local file="$2"

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
  xml_file_abs "${file}"
  echo ""
  echo "=== FULL_DIFF ==="
  git -C "${NKDK_XML_DIR}" -c core.quotepath=false diff --relative -- "${file}"
}

emit_triage_diff() {
  local index="$1"
  local file="$2"

  echo ""
  echo "=== TRIAGE_DIFF ==="
  echo "INDEX: ${index}"
  echo "FILE: ${file}"
  echo "XML_FILE_ABS: $(xml_file_abs "${file}")"
  echo "--- DIFF ---"
  git -C "${NKDK_XML_DIR}" -c core.quotepath=false diff --relative -- "${file}"
}

if [ "${MODE}" = "single" ]; then
  if [ "${DIFF_INDEX}" -gt "${DIFF_COUNT}" ]; then
    die "--diff-index ${DIFF_INDEX} выходит за пределы списка diff'ов (${DIFF_COUNT})"
  fi

  SELECTED_DIFF_FILE="${DIFF_FILES[$((DIFF_INDEX - 1))]}"
  emit_single_diff "${DIFF_INDEX}" "${SELECTED_DIFF_FILE}"
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
  emit_triage_diff "${i}" "${TRIAGE_DIFF_FILE}"
done
```

- [ ] **Step 4: Run syntax check**

Run:

```bash
bash -n .agents/skills/round-trip-xml/round-trip.sh
```

Expected: command exits with code 0 and prints nothing.

- [ ] **Step 5: Check help output without needing `.env`**

Run:

```bash
./.agents/skills/round-trip-xml/round-trip.sh --help
```

Expected: output includes all of these strings:

```text
--diff-index N
--triage
--batch-size N
--start-index K
```

- [ ] **Step 6: Commit emitter change**

Run:

```bash
git add .agents/skills/round-trip-xml/round-trip.sh
git commit -m "feat: :sparkles: добавить triage-вывод round-trip XML"
```

Expected: commit succeeds and contains only `.agents/skills/round-trip-xml/round-trip.sh`.

## Task 3: Document Triage Behavior In The Skill

**Files:**
- Modify: `.agents/skills/round-trip-xml/SKILL.md`

- [ ] **Step 1: Update frontmatter description**

Replace the `description` value with:

```yaml
description: Подсвечивает пачки расхождений short round-trip (XML → модель → XML) для анализа и автоматически генерирует одиночный reproducer для выбранного diff'а после подтверждения пользователя.
```

- [ ] **Step 2: Replace the opening "Что делает скилл" section**

Replace the current first paragraph under `## Что делает скилл` with:

```markdown
У скилла два режима:

1. **Triage-пачка** — информационный обзор нескольких diff-файлов short round-trip. Нужен, чтобы пользователь выбрал следующие проблемы для отдельного анализа. В этом режиме скилл не создаёт ветки, slug, фикстуры, тесты и планы исправления.
2. **Одиночный reproducer** — один изолированный TDD-reproducer для выбранного файла с расхождением в short round-trip (XML → модель → XML). Без явного выбора используется первый файл по алфавиту, как раньше.
```

Keep the existing paragraph that starts with `На выходе: ветка` immediately after this new text.

- [ ] **Step 3: Add triage invariant**

Add this bullet to `## Жёсткие инварианты` after the first bullet:

```markdown
- **Triage-пачка только информирует.** В triage-режиме AI показывает список diff'ов, вероятные модули, вероятные файлы кода, категории, описания и фрагменты diff. Он не предлагает slug, ветки, фикстуры, тесты или план исправления.
```

- [ ] **Step 4: Replace Step 1 runner contract**

In `## Шаг 1. Запуск round-trip`, replace the numbered list item 5:

```markdown
5. Выводит путь **первого по алфавиту** файла с diff'ом и полный diff.
```

with:

```markdown
5. В одиночном режиме выводит выбранный diff-файл и полный diff. Без параметров выбирается первый по алфавиту diff, `--diff-index N` выбирает N-й файл из отсортированного списка.
6. В triage-режиме (`--triage --batch-size N --start-index K`) выводит пачку diff-файлов для анализа.
```

- [ ] **Step 5: Add a new triage section before "Шаг 2"**

Insert this section immediately before `## Шаг 2. Анализ диффа и предложение плана`:

````markdown
## Triage-пачка

Используй этот режим, когда пользователь просит показать несколько ошибок для анализа: «покажи следующие 5 ошибок», «дай пачку с 6-й», «покажи 10 diff'ов». Это не начало reproducer workflow.

Команды:

```bash
./.agents/skills/round-trip-xml/round-trip.sh --triage --batch-size 5
./.agents/skills/round-trip-xml/round-trip.sh --triage --batch-size 5 --start-index 6
```

После запуска сформируй краткий список. Каждый пункт должен содержать:

```text
1. <относительный XML-путь из diff>
   XML-файл: <абсолютный локальный путь из XML_FILE_ABS>
   Вероятный модуль: packages/core/metadata/<...> или неизвестно
   Вероятный код: packages/core/metadata/<...>/rules.ts или неизвестно
   Категория: потеря пустого тега / порядок XML-узлов / лишний default / потеря атрибута / потеря xsi:type / потеря id или ссылки / неизвестно
   Описание: <что изменилось при round-trip>
   Diff:
   <короткий релевантный фрагмент>
   Сомнения: <почему модуль или причина неочевидны, если есть сомнения>
```

Правила triage-ответа:

- `XML-файл` всегда бери из `XML_FILE_ABS`. Если путь абсолютный и файл существует локально, в ответе Codex оформи его кликабельной ссылкой.
- Для определения `Вероятный модуль` и `Вероятный код` можно читать `packages/core/metadata/**/rules.ts`, `types.ts` и соседние тесты через `rg`/`sed`.
- Показывай diff-фрагмент как источник истины. Описание дополняет diff, а не заменяет его.
- Если несколько пунктов похожи на одну категорию, отметь связь, но не объединяй пункты.
- Не создавай ветку, slug, фикстуры, тесты и план исправления. После списка остановись и жди, какую проблему пользователь захочет разобрать отдельно.
````

- [ ] **Step 6: Update single reproducer wording**

In `## Шаг 2. Анализ диффа и предложение плана`, before the sentence `Прочитай diff. Определи:`, insert:

```markdown
Этот шаг выполняется только для одиночного reproducer workflow: после обычного запуска или после `round-trip.sh --diff-index N`. Не выполняй его для triage-пачки.
```

- [ ] **Step 7: Run Markdown sanity checks**

Run:

```bash
rg -n "первого по алфавиту|первый файл|first diff|FIRST_DIFF_FILE" .agents/skills/round-trip-xml/SKILL.md .agents/skills/round-trip-xml/round-trip.sh
```

Expected: either no matches, or only matches that explicitly say "без параметров выбирается первый".

- [ ] **Step 8: Commit skill documentation change**

Run:

```bash
git add .agents/skills/round-trip-xml/SKILL.md
git commit -m "docs: :memo: описать triage-режим round-trip XML"
```

Expected: commit succeeds and contains only `.agents/skills/round-trip-xml/SKILL.md`.

## Task 4: Verify Runner Protocols

**Files:**
- Read: `.agents/skills/round-trip-xml/round-trip.sh`
- Read: `.agents/skills/round-trip-xml/SKILL.md`

- [ ] **Step 1: Verify help output**

Run:

```bash
./.agents/skills/round-trip-xml/round-trip.sh --help
```

Expected: output contains:

```text
--diff-index N
--triage
--batch-size N
--start-index K
```

- [ ] **Step 2: Verify invalid argument handling**

Run:

```bash
./.agents/skills/round-trip-xml/round-trip.sh --diff-index 0
```

Expected: command exits non-zero and prints:

```text
Ошибка: --diff-index должен быть положительным целым числом
```

- [ ] **Step 3: Verify incompatible argument handling**

Run:

```bash
./.agents/skills/round-trip-xml/round-trip.sh --triage --diff-index 2
```

Expected: command exits non-zero and prints:

```text
Ошибка: --diff-index нельзя использовать вместе с --triage
```

- [ ] **Step 4: Verify Bash syntax after all edits**

Run:

```bash
bash -n .agents/skills/round-trip-xml/round-trip.sh
```

Expected: command exits with code 0 and prints nothing.

- [ ] **Step 5: Verify real single-diff protocol in a clean worktree**

Run this only when `git status --short` is clean except for files already committed by this implementation. The runner intentionally refuses dirty worktrees.

```bash
env NKDK_XML_REPO=/Users/nikita/git/round-trip-source NKDK_XML_DIR=/Users/nikita/git/round-trip-source/trade ./.agents/skills/round-trip-xml/round-trip.sh --diff-index 1
```

Expected: if round-trip has diffs, output contains:

```text
=== DIFF_COUNT ===
=== SELECTED_DIFF_INDEX ===
1
=== SELECTED_DIFF_FILE ===
=== SELECTED_XML_FILE_ABS ===
=== FULL_DIFF ===
```

If round-trip is clean, output contains:

```text
=== Round-trip чистый: диффов нет ===
```

- [ ] **Step 6: Verify real triage protocol in a clean worktree**

Run:

```bash
env NKDK_XML_REPO=/Users/nikita/git/round-trip-source NKDK_XML_DIR=/Users/nikita/git/round-trip-source/trade ./.agents/skills/round-trip-xml/round-trip.sh --triage --batch-size 5 --start-index 1
```

Expected: if round-trip has at least one diff, output contains:

```text
=== DIFF_COUNT ===
=== TRIAGE_RANGE ===
1-
=== TRIAGE_DIFF ===
INDEX: 1
FILE:
XML_FILE_ABS: /Users/nikita/git/round-trip-source/trade/
--- DIFF ---
```

If round-trip is clean, output contains:

```text
=== Round-trip чистый: диффов нет ===
```

- [ ] **Step 7: Commit verification notes if docs changed during fixes**

If Task 4 required only command runs and no file edits, do not create a commit. If a verification issue required editing script or docs, commit the exact edited files:

```bash
git add .agents/skills/round-trip-xml/round-trip.sh .agents/skills/round-trip-xml/SKILL.md
git commit -m "fix: :bug: уточнить triage-протокол round-trip XML"
```

Expected: commit is created only when verification caused additional edits.

## Self-Review

- Spec coverage: Task 1 covers `--diff-index`, `--triage`, `--batch-size`, `--start-index` parsing. Task 2 covers `DIFF_COUNT`, `SELECTED_*`, `TRIAGE_*`, full diff output, absolute XML path, and range handling. Task 3 covers AI triage behavior, clickable absolute XML paths, likely module/code/category/description/diff format, and the boundary that triage does not create reproducer files. Task 4 covers the manual verification matrix from the spec.
- Проверка заглушек: план не содержит незаполненных мест; каждый шаг с правкой кода включает точный вставляемый или заменяемый текст.
- Type and name consistency: script variables are `MODE`, `DIFF_INDEX`, `BATCH_SIZE`, `START_INDEX`; output markers match the approved spec: `DIFF_COUNT`, `SELECTED_DIFF_INDEX`, `SELECTED_DIFF_FILE`, `SELECTED_XML_FILE_ABS`, `FULL_DIFF`, `TRIAGE_RANGE`, `TRIAGE_DIFF`, `XML_FILE_ABS`.
