# round-trip-yaml Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a diagnostic Codex skill that runs full metadata round-trip `XML -> модель -> YAML -> модель -> XML` and reports XML diffs.

**Architecture:** Create a separate `.agents/skills/round-trip-yaml/` skill instead of extending `round-trip-xml`. The shell runner mirrors the existing `round-trip-xml` protocol, but replaces `short-round-trip-test` with `nkdk import` into a deterministic temporary YAML directory followed by `nkdk sync` back into XML. The skill documentation defines single and triage workflows only; no reproducer, branch, fixture, test, or fix workflow is included.

**Tech Stack:** Bash, git worktrees, `nkdk import`, `nkdk sync`, existing Codex skill markdown format.

---

## File Structure

- Create `.agents/skills/round-trip-yaml/SKILL.md`: user-facing skill instructions, invariants, modes, output interpretation, and triage response format.
- Create `.agents/skills/round-trip-yaml/round-trip.sh`: full-cycle runner with argument parsing, environment loading, dirty-tree guard, temporary YAML cleanup before each run, command execution, diff collection, and single/triage output blocks.
- Modify nothing else during implementation.

## Task 1: Create Skill Documentation

**Files:**
- Create: `.agents/skills/round-trip-yaml/SKILL.md`
- Reference: `.agents/skills/round-trip-xml/SKILL.md`
- Reference: `.agents/knowledge/metadata/INDEX.md`
- Reference: `.agents/knowledge/metadata/sources-of-truth.md`
- Reference: `.agents/knowledge/metadata/round-trip-cycle.md`
- Reference: `.agents/knowledge/metadata/yaml-contract.md`

- [ ] **Step 1: Create the skill directory**

Run:

```bash
mkdir -p .agents/skills/round-trip-yaml
```

Expected: command exits with status `0`.

- [ ] **Step 2: Write `SKILL.md`**

Create `.agents/skills/round-trip-yaml/SKILL.md` with this content:

