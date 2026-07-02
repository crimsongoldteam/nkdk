# Validation Second Pass Worker Context Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Уменьшить объём состояния, которое пересылается worker-ам перед second pass полной validation, не меняя диагностики.

**Architecture:** Worker сохраняет локальную `ValidationObjectTable`, собранную в first pass, и во second pass получает только supplement из глобального snapshot. Main thread строит supplement отдельно для каждого worker-а, исключая records/filePaths, которые уже есть в локальной таблице этого worker-а. Итоговая таблица worker-а остаётся семантически равной глобальной: удалённые snapshot-records с тем же owner key всё равно передаются и перезаписывают локальные записи через обычный `mergeRecords`.

**Tech Stack:** TypeScript ESM, Node worker_threads, Vitest, pnpm workspace.

---

## File Structure

- Modify: `packages/core/metadata/validation/projectValidationWorkerPool.ts`
  - Добавить `createWorkerTableSupplement`.
  - Накапливать локальные object-record paths по worker-ам.
  - Передавать в worker не полный snapshot, а supplement.
- Modify: `packages/core/metadata/validation/projectValidationWorker.ts`
  - Ввести `WorkerValidationState`.
  - Очищать состояние при новом first pass.
  - Строить и сохранять `localTable` во время first pass.
  - Во second pass восстанавливать таблицу из локального snapshot + supplement.
  - Возвращать внутреннюю статистику second pass для отладочного замера.
- Modify: `packages/core/metadata/validation/projectValidationWorkerPool.test.ts`
  - Добавить unit-тест supplement, включая owner collision.
- Modify: `packages/core/metadata/validation/validateProject.test.ts`
  - Оставить существующий тест parity `concurrency: 1`/`concurrency: 2`.
  - Добавить regression-тест, где глобальный owner lookup должен перезаписать локальную запись worker-а через supplement.

## Task 1: Add Failing Supplement Tests

**Files:**
- Modify: `packages/core/metadata/validation/projectValidationWorkerPool.test.ts`

- [ ] **Step 1: Add imports**

In `packages/core/metadata/validation/projectValidationWorkerPool.test.ts`, replace the import from `projectValidationWorkerPool` with:

```ts
import {
  createProjectValidationWorkerPool,
  createWorkerTableSupplement,
} from "./projectValidationWorkerPool"
import type { ValidationObjectRecord, ValidationObjectTableSnapshot } from "./projectValidationTypes"
```

- [ ] **Step 2: Add supplement tests**

Append this `describe` block after the existing `ProjectValidationWorkerPool` tests:

```ts
describe("createWorkerTableSupplement", () => {
  it("excludes records and file paths already owned by the worker", () => {
    const local = record({ kind: "Справочник", name: "Товары" }, "/project/Справочник/Товары/Свойства.yaml")
    const remote = record({ kind: "Документ", name: "Заказ" }, "/project/Документ/Заказ/Свойства.yaml")
    const snapshot: ValidationObjectTableSnapshot = {
      records: [local, remote],
      filePaths: [local.filePath, remote.filePath],
    }

    const supplement = createWorkerTableSupplement(snapshot, new Set([local.filePath]))

    expect(supplement).toEqual({
      records: [remote],
      filePaths: [remote.filePath],
    })
  })

  it("keeps remote owner records when they override a local owner key", () => {
    const local = record(
      { kind: "Подсистема", name: "Настройки" },
      "/project/Подсистема/A/Подсистемы/Настройки/Свойства.yaml"
    )
    const remote = record(
      { kind: "Подсистема", name: "Настройки" },
      "/project/Подсистема/B/Подсистемы/Настройки/Свойства.yaml"
    )
    const snapshot: ValidationObjectTableSnapshot = {
      records: [remote],
      filePaths: [local.filePath, remote.filePath],
    }

    const supplement = createWorkerTableSupplement(snapshot, new Set([local.filePath]))

    expect(supplement).toEqual({
      records: [remote],
      filePaths: [remote.filePath],
    })
  })
})

function record(owner: { kind: string; name: string }, filePath: string): ValidationObjectRecord {
  return {
    filePath,
    projectPath: filePath.replace(/^\/project\//, ""),
    kind: "properties",
    owner: { dir: owner.kind, name: owner.name },
    ownerRef: { kind: owner.kind, name: owner.name },
    model: { itemType: owner.kind, name: owner.name },
    importDiagnostics: [],
  }
}
```

