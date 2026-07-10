# Unified Shared Snapshot Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make binary `SharedValidationSnapshot` the single second-pass validation mechanism for worker, full in-process, partial, and single-file validation.

**Architecture:** Introduce a neutral snapshot provider built from `ValidationObjectTableSnapshot`. The provider creates binary owner snapshots and shared reference snapshots, then exposes `OwnerMetadataCache`, `ProjectReferenceIndex`, and worker payload factories without knowing concrete metadata item types. Remove JSON owner snapshot, legacy worker object-table supplement, and environment switches that selected old validation paths.

**Tech Stack:** TypeScript, Vitest, Node.js `worker_threads`, `SharedArrayBuffer`, existing `@nakidka/core` validation modules.

---

## File Structure

- Create `packages/core/metadata/validation/validationSnapshotProvider.ts`
  - Owns the neutral provider interface and factory.
  - Builds `SharedValidationSnapshot` from `ValidationObjectTableSnapshot`.
  - Creates owner cache and reference index from the shared payload.

- Create `packages/core/metadata/validation/validationSnapshotProvider.test.ts`
  - Proves provider returns the same owner metadata as the regular table cache.
  - Proves provider reference index supports partial dependency enqueue.

- Modify `packages/core/metadata/validation/sharedValidationSnapshot.ts`
  - Keep only binary owner snapshot.
  - Remove JSON shared owner types, encoder, decoder, and object-field JSON helpers.

- Modify `packages/core/metadata/validation/dataPath/sharedOwnerCache.ts`
  - Keep a tiny binary-only adapter.
  - Remove JSON decoding and duplicated owner-result code.

- Modify `packages/core/metadata/validation/sharedValidationSnapshot.test.ts`
  - Remove format-selection test.
  - Assert binary format is always used.

- Modify `packages/core/metadata/validation/sharedValidationBinaryOwners.test.ts`
  - Extend the existing test to assert table-source columns and `owner.model`.

- Modify `packages/core/metadata/validation/projectValidationWorkerPool.ts`
  - Always create one shared validation snapshot for second pass.
  - Always pass shared reference snapshot and shared owner snapshot to workers.
  - Remove `NKDK_VALIDATION_SHARED_REFERENCE_INDEX`, `NKDK_VALIDATION_SHARED_SECOND_PASS`, `ownerFormat`, and `createWorkerTableSupplement`.

- Modify `packages/core/metadata/validation/projectValidationWorker.ts`
  - Require `sharedValidationSnapshot`.
  - Require shared reference index.
  - Remove `objectTable`, `referenceSnapshot`, `supplementedValidationTable`, and old table-cache fallback.

- Modify `packages/core/metadata/validation/projectValidationWorkerPool.test.ts`
  - Delete `createWorkerTableSupplement` tests.
  - Add a worker-pool test that verifies the second-pass request has no object-table supplement by exercising full worker validation without shared flags.

- Modify `packages/core/metadata/validation/validateProject.ts`
  - Use `ValidationSnapshotProvider` in in-process full and partial validation.
  - Remove `createOwnerMetadataCacheFromValidationTable`, `createProjectReferenceSnapshot`, `createProjectReferenceIndex`, and `createReferenceIndexFromObjectTable` from this file.

- Modify `packages/core/metadata/validation/validateProject.test.ts`
  - Keep the existing partial dependency test.
  - Add a focused single-file test that proves dependency enqueue still works through the shared provider path.

- Modify docs under `docs/superpowers/specs` and `docs/superpowers/plans`
  - Mark old JSON/shared-second-pass plan files as historical where they mention JSON fallback as a current path.

---

### Task 1: Add Neutral Validation Snapshot Provider

**Files:**
- Create: `packages/core/metadata/validation/validationSnapshotProvider.ts`
- Create: `packages/core/metadata/validation/validationSnapshotProvider.test.ts`

- [ ] **Step 1: Write failing provider tests**