```markdown
---
name: round-trip-yaml
description: Диагностирует полный metadata round-trip (XML -> модель -> YAML -> модель -> XML) и показывает single/triage diff'ы без создания reproducer.
---

# round-trip-yaml — диагностика полного round-trip

Перед диагностикой metadata round-trip обязательно прочитай:

1. `.agents/knowledge/metadata/INDEX.md`
2. `.agents/knowledge/metadata/sources-of-truth.md`
3. `.agents/knowledge/metadata/round-trip-cycle.md`
4. `.agents/knowledge/metadata/yaml-contract.md`

## Что делает скилл

Скилл запускает полный цикл:

```text
XML -> модель -> YAML -> модель -> XML
```

На выходе он показывает XML diff'ы, появившиеся после `nkdk import <xml-dir> <tmp-yaml-dir>` и `nkdk sync <tmp-yaml-dir> <xml-dir>`.

У скилла два режима:

1. **Single** — показывает один diff-файл. Без явного выбора берётся первый по алфавиту diff найденного каталога.
2. **Triage-пачка** — показывает несколько diff-файлов для обзорного анализа.

Скилл только диагностирует. Он не создаёт ветки, slug, фикстуры, тесты, планы исправления, коммиты и PR.

## Жёсткие инварианты

- **Triage-пачка только информирует.** В triage-режиме AI показывает список diff'ов, вероятные модули, вероятные файлы кода, категории, описания и фрагменты diff.
- **Single тоже только информирует.** Single-режим показывает один полный diff и краткий разбор, но не начинает reproducer workflow.
- **Чистое рабочее дерево `nakidka-core`.** Если `git status` не чистый — стоп, попросить пользователя.
- **Временный YAML-каталог очищается перед прогоном.** Старые YAML-файлы и миграции не должны влиять на новый результат.
- **Временный YAML-каталог остаётся после прогона.** Он нужен для диагностики YAML-слоя.
- **XML-репо после прогона остаётся с diff'ами.** Не откатывай XML-репо после диагностики: diff является результатом анализа.
- **Не писать новые правила fromXML/toXML/fromYAML/toYAML.** Скилл ничего не исправляет.
- **Не запускать полный `pnpm test`.** Это диагностический skill.

## Запуск round-trip

Вызови `./.agents/skills/round-trip-yaml/round-trip.sh` из корня `nakidka-core`.

Скрипт:

1. читает `NKDK_XML_REPO` (обязательная) и `NKDK_XML_DIR` (опциональная) из `.env`;
2. проверяет, что рабочее дерево `nakidka-core` чистое;
3. проверяет, что `NKDK_XML_REPO` является git-репозиторием;
4. определяет каталоги запуска;
5. перед каждым прогоном делает `git restore .` в XML-репо;
6. перед каждым прогоном удаляет временный YAML-каталог для активного XML-каталога;
7. запускает `nkdk import <xml-dir> <tmp-yaml-dir>`;
8. запускает `nkdk sync <tmp-yaml-dir> <xml-dir>`;
9. собирает XML diff'ы через `git diff`;
10. если после каталога появился хотя бы один diff — останавливается на этом каталоге и дальше не смотрит, если не указан `--all-configs`.

Если скрипт написал `=== Round-trip чистый: диффов нет ===` — стоп, нечего анализировать.

Если скрипт упал на guard'е dirty-tree — попроси пользователя сохранить/откатить правки. Не запускай `git stash`, `git restore`, `git clean` сам.

## Single-режим

Команды:

```bash
./.agents/skills/round-trip-yaml/round-trip.sh
./.agents/skills/round-trip-yaml/round-trip.sh --diff-index 3
```

После запуска сформируй краткий разбор:

```text
XML-файл: <абсолютный локальный путь из SELECTED_XML_FILE_ABS>
XML-каталог: <значение ACTIVE_XML_DIR>
YAML-каталог: <значение YAML_DIR>
Diff: <SELECTED_DIFF_FILE>
Вероятный модуль: packages/core/metadata/<...> или неизвестно
Вероятный код: packages/core/metadata/<...>/rules.ts или неизвестно
Категория: потеря пустого тега / порядок XML-узлов / лишний default / потеря атрибута / потеря xsi:type / потеря id или ссылки / YAML-default / YAML-исключение / неизвестно
Описание: <что изменилось при полном round-trip>
Diff:
<релевантный фрагмент или полный diff, если он короткий>
Сомнения: <почему модуль или причина неочевидны, если есть сомнения>
```

## Triage-пачка

Используй этот режим, когда пользователь просит показать несколько ошибок для анализа: «покажи следующие 5 ошибок», «дай пачку с 6-й», «покажи 10 diff'ов».

Команды:

```bash
./.agents/skills/round-trip-yaml/round-trip.sh --triage --batch-size 5
./.agents/skills/round-trip-yaml/round-trip.sh --triage --batch-size 5 --start-index 6
./.agents/skills/round-trip-yaml/round-trip.sh --triage --all-configs --batch-size 20
```

После запуска сформируй краткий список. Каждый пункт должен содержать:

```text
1. <относительный XML-путь из diff>
   XML-файл: <абсолютный локальный путь из XML_FILE_ABS>
   XML-каталог: <значение ACTIVE_XML_DIR>
   YAML-каталог: <значение YAML_DIR>
   Вероятный модуль: packages/core/metadata/<...> или неизвестно
   Вероятный код: packages/core/metadata/<...>/rules.ts или неизвестно
   Категория: потеря пустого тега / порядок XML-узлов / лишний default / потеря атрибута / потеря xsi:type / потеря id или ссылки / YAML-default / YAML-исключение / неизвестно
   Описание: <что изменилось при полном round-trip>
   Diff:
   <короткий релевантный фрагмент>
   Сомнения: <почему модуль или причина неочевидны, если есть сомнения>
```

Правила triage-ответа:

- `XML-файл` всегда бери из `XML_FILE_ABS`. Если путь абсолютный и файл существует локально, оформи его кликабельной ссылкой.
- `YAML-каталог` всегда бери из `YAML_DIR`.
- Для определения вероятного модуля и кода можно читать `packages/core/metadata/**/rules.ts`, `types.ts`, `fromYAML.test.ts`, `toYAML.test.ts`, `fromXML.test.ts`, `toXML.test.ts`.
- Показывай diff-фрагмент как источник истины.
- Если несколько пунктов похожи на одну категорию, отметь связь, но не объединяй пункты.
- Не создавай ветку, slug, фикстуры, тесты и план исправления. После списка остановись и жди, какую проблему пользователь захочет разобрать отдельно.

## Тупиковые ситуации

Остановись и спроси пользователя, если:

- `nkdk import` падает;
- `nkdk sync` падает;
- один diff содержит несколько независимых причин и краткая классификация будет вводить в заблуждение;
- невозможно понять, расхождение появилось из-за XML-слоя или YAML-слоя.

## Политика коммитов

Скилл не коммитит, не пушит, не создаёт PR, не запускает тесты и не исправляет код.
```