- [ ] **Step 3: Run focused test and confirm it fails**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/projectValidationWorkerPool.test.ts
```

Expected: FAIL with TypeScript/import error because `createWorkerTableSupplement` is not exported yet.

## Task 2: Implement Supplement Creation in the Pool

**Files:**
- Modify: `packages/core/metadata/validation/projectValidationWorkerPool.ts`

- [ ] **Step 1: Extend first-pass result types**

In `packages/core/metadata/validation/projectValidationWorkerPool.ts`, update `FirstPassPoolResult`:

```ts
export interface FirstPassPoolResult {
  diagnostics: Diagnostic[]
  objectRecords: ValidationObjectRecord[]
}
```

No public shape change is needed here. The pool can derive local paths from each worker response.

- [ ] **Step 2: Add local object path tracking**

Near the existing `assignedFilePaths` declaration, add:

```ts
  const localObjectRecordPaths = new Map<Worker, Set<string>>()
```

Inside `runFirstPass`, after verifying `response.kind !== "firstPassResult"` did not throw, add:

```ts
          localObjectRecordPaths.set(
            worker,
            new Set(response.objectRecords.map((record) => record.filePath))
          )
```

For the empty `filePaths.length === 0` branch, set an empty set before returning:

```ts
          if (filePaths.length === 0) {
            localObjectRecordPaths.set(worker, new Set())
            return { diagnostics: [], objectRecords: [] }
          }
```

- [ ] **Step 3: Send supplements instead of full snapshots**

In `runSecondPass`, before `request(worker, { ... })`, compute:

```ts
          const objectTable = createWorkerTableSupplement(
            secondPassParams.objectTable,
            localObjectRecordPaths.get(worker) ?? new Set()
          )
```

Then pass that local `objectTable` in the worker request:

```ts
          const response = await request(worker, {
            kind: "secondPass",
            projectDir: secondPassParams.projectDir,
            context: secondPassParams.context,
            mode: secondPassParams.mode,
            objectTable,
            filePaths,
          })
```

- [ ] **Step 4: Add exported helper**

At the end of `packages/core/metadata/validation/projectValidationWorkerPool.ts`, before `partitionRoundRobin`, add:

```ts
export function createWorkerTableSupplement(
  snapshot: ValidationObjectTableSnapshot,
  localFilePaths: ReadonlySet<string>
): ValidationObjectTableSnapshot {
  const local = new Set([...localFilePaths].map((filePath) => resolve(filePath)))

  return {
    records: snapshot.records.filter((record) => !local.has(resolve(record.filePath))),
    filePaths: snapshot.filePaths.filter((filePath) => !local.has(resolve(filePath))),
  }
}
```

Also update the path import at the top:

```ts
import { dirname, join, resolve } from "node:path"
```

- [ ] **Step 5: Run focused test**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/projectValidationWorkerPool.test.ts
```

Expected: PASS.

## Task 3: Retain Worker Local Table Across Passes

**Files:**
- Modify: `packages/core/metadata/validation/projectValidationWorker.ts`

- [ ] **Step 1: Replace module-level maps with worker state**

In `packages/core/metadata/validation/projectValidationWorker.ts`, replace:

```ts
const entries = new Map<string, ProjectYamlEntry>()
const states = new Map<string, ProjectValidationFileState>()
```

with:

```ts
interface WorkerValidationState {
  entries: Map<string, ProjectYamlEntry>
  states: Map<string, ProjectValidationFileState>
  localTable: ReturnType<typeof createValidationObjectTable>
}

let workerState = createEmptyWorkerValidationState()

function createEmptyWorkerValidationState(): WorkerValidationState {
  return {
    entries: new Map(),
    states: new Map(),
    localTable: createValidationObjectTable(),
  }
}
```

- [ ] **Step 2: Reset state at first pass start**

At the start of `runFirstPass`, before diagnostics are created, add:

```ts
  workerState = createEmptyWorkerValidationState()
```

Then replace all first-pass uses:

```ts
    entries.set(resolve(entry.filePath), entry)
```

with:

```ts
    workerState.entries.set(resolve(entry.filePath), entry)
```

Replace:

```ts
    states.set(resolve(file.absolutePath), first.state)
```

with:

```ts
    workerState.states.set(resolve(file.absolutePath), first.state)
    workerState.localTable.mergeRecords(first.objectRecords)
```

- [ ] **Step 3: Use local table plus supplement in second pass**