Create `packages/core/metadata/validation/validationSnapshotProvider.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import type { ParsedMetadataTarget } from "../commonObjects/metadataTargets"
import { createOwnerMetadataCacheFromValidationTable } from "./dataPath/ownerCache"
import { projectObjectIndexKey } from "./projectReferenceIndex"
import { createValidationObjectTable } from "./projectValidationObjectTable"
import type { ValidationObjectRecord } from "./projectValidationTypes"
import { createValidationSnapshotProvider } from "./validationSnapshotProvider"

describe("ValidationSnapshotProvider", () => {
  it("creates owner cache from the shared binary snapshot", () => {
    const table = createValidationObjectTable({
      records: [catalogRecord()],
      filePaths: ["/project/Справочник/Номенклатура/Свойства.yaml"],
    })
    const provider = createValidationSnapshotProvider(table.snapshot())
    const regular = createOwnerMetadataCacheFromValidationTable({ projectDir: "/project", table })
    const shared = provider.ownerCache("/project")

    const regularOwner = regular.get({ kind: "Справочник", name: "Номенклатура" })
    const sharedOwner = shared.get({ kind: "Справочник", name: "Номенклатура" })

    expect(provider.sharedPayload().owners.format).toBe("binary")
    expect(sharedOwner).toMatchObject({ status: regularOwner.status })
    if (sharedOwner.status !== "ok" || regularOwner.status !== "ok") throw new Error("owner expected")
    expect(sharedOwner.owner.model).toEqual(regularOwner.owner.model)
    expect([...sharedOwner.owner.fieldIndex.fields.entries()]).toEqual([...regularOwner.owner.fieldIndex.fields.entries()])
  })

  it("creates a partial reference index that can request a dependency", () => {
    const target: Extract<ParsedMetadataTarget, { kind: "object" }> = {
      kind: "object",
      root: "Catalog",
      objectName: "Товары",
    }
    const table = createValidationObjectTable({
      records: [],
      filePaths: [],
    })
    table.mergeReferenceIndexEntries({
      objectIndexEntries: [],
      memberIndexEntries: [],
      valueIndexEntries: [],
      pendingReferences: [],
    })
    const provider = createValidationSnapshotProvider(table.snapshot())
    const index = provider.referenceIndex({
      projectDir: "/project",
      mode: "partial",
      resolveObjectFilePath: () => "/project/Справочник/Товары/Свойства.yaml",
      resolveProjectFile: () => ({
        kind: "needsDependency",
        file: {
          absolutePath: "/project/Справочник/Товары/Свойства.yaml",
          projectPath: "Справочник/Товары/Свойства.yaml",
          kind: "properties",
        },
        requestedBy: "/project/Справочник/Товары/Свойства.yaml",
      }),
    })

    const result = index.resolve({
      filePath: "/project/Документ/Заказ/Свойства.yaml",
      yamlPath: ["Реквизиты", 0, "Тип"],
      canonical: projectObjectIndexKey(target),
      target,
      constraint: { kind: "object" },
    })

    expect(result).toMatchObject({ ok: false, reason: "needsDependency" })
  })
})

function catalogRecord(): ValidationObjectRecord {
  return {
    filePath: "/project/Справочник/Номенклатура/Свойства.yaml",
    projectPath: "Справочник/Номенклатура/Свойства.yaml",
    kind: "properties",
    owner: { dir: "Справочник", name: "Номенклатура" },
    ownerRef: { kind: "Справочник", name: "Номенклатура" },
    model: { itemType: "MetadataCatalog", name: "Номенклатура" },
    fieldIndex: {
      fields: new Map([
        [
          "Артикул",
          {
            name: "Артикул",
            kind: "attribute",
            sourceCollection: "attributes",
            typeInfo: { kinds: ["string"], nextTypes: [], sourceText: "String" },
          },
        ],
      ]),
      standardAttributeAliases: new Map([["Code", "Код"]]),
      diagnostics: [],
    },
    importDiagnostics: [],
  }
}
```

- [ ] **Step 2: Run the provider test and verify it fails**

Run:

```bash
pnpm --filter @nakidka/core test -- validationSnapshotProvider.test.ts
```

Expected: FAIL because `./validationSnapshotProvider` does not exist.

- [ ] **Step 3: Implement the provider**

Create `packages/core/metadata/validation/validationSnapshotProvider.ts`:

```ts
import type { ParsedMetadataTarget } from "../commonObjects/metadataTargets"
import type { OwnerMetadataCache } from "./dataPath/ownerCache"
import { createOwnerMetadataCacheFromSharedValidationSnapshot } from "./dataPath/sharedOwnerCache"
import type { ProjectReferenceIndex } from "./projectReferenceIndex"
import type { ValidationDependencyRequest, ValidationMode, ValidationObjectTableSnapshot } from "./projectValidationTypes"
import { createSharedProjectReferenceIndex } from "./sharedProjectReferenceIndex"
import { createSharedValidationSnapshot, type SharedValidationSnapshot } from "./sharedValidationSnapshot"

export type ResolveObjectFilePath = (target: Extract<ParsedMetadataTarget, { kind: "object" }>) => string | undefined

export type ResolveProjectFileDependency = (
  target: Extract<ParsedMetadataTarget, { kind: "object" }>
) => ValidationDependencyRequest | undefined

export interface ValidationSnapshotProvider {
  ownerCache(projectDir: string): OwnerMetadataCache
  referenceIndex(params: {
    projectDir: string
    mode: ValidationMode
    resolveObjectFilePath: ResolveObjectFilePath
    resolveProjectFile?: ResolveProjectFileDependency
  }): ProjectReferenceIndex
  sharedPayload(): SharedValidationSnapshot
}

export function createValidationSnapshotProvider(snapshot: ValidationObjectTableSnapshot): ValidationSnapshotProvider {
  const shared = createSharedValidationSnapshot(snapshot)

  return {
    ownerCache(projectDir) {
      return createOwnerMetadataCacheFromSharedValidationSnapshot({ projectDir, snapshot: shared })
    },
    referenceIndex(params) {
      return createSharedProjectReferenceIndex({
        projectDir: params.projectDir,
        mode: params.mode,
        snapshot: shared.reference,
        resolveObjectFilePath: params.resolveObjectFilePath,
        resolveProjectFile: params.resolveProjectFile,
      })
    },
    sharedPayload() {
      return shared
    },
  }
}
```