- [ ] **Step 3: Review skill docs for forbidden workflow leakage**

Run:

```bash
rg -n "ветк|slug|фикстур|it\\(|pnpm test|commit|PR" .agents/skills/round-trip-yaml/SKILL.md
```

Expected: matches only appear in invariant/negative-policy lines saying the skill does **not** create those things.

- [ ] **Step 4: Commit**

Run:

```bash
git add .agents/skills/round-trip-yaml/SKILL.md
git commit -m "docs: :memo: описать skill round-trip-yaml"
```

Expected: commit succeeds.

## Task 2: Create Shell Runner

**Files:**
- Create: `.agents/skills/round-trip-yaml/round-trip.sh`
- Reference: `.agents/skills/round-trip-xml/round-trip.sh`
- Reference: `packages/cli/src/cli.ts`
- Reference: `packages/cli/src/commands/import.ts`
- Reference: `packages/cli/src/commands/sync.ts`

- [ ] **Step 1: Create `round-trip.sh`**

Create `.agents/skills/round-trip-yaml/round-trip.sh` with this content:

```bash
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
  rel="$(config_rel_path "${active_dir}")"
  printf '%s/round-trip-yaml/%s' "${TMPDIR:-/tmp}" "$(sanitize_path_segment "${rel}")"
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
ACTIVE_XML_DIR=""
ACTIVE_YAML_DIR=""

for RUN_XML_DIR in "${RUN_DIRS[@]}"; do
  RUN_YAML_DIR="$(yaml_dir_for "${RUN_XML_DIR}")"

  echo "[restore] Откат XML-репо к HEAD..."
  git -C "${NKDK_XML_REPO}" restore .

  echo "[yaml] Очистка временного YAML-каталога: ${RUN_YAML_DIR}"
  rm -rf "${RUN_YAML_DIR}"
  mkdir -p "${RUN_YAML_DIR}"

  echo "[round-trip] XML -> YAML: ${RUN_XML_DIR}"
  if ! run_nkdk "${NKDK[@]}" import "${RUN_XML_DIR}" "${RUN_YAML_DIR}"; then
    echo "=== ROUND_TRIP_ERROR ==="
    echo "STAGE: import"
    echo "ACTIVE_XML_DIR: ${RUN_XML_DIR}"
    echo "YAML_DIR: ${RUN_YAML_DIR}"
    exit 1
  fi

  echo "[round-trip] YAML -> XML: ${RUN_YAML_DIR}"
  if ! run_nkdk "${NKDK[@]}" sync "${RUN_YAML_DIR}" "${RUN_XML_DIR}"; then
    echo "=== ROUND_TRIP_ERROR ==="
    echo "STAGE: sync"
    echo "ACTIVE_XML_DIR: ${RUN_XML_DIR}"
    echo "YAML_DIR: ${RUN_YAML_DIR}"
    exit 1
  fi

  CURRENT_DIFF_FILES=()
  while IFS= read -r diff_file; do
    CURRENT_DIFF_FILES+=("${diff_file}")
  done < <(git -C "${RUN_XML_DIR}" -c core.quotepath=false diff --name-only --relative -- . | sort)

  if [ "${#CURRENT_DIFF_FILES[@]}" -gt 0 ]; then
    ACTIVE_XML_DIR="${RUN_XML_DIR}"
    ACTIVE_YAML_DIR="${RUN_YAML_DIR}"
    for diff_file in "${CURRENT_DIFF_FILES[@]}"; do
      DIFF_FILES+=("${diff_file}")
      DIFF_FILE_DIRS+=("${RUN_XML_DIR}")
      DIFF_FILE_YAML_DIRS+=("${RUN_YAML_DIR}")
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
  git -C "${active_dir}" -c core.quotepath=false diff --relative -- "${file}"
}

emit_triage_diff() {
  local index="$1"
  local file="$2"
  local active_dir="$3"
  local yaml_dir="$4"

  echo ""
  echo "=== TRIAGE_DIFF ==="
  echo "INDEX: ${index}"
  echo "ACTIVE_XML_DIR: ${active_dir}"
  echo "YAML_DIR: ${yaml_dir}"
  echo "FILE: ${file}"
  echo "XML_FILE_ABS: $(xml_file_abs "${file}" "${active_dir}")"
  echo "--- DIFF ---"
  git -C "${active_dir}" -c core.quotepath=false diff --relative -- "${file}"
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
  emit_single_diff "${DIFF_INDEX}" "${SELECTED_DIFF_FILE}" "${SELECTED_DIFF_DIR}" "${SELECTED_YAML_DIR}"
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
  emit_triage_diff "${i}" "${TRIAGE_DIFF_FILE}" "${TRIAGE_DIFF_DIR}" "${TRIAGE_YAML_DIR}"
done
```

