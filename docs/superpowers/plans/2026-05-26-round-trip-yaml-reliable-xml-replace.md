# Reliable round-trip-yaml XML Replace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `round-trip-yaml` show XML files lost during `XML -> YAML -> XML` as deletions in `git diff`.

**Architecture:** Keep the public `round-trip-yaml` interface unchanged, but change the runner internals. For each active XML directory, start from an empty temporary XML directory, run `nkdk sync` into that temporary directory, and only after successful sync replace the active XML directory contents with the temporary result. The check is intentionally strict: files that are not recreated from YAML disappear from the active XML directory and become deletions in `git diff`.

**Tech Stack:** Bash, git, `nkdk import`, `nkdk sync`, existing Codex skill markdown format.

---

## File Structure

- Modify `.agents/skills/round-trip-yaml/round-trip.sh`: add temporary XML directory helpers, sync YAML into an empty temp XML directory, then replace active XML contents before collecting `git diff`.
- Modify `.agents/skills/round-trip-yaml/SKILL.md`: document the new temp XML step and explain that the temp XML directory is not the retained diagnostic result.
- No changes in `packages/core/metadata/**`: this is a runner behavior change, not metadata serialization logic.

## Task 1: Add Safe Directory Helpers

**Files:**
- Modify: `.agents/skills/round-trip-yaml/round-trip.sh`

- [ ] **Step 1: Insert temporary XML and directory helper functions**

Insert this block immediately after the existing `yaml_dir_for()` function:

```bash
xml_tmp_dir_for() {
  local active_dir="$1"
  local rel

  rel="$(config_rel_path "${active_dir}")"
  printf '%s/round-trip-yaml-xml/%s' "${TMPDIR:-/tmp}" "$(sanitize_path_segment "${rel}")"
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

move_dir_contents() {
  local source_dir="$1"
  local target_dir="$2"

  ensure_safe_dir "${source_dir}"
  ensure_safe_dir "${target_dir}"
  [ -d "${source_dir}" ] || die "каталог-источник не существует: ${source_dir}"
  mkdir -p "${target_dir}"
  find "${source_dir}" -mindepth 1 -maxdepth 1 ! -name .git -exec mv {} "${target_dir}/" \;
}
```

- [ ] **Step 2: Run shell syntax check**

Run:

```bash
bash -n .agents/skills/round-trip-yaml/round-trip.sh
```

Expected: command exits with status `0` and prints nothing.

## Task 2: Route sync Through Temporary XML

**Files:**
- Modify: `.agents/skills/round-trip-yaml/round-trip.sh`

- [ ] **Step 1: Replace the beginning of the run loop**

Replace the current loop body from `for RUN_XML_DIR in "${RUN_DIRS[@]}"; do` through the `nkdk sync` block with this code:

```bash
for RUN_XML_DIR in "${RUN_DIRS[@]}"; do
  RUN_YAML_DIR="$(yaml_dir_for "${RUN_XML_DIR}")"
  RUN_XML_TMP_DIR="$(xml_tmp_dir_for "${RUN_XML_DIR}")"

  echo "[restore] Откат XML-репо к HEAD..."
  git -C "${NKDK_XML_REPO}" restore .

  echo "[yaml] Очистка временного YAML-каталога: ${RUN_YAML_DIR}"
  rm -rf "${RUN_YAML_DIR}"
  mkdir -p "${RUN_YAML_DIR}"

  echo "[xml] Очистка временного XML-каталога: ${RUN_XML_TMP_DIR}"
  clear_dir_contents "${RUN_XML_TMP_DIR}"

  echo "[round-trip] XML -> YAML: ${RUN_XML_DIR}"
  if ! run_nkdk "${NKDK[@]}" import "${RUN_XML_DIR}" "${RUN_YAML_DIR}"; then
    echo "=== ROUND_TRIP_ERROR ==="
    echo "STAGE: import"
    echo "ACTIVE_XML_DIR: ${RUN_XML_DIR}"
    echo "YAML_DIR: ${RUN_YAML_DIR}"
    echo "XML_TMP_DIR: ${RUN_XML_TMP_DIR}"
    exit 1
  fi

  echo "[round-trip] YAML -> временный XML: ${RUN_YAML_DIR}"
  if ! run_nkdk "${NKDK[@]}" sync "${RUN_YAML_DIR}" "${RUN_XML_TMP_DIR}"; then
    echo "=== ROUND_TRIP_ERROR ==="
    echo "STAGE: sync"
    echo "ACTIVE_XML_DIR: ${RUN_XML_DIR}"
    echo "YAML_DIR: ${RUN_YAML_DIR}"
    echo "XML_TMP_DIR: ${RUN_XML_TMP_DIR}"
    exit 1
  fi

  echo "[xml] Замена XML-каталога результатом временного XML: ${RUN_XML_DIR}"
  clear_dir_contents "${RUN_XML_DIR}"
  move_dir_contents "${RUN_XML_TMP_DIR}" "${RUN_XML_DIR}"
```

Leave the existing `CURRENT_DIFF_FILES=()` block and the rest of the loop unchanged.

- [ ] **Step 2: Check that diff collection still targets the active XML directory**

Run:

```bash
rg -n "git -C \"\\$\\{RUN_XML_DIR\\}\".*diff|git -C \"\\$\\{active_dir\\}\".*diff" .agents/skills/round-trip-yaml/round-trip.sh
```

Expected output includes the existing diff collection command against `${RUN_XML_DIR}` and the existing emit commands against `${active_dir}`.

- [ ] **Step 3: Run shell syntax check again**