- [ ] **Step 4: Run the provider test and verify it passes**

Run:

```bash
pnpm --filter @nakidka/core test -- validationSnapshotProvider.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/validation/validationSnapshotProvider.ts packages/core/metadata/validation/validationSnapshotProvider.test.ts
git commit -m "feat: :sparkles: добавить provider shared snapshot validation"
```

---

### Task 2: Make SharedValidationSnapshot Binary-Only

**Files:**
- Modify: `packages/core/metadata/validation/sharedValidationSnapshot.ts`
- Modify: `packages/core/metadata/validation/dataPath/sharedOwnerCache.ts`
- Modify: `packages/core/metadata/validation/sharedValidationSnapshot.test.ts`
- Modify: `packages/core/metadata/validation/sharedValidationBinaryOwners.test.ts`

- [ ] **Step 1: Write the binary-only test change**

In `packages/core/metadata/validation/sharedValidationSnapshot.test.ts`, replace the second test with:

```ts
  it("always uses binary owner snapshot", () => {
    const table = createValidationObjectTable({
      records: [catalogRecord()],
      filePaths: ["/project/Справочник/Номенклатура/Свойства.yaml"],
    })
    const shared = createSharedValidationSnapshot(table.snapshot())

    expect(shared.owners.format).toBe("binary")
    expect(shared.owners.bytes).toBeGreaterThan(0)
  })
```

Remove all mutation of `process.env["NKDK_VALIDATION_SHARED_OWNER_FORMAT"]` from this file.

- [ ] **Step 2: Extend binary owner test coverage**

In `packages/core/metadata/validation/sharedValidationBinaryOwners.test.ts`, inside `restores owner field indexes without JSON decoding`, after the standard attribute alias assertion, add:

```ts
    const binaryTable = binaryOwner.owner.fieldIndex.fields.get("Товары")
    const regularTable = regularOwner.owner.fieldIndex.fields.get("Товары")
    expect(binaryTable).toEqual(regularTable)
    expect(binaryOwner.owner.model).toEqual(regularOwner.owner.model)
```

- [ ] **Step 3: Run changed tests and verify current code still has the old switch**

Run:

```bash
pnpm --filter @nakidka/core test -- sharedValidationSnapshot.test.ts sharedValidationBinaryOwners.test.ts
```

Expected before implementation: `sharedValidationSnapshot.test.ts` fails unless the environment variable happens to force binary, because the default path still creates JSON owners.

- [ ] **Step 4: Replace `sharedValidationSnapshot.ts` with binary-only code**

Edit `packages/core/metadata/validation/sharedValidationSnapshot.ts` so its public surface is:

```ts
import {
  createSharedProjectReferenceSnapshot,
  type SharedProjectReferenceSnapshot,
} from "./sharedProjectReferenceIndex"
import { createBinarySharedOwnersSnapshot, type BinarySharedOwnersSnapshot } from "./sharedValidationBinaryOwners"
import type { ValidationObjectTableSnapshot } from "./projectValidationTypes"

export interface SharedValidationSnapshot {
  reference: SharedProjectReferenceSnapshot
  owners: BinarySharedOwnersSnapshot
}

export function createSharedValidationSnapshot(snapshot: ValidationObjectTableSnapshot): SharedValidationSnapshot {
  if (!Array.isArray(snapshot.records)) {
    throw new Error(
      `Некорректный ValidationObjectTableSnapshot для shared validation: keys=${Object.keys(snapshot as object).join(",")} records=${typeof snapshot.records}`
    )
  }

  return {
    reference: createSharedProjectReferenceSnapshot({
      objectIndexEntries: snapshot.objectIndexEntries ?? [],
      memberIndexEntries: snapshot.memberIndexEntries ?? [],
      valueIndexEntries: snapshot.valueIndexEntries ?? [],
    }),
    owners: createBinarySharedOwnersSnapshot(snapshot),
  }
}
```

Remove these exports and helpers from the same file:

```ts
JsonSharedOwnersSnapshot
SharedValidationOwnerRecord
SharedObjectFieldIndex
SharedObjectField
SharedObjectFieldTableSource
decodeSharedValidationOwners
decodeObjectFieldIndex
createJsonSharedOwnersSnapshot
encodeOwnerRecord
encodeObjectFieldIndex
encodeObjectField
encodeTableSource
decodeObjectField
decodeTableSource
```

- [ ] **Step 5: Replace `sharedOwnerCache.ts` with a binary-only adapter**

Edit `packages/core/metadata/validation/dataPath/sharedOwnerCache.ts` to:

```ts
import type { OwnerMetadataCache } from "./ownerCache"
import { createOwnerMetadataCacheFromBinarySharedOwners } from "../sharedValidationBinaryOwners"
import type { SharedValidationSnapshot } from "../sharedValidationSnapshot"

export function createOwnerMetadataCacheFromSharedValidationSnapshot(params: {
  projectDir: string
  snapshot: SharedValidationSnapshot
}): OwnerMetadataCache {
  return createOwnerMetadataCacheFromBinarySharedOwners({
    projectDir: params.projectDir,
    snapshot: params.snapshot.owners,
  })
}
```

- [ ] **Step 6: Run changed tests and TypeScript import check**

Run:

```bash
pnpm --filter @nakidka/core test -- sharedValidationSnapshot.test.ts sharedValidationBinaryOwners.test.ts dataPath/ownerCache.test.ts
```

Expected: PASS.

- [ ] **Step 7: Search for removed JSON symbols**

Run:

```bash
rg -n "JsonSharedOwnersSnapshot|SharedValidationOwnerRecord|SharedObjectFieldIndex|SharedObjectField|SharedObjectFieldTableSource|createJsonSharedOwnersSnapshot|decodeSharedValidationOwners|decodeObjectFieldIndex|NKDK_VALIDATION_SHARED_OWNER_FORMAT" packages/core/metadata/validation
```

Expected: no matches.

- [ ] **Step 8: Commit**

```bash
git add packages/core/metadata/validation/sharedValidationSnapshot.ts packages/core/metadata/validation/dataPath/sharedOwnerCache.ts packages/core/metadata/validation/sharedValidationSnapshot.test.ts packages/core/metadata/validation/sharedValidationBinaryOwners.test.ts
git commit -m "refactor: :recycle: оставить binary shared owners единственным форматом"
```

---

### Task 3: Make Worker Second Pass Always Use Shared Snapshot

**Files:**
- Modify: `packages/core/metadata/validation/projectValidationWorkerPool.ts`
- Modify: `packages/core/metadata/validation/projectValidationWorker.ts`
- Modify: `packages/core/metadata/validation/projectValidationWorkerPool.test.ts`

- [ ] **Step 1: Remove supplement tests and add shared-only worker expectation**

In `packages/core/metadata/validation/projectValidationWorkerPool.test.ts`:

1. Remove `createWorkerTableSupplement` from the import list.
2. Delete the whole `describe("createWorkerTableSupplement", ...)` block.
3. Keep `partitionPendingReferencesForWorkers` tests.

Add this test in `describe("ProjectValidationWorkerPool", ...)`:

```ts
  it("runs second pass through shared snapshots without opt-in environment flags", async () => {
    const previousSecondPass = process.env["NKDK_VALIDATION_SHARED_SECOND_PASS"]
    const previousReference = process.env["NKDK_VALIDATION_SHARED_REFERENCE_INDEX"]
    delete process.env["NKDK_VALIDATION_SHARED_SECOND_PASS"]
    delete process.env["NKDK_VALIDATION_SHARED_REFERENCE_INDEX"]
    try {
      const pool = createProjectValidationWorkerPool({ concurrency: 1 })
      await pool.start()
      const second = await pool.runSecondPass({
        projectDir: "/project",
        context: {
          version: "2.20",
          defaultLanguage: "ru",
          exportToYAML: { toTyped: false },
        },
        mode: "full",
        objectTable: {
          records: [],
          filePaths: [],
          objectIndexEntries: [],
          memberIndexEntries: [],
          valueIndexEntries: [],
          pendingReferences: [],
        },
      })
      await pool.close()

      expect(second.diagnostics).toEqual([])
    } finally {
      if (previousSecondPass === undefined) delete process.env["NKDK_VALIDATION_SHARED_SECOND_PASS"]
      else process.env["NKDK_VALIDATION_SHARED_SECOND_PASS"] = previousSecondPass
      if (previousReference === undefined) delete process.env["NKDK_VALIDATION_SHARED_REFERENCE_INDEX"]
      else process.env["NKDK_VALIDATION_SHARED_REFERENCE_INDEX"] = previousReference
    }
  })
```