- [ ] **Step 2: Make the runner executable**

Run:

```bash
chmod +x .agents/skills/round-trip-yaml/round-trip.sh
```

Expected: command exits with status `0`.

- [ ] **Step 3: Verify shell syntax**

Run:

```bash
bash -n .agents/skills/round-trip-yaml/round-trip.sh
```

Expected: command exits with status `0` and no output.

- [ ] **Step 4: Verify help output**

Run:

```bash
./.agents/skills/round-trip-yaml/round-trip.sh --help
```

Expected: output contains:

```text
Использование:
  ./.agents/skills/round-trip-yaml/round-trip.sh
  ./.agents/skills/round-trip-yaml/round-trip.sh --diff-index N
  ./.agents/skills/round-trip-yaml/round-trip.sh --triage [--batch-size N] [--start-index K]
```

- [ ] **Step 5: Verify invalid argument guard**

Run:

```bash
./.agents/skills/round-trip-yaml/round-trip.sh --triage --diff-index 1
```

Expected: command exits non-zero and prints:

```text
Ошибка: --diff-index нельзя использовать вместе с --triage
```

- [ ] **Step 6: Commit**

Run:

```bash
git add .agents/skills/round-trip-yaml/round-trip.sh
git commit -m "feat: :sparkles: добавить runner round-trip-yaml"
```

Expected: commit succeeds.

## Task 3: Smoke-Test the Integrated Skill

**Files:**
- Verify: `.agents/skills/round-trip-yaml/SKILL.md`
- Verify: `.agents/skills/round-trip-yaml/round-trip.sh`

- [ ] **Step 1: Verify clean implementation tree**

Run:

```bash
git status --short
```

Expected: no output.

- [ ] **Step 2: Verify required metadata docs are mentioned**

Run:

```bash
rg -n "metadata/INDEX|sources-of-truth|round-trip-cycle|yaml-contract" .agents/skills/round-trip-yaml/SKILL.md
```

Expected: output contains all four metadata knowledge files.

- [ ] **Step 3: Verify the runner uses full-cycle commands**

Run:

```bash
rg -n " import | sync |short-round-trip-test" .agents/skills/round-trip-yaml/round-trip.sh
```

Expected: output contains `import` and `sync`; output does not contain `short-round-trip-test`.

- [ ] **Step 4: Verify YAML cleanup happens before import**

Run:

```bash
awk '/rm -rf.*RUN_YAML_DIR/{cleanup=NR} / import /{import=NR} END{if (cleanup > 0 && import > cleanup) print "ok"; else exit 1}' .agents/skills/round-trip-yaml/round-trip.sh
```

Expected:

```text
ok
```

- [ ] **Step 5: Optional live smoke test**

Run only if the current worktree is clean and `NKDK_XML_REPO` / `NKDK_XML_DIR` point to a small XML test corpus:

```bash
./.agents/skills/round-trip-yaml/round-trip.sh --triage --batch-size 1
```

Expected: one of:

```text
=== Round-trip чистый: диффов нет ===
```

or:

```text
=== TRIAGE_DIFF ===
YAML_DIR: <absolute tmp yaml dir>
XML_FILE_ABS: <absolute xml file>
--- DIFF ---
```

If the command fails because `nkdk import` or `nkdk sync` finds an existing product issue, capture the failing stage and treat the runner as exercised if it emits `ROUND_TRIP_ERROR` with `STAGE`, `ACTIVE_XML_DIR`, and `YAML_DIR`.

- [ ] **Step 6: Final status**

Run:

```bash
git log --oneline -3
git status --short
```

Expected: latest commits include the skill docs and runner commits; status has no uncommitted implementation changes.

## Self-Review Checklist

- Spec coverage: the plan creates the separate skill directory, documents single and triage modes, implements full XML/YAML/XML cycle, cleans the YAML directory before each run, leaves it after run, and avoids reproducer workflow.
- Placeholder scan: no task contains unfinished placeholders or an unspecified test step.
- Type/command consistency: all commands use `.agents/skills/round-trip-yaml/round-trip.sh`; the runner uses `nkdk import` and `nkdk sync`, matching the CLI.
