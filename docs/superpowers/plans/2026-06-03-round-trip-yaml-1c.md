# round-trip-yaml-1c Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a diagnostic Codex skill that generates XML from YAML without `--reference` and checks whether that XML imports into a 1C file infobase through `ibcmd`.

**Architecture:** Create a new `.agents/skills/round-trip-yaml-1c/` skill rather than extending `round-trip-yaml`, because this workflow validates generated XML with 1C instead of collecting XML diffs. The runner mirrors the existing `round-trip-yaml` environment and temporary-directory handling, but stops after `nkdk sync <yaml> <tmp-xml>` without `--reference` and then runs `ibcmd infobase config import` against a file infobase. The skill remains diagnostic: it reports import/sync/1C-load errors and waits for the user to choose a problem.

**Tech Stack:** Bash, git, `.env`, `nkdk import`, `nkdk sync`, `ibcmd infobase config import`, Codex skill markdown.

---

## File Structure

- Create `.agents/skills/round-trip-yaml-1c/SKILL.md`: skill contract, required metadata knowledge files, invariants, `.env` contract, run instructions, error response format, and no-auto-fix policy.
- Create `.agents/skills/round-trip-yaml-1c/round-trip.sh`: executable runner that loads `.env`, validates inputs, generates YAML, generates XML without `--reference`, runs full 1C import through `ibcmd`, and emits machine-readable diagnostic blocks.
- Modify nothing else during implementation.

## Task 1: Create Skill Documentation

**Files:**
- Create: `.agents/skills/round-trip-yaml-1c/SKILL.md`
- Reference: `docs/superpowers/specs/2026-06-03-round-trip-yaml-1c-design.md`
- Reference: `.agents/skills/round-trip-yaml/SKILL.md`

- [ ] **Step 1: Create the skill directory**

Run:

```bash
mkdir -p .agents/skills/round-trip-yaml-1c
```

Expected: command exits with status `0`.

- [ ] **Step 2: Write `SKILL.md`**

Create `.agents/skills/round-trip-yaml-1c/SKILL.md` with this content:

```markdown
---
name: round-trip-yaml-1c
description: Диагностирует YAML -> XML без reference и проверяет загрузку результата в файловую базу 1С через ibcmd.
---

# round-trip-yaml-1c — проверка XML без reference через 1С

Перед диагностикой обязательно прочитай:

1. `.agents/knowledge/metadata/INDEX.md`
2. `.agents/knowledge/metadata/sources-of-truth.md`
3. `.agents/knowledge/metadata/round-trip-cycle.md`
4. `.agents/knowledge/metadata/yaml-contract.md`

## Что делает skill

Skill запускает цепочку:

```text
XML -> модель -> YAML -> модель -> XML без reference -> загрузка XML в 1С
```

Он нужен, чтобы понять, принимает ли 1С XML, сгенерированный из YAML без опоры на исходную XML-выгрузку. При ошибке skill показывает контекст, временные каталоги и журнал, после чего останавливается.

## Жёсткие инварианты

- **Только диагностика.** Skill не исправляет код, не создаёт тесты, фикстуры, планы исправления, коммиты и PR.
- **Чистое рабочее дерево `nkdk`.** Если `git status` не чистый — стоп, попроси пользователя сохранить или откатить правки.
- **Не менять XML-репо.** Активный XML-каталог не заменяется результатом генерации без reference.
- **Временный YAML-каталог очищается перед прогоном и остаётся после него.**
- **Временный XML-каталог без reference очищается перед прогоном и остаётся после него.**
- **`nkdk sync` запускается без `--reference`.**
- **Только файловая база 1С.** Клиент-серверные базы и `config.yml` автономного сервера не входят в первую версию.
- **Пустые логин и пароль не передаются в `ibcmd`.**
- **Не запускать полный `pnpm test`.** Это диагностический skill.

## Настройки `.env`

Скрипт читает `.env` из корня `nkdk`.

Обязательные настройки:

```env
NKDK_XML_REPO=/home/nikita/git/round-trip
NKDK_XML_DIR=/home/nikita/git/round-trip/all
NKDK_1C_DATA=/home/nikita/git/temp-base
NKDK_1C_DB_PATH=/home/nikita/git/temp-base
```

Опциональные настройки:

```env
NKDK_ROUND_TRIP_YAML_DIR=/tmp/round-trip-yaml-1c
NKDK_1C_IBCMD=ibcmd
NKDK_1C_USER=
NKDK_1C_PASSWORD=
```

Если `NKDK_1C_USER` и `NKDK_1C_PASSWORD` пустые, параметры `--user` и `--password` не добавляются.

## Запуск

Вызови из корня `nkdk`:

```bash
./.agents/skills/round-trip-yaml-1c/round-trip.sh
```

Скрипт:

1. читает `.env`;
2. проверяет чистоту рабочего дерева `nkdk`;
3. проверяет `NKDK_XML_REPO`, `NKDK_XML_DIR`, `NKDK_1C_DATA`, `NKDK_1C_DB_PATH`;
4. находит `nkdk` или запускает CLI через `pnpm -s --dir packages/cli exec tsx src/cli.ts`;
5. проверяет доступность `ibcmd`;
6. очищает временный YAML-каталог;
7. очищает временный XML-каталог;
8. запускает `nkdk import <xml-dir> <yaml-dir>`;
9. запускает `nkdk sync <yaml-dir> <tmp-xml-dir>` без `--reference`;
10. запускает `ibcmd infobase config import --data <data> --db-path <db-path> <tmp-xml-dir>`;
11. при ошибке печатает диагностический блок и останавливается.

## Формат ответа после ошибки

После ошибки сформируй краткий ответ:

```text
XML-каталог: <ACTIVE_XML_DIR>
YAML-каталог: <YAML_DIR>
XML без reference: <TMP_XML_DIR>
Команда: <IBCMD_COMMAND или команда nkdk>
Категория: ошибка import / ошибка sync / ошибка загрузки 1С / неизвестно
Описание: <что видно по журналу>
Журнал:
<релевантный фрагмент>
Сомнения: <если причина неочевидна>
```

Не начинай исправления без отдельного запроса пользователя.

## Успешный результат

Если скрипт пишет:

```text
=== Загрузка в 1С прошла успешно ===
```

сообщи пользователю, какие каталоги были проверены, и остановись.

## Тупиковые ситуации

Остановись и спроси пользователя, если:

- файловая база `/home/nikita/git/temp-base` отсутствует или не открывается через `ibcmd`;
- `nkdk import` или `nkdk sync` падают по причине, не связанной с текущей диагностикой;
- журнал `ibcmd` содержит несколько независимых ошибок и краткая классификация будет вводить в заблуждение.

## Политика коммитов

Skill сам не коммитит, не пушит и не создаёт PR.
```