- [ ] **Step 2: Run worker-pool tests and verify old exported supplement breaks**

Run:

```bash
pnpm --filter @nakidka/core test -- projectValidationWorkerPool.test.ts
```

Expected before implementation: test file still compiles only after the import/test removal; the new test should pass or expose that workers still depend on old optional message paths.

- [ ] **Step 3: Update worker request types in `projectValidationWorkerPool.ts`**

In the `WorkerRequest` second-pass variant, replace optional old fields:

```ts
      objectTable?: ValidationObjectTableSnapshot
      referenceSnapshot?: ProjectReferenceSnapshot
      sharedReferenceSnapshot?: SharedProjectReferenceSnapshot
      sharedValidationSnapshot?: SharedValidationSnapshot
```

with:

```ts
      sharedValidationSnapshot: SharedValidationSnapshot
```

Remove these imports from `projectValidationWorkerPool.ts`:

```ts
createProjectReferenceSnapshot
type ProjectReferenceSnapshot
createSharedProjectReferenceSnapshot
type SharedProjectReferenceSnapshot
```

Keep `createValidationSnapshotProvider`.

- [ ] **Step 4: Rewrite `runSecondPass` in `projectValidationWorkerPool.ts`**

Add the provider import:

```ts
import { createValidationSnapshotProvider } from "./validationSnapshotProvider"
```

Replace the snapshot-building part of `runSecondPass` with:

```ts
      const snapshotStartedAt = performance.now()
      const provider = createValidationSnapshotProvider(secondPassParams.objectTable)
      const sharedValidationSnapshot = provider.sharedPayload()
      const snapshotMs = performance.now() - snapshotStartedAt
      const pendingReferences = secondPassParams.objectTable.pendingReferences ?? []
      const referencePartitions = partitionPendingReferencesForWorkers(pendingReferences, workers.length)
      const requestStartedAt = performance.now()
      const results = await Promise.all(
        workers.map(async (worker, index) => {
          const filePaths = assignedFilePaths.get(worker) ?? []
          if (filePaths.length === 0) return { index, diagnostics: [] }

          const response = await request(worker, {
            kind: "secondPass",
            projectDir: secondPassParams.projectDir,
            context: secondPassParams.context,
            mode: secondPassParams.mode,
            sharedValidationSnapshot,
            pendingReferences: referencePartitions[index] ?? [],
            filePaths,
          })
          if (response.kind !== "secondPassResult") throw new Error("Worker вернул неожиданный результат secondPass")
          return { index, ...response }
        })
      )
      logSecondPassPoolProfile({
        snapshotMs,
        workerWallMs: performance.now() - requestStartedAt,
        sharedSnapshotBytes: sharedValidationSnapshot.reference.stats.snapshotBytes,
        sharedOwnerBytes: sharedValidationSnapshot.owners.bytes,
      })
```

Remove `localObjectRecordPaths` and every assignment to it.

- [ ] **Step 5: Remove owner format from profile**

Change `logSecondPassPoolProfile` params from:

```ts
  ownerFormat?: string
```

to no `ownerFormat` field, and remove this output fragment:

```ts
...(params.ownerFormat === undefined ? [] : [`ownerFormat=${params.ownerFormat}`]),
```

- [ ] **Step 6: Remove worker supplement helper and tests**

Delete `createWorkerTableSupplement` from `projectValidationWorkerPool.ts`.

Run:

```bash
rg -n "createWorkerTableSupplement|NKDK_VALIDATION_SHARED_SECOND_PASS|NKDK_VALIDATION_SHARED_REFERENCE_INDEX|ownerFormat" packages/core/metadata/validation/projectValidationWorkerPool.ts packages/core/metadata/validation/projectValidationWorkerPool.test.ts
```

Expected: no matches.

- [ ] **Step 7: Update worker second-pass message shape**

In `packages/core/metadata/validation/projectValidationWorker.ts`, replace optional old fields:

```ts
      objectTable?: ValidationObjectTableSnapshot
      referenceSnapshot?: ProjectReferenceSnapshot
      sharedReferenceSnapshot?: SharedProjectReferenceSnapshot
      sharedValidationSnapshot?: SharedValidationSnapshot
```

with:

```ts
      sharedValidationSnapshot: SharedValidationSnapshot
```

Remove these imports:

```ts
createOwnerMetadataCacheFromValidationTable
type ProjectReferenceSnapshot
createProjectReferenceIndex
type SharedProjectReferenceSnapshot
createValidationObjectTable
type ValidationObjectTableSnapshot
```

Keep these imports, because the worker builds views over the shared payload it receives:

```ts
import { createOwnerMetadataCacheFromSharedValidationSnapshot } from "./dataPath/sharedOwnerCache"
import { createSharedProjectReferenceIndex } from "./sharedProjectReferenceIndex"
```

