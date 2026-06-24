# Round-Trip Runner Config Dirs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make all round-trip shell runners choose configuration directories through one shared mechanism and support both single-config and all-config runs.

**Architecture:** Extract the existing directory detection helpers from `round-trip-yaml` and `round-trip-xml` into one shared shell file under `.agents/skills/_shared`. Then migrate `round-trip-xml` and `round-trip-yaml` to source that helper without changing behavior, add the same run-dir loop to `round-trip-yaml-fast`, and add `--all-configs` looping to `round-trip-yaml-1c`.

**Tech Stack:** Bash, existing `nkdk` CLI, shell smoke checks, existing skill runner scripts.

---

## File Structure

- Create `.agents/skills/_shared/round-trip-config-dirs.sh`
  - Owns configuration directory detection and path segment helpers shared by all round-trip runners.
- Modify `.agents/skills/round-trip-xml/round-trip.sh`
  - Remove local copies of shared helper functions and source the shared file.
- Modify `.agents/skills/round-trip-yaml/round-trip.sh`
  - Remove local copies of shared helper functions and source the shared file.
- Modify `.agents/skills/round-trip-yaml-fast/round-trip.sh`
  - Add shared run-dir collection, `--all-configs`, per-config execution, and global diff selection.
- Modify `.agents/skills/round-trip-yaml-1c/round-trip.sh`
  - Add shared helper sourcing, `--all-configs`, and a per-config execution function.
- Modify skill docs for changed behavior:
  - `.agents/skills/round-trip-yaml-fast/SKILL.md`
  - `.agents/skills/round-trip-yaml-1c/SKILL.md`

## Task 1: Shared Config Directory Helper

**Files:**
- Create: `.agents/skills/_shared/round-trip-config-dirs.sh`
- Modify: `.agents/skills/round-trip-xml/round-trip.sh`
- Modify: `.agents/skills/round-trip-yaml/round-trip.sh`

- [ ] **Step 1: Create shared helper**

Create `.agents/skills/_shared/round-trip-config-dirs.sh`:

```bash
#!/usr/bin/env bash

ROUND_TRIP_KNOWN_XML_DIRS=("Catalogs" "Documents" "DocumentNumerators" "Sequences" "Enums")

round_trip_is_config_dir() {
  local candidate="$1"
  local xml_dir

  for xml_dir in "${ROUND_TRIP_KNOWN_XML_DIRS[@]}"; do
    if [ -d "${candidate}/${xml_dir}" ]; then
      return 0
    fi
  done

  return 1
}

round_trip_collect_run_dirs() {
  local root="$1"
  local child

  if round_trip_is_config_dir "${root}"; then
    printf '%s\n' "${root}"
    return 0
  fi

  while IFS= read -r child; do
    if round_trip_is_config_dir "${child}"; then
      printf '%s\n' "${child}"
    fi
  done < <(find "${root}" -mindepth 1 -maxdepth 1 -type d | sort)
}

round_trip_sanitize_path_segment() {
  printf '%s' "$1" | sed 's#[^A-Za-z0-9._-]#_#g'
}

round_trip_config_rel_path() {
  local dir="$1"
  local repo="$2"
  repo="${repo%/}"

  if [ "${dir}" = "${repo}" ]; then
    printf '.'
    return 0
  fi

  printf '%s' "${dir#${repo}/}"
}
```

- [ ] **Step 2: Source helper from `round-trip-xml`**

In `.agents/skills/round-trip-xml/round-trip.sh`, after `REPO_DIR=...`, add:

```bash
# shellcheck source=../_shared/round-trip-config-dirs.sh
. "${REPO_DIR}/.agents/skills/_shared/round-trip-config-dirs.sh"
```

Delete the local block:

```bash
KNOWN_XML_DIRS=("Catalogs" "Documents" "DocumentNumerators" "Sequences" "Enums")

is_config_dir() {
  ...
}

collect_run_dirs() {
  ...
}
```

Replace:

```bash
done < <(collect_run_dirs "${NKDK_XML_DIR}")
```

with:

```bash
done < <(round_trip_collect_run_dirs "${NKDK_XML_DIR}")
```

No change is required for the local `config_rel_path` in this script because `known-invalid-diffs.tsv` uses its one-argument form. Keep it local in `round-trip-xml`.

- [ ] **Step 3: Source helper from `round-trip-yaml`**

In `.agents/skills/round-trip-yaml/round-trip.sh`, after `REPO_DIR=...`, add:

```bash
# shellcheck source=../_shared/round-trip-config-dirs.sh
. "${REPO_DIR}/.agents/skills/_shared/round-trip-config-dirs.sh"
```

Delete the local functions:

```bash
KNOWN_XML_DIRS=(...)
is_config_dir() { ... }
collect_run_dirs() { ... }
sanitize_path_segment() { ... }
config_rel_path() { ... }
```

Add compatibility wrappers where those function names are currently used:

```bash
sanitize_path_segment() {
  round_trip_sanitize_path_segment "$1"
}

config_rel_path() {
  round_trip_config_rel_path "$1" "${NKDK_XML_REPO}"
}
```

Replace:

```bash
done < <(collect_run_dirs "${NKDK_XML_DIR}")
```

with:

```bash
done < <(round_trip_collect_run_dirs "${NKDK_XML_DIR}")
```

- [ ] **Step 4: Syntax-check changed scripts**

Run:

```bash
bash -n .agents/skills/_shared/round-trip-config-dirs.sh
bash -n .agents/skills/round-trip-xml/round-trip.sh
bash -n .agents/skills/round-trip-yaml/round-trip.sh
```

Expected: all commands exit with status `0` and print nothing.

- [ ] **Step 5: Smoke-check help output**

Run:

```bash
./.agents/skills/round-trip-xml/round-trip.sh --help
./.agents/skills/round-trip-yaml/round-trip.sh --help
```

Expected: both commands print usage text and exit with status `0`.

- [ ] **Step 6: Commit shared helper migration**

```bash
git add .agents/skills/_shared/round-trip-config-dirs.sh \
  .agents/skills/round-trip-xml/round-trip.sh \
  .agents/skills/round-trip-yaml/round-trip.sh
git commit -m "refactor: ♻️ вынести выбор round-trip конфигураций"
```

## Task 2: `round-trip-yaml-fast` Uses Shared Run Dirs

**Files:**
- Modify: `.agents/skills/round-trip-yaml-fast/round-trip.sh`
- Modify: `.agents/skills/round-trip-yaml-fast/SKILL.md`

- [ ] **Step 1: Add helper source and `--all-configs` state**

In `.agents/skills/round-trip-yaml-fast/round-trip.sh`, after `REPO_DIR=...`, add:

```bash
# shellcheck source=../_shared/round-trip-config-dirs.sh
. "${REPO_DIR}/.agents/skills/_shared/round-trip-config-dirs.sh"
```

After `START_INDEX_SET="0"`, add:

```bash
ALL_CONFIGS="0"
```

- [ ] **Step 2: Update usage and argument parsing**

In the usage text, add:

```bash
  ./.agents/skills/round-trip-yaml-fast/round-trip.sh --triage --all-configs [--batch-size N] [--start-index K]
```

Add parameter description:

```bash
  --all-configs    Проверить все конфигурационные каталоги, не останавливаться на первом diff/error.
```

In the `while [ "$#" -gt 0 ]; do case "$1" in` block, add:

```bash
    --all-configs)
      ALL_CONFIGS="1"
      shift
      ;;
```

- [ ] **Step 3: Replace single output file with per-run files**

Replace:

```bash
OUTPUT_FILE="$(mktemp "${TMPDIR:-/tmp}/round-trip-yaml-fast.XXXXXX")"
trap 'rm -f "${OUTPUT_FILE}"' EXIT
```

with:

```bash
OUTPUT_DIR="$(mktemp -d "${TMPDIR:-/tmp}/round-trip-yaml-fast.XXXXXX")"
trap 'rm -rf "${OUTPUT_DIR}"' EXIT
```

- [ ] **Step 4: Print `all configs` in the header**

After:

```bash
echo "mode:        ${MODE}"
```

add:

```bash
echo "all configs: ${ALL_CONFIGS}"
```

- [ ] **Step 5: Collect run dirs before executing CLI**

After resolving `NKDK_XML_DIR` and `NKDK_XML_REPO`, add:

```bash
RUN_DIRS=()
while IFS= read -r run_dir; do
  RUN_DIRS+=("${run_dir}")
done < <(round_trip_collect_run_dirs "${NKDK_XML_DIR}")

if [ "${#RUN_DIRS[@]}" -eq 0 ]; then
  die "в NKDK_XML_DIR ('${NKDK_XML_DIR}') не найдено конфигурационных каталогов"
fi
```

- [ ] **Step 6: Add per-output parsers**

Before the current CLI execution block, add:

```bash
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
```

- [ ] **Step 7: Replace single CLI execution with run-dir loop**

Replace the block from:

```bash
NKDK_EXIT="0"
if ! "${NKDK[@]}" round-trip-yaml-fast "${NKDK_XML_DIR}" >"${OUTPUT_FILE}"; then
```

through the `ERROR_COUNT` parsing block with:

```bash
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
  if ! "${NKDK[@]}" round-trip-yaml-fast "${RUN_XML_DIR}" >"${OUTPUT_FILE}"; then
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
  ACTIVE_XML_DIR="${RUN_DIRS[${#RUN_DIRS[@]} - 1]}"
fi

CHECKED_COUNT="${TOTAL_CHECKED_COUNT}"
DIFF_COUNT="${TOTAL_DIFF_COUNT}"
ERROR_COUNT="${TOTAL_ERROR_COUNT}"
```

- [ ] **Step 8: Print active dir and totals**

Replace:

```bash
echo "${NKDK_XML_DIR}"
```

under `=== ACTIVE_XML_DIR ===` with:

```bash
echo "${ACTIVE_XML_DIR}"
```

After the `ERROR_COUNT` block, add:

```bash
echo ""
echo "=== RUN_DIR_COUNT ==="
echo "${#RUN_OUTPUT_FILES[@]}"
```

- [ ] **Step 9: Replace selected diff emitter with global emitter**

Replace the existing `emit_single_diff` function with:

```bash
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
      awk -v target="${local_target}" -v active_dir="${active_dir}" '
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
```

- [ ] **Step 10: Replace triage emitter with global loop**

Replace the existing `emit_triage_diffs` function with:

```bash
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
```

- [ ] **Step 11: Preserve errors-only output**

Replace the errors-only block with:

```bash
if [ "${DIFF_COUNT}" -eq 0 ]; then
  for i in "${!RUN_OUTPUT_FILES[@]}"; do
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
  exit 0
fi
```

- [ ] **Step 12: Update fast skill docs**

In `.agents/skills/round-trip-yaml-fast/SKILL.md`, add `--all-configs` to the command examples:

```bash
./.agents/skills/round-trip-yaml-fast/round-trip.sh --triage --all-configs --batch-size 20
```

Add one sentence after the `.env` paragraph:

```markdown
Если `NKDK_XML_DIR` указывает на корень с несколькими конфигурациями, скрипт выбирает конфигурационные каталоги так же, как `round-trip-yaml` и `round-trip-xml`; `--all-configs` проходит все найденные каталоги.
```

- [ ] **Step 13: Syntax-check and smoke-check fast**

Run:

```bash
bash -n .agents/skills/round-trip-yaml-fast/round-trip.sh
./.agents/skills/round-trip-yaml-fast/round-trip.sh --help
```

Expected: syntax check exits `0`; help output includes `--all-configs`.

- [ ] **Step 14: Verify fast on root path**

Run:

```bash
NKDK_XML_REPO=/home/nikita/git/round-trip NKDK_XML_DIR=/home/nikita/git/round-trip ./.agents/skills/round-trip-yaml-fast/round-trip.sh
```

Expected: output does not show `CHECKED` as `0`; `ACTIVE_XML_DIR` is one of the child config directories under `/home/nikita/git/round-trip`. If sandbox blocks `tsx` IPC under `/tmp`, rerun with approved escalation.