In `runSecondPass`, replace:

```ts
  const table = createValidationObjectTable(message.objectTable)
```

with:

```ts
  const localSnapshot = workerState.localTable.snapshot()
  const supplementedTable = createValidationObjectTable({
    records: [...localSnapshot.records, ...message.objectTable.records],
    filePaths: [...localSnapshot.filePaths, ...message.objectTable.filePaths],
  })
```

Then pass `supplementedTable` to `createOwnerMetadataCacheFromValidationTable` and `createProjectMetadataResolverFromValidationTable`:

```ts
  const ownerCache = createOwnerMetadataCacheFromValidationTable({ projectDir: message.projectDir, table: supplementedTable })
  const metadataResolver = createProjectMetadataResolverFromValidationTable({
    projectDir: message.projectDir,
    table: supplementedTable,
    mode: message.mode,
    ownerCache,
    yamlCache: cache,
  })
```

The record order is important: supplement records come after local records, so global owner lookup semantics can still override a local owner key when the global snapshot selected a remote record.

- [ ] **Step 4: Update second-pass state lookups**

In the second-pass file loop, replace:

```ts
    const state = states.get(resolve(filePath))
```

with:

```ts
    const state = workerState.states.get(resolve(filePath))
```

- [ ] **Step 5: Update YAML cache creation**

In `createWorkerYamlCache`, replace:

```ts
  const local = createProjectYamlCacheFromEntries([...entries.values()])
```

with:

```ts
  const local = createProjectYamlCacheFromEntries([...workerState.entries.values()])
```

- [ ] **Step 6: Run focused validation tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/projectValidationWorkerPool.test.ts metadata/validation/validateProject.test.ts
```

Expected: PASS.

## Task 4: Add Gated Second-Pass Timing

**Files:**
- Modify: `packages/core/metadata/validation/projectValidationWorker.ts`
- Modify: `packages/core/metadata/validation/projectValidationWorkerPool.ts`

- [ ] **Step 1: Add timing type to worker response**

In `packages/core/metadata/validation/projectValidationWorkerPool.ts`, add this interface near `SecondPassPoolResult`:

```ts
interface WorkerSecondPassTiming {
  contextMs: number
  validationMs: number
  fileCount: number
  supplementRecords: number
  supplementFilePaths: number
}
```

Update `WorkerResponse`:

```ts
  | { kind: "secondPassResult"; diagnostics: Diagnostic[]; timing?: WorkerSecondPassTiming }