- [ ] **Step 8: Rewrite worker `runSecondPass` setup**

In `runSecondPass`, replace owner-cache and reference-index construction with:

```ts
  const ownerCache = createOwnerMetadataCacheFromSharedValidationSnapshot({
    projectDir: message.projectDir,
    snapshot: message.sharedValidationSnapshot,
  })
  const referenceIndex = createSharedProjectReferenceIndex({
    projectDir: message.projectDir,
    mode: message.mode,
    snapshot: message.sharedValidationSnapshot.reference,
    resolveObjectFilePath: (target) => resolveObjectFilePath({ projectDir: message.projectDir, target }),
  })
```

- [ ] **Step 9: Remove old worker fallback helpers**

Delete these functions from `projectValidationWorker.ts`:

```ts
supplementedValidationTable
requiredReferenceSnapshot
```

Remove `supplementRecords` and `supplementFilePaths` from the worker timing interface, returned timing object, and pool timing log.

- [ ] **Step 10: Run worker tests**

Run:

```bash
pnpm --filter @nakidka/core test -- projectValidationWorkerPool.test.ts validateProject.test.ts
```

Expected: PASS.

- [ ] **Step 11: Commit**

```bash
git add packages/core/metadata/validation/projectValidationWorkerPool.ts packages/core/metadata/validation/projectValidationWorker.ts packages/core/metadata/validation/projectValidationWorkerPool.test.ts
git commit -m "refactor: :recycle: сделать worker validation shared-only"
```

---

### Task 4: Use The Same Provider In In-Process Validation

**Files:**
- Modify: `packages/core/metadata/validation/validateProject.ts`
- Modify: `packages/core/metadata/validation/validateProject.test.ts`

- [ ] **Step 1: Add a focused single-file dependency test**

In `packages/core/metadata/validation/validateProject.test.ts`, add this test near the existing partial dependency test:

```ts
  it("keeps dependency enqueue for single-file validation through the shared snapshot provider", async () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-validation-shared-partial-"))
    writeProjectFile(projectDir, "Документ/Заказ/Свойства.yaml", [
      "Имя: Заказ",
      "Синоним: Заказ",
      "Реквизиты:",
      "  - Имя: Товар",
      "    Тип:",
      "      - СправочникСсылка.Товары",
    ])
    writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", [
      "Имя: Товары",
      "Синоним: Товары",
    ])

    const result = await validateProject({
      projectDir,
      filePath: join(projectDir, "Документ", "Заказ", "Свойства.yaml"),
    })

    expect(result.diagnostics.filter((diagnostic) => diagnostic.source === "reference")).toEqual([])
  })
```

- [ ] **Step 2: Run the focused test before implementation**

Run:

```bash
pnpm --filter @nakidka/core test -- validateProject.test.ts -t "shared snapshot provider"
```

Expected: PASS on current behavior, because this is a regression guard before changing the in-process path.

- [ ] **Step 3: Replace direct table/reference caches with provider**

In `packages/core/metadata/validation/validateProject.ts`, remove imports:

```ts
import { createOwnerMetadataCacheFromValidationTable } from "./dataPath/ownerCache"
import {
  createProjectReferenceIndex,
  createProjectReferenceSnapshot,
  validatePendingReferencesWithIndex,
} from "./projectReferenceIndex"
```

Replace with:

```ts
import { validatePendingReferencesWithIndex } from "./projectReferenceIndex"
import { createValidationSnapshotProvider } from "./validationSnapshotProvider"
```

Keep `validatePendingReferencesWithIndex`, because validation still runs through the `ProjectReferenceIndex` interface.

- [ ] **Step 4: Update in-process full reference validation**

Replace the `if (skipMetadataTargetValidation)` block with:

```ts
  if (skipMetadataTargetValidation) {
    const objectTableSnapshot = objectTable.snapshot()
    const provider = createValidationSnapshotProvider(objectTableSnapshot)
    const referenceIndex = provider.referenceIndex({
      projectDir,
      mode: queue.mode,
      resolveObjectFilePath: (target) => resolveObjectFilePath({ projectDir, target }),
      resolveProjectFile: (target) => resolveProjectFileDependency({ projectDir, target }),
    })
    const pendingReferences = objectTableSnapshot.pendingReferences ?? []
    const referenceResult = validatePendingReferencesWithIndex({
      index: referenceIndex,
      references: pendingReferences,
    })
    logInProcessReferenceProfile({
      snapshotBytes: provider.sharedPayload().reference.stats.snapshotBytes,
      pendingReferences: pendingReferences.length,
      memberIndexEntries: provider.sharedPayload().reference.stats.memberEntries,
      result: referenceResult,
    })
    diagnostics.push(...referenceResult.diagnostics)
  }
```