- [ ] **Step 15: Commit fast runner changes**

```bash
git add .agents/skills/round-trip-yaml-fast/round-trip.sh \
  .agents/skills/round-trip-yaml-fast/SKILL.md
git commit -m "feat: ✨ выбирать конфигурации в round-trip-yaml-fast"
```

## Task 3: `round-trip-yaml-1c` Supports `--all-configs`

**Files:**
- Modify: `.agents/skills/round-trip-yaml-1c/round-trip.sh`
- Modify: `.agents/skills/round-trip-yaml-1c/SKILL.md`

- [ ] **Step 1: Source shared helper and add state**

In `.agents/skills/round-trip-yaml-1c/round-trip.sh`, after `REPO_DIR=...`, add:

```bash
# shellcheck source=../_shared/round-trip-config-dirs.sh
. "${REPO_DIR}/.agents/skills/_shared/round-trip-config-dirs.sh"
```

After that, add:

```bash
ALL_CONFIGS="0"
```

Delete the local helper block:

```bash
KNOWN_XML_DIRS=(...)
is_config_dir() { ... }
collect_run_dirs() { ... }
sanitize_path_segment() { ... }
config_rel_path() { ... }
```

Add compatibility wrappers:

```bash
sanitize_path_segment() {
  round_trip_sanitize_path_segment "$1"
}

config_rel_path() {
  round_trip_config_rel_path "$1" "${NKDK_XML_REPO}"
}
```

- [ ] **Step 2: Add `--all-configs` usage and parsing**

In usage, add:

```text
  ./.agents/skills/round-trip-yaml-1c/round-trip.sh --all-configs
```

Add option description:

```text
  --all-configs    Проверить все конфигурационные каталоги, не останавливаться после первого успешного.
```

In argument parsing, add:

```bash
    --all-configs)
      ALL_CONFIGS="1"
      shift
      ;;
```

- [ ] **Step 3: Use shared run-dir collector**

Replace:

```bash
done < <(collect_run_dirs "${NKDK_XML_DIR}")
```

with:

```bash
done < <(round_trip_collect_run_dirs "${NKDK_XML_DIR}")
```

- [ ] **Step 4: Wrap one-config execution into a function**

Replace the current single `ACTIVE_XML_DIR=...` execution block from:

```bash
ACTIVE_XML_DIR="${RUN_DIRS[0]}"
YAML_DIR="$(yaml_dir_for "${ACTIVE_XML_DIR}")"
```

through the final success block with:

```bash
run_one_config() {
  ACTIVE_XML_DIR="$1"
  YAML_DIR="$(yaml_dir_for "${ACTIVE_XML_DIR}")"
  TMP_XML_DIR="$(xml_tmp_dir_for "${ACTIVE_XML_DIR}")"
  IMPORT_LOG="${TMPDIR:-/tmp}/round-trip-yaml-1c-import.log"
  SYNC_LOG="${TMPDIR:-/tmp}/round-trip-yaml-1c-sync.log"
  CREATE_INFOBASE_LOG="${TMPDIR:-/tmp}/round-trip-yaml-1c-create-infobase.log"
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

  echo "[1c] Очистка файловой базы: ${NKDK_1C_DB_PATH}"
  clear_dir_contents "${NKDK_1C_DB_PATH}"

  CREATE_INFOBASE_ARGS=("${IBCMD_BIN}" infobase create --data="${NKDK_1C_DATA}" --db-path="${NKDK_1C_DB_PATH}")
  if ! run_logged "create-infobase" "$(ibcmd_create_command_text)" "${CREATE_INFOBASE_LOG}" "${CREATE_INFOBASE_ARGS[@]}"; then
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
}

if [ "${ALL_CONFIGS}" = "1" ]; then
  CHECKED_CONFIGS="0"
  for RUN_XML_DIR in "${RUN_DIRS[@]}"; do
    run_one_config "${RUN_XML_DIR}"
    CHECKED_CONFIGS="$((CHECKED_CONFIGS + 1))"
  done
  echo ""
  echo "=== Проверка всех конфигураций в 1С прошла успешно ==="
  echo "Проверено каталогов: ${CHECKED_CONFIGS}"
  exit 0
fi

run_one_config "${RUN_DIRS[0]}"
```