Run:

```bash
bash -n .agents/skills/round-trip-yaml/round-trip.sh
```

Expected: command exits with status `0` and prints nothing.

## Task 3: Update Skill Documentation

**Files:**
- Modify: `.agents/skills/round-trip-yaml/SKILL.md`

- [ ] **Step 1: Update the summary of what the skill reports**

Replace the sentence:

```markdown
На выходе он показывает XML diff'ы, появившиеся после `nkdk import <xml-dir> <tmp-yaml-dir>` и `nkdk sync <tmp-yaml-dir> <xml-dir>`.
```

with:

```markdown
На выходе он показывает XML diff'ы, появившиеся после `nkdk import <xml-dir> <tmp-yaml-dir>`, `nkdk sync <tmp-yaml-dir> <tmp-xml-dir>` и полной замены активного XML-каталога результатом временного XML-каталога.
```

- [ ] **Step 2: Update the runner steps**

Replace steps 6-10 in the "Скрипт:" list with:

```markdown
6. перед каждым прогоном удаляет временный YAML-каталог для активного XML-каталога;
7. перед каждым прогоном очищает временный XML-каталог;
8. запускает `nkdk import <xml-dir> <tmp-yaml-dir>`;
9. запускает `nkdk sync <tmp-yaml-dir> <tmp-xml-dir>`;
10. после успешного `sync` полностью заменяет активный XML-каталог содержимым временного XML-каталога;
11. собирает XML diff'ы через `git diff`;
12. если после каталога появился хотя бы один diff — останавливается на этом каталоге и дальше не смотрит, если не указан `--all-configs`.
```

- [ ] **Step 3: Add a temporary XML directory subsection**

Add this subsection immediately after the existing "Каталог YAML" subsection:

```markdown
### Временный XML-каталог

Для экспорта YAML обратно в XML скрипт использует временный XML-каталог `${TMPDIR:-/tmp}/round-trip-yaml-xml/<config>`.

Перед `sync` каталог очищается. Результат после успешного `sync` полностью заменяет активный XML-каталог, поэтому любые файлы, которые не были восстановлены из YAML, становятся удалениями в `git diff`. Сам временный XML-каталог не считается диагностическим результатом; анализировать нужно diff в XML-репо и сохраненный YAML-каталог.
```

- [ ] **Step 4: Check that old direct-sync wording is gone**

Run:

```bash
rg -n "sync <tmp-yaml-dir> <xml-dir>|прямо.*<xml-dir>" .agents/skills/round-trip-yaml/SKILL.md
```

Expected: no matches.

## Task 4: Commit Static-Checked Implementation

**Files:**
- Modify: `.agents/skills/round-trip-yaml/round-trip.sh`
- Modify: `.agents/skills/round-trip-yaml/SKILL.md`

- [ ] **Step 1: Run syntax and whitespace checks**

Run:

```bash
bash -n .agents/skills/round-trip-yaml/round-trip.sh
git diff --check
```

Expected: both commands exit with status `0`.

- [ ] **Step 2: Inspect the implementation diff**

Run:

```bash
git diff -- .agents/skills/round-trip-yaml/round-trip.sh .agents/skills/round-trip-yaml/SKILL.md
```

Expected: the diff only changes the runner flow and the skill documentation. No files under `packages/core/metadata/**` are changed.

- [ ] **Step 3: Commit the implementation before a real round-trip run**

This commit is required before the real runner check because `round-trip-yaml` refuses to run when the `nakidka-core` worktree is dirty.

Run:

```bash
git add .agents/skills/round-trip-yaml/round-trip.sh .agents/skills/round-trip-yaml/SKILL.md
git commit -m "fix: :bug: показывать потери XML в round-trip-yaml"
```

Expected: commit succeeds and `git status --short` is empty.

## Task 5: Run a Real Smoke Check

**Files:**
- Execute: `.agents/skills/round-trip-yaml/round-trip.sh`

- [ ] **Step 1: Confirm clean `nakidka-core` worktree**

Run:

```bash
git status --short
```

Expected: no output.

- [ ] **Step 2: Run a small triage check**

Run:

```bash
./.agents/skills/round-trip-yaml/round-trip.sh --triage --batch-size 1
```

Expected: output includes these new log lines before diff reporting or clean-result reporting:

```text
[xml] Очистка временного XML-каталога:
[round-trip] YAML -> временный XML:
[xml] Замена XML-каталога результатом временного XML:
```

The final output must include one of these markers:

```text
=== TRIAGE_DIFF ===
=== Round-trip чистый: диффов нет ===
```

If output includes `=== ROUND_TRIP_ERROR ===`, stop and inspect the printed `STAGE`, `ACTIVE_XML_DIR`, `YAML_DIR`, and `XML_TMP_DIR`.

- [ ] **Step 3: Confirm the diagnostic result is in the XML repo, not in `nakidka-core`**

Run:

```bash
git status --short
```

Expected: no output in `nakidka-core`.

Do not run `git restore` in the external XML repo after a successful diagnostic run; the XML diff is the diagnostic result.

## Self-Review

- Spec coverage: the plan implements temporary XML export, full active XML replacement, strict deletion of files not restored from YAML, preserved YAML diagnostics, unchanged single/triage output, and documentation updates.
- Placeholder scan: the plan contains exact files, code blocks, commands, and expected outcomes.
- Type consistency: all new names are Bash functions or local variables defined before use: `xml_tmp_dir_for`, `ensure_safe_dir`, `clear_dir_contents`, `move_dir_contents`, and `RUN_XML_TMP_DIR`.