- [ ] **Step 5: Update per-file second pass in the loop**

Inside the `for (const stateKey of [...secondPassPending])` loop, replace:

```ts
      const ownerCache = createOwnerMetadataCacheFromValidationTable({ projectDir, table: objectTable })
      const referenceIndex = createReferenceIndexFromObjectTable({
        projectDir,
        mode: queue.mode,
        objectTable: objectTable.snapshot(),
      })
```

with:

```ts
      const objectTableSnapshot = objectTable.snapshot()
      const provider = createValidationSnapshotProvider(objectTableSnapshot)
      const ownerCache = provider.ownerCache(projectDir)
      const referenceIndex = provider.referenceIndex({
        projectDir,
        mode: queue.mode,
        resolveObjectFilePath: (target) => resolveObjectFilePath({ projectDir, target }),
        resolveProjectFile: (target) => resolveProjectFileDependency({ projectDir, target }),
      })
```

- [ ] **Step 6: Update in-process reference profile helper**

Replace `logInProcessReferenceProfile` signature with:

```ts
function logInProcessReferenceProfile(params: {
  snapshotBytes: number
  pendingReferences: number
  memberIndexEntries: number
  result: ReturnType<typeof validatePendingReferencesWithIndex>
}): void {
  if (process.env["NKDK_VALIDATION_PROFILE"] !== "1") return
  const references = params.result.stats

  console.error(
    [
      "[validation-profile] references second-pass",
      `hits=${references.hits}`,
      `misses=${references.misses}`,
      `conflicts=${references.conflicts}`,
      `filters=${references.filterFailures}`,
      `dependencies=${references.dependencies}`,
      `unsupported=${references.unsupported}`,
      `fallbacks=${references.fallbacks}`,
      `snapshotBytes=${params.snapshotBytes}`,
      `pending=${params.pendingReferences}`,
      `entries=${params.memberIndexEntries}`,
    ].join(" ")
  )
}
```

- [ ] **Step 7: Delete obsolete helper**

Delete `createReferenceIndexFromObjectTable` from `validateProject.ts`.

- [ ] **Step 8: Run in-process validation tests**

Run:

```bash
pnpm --filter @nakidka/core test -- validateProject.test.ts validationSnapshotProvider.test.ts sharedProjectReferenceIndex.test.ts
```

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add packages/core/metadata/validation/validateProject.ts packages/core/metadata/validation/validateProject.test.ts
git commit -m "refactor: :recycle: использовать shared snapshot в partial validation"
```

---

### Task 5: Remove Old Switches And Historical Documentation Drift

**Files:**
- Modify: `docs/superpowers/specs/2026-07-02-validation-shared-second-pass-design.md`
- Modify: `docs/superpowers/specs/2026-07-02-validation-binary-shared-snapshot-design.md`
- Modify: `docs/superpowers/plans/2026-07-02-validation-shared-second-pass.md`
- Modify: `docs/superpowers/plans/2026-07-02-validation-binary-shared-snapshot.md`

- [ ] **Step 1: Search old switches and JSON path**

Run:

```bash
rg -n "NKDK_VALIDATION_SHARED_OWNER_FORMAT|NKDK_VALIDATION_SHARED_SECOND_PASS|NKDK_VALIDATION_SHARED_REFERENCE_INDEX|ownerFormat=json|ownerFormat=binary|JSON shared owners|JSON owner|createJsonSharedOwnersSnapshot|decodeSharedValidationOwners|createWorkerTableSupplement" packages/core docs/superpowers
```

Expected before docs cleanup: matches remain in historical plan/spec files only.

- [ ] **Step 2: Add historical notices to old spec files**

At the top of `docs/superpowers/specs/2026-07-02-validation-shared-second-pass-design.md`, after the title, add:

```md
> Historical note: this design described an opt-in shared second pass while the branch was testing hypotheses. The current target design is `2026-07-02-validation-unified-shared-snapshot-design.md`: binary shared snapshot is the only supported owner/reference transfer mechanism.
```

At the top of `docs/superpowers/specs/2026-07-02-validation-binary-shared-snapshot-design.md`, after the title, add:

```md
> Historical note: this design compared JSON and binary owner snapshots. The current target design is `2026-07-02-validation-unified-shared-snapshot-design.md`: JSON owner snapshot and format-selection flags are removed.
```

- [ ] **Step 3: Add historical notices to old plan files**

At the top of `docs/superpowers/plans/2026-07-02-validation-shared-second-pass.md`, after the title, add:

```md
> Historical note: this plan kept a legacy fallback while shared second pass was experimental. The active implementation plan is `2026-07-02-validation-unified-shared-snapshot.md`.
```

At the top of `docs/superpowers/plans/2026-07-02-validation-binary-shared-snapshot.md`, after the title, add:

```md
> Historical note: this plan introduced binary as a selectable format for comparison. The active implementation plan is `2026-07-02-validation-unified-shared-snapshot.md`, where binary is the only owner snapshot format.
```

- [ ] **Step 4: Verify no current code references old paths**

Run:

```bash
rg -n "NKDK_VALIDATION_SHARED_OWNER_FORMAT|NKDK_VALIDATION_SHARED_SECOND_PASS|NKDK_VALIDATION_SHARED_REFERENCE_INDEX|createJsonSharedOwnersSnapshot|decodeSharedValidationOwners|createWorkerTableSupplement|ownerFormat" packages/core/metadata/validation
```

Expected: no matches.

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/specs/2026-07-02-validation-shared-second-pass-design.md docs/superpowers/specs/2026-07-02-validation-binary-shared-snapshot-design.md docs/superpowers/plans/2026-07-02-validation-shared-second-pass.md docs/superpowers/plans/2026-07-02-validation-binary-shared-snapshot.md
git commit -m "docs: :memo: пометить старые shared validation планы историческими"
```

