# Operation Profile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить общий профиль операций через `NKDK_PROFILE=1` и runner для распределения времени XML-import.

**Architecture:** Существующий validation profiler превращается в общий operation profiler с параметром `operation`. XML-import оборачивает уже существующие этапы в `measure/measureAsync`, worker возвращают те же строки профиля через stderr, а `.agents/skills/import-profile/import-profile.mjs` парсит их и печатает таблицу в стиле validation-profile.

**Tech Stack:** TypeScript, Node.js, pnpm, tsx, vitest, существующий worker pool на Piscina.

## Global Constraints

- Ответы и документация проекта на русском.
- Переменная включения профиля только `NKDK_PROFILE=1`.
- Обратная совместимость с `NKDK_VALIDATION_TIMING` и `NKDK_FULL_SYNC_PROFILE` не нужна.
- XML-фикстуры не менять.
- Core metadata-слои не получают знания о `cf/cfe/erf/epf`.

---

### Task 1: Общий operation profiler

**Files:**
- Modify: `packages/core/metadata/validation/profile.ts`
- Test: `packages/core/metadata/validation/profile.test.ts`

**Interfaces:**
- Produces: `createOperationProfiler({ operation, scope })`, строки `[nkdk-profile-step]`.
- Keeps: `createValidationProfiler(scope)` as a thin local alias only if existing validation code still imports it during migration.

- [ ] **Step 1: Write failing tests**

Add tests that set `NKDK_PROFILE=1`, call `createOperationProfiler({ operation: "import-from-xml", scope: { scope: "main" } })`, flush, and expect stderr to contain `[nkdk-profile-step] operation="import-from-xml"`.

- [ ] **Step 2: Implement minimal profiler change**

Add `operation` to profile records and formatting. `isProfilingEnabled()` returns `process.env["NKDK_PROFILE"] === "1"`.

- [ ] **Step 3: Run focused tests**

Run: `pnpm --filter @nkdk/core test -- metadata/validation/profile.test.ts`

### Task 2: Instrument XML-import coordinator and worker

**Files:**
- Modify: `packages/core/metadata/importFromXml/importConfiguration.ts`
- Modify: `packages/core/metadata/importFromXml/worker.ts`
- Modify: `packages/core/metadata/importFromXml/workerPool.ts`
- Modify: `packages/core/metadata/importFromXml/prepareModel.ts`
- Test: `packages/core/metadata/importFromXml/importConfiguration.test.ts`
- Test: `packages/core/metadata/importFromXml/worker.test.ts`

**Interfaces:**
- Consumes: `createOperationProfiler({ operation: "import-from-xml", scope })`.
- Produces: stderr records for main and worker import substeps.

- [ ] **Step 1: Write failing tests**

Add tests with `NKDK_PROFILE=1` and captured stderr. Expect `[nkdk-profile-step]`, `operation="import-from-xml"`, main substeps `Поиск XML-файлов выгрузки`, `Первый проход worker`, and worker substeps `Чтение XML`, `Парсинг XML`, `Построение модели`.

- [ ] **Step 2: Instrument main coordinator**

Wrap temp directory creation, discovery, pool initialization, first pass, shared metadata creation, second pass, file merge, transfer, hash, index build/write, and temp cleanup.

- [ ] **Step 3: Instrument worker**

Record first-pass read/parse/model/index/owner-facts timings and second-pass YAML/file-list timings.

- [ ] **Step 4: Run focused tests**

Run: `pnpm --filter @nkdk/core test -- metadata/importFromXml/importConfiguration.test.ts metadata/importFromXml/worker.test.ts`

### Task 3: Import profile runner

**Files:**
- Create: `.agents/skills/import-profile/SKILL.md`
- Create: `.agents/skills/import-profile/import-profile.mjs`

**Interfaces:**
- Consumes: CLI command `pnpm --filter @nkdk/cli dev import <xml-dir> <yaml-dir>`.
- Produces: user-facing profile summary and distribution table.

- [ ] **Step 1: Create runner**

Implement args: `<xml-dir> <yaml-dir> [--runs N] [--json]`. Each run spawns import with `NKDK_PROFILE=1`, captures stderr/stdout, parses `[nkdk-profile-step]`, and records elapsed time, success count, errors, warnings, RSS.

- [ ] **Step 2: Print validation-style report**

Print mode, XML/YAML dirs, workers, Cold, Warm, Warnings/Errors, Peak RSS, Runs, then markdown table grouped by `operation/step/substep`.

- [ ] **Step 3: Smoke run help**

Run: `node .agents/skills/import-profile/import-profile.mjs --help`

### Task 4: Verification

**Files:**
- No source changes unless tests expose a bug.

**Interfaces:**
- Consumes: all previous tasks.
- Produces: verified import profiling.

- [ ] **Step 1: Type-check and focused tests**

Run: `pnpm --filter @nkdk/core test -- metadata/validation/profile.test.ts metadata/importFromXml/importConfiguration.test.ts metadata/importFromXml/worker.test.ts`

- [ ] **Step 2: Full test suite**

Run: `pnpm test`

- [ ] **Step 3: Real import profile**

Run: `node .agents/skills/import-profile/import-profile.mjs /Users/nikita/git/round-trip/cf/doc /Users/nikita/git/nkdk-yaml/cf --runs 1`

Expected: report contains cold time and `Шаги import-from-xml`.