- [ ] **Step 3: Verify documentation contains the required boundaries**

Run:

```bash
rg -n 'без `--reference`|Только диагностика|файловая база|Пустые логин' .agents/skills/round-trip-yaml-1c/SKILL.md
```

Expected: output includes matches for all four phrases.

- [ ] **Step 4: Commit skill documentation**

Run:

```bash
git add .agents/skills/round-trip-yaml-1c/SKILL.md
git commit -m "docs: :memo: описать skill проверки YAML через 1С"
```

Expected: commit succeeds.

## Task 2: Create Runner With Guards And Metadata Cycle

**Files:**
- Create: `.agents/skills/round-trip-yaml-1c/round-trip.sh`
- Reference: `.agents/skills/round-trip-yaml/round-trip.sh`

- [ ] **Step 1: Create `round-trip.sh`**

Create `.agents/skills/round-trip-yaml-1c/round-trip.sh` with this content:

```bash
#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "${SCRIPT_DIR}/../../.." && pwd)"

usage() {
  cat <<'USAGE'
Использование:
  ./.agents/skills/round-trip-yaml-1c/round-trip.sh

Что делает:
  1. nkdk import <xml-dir> <yaml-dir>
  2. nkdk sync <yaml-dir> <tmp-xml-dir> без --reference
  3. ibcmd infobase config import --data <data> --db-path <db-path> <tmp-xml-dir>

Обязательные .env:
  NKDK_XML_REPO       Git-репозиторий XML-выгрузки.
  NKDK_XML_DIR        XML-каталог конфигурации для проверки.
  NKDK_1C_DATA        Каталог данных автономного сервера.
  NKDK_1C_DB_PATH     Каталог файловой базы 1С.

Опциональные .env:
  NKDK_ROUND_TRIP_YAML_DIR  Базовый каталог временного YAML.
  NKDK_1C_IBCMD             Команда ibcmd. По умолчанию ibcmd.
  NKDK_1C_USER              Пользователь ИБ. Если пустой, не передаётся.
  NKDK_1C_PASSWORD          Пароль ИБ. Если пустой, не передаётся.

Ограничения:
  Скрипт не меняет активный XML-каталог и не использует --reference.
  Поддерживается только файловая база 1С.
USAGE
}

die() {
  echo "Ошибка: $*" >&2
  exit 1
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
  local yaml_root="${NKDK_ROUND_TRIP_YAML_DIR:-}"

  rel="$(config_rel_path "${active_dir}")"
  if [ -n "${yaml_root}" ]; then
    yaml_root="${yaml_root%/}"
    printf '%s/%s' "${yaml_root}" "$(sanitize_path_segment "${rel}")"
    return 0
  fi

  printf '%s/round-trip-yaml-1c/%s' "${TMPDIR:-/tmp}" "$(sanitize_path_segment "${rel}")"
}

xml_tmp_dir_for() {
  local active_dir="$1"
  local rel

  rel="$(config_rel_path "${active_dir}")"
  printf '%s/round-trip-yaml-1c-xml/%s' "${TMPDIR:-/tmp}" "$(sanitize_path_segment "${rel}")"
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

emit_error() {
  local stage="$1"
  local command_text="$2"
  local exit_code="$3"
  local log_file="$4"

  echo ""
  echo "=== Ошибка загрузки в 1С ==="
  echo "STAGE: ${stage}"
  echo "ACTIVE_XML_DIR: ${ACTIVE_XML_DIR}"
  echo "YAML_DIR: ${YAML_DIR}"
  echo "TMP_XML_DIR: ${TMP_XML_DIR}"
  echo "COMMAND: ${command_text}"
  echo "EXIT_CODE: ${exit_code}"
  echo "LOG:"
  cat "${log_file}"
}

run_logged() {
  local stage="$1"
  local command_text="$2"
  local log_file="$3"
  shift 3

  echo "[command] ${command_text}"
  if "$@" >"${log_file}" 2>&1; then
    cat "${log_file}"
    return 0
  fi

  local exit_code="$?"
  emit_error "${stage}" "${command_text}" "${exit_code}" "${log_file}"
  return "${exit_code}"
}

ibcmd_command_text() {
  local text

  text="${IBCMD_BIN} infobase config import --data=${NKDK_1C_DATA} --db-path=${NKDK_1C_DB_PATH}"
  if [ -n "${NKDK_1C_USER:-}" ]; then
    text="${text} --user=${NKDK_1C_USER}"
  fi
  if [ -n "${NKDK_1C_PASSWORD:-}" ]; then
    text="${text} --password=***"
  fi
  text="${text} ${TMP_XML_DIR}"
  printf '%s' "${text}"
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    -h|--help)
      usage
      exit 0
      ;;
    *)
      die "неизвестный параметр: $1"
      ;;
  esac
done

if [ -f "${REPO_DIR}/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  . "${REPO_DIR}/.env"
  set +a
fi

[ -n "${NKDK_XML_REPO:-}" ] || die "переменная NKDK_XML_REPO не задана"
[ -n "${NKDK_XML_DIR:-}" ] || die "переменная NKDK_XML_DIR не задана"
[ -n "${NKDK_1C_DATA:-}" ] || die "переменная NKDK_1C_DATA не задана"
[ -n "${NKDK_1C_DB_PATH:-}" ] || die "переменная NKDK_1C_DB_PATH не задана"

if ! git -C "${NKDK_XML_REPO}" rev-parse --git-dir &>/dev/null; then
  die "NKDK_XML_REPO ('${NKDK_XML_REPO}') не является git-репозиторием"
fi

[ -d "${NKDK_XML_DIR}" ] || die "NKDK_XML_DIR ('${NKDK_XML_DIR}') не существует или не каталог"
[ -d "${NKDK_1C_DATA}" ] || die "NKDK_1C_DATA ('${NKDK_1C_DATA}') не существует или не каталог"
[ -d "${NKDK_1C_DB_PATH}" ] || die "NKDK_1C_DB_PATH ('${NKDK_1C_DB_PATH}') не существует или не каталог"

NKDK_XML_DIR="$(cd "${NKDK_XML_DIR}" && pwd)"
NKDK_XML_REPO="$(cd "${NKDK_XML_REPO}" && pwd)"
NKDK_1C_DATA="$(cd "${NKDK_1C_DATA}" && pwd)"
NKDK_1C_DB_PATH="$(cd "${NKDK_1C_DB_PATH}" && pwd)"

if [ -n "$(git -C "${REPO_DIR}" status --porcelain)" ]; then
  echo "Ошибка: рабочее дерево nkdk не чистое." >&2
  echo "Сохрани или откати изменения перед запуском round-trip-yaml-1c." >&2
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

IBCMD_BIN="${NKDK_1C_IBCMD:-ibcmd}"
if ! command -v "${IBCMD_BIN}" &>/dev/null; then
  die "команда ibcmd не найдена: ${IBCMD_BIN}"
fi

RUN_DIRS=()
while IFS= read -r run_dir; do
  RUN_DIRS+=("${run_dir}")
done < <(collect_run_dirs "${NKDK_XML_DIR}")

if [ "${#RUN_DIRS[@]}" -eq 0 ]; then
  die "в NKDK_XML_DIR ('${NKDK_XML_DIR}') не найдено конфигурационных каталогов"
fi

ACTIVE_XML_DIR="${RUN_DIRS[0]}"
YAML_DIR="$(yaml_dir_for "${ACTIVE_XML_DIR}")"
TMP_XML_DIR="$(xml_tmp_dir_for "${ACTIVE_XML_DIR}")"
IMPORT_LOG="${TMPDIR:-/tmp}/round-trip-yaml-1c-import.log"
SYNC_LOG="${TMPDIR:-/tmp}/round-trip-yaml-1c-sync.log"
IBCMD_LOG="${TMPDIR:-/tmp}/round-trip-yaml-1c-ibcmd.log"

echo "=== round-trip-yaml-1c.sh ==="
echo "ACTIVE_XML_DIR: ${ACTIVE_XML_DIR}"
echo "YAML_DIR: ${YAML_DIR}"
echo "TMP_XML_DIR: ${TMP_XML_DIR}"
echo "IBCMD_COMMAND: $(ibcmd_command_text)"
echo ""

echo "[yaml] Очистка временного YAML-каталога: ${YAML_DIR}"
rm -rf "${YAML_DIR}"
mkdir -p "${YAML_DIR}"

echo "[xml] Очистка временного XML-каталога без reference: ${TMP_XML_DIR}"
clear_dir_contents "${TMP_XML_DIR}"

IMPORT_COMMAND="${NKDK[*]} import ${ACTIVE_XML_DIR} ${YAML_DIR}"
if ! run_logged "import" "${IMPORT_COMMAND}" "${IMPORT_LOG}" "${NKDK[@]}" import "${ACTIVE_XML_DIR}" "${YAML_DIR}"; then
  exit 1
fi

SYNC_COMMAND="${NKDK[*]} sync ${YAML_DIR} ${TMP_XML_DIR}"
if ! run_logged "sync" "${SYNC_COMMAND}" "${SYNC_LOG}" "${NKDK[@]}" sync "${YAML_DIR}" "${TMP_XML_DIR}"; then
  exit 1
fi

IBCMD_ARGS=("${IBCMD_BIN}" infobase config import --data="${NKDK_1C_DATA}" --db-path="${NKDK_1C_DB_PATH}")
if [ -n "${NKDK_1C_USER:-}" ]; then
  IBCMD_ARGS+=(--user="${NKDK_1C_USER}")
fi
if [ -n "${NKDK_1C_PASSWORD:-}" ]; then
  IBCMD_ARGS+=(--password="${NKDK_1C_PASSWORD}")
fi
IBCMD_ARGS+=("${TMP_XML_DIR}")

if ! run_logged "ibcmd" "$(ibcmd_command_text)" "${IBCMD_LOG}" "${IBCMD_ARGS[@]}"; then
  exit 1
fi

echo ""
echo "=== Загрузка в 1С прошла успешно ==="
echo "ACTIVE_XML_DIR: ${ACTIVE_XML_DIR}"
echo "YAML_DIR: ${YAML_DIR}"
echo "TMP_XML_DIR: ${TMP_XML_DIR}"
```

