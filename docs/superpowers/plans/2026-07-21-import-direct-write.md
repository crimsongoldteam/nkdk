# Import Direct Write Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Убрать временный каталог XML-import и писать результат сразу в пустой целевой YAML-компонент.

**Architecture:** Worker получает `outputDir` вместо `tempDir` и пишет YAML/generated files по целевым путям. Main копирует XML external files по итоговому списку и строит projectFiles из этого же списка, без полного обхода проекта и без transfer/rename стадии.

**Tech Stack:** TypeScript, Node.js fs/promises, Piscina worker pool, vitest, pnpm.

## Global Constraints

- XML-фикстуры не менять.
- Core metadata-слои не знают про `cf/cfe/erf/epf`.
- `NKDK_PROFILE=1` остаётся общей переменной профилирования.
- Import target должен быть пустым до записи; rollback не добавляется.

---

### Task 1: Remove temp-root contract from coordinator

**Files:**
- Modify: `packages/core/metadata/importFromXml/importConfiguration.ts`
- Modify: `packages/core/metadata/importFromXml/importConfiguration.test.ts`
- Modify: `packages/core/metadata/importFromXml/types.ts`

**Interfaces:**
- `ImportConfigurationFromXmlParams.operationId` больше не влияет на filesystem path.
- `ConfigurationImportResult` больше не содержит `preservedTempRoot`.
- `XmlImportWorkerPool.initialize` принимает `outputDir` вместо `tempRoot`.

- [ ] **Step 1: Write failing tests**

Update coordinator tests so successful call order no longer includes temp creation, transfer, removeTemp. Failure results should not contain `preservedTempRoot`.

- [ ] **Step 2: Implement coordinator**

Remove `createImportTempRoot`, `removeTemp`, and `transfer` dependency from import coordinator. Initialize pool with `outputDir`. Replace hash step with a function that hashes only result files.

- [ ] **Step 3: Run focused tests**

Run `pnpm --filter @nkdk/core test -- metadata/importFromXml/importConfiguration.test.ts`.

### Task 2: Write worker output directly

**Files:**
- Modify: `packages/core/metadata/importFromXml/worker.ts`
- Modify: `packages/core/metadata/importFromXml/workerPool.ts`
- Modify: `packages/core/metadata/importFromXml/worker.test.ts`
- Modify: `packages/core/metadata/importFromXml/workerPool.test.ts`

**Interfaces:**
- Worker state has `outputDir`.
- Second pass writes to `outputDir/targetProjectPath`.
- Returned `ImportResultFile` for worker files may keep `sourcePath` equal to final path.

- [ ] **Step 1: Write failing tests**

Update worker tests to assert YAML is written in the final output directory, not worker temp dir.

- [ ] **Step 2: Implement worker and pool rename**

Rename `tempDir`/`tempRoot` to `outputDir` in worker commands and pool initialization. Remove worker subdirectories for import output.

- [ ] **Step 3: Run focused tests**

Run `pnpm --filter @nkdk/core test -- metadata/importFromXml/worker.test.ts metadata/importFromXml/workerPool.test.ts`.

### Task 3: Copy XML external files and hash result files only

**Files:**
- Modify: `packages/core/metadata/importFromXml/transfer.ts`
- Modify: `packages/core/metadata/importFromXml/transfer.test.ts`
- Modify: `packages/core/metadata/configurationIndex/projectFiles.ts`
- Modify: `packages/core/metadata/configurationIndex/projectFiles.test.ts`

**Interfaces:**
- Add `copyXmlImportExternalFiles({ projectDir, files, concurrency })`.
- Add `hashConfigurationProjectFileList(projectDir, projectPaths, options)`.
- Coordinator uses merged result file list for external copy and hash.

- [ ] **Step 1: Write failing tests**

Add tests that `hashConfigurationProjectFileList` hashes only supplied project paths and does not discover unrelated project files.

- [ ] **Step 2: Implement direct copy/hash helpers**

Keep existing path safety checks. For worker files, no copy needed; for XML files, copy to target path.

- [ ] **Step 3: Run focused tests**

Run `pnpm --filter @nkdk/core test -- metadata/importFromXml/transfer.test.ts metadata/configurationIndex/projectFiles.test.ts`.

### Task 4: Public contracts, docs, and profile names

**Files:**
- Modify: `packages/cli/src/commands/import.ts`
- Modify: `packages/cli/src/commands/import.test.ts`
- Modify: `packages/mcp/src/services/importFromXml.ts`
- Modify: `packages/mcp/src/services/importFromXml.test.ts`
- Modify: `packages/mcp/src/contracts/importFromXml.ts`
- Modify: `packages/mcp/src/tools/registerTools.ts`
- Modify: `packages/mcp/src/guides/index.ts`
- Modify: `.agents/architecture.md`
- Modify: `docs/superpowers/specs/2026-07-21-operation-profile-design.md`
- Modify: `.agents/skills/import-profile/import-profile.mjs`

**Interfaces:**
- No `preservedTempRoot` in import result.
- CLI rejects non-empty YAML target.
- Profile uses `Копирование внешних файлов XML-выгрузки` and no temp/transfer steps.

- [ ] **Step 1: Write failing tests**

Update CLI/MCP tests to remove `preservedTempRoot` expectations and add CLI non-empty target rejection.

- [ ] **Step 2: Implement public updates**

Remove temp wording from docs/contracts/tools/guides. Add CLI empty-target guard.

- [ ] **Step 3: Run package tests**

Run `pnpm --filter @nkdk/core test`, `pnpm --filter @nkdk/mcp test`, and `pnpm --filter @nkdk/cli test`.

### Task 5: Verification and benchmark

**Files:**
- No source changes unless verification exposes a bug.

- [ ] **Step 1: Full tests**

Run `pnpm test`.

- [ ] **Step 2: Import profile on erp**

Clean `/Users/nikita/git/nkdk-yaml/cf`, then run:

```bash
node .agents/skills/import-profile/import-profile.mjs /Users/nikita/git/round-trip/cf/erp /Users/nikita/git/nkdk-yaml/cf --runs 1
```

Expected: no `Перенос результата импорта в проект`; hash step should be materially lower because it hashes only result files.