```

- [ ] **Step 2: Collect timing in the worker**

In `packages/core/metadata/validation/projectValidationWorker.ts`, add the import:

```ts
import { performance } from "node:perf_hooks"
```

Update the `runSecondPass` return type:

```ts
function runSecondPass(message: Extract<ValidationWorkerMessage, { kind: "secondPass" }>): {
  diagnostics: Diagnostic[]
  timing: {
    contextMs: number
    validationMs: number
    fileCount: number
    supplementRecords: number
    supplementFilePaths: number
  }
} {
```

At the start of `runSecondPass`, add:

```ts
  const contextStartedAt = performance.now()
```

After creating `metadataResolver`, add:

```ts
  const validationStartedAt = performance.now()
```

Replace the final return with:

```ts
  return {
    diagnostics,
    timing: {
      contextMs: validationStartedAt - contextStartedAt,
      validationMs: performance.now() - validationStartedAt,
      fileCount: message.filePaths.length,
      supplementRecords: message.objectTable.records.length,
      supplementFilePaths: message.objectTable.filePaths.length,
    },
  }
```

- [ ] **Step 3: Log timing only when explicitly enabled**

In `packages/core/metadata/validation/projectValidationWorkerPool.ts`, inside `runSecondPass`, keep the worker index in every mapped result. Replace the empty-file branch:

```ts
          if (filePaths.length === 0) return { diagnostics: [] }
```

with:

```ts
          if (filePaths.length === 0) return { index, diagnostics: [] }
```

Then keep the worker index in the normal response:

```ts
          return { index, ...response }
```

Then replace the final return:

```ts
      return { diagnostics: results.flatMap((result) => result.diagnostics) }
```

with:

```ts
      logSecondPassTiming(results)

      return { diagnostics: results.flatMap((result) => result.diagnostics) }
```

Add this helper before `createWorkerTableSupplement`:

```ts
function logSecondPassTiming(
  results: Array<{ index: number; timing?: WorkerSecondPassTiming }>
): void {
  if (process.env["NKDK_VALIDATION_TIMING"] !== "1") return

  for (const result of results) {
    if (result.timing === undefined) continue
    console.error(
      [
        `[validation] worker ${result.index} second pass`,
        `files=${result.timing.fileCount}`,
        `supplementRecords=${result.timing.supplementRecords}`,
        `supplementFilePaths=${result.timing.supplementFilePaths}`,
        `context=${result.timing.contextMs.toFixed(2)}ms`,
        `validation=${result.timing.validationMs.toFixed(2)}ms`,
      ].join(" ")
    )
  }
}
```

- [ ] **Step 4: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/projectValidationWorkerPool.test.ts metadata/validation/validateProject.test.ts
```

Expected: PASS. Normal test output must not include `[validation] worker`.

## Task 5: Add Regression Coverage for Supplement Semantics

**Files:**
- Modify: `packages/core/metadata/validation/validateProject.test.ts`

- [ ] **Step 1: Add a full-validation regression test**

After `parallel validation keeps subsystem files with duplicate local names`, add:

```ts
  it("parallel validation resolves remote records from worker supplements", async () => {
    const projectDir = createProject()
    writeProjectFile(projectDir, "Подсистема/A/Свойства.yaml", [
      "КомандныйИнтерфейс:",
      "  ПорядокПодсистем:",
      "    - Подсистема.B.Подсистема.Настройки",
    ])
    writeProjectFile(projectDir, "Подсистема/A/Подсистемы/Настройки/Свойства.yaml", "{}\n")
    writeProjectFile(projectDir, "Подсистема/B/Свойства.yaml", [
      "КомандныйИнтерфейс:",
      "  ПорядокПодсистем:",
      "    - Подсистема.A.Подсистема.Настройки",
    ])
    writeProjectFile(projectDir, "Подсистема/B/Подсистемы/Настройки/Свойства.yaml", "{}\n")

    const parallel = await validateProject({ projectDir, context: mockContext, concurrency: 2 })

    expect(parallel.diagnostics).toEqual([])
  })
```

- [ ] **Step 2: Run the regression test**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/validateProject.test.ts
```

Expected: PASS.

## Task 6: Measure and Verify

**Files:**
- No code changes.

- [ ] **Step 1: Run full project tests**

Run from `/Users/nikita/git/nkdk/.worktrees/benchmark-yaml-parsers`:

```bash
pnpm test
```

Expected: all package tests pass.

- [ ] **Step 2: Measure full YAML validation**

Run:

```bash
/usr/bin/time -p pnpm --filter @nakidka/cli exec tsx src/cli.ts validate /Users/nikita/git/nkdk-yaml
```

Expected:

```text
summary: 0 error, 0 warning
```

Record `real`, `user`, and `sys`. Compare `real` with the current warm baseline `52.89 s`.

- [ ] **Step 3: Measure with worker timing**

Run:

```bash
NKDK_VALIDATION_TIMING=1 /usr/bin/time -p pnpm --filter @nakidka/cli exec tsx src/cli.ts validate /Users/nikita/git/nkdk-yaml
```

Expected:

```text
summary: 0 error, 0 warning
[validation] worker ...
```

Record per-worker `supplementRecords`, `supplementFilePaths`, `context`, and `validation` values. Use this only for analysis; do not keep timing output enabled by default.

- [ ] **Step 4: Inspect git diff**

Run:

```bash
git diff --stat
git diff -- packages/core/metadata/validation/projectValidationWorkerPool.ts packages/core/metadata/validation/projectValidationWorker.ts packages/core/metadata/validation/projectValidationWorkerPool.test.ts packages/core/metadata/validation/validateProject.test.ts
```

Expected: diff only contains worker supplement/state retention changes and tests.

## Task 7: Commit Implementation

**Files:**
- Commit only implementation and tests from Tasks 1-5.

- [ ] **Step 1: Stage files**

Run:

```bash
git add packages/core/metadata/validation/projectValidationWorkerPool.ts packages/core/metadata/validation/projectValidationWorker.ts packages/core/metadata/validation/projectValidationWorkerPool.test.ts packages/core/metadata/validation/validateProject.test.ts
```

- [ ] **Step 2: Commit**

Run:

```bash
git commit -m "perf: :zap: ускорить second pass validation"
```

Expected: commit succeeds after `pnpm test` and validation measurement.