- [ ] **Step 2: Make the runner executable**

Run:

```bash
chmod +x .agents/skills/round-trip-yaml-1c/round-trip.sh
```

Expected: command exits with status `0`.

- [ ] **Step 3: Verify shell syntax**

Run:

```bash
bash -n .agents/skills/round-trip-yaml-1c/round-trip.sh
```

Expected: command exits with status `0` and prints nothing.

- [ ] **Step 4: Verify help output**

Run:

```bash
./.agents/skills/round-trip-yaml-1c/round-trip.sh --help
```

Expected: output includes `nkdk sync <yaml-dir> <tmp-xml-dir> без --reference` and `Поддерживается только файловая база 1С`.

- [ ] **Step 5: Verify dirty-tree guard behavior**

Run:

```bash
./.agents/skills/round-trip-yaml-1c/round-trip.sh
```

Expected: because the new script is uncommitted, output starts with `Ошибка: рабочее дерево nkdk не чистое.` and exits non-zero. This confirms the guard works before running external tools.

- [ ] **Step 6: Commit runner skeleton**

Run:

```bash
git add .agents/skills/round-trip-yaml-1c/round-trip.sh
git commit -m "feat: :sparkles: добавить runner проверки YAML через 1С"
```

Expected: commit succeeds.

## Task 3: Verify Real Environment And First Diagnostic Run