---

### Task 6: Full Verification And Performance Check

**Files:**
- No code files unless verification exposes a bug.

- [ ] **Step 1: Run focused validation test set**

Run:

```bash
pnpm --filter @nakidka/core test -- validationSnapshotProvider.test.ts sharedValidationSnapshot.test.ts sharedValidationBinaryOwners.test.ts sharedProjectReferenceIndex.test.ts projectValidationWorkerPool.test.ts validateProject.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run full project tests**

Run from `/Users/nikita/git/nkdk/.worktrees/benchmark-yaml-parsers`:

```bash
pnpm test
```

Expected: all package tests pass.

- [ ] **Step 3: Run full YAML validation with profile**

Run:

```bash
/usr/bin/time -p env NKDK_VALIDATION_TIMING=1 NKDK_VALIDATION_PROFILE=1 pnpm --filter @nakidka/cli dev validate /Users/nikita/git/nkdk-yaml
```

Expected:

```text
summary: 0 error, 0 warning
```

Profile expectations:

```text
[validation-profile] second pass orchestration snapshot=...ms workerWall=...ms sharedSnapshotBytes=... sharedOwnerBytes=...
[validation-profile] references second-pass hits=... misses=0 conflicts=0 filters=0 dependencies=0 unsupported=0 fallbacks=0 ...
```

The output must not contain:

```text
ownerFormat=
supplementRecords=
supplementFilePaths=
```

- [ ] **Step 4: Verify repository-wide removal**

Run:

```bash
rg -n "NKDK_VALIDATION_SHARED_OWNER_FORMAT|NKDK_VALIDATION_SHARED_SECOND_PASS|NKDK_VALIDATION_SHARED_REFERENCE_INDEX|JsonSharedOwnersSnapshot|SharedValidationOwnerRecord|SharedObjectFieldIndex|createJsonSharedOwnersSnapshot|decodeSharedValidationOwners|decodeObjectFieldIndex|createWorkerTableSupplement|ownerFormat" packages/core/metadata/validation
```

Expected: no matches.

- [ ] **Step 5: Commit verification fixes if needed**

If verification required code or test fixes, inspect the changed files first:

```bash
git status --short
```

Then stage only files changed by the verification fix. For example, if the fix touched `validateProject.ts` and `validateProject.test.ts`, run:

```bash
git add packages/core/metadata/validation/validateProject.ts packages/core/metadata/validation/validateProject.test.ts
git commit -m "fix: :bug: стабилизировать unified shared validation"
```

If no files changed, do not create an empty commit.

---

## Self-Review

- Spec coverage:
  - Binary owner snapshot is the only owner format: Task 2.
  - JSON owner snapshot and format flag removed: Task 2 and Task 5.
  - Worker second pass has no legacy object-table supplement: Task 3.
  - Full validation uses shared owner/reference snapshots without opt-in flags: Task 3.
  - Partial and single-file validation use the same provider/cache/index path: Task 4.
  - Shared reference index keeps dependency enqueue behavior: Task 1 and Task 4.
  - Old docs are marked historical: Task 5.
  - Full `/Users/nikita/git/nkdk-yaml` and `pnpm test` verification: Task 6.

- Placeholder scan:
  - No `TBD`, `TODO`, or unspecified tests remain in this plan.
  - Commands and expected results are explicit.

- Type consistency:
  - `ValidationSnapshotProvider`, `ResolveObjectFilePath`, and `ResolveProjectFileDependency` are defined in Task 1 and reused by later tasks.
  - `SharedValidationSnapshot.owners` is binary-only after Task 2.
  - Worker second-pass request requires `sharedValidationSnapshot` after Task 3.