- [ ] **Step 5: Update 1C skill docs**

In `.agents/skills/round-trip-yaml-1c/SKILL.md`, add to launch examples:

```bash
./.agents/skills/round-trip-yaml-1c/round-trip.sh --all-configs
```

Add after the `.env` section:

```markdown
Если `NKDK_XML_DIR` указывает на корень с несколькими конфигурациями, без `--all-configs` проверяется первый найденный конфигурационный каталог по алфавиту; с `--all-configs` проверяются все найденные каталоги до первой ошибки или полного успеха.
```

- [ ] **Step 6: Syntax-check and smoke-check 1C runner**

Run:

```bash
bash -n .agents/skills/round-trip-yaml-1c/round-trip.sh
./.agents/skills/round-trip-yaml-1c/round-trip.sh --help
```

Expected: syntax check exits `0`; help output includes `--all-configs`.

- [ ] **Step 7: Commit 1C runner changes**

```bash
git add .agents/skills/round-trip-yaml-1c/round-trip.sh \
  .agents/skills/round-trip-yaml-1c/SKILL.md
git commit -m "feat: ✨ добавить all-configs в round-trip-yaml-1c"
```

## Task 4: Cross-Runner Verification

**Files:**
- Verify only; no code changes expected.

- [ ] **Step 1: Syntax-check all runner scripts**

Run:

```bash
bash -n .agents/skills/_shared/round-trip-config-dirs.sh
bash -n .agents/skills/round-trip-xml/round-trip.sh
bash -n .agents/skills/round-trip-yaml/round-trip.sh
bash -n .agents/skills/round-trip-yaml-fast/round-trip.sh
bash -n .agents/skills/round-trip-yaml-1c/round-trip.sh
```

Expected: all commands exit with status `0` and print nothing.

- [ ] **Step 2: Verify help output**

Run:

```bash
./.agents/skills/round-trip-xml/round-trip.sh --help
./.agents/skills/round-trip-yaml/round-trip.sh --help
./.agents/skills/round-trip-yaml-fast/round-trip.sh --help
./.agents/skills/round-trip-yaml-1c/round-trip.sh --help
```

Expected: all commands exit with status `0`; `fast`, `yaml`, `xml`, and `1c` help mention `--all-configs`.

- [ ] **Step 3: Verify fast root behavior**

Run:

```bash
NKDK_XML_REPO=/home/nikita/git/round-trip NKDK_XML_DIR=/home/nikita/git/round-trip ./.agents/skills/round-trip-yaml-fast/round-trip.sh
```

Expected: output uses a child config directory under `/home/nikita/git/round-trip` and `CHECKED` is greater than `0`. If the command reports real diffs or CLI errors, treat that as diagnostic success.

- [ ] **Step 4: Verify fast all-configs behavior**

Run:

```bash
NKDK_XML_REPO=/home/nikita/git/round-trip NKDK_XML_DIR=/home/nikita/git/round-trip ./.agents/skills/round-trip-yaml-fast/round-trip.sh --triage --all-configs --batch-size 3
```

Expected: output includes `RUN_DIR_COUNT` greater than `1` unless the first technical CLI error stops execution before structured output. Triage entries include `ACTIVE_XML_DIR`.

- [ ] **Step 5: Inspect final git status**

Run:

```bash
git status --short
```

Expected: only intentional runner, skill-doc, helper, and plan files are modified or committed. Do not revert unrelated existing metadata changes.

## Self-Review

- Spec coverage: shared helper, single config, root config collection, `--all-configs`, fast structured output, 1C sequential all-configs, and protocol preservation for yaml/xml are all mapped to tasks.
- Placeholder scan: no unfinished-marker strings and no vague "write tests" steps.
- Type and name consistency: helper functions use the `round_trip_` prefix everywhere; runner-local wrappers preserve old `sanitize_path_segment` and `config_rel_path` call sites where needed.