**Files:**
- Read: `.env`
- Run: `.agents/skills/round-trip-yaml-1c/round-trip.sh`
- External test paths: `/home/nikita/git/round-trip/all`, `/home/nikita/git/temp-base`

- [ ] **Step 1: Verify `.env` has the file-base values**

Run:

```bash
rg -n "NKDK_XML_REPO|NKDK_XML_DIR|NKDK_1C_DATA|NKDK_1C_DB_PATH|NKDK_1C_USER|NKDK_1C_PASSWORD|NKDK_1C_IBCMD" .env
```

Expected: values include `/home/nikita/git/round-trip`, `/home/nikita/git/round-trip/all`, `/home/nikita/git/temp-base`; user/password are either absent or empty.

- [ ] **Step 2: If `.env` is missing values, stop and ask the user**

Do not edit `.env` unless the user explicitly asks. Ask one question:

```text
В `.env` не хватает настроек для файловой базы 1С. Добавить тестовые значения для `/home/nikita/git/round-trip/all` и `/home/nikita/git/temp-base`?
```

Expected: execution pauses for user approval if values are missing.

- [ ] **Step 3: Verify external paths and tools**

Run:

```bash
test -d /home/nikita/git/round-trip/all
test -d /home/nikita/git/temp-base
command -v ibcmd
```

Expected: all commands exit with status `0`; `command -v ibcmd` prints the path to `ibcmd`.

- [ ] **Step 4: Run the diagnostic skill**

Run:

```bash
./.agents/skills/round-trip-yaml-1c/round-trip.sh
```

Expected on success: output ends with `=== Загрузка в 1С прошла успешно ===`.

Expected on diagnostic failure: output contains `=== Ошибка загрузки в 1С ===`, `ACTIVE_XML_DIR`, `YAML_DIR`, `TMP_XML_DIR`, `COMMAND`, `EXIT_CODE`, and `LOG`.

- [ ] **Step 5: If `ibcmd` fails, summarize the first actionable error**

Use this response shape:

```text
XML-каталог: <ACTIVE_XML_DIR>
YAML-каталог: <YAML_DIR>
XML без reference: <TMP_XML_DIR>
Команда: <COMMAND>
Категория: ошибка загрузки 1С
Описание: <одно предложение по журналу>
Журнал:
<релевантный фрагмент>
Сомнения: <если причина неочевидна>
```

Expected: no code changes are made while summarizing the error.

## Task 4: Final Verification

**Files:**
- Verify: `.agents/skills/round-trip-yaml-1c/SKILL.md`
- Verify: `.agents/skills/round-trip-yaml-1c/round-trip.sh`

- [ ] **Step 1: Verify no `--reference` is used in the runner**

Run:

```bash
rg -n -- "--reference" .agents/skills/round-trip-yaml-1c
```

Expected: matches only appear in documentation/help text saying the runner does not use `--reference`; no command line invokes `--reference`.

- [ ] **Step 2: Verify the active XML directory is not replaced**

Run:

```bash
rg -n "clear_dir_contents .*ACTIVE|move_dir_contents|git -C .*restore" .agents/skills/round-trip-yaml-1c/round-trip.sh
```

Expected: no matches. The script may clear `YAML_DIR` and `TMP_XML_DIR`, but not `ACTIVE_XML_DIR`.

- [ ] **Step 3: Verify syntax one last time**

Run:

```bash
bash -n .agents/skills/round-trip-yaml-1c/round-trip.sh
```

Expected: command exits with status `0` and prints nothing.

- [ ] **Step 4: Verify git status**

Run:

```bash
git status --short
```

Expected: clean output.

## Self-Review Checklist

- Spec coverage: tasks create both required files, use `nkdk sync` without `--reference`, keep XML repo untouched, support empty 1C credentials, run `ibcmd infobase config import`, and define diagnostic output.
- Placeholder scan: no deferred-work markers or vague implementation steps remain.
- Type/name consistency: environment variables match the spec: `NKDK_XML_REPO`, `NKDK_XML_DIR`, `NKDK_ROUND_TRIP_YAML_DIR`, `NKDK_1C_IBCMD`, `NKDK_1C_DATA`, `NKDK_1C_DB_PATH`, `NKDK_1C_USER`, `NKDK_1C_PASSWORD`.
