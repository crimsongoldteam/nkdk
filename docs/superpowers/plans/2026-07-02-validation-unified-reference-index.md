# Validation Unified Reference Index Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace resolver-based metadata target validation with one `ProjectReferenceIndex` for object, member and value references in full and partial validation.

**Architecture:** First pass imports YAML, validates schema, builds object/member/value index entries and collects pending references. Second pass resolves every pending reference through `ProjectReferenceIndex` only; partial validation uses the same index to return `needsDependency` when a referenced YAML file exists but was not loaded yet. Runtime validation no longer depends on `ProjectMetadataResolver` or resolver fallback.

**Tech Stack:** TypeScript, Vitest, `@nakidka/core`, existing validation worker pool, YAML validation cache, metadata target registrations.

---

## Spec

Source spec: `docs/superpowers/specs/2026-07-02-validation-unified-reference-index-design.md`.

## File Structure

- Create: `packages/core/metadata/validation/projectReferenceIndex.ts`
  - Owns public index types, snapshot creation, key builders, `createProjectReferenceIndex()` and `resolve()`.
  - Keeps common validation layer neutral: no checks for concrete metadata folders like `Формы`/`Макеты`, no hardcoded applied object rules.
- Modify: `packages/core/metadata/validation/projectMetadataReferences.ts`
  - Keep only pending-reference collection-facing types or turn it into a re-export shim while call sites move to `projectReferenceIndex.ts`.
  - Remove `validatePendingReferences()` resolver fallback.
- Modify: `packages/core/metadata/validation/projectMetadataResolverRegistry.ts`
  - Rename runtime registry concepts to index/validation contributors.
  - Keep `registerProjectFileValidator()`.
  - Keep object/member/value/named-resource contributors as neutral registrations; remove resolver-specific names after migration.
- Modify: `packages/core/metadata/validation/projectValidationPasses.ts`
  - First pass emits object/member/value index entries.
  - Second pass accepts `ProjectReferenceIndex` instead of `ProjectMetadataResolver`.
  - Remove `createDependencyRecordingResolver()`.
- Modify: `packages/core/metadata/validation/validateProject.ts`
  - Build `ProjectReferenceIndex` from object table snapshot for full and partial validation.
  - Use index-only pending reference validation.
- Modify: `packages/core/metadata/validation/projectValidationWorker.ts`
  - Worker second pass receives `ProjectReferenceSnapshot` and validates assigned pending references through index only.
- Modify: `packages/core/metadata/validation/projectValidationWorkerPool.ts`
  - Build snapshot once from merged first pass results, partition pending references, collect index stats.
- Modify: `packages/core/metadata/validation/projectValidationTypes.ts`
  - Replace `memberIndexEntries` with `referenceIndexEntries` or add object/value arrays first, then collapse naming.
- Modify: `packages/core/metadata/orchestration/property/fn.ts`
  - Remove `ProjectMetadataResolver` from `ValidateMetadataTargetFunction` only after runtime validation no longer uses it.
  - Keep collection handlers as the validation path.
- Modify: `packages/core/metadata/commonObjects/metadataTargets/validationHandlers.ts`
  - Stop relying on resolver validation for runtime validation; ensure collector covers object/member/value/common picture/style references.
- Modify: registration files under:
  - `packages/core/metadata/commonObjects/metadataTargetProjectResolvers/register.ts`
  - `packages/core/metadata/appliedObjects/*/register.ts`
  - Responsibility: register index contributors, not resolver implementations.
- Test: `packages/core/metadata/validation/projectReferenceIndex.test.ts`
  - Contract tests migrated from `projectMetadataResolver.test.ts`.
- Modify/Test: `packages/core/metadata/validation/projectMetadataReferences.test.ts`
  - Keep pending-reference and snapshot tests that still belong there; move resolution tests to `projectReferenceIndex.test.ts`.
- Modify/Test: `packages/core/metadata/validation/projectValidationPasses.test.ts`
  - Assert first pass builds object/member/value entries and second pass uses index.
- Modify/Test: `packages/core/metadata/validation/projectValidationWorkerPool.test.ts`
  - Assert no fallback metrics and worker partitioning still works.
- Modify/Test: `packages/core/metadata/importBoundaries.test.ts`
  - Update boundary test names/imports from resolver registry to index registry.
- Delete after migration:
  - `packages/core/metadata/validation/projectMetadataResolver.ts`
  - `packages/core/metadata/validation/projectMetadataResolver.test.ts`
  - Resolver-only exports from `packages/core/metadata/validation/projectMetadataResolverRegistry.ts`.

## Invariants

- `rg "createProjectMetadataResolver|ProjectMetadataResolver|projectMetadataResolverRegistry" packages/core/metadata packages/cli packages/mcp` must have no runtime usage after the deletion task.
- Full validation must report `fallback=0` or stop reporting fallback entirely.
- Full validation must not report `unsupported > 0`; unsupported references are a bug in the new collector/index contract.
- Diagnostics keep current meaning and location.
- No XML fixtures are changed.

### Task 1: Add ProjectReferenceIndex Contract Tests

**Files:**
- Create: `packages/core/metadata/validation/projectReferenceIndex.test.ts`
- Modify: `packages/core/metadata/validation/projectMetadataReferences.test.ts`

- [x] **Step 1: Create failing object/member/value contract tests**

Add this test file:

```ts
import { join } from "path"
import { describe, expect, it } from "vitest"
import { parseMetadataTargetFromYAML } from "../commonObjects/metadataTargets"
import type { ParsedMetadataTarget } from "../commonObjects/metadataTargets/types"
import {
  createProjectReferenceIndex,
  createProjectReferenceSnapshot,
  projectMemberIndexKey,
  projectObjectIndexKey,
  projectValueIndexKey,
  type ProjectObjectIndexEntry,
  type ProjectMemberIndexEntry,
  type ProjectValueIndexEntry,
} from "./projectReferenceIndex"

describe("ProjectReferenceIndex", () => {
  it("resolves object entries without resolver fallback", () => {
    const projectDir = "/tmp/nkdk-project"
    const target = objectTarget("Справочник.Номенклатура")
    const filePath = join(projectDir, "Справочник", "Номенклатура", "Свойства.yaml")
    const objectEntries: ProjectObjectIndexEntry[] = [
      { canonical: projectObjectIndexKey(target), target, result: { ok: true, filePath } },
    ]
    const index = createProjectReferenceIndex({
      projectDir,
      mode: "full",
      snapshot: createProjectReferenceSnapshot({
        objectIndexEntries: objectEntries,
        memberIndexEntries: [],
        valueIndexEntries: [],
        pendingReferences: [],
      }),
    })

    expect(index.resolve({ filePath, yamlPath: ["Поле"], canonical: "Справочник.Номенклатура", target, constraint: { kind: "object" } })).toEqual({ ok: true })
    expect(index.stats()).toMatchObject({ hits: 1, misses: 0, unsupported: 0, fallbacks: 0 })
  })

  it("resolves member entries and exposes field details for filters", () => {
    const projectDir = "/tmp/nkdk-project"
    const target = memberTarget("Справочник.Номенклатура.Реквизит.Артикул")
    const filePath = join(projectDir, "Справочник", "Номенклатура", "Свойства.yaml")
    const details = { kind: "attribute", name: "Артикул", typeInfo: { kinds: ["string"] } }
    const memberEntries: ProjectMemberIndexEntry[] = [
      { canonical: projectMemberIndexKey(target), target, result: { ok: true, filePath, details } },
    ]
    const index = createProjectReferenceIndex({
      projectDir,
      mode: "full",
      snapshot: createProjectReferenceSnapshot({
        objectIndexEntries: [],
        memberIndexEntries: memberEntries,
        valueIndexEntries: [],
        pendingReferences: [],
      }),
    })

    expect(index.resolve({
      filePath,
      yamlPath: ["Поле"],
      canonical: "Справочник.Номенклатура.Реквизит.Артикул",
      target,
      constraint: { kind: "member", filters: { hasType: ["string"] } },
    })).toEqual({ ok: true })
    expect(index.stats()).toMatchObject({ hits: 1, misses: 0, unsupported: 0, fallbacks: 0 })
  })

  it("resolves value entries", () => {
    const projectDir = "/tmp/nkdk-project"
    const target = valueTarget("Перечисление.ВидыЦен.Значение.Розничная")
    const filePath = join(projectDir, "Перечисление", "ВидыЦен", "Свойства.yaml")
    const valueEntries: ProjectValueIndexEntry[] = [
      { canonical: projectValueIndexKey(target), target, result: { ok: true, filePath } },
    ]
    const index = createProjectReferenceIndex({
      projectDir,
      mode: "full",
      snapshot: createProjectReferenceSnapshot({
        objectIndexEntries: [],
        memberIndexEntries: [],
        valueIndexEntries: valueEntries,
        pendingReferences: [],
      }),
    })

    expect(index.resolve({ filePath, yamlPath: ["Поле"], canonical: "Перечисление.ВидыЦен.Значение.Розничная", target, constraint: { kind: "object" } })).toEqual({ ok: true })
    expect(index.stats()).toMatchObject({ hits: 1, misses: 0, unsupported: 0, fallbacks: 0 })
  })
})

function objectTarget(value: string): Extract<ParsedMetadataTarget, { kind: "object" }> {
  const parsed = parseMetadataTargetFromYAML(value, { kind: "object" })
  if (!parsed.ok || parsed.target.kind !== "object") throw new Error(value)
  return parsed.target
}

function memberTarget(value: string): Extract<ParsedMetadataTarget, { kind: "member" }> {
  const parsed = parseMetadataTargetFromYAML(value, { kind: "member" })
  if (!parsed.ok || parsed.target.kind !== "member") throw new Error(value)
  return parsed.target
}

function valueTarget(value: string): Extract<ParsedMetadataTarget, { kind: "value" }> {
  const parsed = parseMetadataTargetFromYAML(value, { kind: "value" })
  if (!parsed.ok || parsed.target.kind !== "value") throw new Error(value)
  return parsed.target
}
```

- [x] **Step 2: Run test and verify it fails**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/validation/projectReferenceIndex.test.ts
```

Expected: FAIL because `projectReferenceIndex.ts`, `createProjectReferenceIndex`, `projectObjectIndexKey` and `projectValueIndexKey` do not exist yet.

- [x] **Step 3: Commit failing contract tests**

```bash
git add packages/core/metadata/validation/projectReferenceIndex.test.ts
git commit -m "test: :white_check_mark: описать contract project reference index"
```

### Task 2: Introduce ProjectReferenceIndex Core

**Files:**
- Create: `packages/core/metadata/validation/projectReferenceIndex.ts`
- Modify: `packages/core/metadata/validation/projectMetadataReferences.ts`
- Modify: `packages/core/metadata/validation/projectMetadataReferences.test.ts`

- [x] **Step 1: Add index types and key builders**

Create `packages/core/metadata/validation/projectReferenceIndex.ts` with these public contracts:

```ts
import type { MetadataTargetConstraint, ParsedMetadataTarget } from "../commonObjects/metadataTargets"
import type { ValidationDependencyRequest } from "./projectValidationTypes"
import type { Diagnostic } from "./types"
import type { YamlPath } from "./yamlLocations"

export type MetadataReferenceResolveResult =
  | { ok: true; filePath?: string; details?: unknown }
  | { ok: false; diagnostics: Diagnostic[]; dependency?: ValidationDependencyRequest }

export interface ProjectObjectIndexEntry {
  canonical: string
  target: Extract<ParsedMetadataTarget, { kind: "object" }>
  result: MetadataReferenceResolveResult
}

export interface ProjectMemberIndexEntry {
  canonical: string
  target: Extract<ParsedMetadataTarget, { kind: "member" }>
  result: MetadataReferenceResolveResult
}

export interface ProjectValueIndexEntry {
  canonical: string
  target: Extract<ParsedMetadataTarget, { kind: "value" }>
  result: MetadataReferenceResolveResult
}

export interface PendingMetadataTargetReference {
  filePath: string
  yamlPath: YamlPath
  canonical: string
  target: ParsedMetadataTarget
  constraint: MetadataTargetConstraint
}

export interface ProjectReferenceSnapshot {
  objectIndex: Array<ProjectObjectIndexEntry | ProjectReferenceIndexConflict>
  objectIndexByKey: Record<string, ProjectObjectIndexEntry | ProjectReferenceIndexConflict>
  memberIndex: Array<ProjectMemberIndexEntry | ProjectReferenceIndexConflict>
  memberIndexByKey: Record<string, ProjectMemberIndexEntry | ProjectReferenceIndexConflict>
  valueIndex: Array<ProjectValueIndexEntry | ProjectReferenceIndexConflict>
  valueIndexByKey: Record<string, ProjectValueIndexEntry | ProjectReferenceIndexConflict>
  pendingReferences: PendingMetadataTargetReference[]
  stats: ProjectReferenceSnapshotStats
}

export interface ProjectReferenceSnapshotStats {
  objectEntries: number
  memberEntries: number
  valueEntries: number
  pendingReferences: number
  conflicts: number
  snapshotBytes: number
}

export interface ProjectReferenceIndexConflict {
  canonical: string
  conflict: true
}
```

Also add:

```ts
export function projectObjectIndexKey(target: Extract<ParsedMetadataTarget, { kind: "object" }>): string {
  return [
    target.root,
    target.objectName,
    ...(target.objectSegments ?? []).flatMap((segment) => [segment.kind, segment.objectName]),
  ].join(".")
}

export function projectMemberIndexKey(target: Extract<ParsedMetadataTarget, { kind: "member" }>): string {
  return [
    target.root,
    target.objectName,
    ...(target.objectSegments ?? []).flatMap((segment) => [segment.kind, segment.objectName]),
    ...target.segments.flatMap((segment) => [segment.kind, segment.name]),
  ].join(".")
}

export function projectValueIndexKey(target: Extract<ParsedMetadataTarget, { kind: "value" }>): string {
  return [
    target.root,
    target.objectName,
    ...(target.objectSegments ?? []).flatMap((segment) => [segment.kind, segment.objectName]),
    target.valueKind,
    target.valueName,
  ].join(".")
}
```

- [x] **Step 2: Add snapshot builder**

In the same file, add:

```ts
export function createProjectReferenceSnapshot(params: {
  objectIndexEntries: readonly ProjectObjectIndexEntry[]
  memberIndexEntries: readonly ProjectMemberIndexEntry[]
  valueIndexEntries: readonly ProjectValueIndexEntry[]
  pendingReferences: readonly PendingMetadataTargetReference[]
}): ProjectReferenceSnapshot {
  const objectIndex = uniqueEntries(params.objectIndexEntries)
  const memberIndex = uniqueEntries(params.memberIndexEntries)
  const valueIndex = uniqueEntries(params.valueIndexEntries)
  const snapshotWithoutBytes = {
    objectIndex: objectIndex.entries,
    objectIndexByKey: objectIndex.byKey,
    memberIndex: memberIndex.entries,
    memberIndexByKey: memberIndex.byKey,
    valueIndex: valueIndex.entries,
    valueIndexByKey: valueIndex.byKey,
    pendingReferences: [...params.pendingReferences],
    stats: {
      objectEntries: objectIndex.entries.length,
      memberEntries: memberIndex.entries.length,
      valueEntries: valueIndex.entries.length,
      pendingReferences: params.pendingReferences.length,
      conflicts: objectIndex.conflicts + memberIndex.conflicts + valueIndex.conflicts,
      snapshotBytes: 0,
    },
  }

  return {
    ...snapshotWithoutBytes,
    stats: {
      ...snapshotWithoutBytes.stats,
      snapshotBytes: estimateProjectReferenceSnapshotBytes(snapshotWithoutBytes),
    },
  }
}

export function estimateProjectReferenceSnapshotBytes(
  snapshot: Omit<ProjectReferenceSnapshot, "stats"> | ProjectReferenceSnapshot
): number {
  return Buffer.byteLength(JSON.stringify(snapshot), "utf8")
}

function uniqueEntries<Entry extends { canonical: string }>(
  entries: readonly Entry[]
): {
  entries: Array<Entry | ProjectReferenceIndexConflict>
  byKey: Record<string, Entry | ProjectReferenceIndexConflict>
  conflicts: number
} {
  const byKeyMap = new Map<string, Entry | ProjectReferenceIndexConflict>()
  for (const entry of entries) {
    const existing = byKeyMap.get(entry.canonical)
    if (existing === undefined) {
      byKeyMap.set(entry.canonical, entry)
      continue
    }
    byKeyMap.set(entry.canonical, { canonical: entry.canonical, conflict: true })
  }

  const materialized = [...byKeyMap.values()]
  return {
    entries: materialized,
    byKey: Object.fromEntries(byKeyMap),
    conflicts: materialized.filter(isConflict).length,
  }
}
```

- [x] **Step 3: Add `createProjectReferenceIndex()`**

Add:

```ts
export interface ProjectReferenceIndex {
  resolve(reference: PendingMetadataTargetReference): ProjectReferenceIndexResult
  stats(): ProjectReferenceIndexStats
}

export type ProjectReferenceIndexResult =
  | { ok: true }
  | { ok: false; reason: "notFound"; diagnostics: Diagnostic[] }
  | { ok: false; reason: "conflict"; diagnostics: Diagnostic[] }
  | { ok: false; reason: "filter"; diagnostics: Diagnostic[] }
  | { ok: false; reason: "needsDependency"; dependency: ValidationDependencyRequest; diagnostics: Diagnostic[] }
  | { ok: false; reason: "unsupported"; diagnostics: Diagnostic[] }

export interface ProjectReferenceIndexStats {
  hits: number
  misses: number
  conflicts: number
  filterFailures: number
  dependencies: number
  unsupported: number
  fallbacks: 0
}

export function createProjectReferenceIndex(params: {
  projectDir: string
  mode: "full" | "partial"
  snapshot: ProjectReferenceSnapshot
}): ProjectReferenceIndex {
  const stats: ProjectReferenceIndexStats = {
    hits: 0,
    misses: 0,
    conflicts: 0,
    filterFailures: 0,
    dependencies: 0,
    unsupported: 0,
    fallbacks: 0,
  }

  return {
    resolve(reference) {
      const result = resolveReference(params.snapshot, reference)
      if (result.ok) stats.hits += 1
      else if (result.reason === "notFound") stats.misses += 1
      else if (result.reason === "conflict") stats.conflicts += 1
      else if (result.reason === "filter") stats.filterFailures += 1
      else if (result.reason === "needsDependency") stats.dependencies += 1
      else stats.unsupported += 1
      return result
    },
    stats() {
      return { ...stats }
    },
  }
}
```

- [x] **Step 4: Add minimal resolver logic**

Add `resolveReference()` and conflict helper:

```ts
function resolveReference(snapshot: ProjectReferenceSnapshot, reference: PendingMetadataTargetReference): ProjectReferenceIndexResult {
  const entry = lookupEntry(snapshot, reference.target)
  if (entry === undefined) {
    return { ok: false, reason: "notFound", diagnostics: [referenceDiagnostic(reference, `Не найдена ссылка "${reference.canonical}"`)] }
  }
  if (isConflict(entry)) {
    return { ok: false, reason: "conflict", diagnostics: [referenceDiagnostic(reference, `Неоднозначная ссылка "${reference.canonical}"`)] }
  }
  if (!entry.result.ok) {
    if (entry.result.dependency !== undefined) {
      return { ok: false, reason: "needsDependency", dependency: entry.result.dependency, diagnostics: entry.result.diagnostics }
    }
    return { ok: false, reason: "notFound", diagnostics: entry.result.diagnostics }
  }
  return { ok: true }
}

function lookupEntry(snapshot: ProjectReferenceSnapshot, target: ParsedMetadataTarget) {
  if (target.kind === "object") return snapshot.objectIndexByKey[projectObjectIndexKey(target)]
  if (target.kind === "member") return snapshot.memberIndexByKey[projectMemberIndexKey(target)]
  if (target.kind === "value") return snapshot.valueIndexByKey[projectValueIndexKey(target)]
  return undefined
}

function referenceDiagnostic(reference: PendingMetadataTargetReference, message: string): Diagnostic {
  return {
    filePath: reference.filePath,
    line: 1,
    col: 1,
    severity: "error",
    source: "reference",
    message,
  }
}

function isConflict(entry: unknown): entry is ProjectReferenceIndexConflict {
  return typeof entry === "object" && entry !== null && "conflict" in entry
}
```

- [x] **Step 5: Move exports from `projectMetadataReferences.ts`**

Change `projectMetadataReferences.ts` to re-export from the new module for one commit:

```ts
export {
  createProjectReferenceIndex,
  createProjectReferenceSnapshot,
  estimateProjectReferenceSnapshotBytes,
  projectMemberIndexKey,
  projectObjectIndexKey,
  projectValueIndexKey,
  type PendingMetadataTargetReference,
  type ProjectMemberIndexEntry,
  type ProjectObjectIndexEntry,
  type ProjectReferenceIndex,
  type ProjectReferenceIndexResult,
  type ProjectReferenceSnapshot,
  type ProjectValueIndexEntry,
} from "./projectReferenceIndex"
```

- [x] **Step 6: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/validation/projectReferenceIndex.test.ts packages/core/metadata/validation/projectMetadataReferences.test.ts
```

Expected: new tests pass; existing `projectMetadataReferences.test.ts` may fail where it expects `"miss"` because result reason is now `"notFound"`. Update those expectations to the new public reason.

- [x] **Step 7: Commit core index**

```bash
git add packages/core/metadata/validation/projectReferenceIndex.ts packages/core/metadata/validation/projectMetadataReferences.ts packages/core/metadata/validation/projectMetadataReferences.test.ts
git commit -m "feat: :sparkles: добавить project reference index"
```

### Task 3: Move Pending Validation To Index Only

**Files:**
- Modify: `packages/core/metadata/validation/projectReferenceIndex.ts`
- Modify: `packages/core/metadata/validation/validateProject.ts`
- Modify: `packages/core/metadata/validation/projectValidationWorker.ts`
- Modify: `packages/core/metadata/validation/projectValidationWorkerPool.ts`
- Test: `packages/core/metadata/validation/projectReferenceIndex.test.ts`
- Test: `packages/core/metadata/validation/projectValidationWorkerPool.test.ts`

- [x] **Step 1: Add `validatePendingReferencesWithIndex()` failing tests**

Append to `projectReferenceIndex.test.ts`:

```ts
it("validates pending references without fallback", () => {
  const projectDir = "/tmp/nkdk-project"
  const target = memberTarget("Справочник.Номенклатура.Реквизит.Артикул")
  const filePath = join(projectDir, "Справочник", "Номенклатура", "Свойства.yaml")
  const snapshot = createProjectReferenceSnapshot({
    objectIndexEntries: [],
    memberIndexEntries: [{ canonical: projectMemberIndexKey(target), target, result: { ok: true, filePath } }],
    valueIndexEntries: [],
    pendingReferences: [{ filePath, yamlPath: ["Поле"], canonical: "Справочник.Номенклатура.Реквизит.Артикул", target, constraint: { kind: "member" } }],
  })
  const index = createProjectReferenceIndex({ projectDir, mode: "full", snapshot })

  expect(validatePendingReferencesWithIndex({ index, references: snapshot.pendingReferences })).toEqual({
    diagnostics: [],
    stats: { hits: 1, misses: 0, conflicts: 0, filterFailures: 0, dependencies: 0, unsupported: 0, fallbacks: 0 },
  })
})
```

Import `validatePendingReferencesWithIndex`.

- [x] **Step 2: Implement `validatePendingReferencesWithIndex()`**

Add to `projectReferenceIndex.ts`:

```ts
export interface ValidatePendingReferencesWithIndexResult {
  diagnostics: Diagnostic[]
  stats: ProjectReferenceIndexStats
}

export function validatePendingReferencesWithIndex(params: {
  index: ProjectReferenceIndex
  references: readonly PendingMetadataTargetReference[]
}): ValidatePendingReferencesWithIndexResult {
  const diagnostics: Diagnostic[] = []
  for (const reference of params.references) {
    const result = params.index.resolve(reference)
    if (!result.ok) diagnostics.push(...result.diagnostics)
  }
  return { diagnostics, stats: params.index.stats() }
}
```

- [x] **Step 3: Replace in-process full validation fallback**

In `validateProject.ts`, replace full-validation resolver creation block with:

```ts
const referenceSnapshot = createProjectReferenceSnapshot({
  objectIndexEntries: objectTableSnapshot.objectIndexEntries ?? [],
  memberIndexEntries: objectTableSnapshot.memberIndexEntries ?? [],
  valueIndexEntries: objectTableSnapshot.valueIndexEntries ?? [],
  pendingReferences: objectTableSnapshot.pendingReferences ?? [],
})
const referenceIndex = createProjectReferenceIndex({
  projectDir,
  mode: queue.mode,
  snapshot: referenceSnapshot,
})
const referenceResult = validatePendingReferencesWithIndex({
  index: referenceIndex,
  references: referenceSnapshot.pendingReferences,
})
logInProcessReferenceProfile({ snapshot: referenceSnapshot, result: referenceResult })
diagnostics.push(...referenceResult.diagnostics)
```

Update imports from `projectMetadataReferences`/`projectReferenceIndex` accordingly.

- [x] **Step 4: Replace worker second-pass fallback**

In `projectValidationWorker.ts`, replace `createProjectMetadataResolverFromValidationTable()` and `validatePendingReferences({ resolver })` with:

```ts
const referenceIndex = createProjectReferenceIndex({
  projectDir: message.projectDir,
  mode: message.mode,
  snapshot: message.referenceSnapshot,
})
const referenceResult = validatePendingReferencesWithIndex({
  index: referenceIndex,
  references: message.pendingReferences,
})
```

Return `referenceResult.stats` fields in the timing payload instead of `hits/misses/fallbacks` from the old result.

- [x] **Step 5: Update profile logging names**

In `validateProject.ts` and `projectValidationWorkerPool.ts`, use:

```ts
`hits=${references.hits}`,
`misses=${references.misses}`,
`conflicts=${references.conflicts}`,
`filters=${references.filterFailures}`,
`dependencies=${references.dependencies}`,
`unsupported=${references.unsupported}`,
`fallbacks=${references.fallbacks}`,
```

Expected after this task on current code: `fallbacks=0`; `unsupported` may still be non-zero until object/value index entries are fully built.

- [x] **Step 6: Run focused tests**

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/validation/projectReferenceIndex.test.ts packages/core/metadata/validation/projectValidationWorkerPool.test.ts
```

Expected: PASS or failures only from missing object/value snapshot fields that will be added in Task 4.

- [x] **Step 7: Commit index-only pending validation**

```bash
git add packages/core/metadata/validation/projectReferenceIndex.ts packages/core/metadata/validation/validateProject.ts packages/core/metadata/validation/projectValidationWorker.ts packages/core/metadata/validation/projectValidationWorkerPool.ts packages/core/metadata/validation/projectReferenceIndex.test.ts packages/core/metadata/validation/projectValidationWorkerPool.test.ts
git commit -m "perf: :zap: валидировать pending references через index"
```

### Task 4: Extend First Pass Snapshot To Object And Value Entries

**Files:**
- Modify: `packages/core/metadata/validation/projectValidationTypes.ts`
- Modify: `packages/core/metadata/validation/projectValidationObjectTable.ts`
- Modify: `packages/core/metadata/validation/projectValidationPasses.ts`
- Modify: `packages/core/metadata/validation/projectValidationWorker.ts`
- Modify: `packages/core/metadata/validation/projectValidationWorkerPool.ts`
- Test: `packages/core/metadata/validation/projectValidationPasses.test.ts`
- Test: `packages/core/metadata/validation/projectValidationObjectTable.test.ts`

- [x] **Step 1: Add object/value arrays to validation record types**

In `projectValidationTypes.ts`, extend records:

```ts
import type {
  PendingMetadataTargetReference,
  ProjectMemberIndexEntry,
  ProjectObjectIndexEntry,
  ProjectValueIndexEntry,
} from "./projectReferenceIndex"

export interface ValidationObjectRecord {
  // existing fields stay
  objectIndexEntries?: ProjectObjectIndexEntry[]
  memberIndexEntries?: ProjectMemberIndexEntry[]
  valueIndexEntries?: ProjectValueIndexEntry[]
  pendingReferences?: PendingMetadataTargetReference[]
}

export interface ValidationObjectTableSnapshot {
  // existing fields stay
  objectIndexEntries?: ProjectObjectIndexEntry[]
  memberIndexEntries?: ProjectMemberIndexEntry[]
  valueIndexEntries?: ProjectValueIndexEntry[]
  pendingReferences?: PendingMetadataTargetReference[]
}
```

- [x] **Step 2: Merge new arrays in object table**

In `projectValidationObjectTable.ts`, update `snapshot()` to include:

```ts
objectIndexEntries: records.flatMap((record) => record.objectIndexEntries ?? []),
memberIndexEntries: records.flatMap((record) => record.memberIndexEntries ?? []),
valueIndexEntries: records.flatMap((record) => record.valueIndexEntries ?? []),
pendingReferences: records.flatMap((record) => record.pendingReferences ?? []),
```

- [x] **Step 3: Build owner object entry in first pass**

In `projectValidationPasses.ts`, add helper:

```ts
function buildObjectIndexEntry(params: { owner: OwnerMetadata }): ProjectObjectIndexEntry | undefined {
  const root = rootFromYAML[params.owner.ref.kind]
  if (!root || params.owner.ref.name === undefined) return undefined
  const target: Extract<ParsedMetadataTarget, { kind: "object" }> = {
    kind: "object",
    root: root as never,
    objectName: params.owner.ref.name,
  }
  return {
    canonical: projectObjectIndexKey(target),
    target,
    result: { ok: true, filePath: params.owner.filePath, details: params.owner },
  }
}
```

In `validateProjectPropertiesFirstPass()`, after `owner` is created:

```ts
const objectIndexEntry = buildObjectIndexEntry({ owner })
const objectIndexEntries = objectIndexEntry ? [objectIndexEntry] : []
const valueIndexEntries = buildValueIndexEntries({ owner })
```

Return both at top level and inside the `objectRecords` entry.

- [x] **Step 4: Add minimal value entry builder**

In `projectValidationPasses.ts`, add:

```ts
function buildValueIndexEntries(params: { owner: OwnerMetadata }): ProjectValueIndexEntry[] {
  const root = rootFromYAML[params.owner.ref.kind]
  if (!root || params.owner.ref.name === undefined) return []
  const values = params.owner.fieldIndex.values ?? new Map<string, ObjectField>()
  return [...values.values()].map((field) => {
    const target: Extract<ParsedMetadataTarget, { kind: "value" }> = {
      kind: "value",
      root: root as never,
      objectName: params.owner.ref.name ?? "",
      valueKind: metadataFieldKindFromObjectFieldKind(field.kind) as never,
      valueName: field.name,
    }
    return {
      canonical: projectValueIndexKey(target),
      target,
      result: { ok: true, filePath: params.owner.filePath, details: field },
    }
  })
}
```

If `ObjectFieldIndex` does not expose `values`, do not add an ad hoc parser. Instead add the value contributor interface in Task 5 and keep this function returning `[]` until contributors provide values.

- [x] **Step 5: Update worker first-pass payloads**

In `projectValidationWorker.ts` and `projectValidationWorkerPool.ts`, add `objectIndexEntries` and `valueIndexEntries` beside `memberIndexEntries` in:

- worker state;
- first-pass result payload;
- merged pool result;
- snapshot creation.

- [x] **Step 6: Add first-pass regression tests**

In `projectValidationPasses.test.ts`, add assertions near the existing member-index test:

```ts
expect(first.objectIndexEntries).toContainEqual(
  expect.objectContaining({
    canonical: "Catalog.Номенклатура",
    result: expect.objectContaining({ ok: true }),
  })
)
expect(first.memberIndexEntries).toContainEqual(
  expect.objectContaining({
    canonical: "Catalog.Номенклатура.Attribute.Артикул",
    result: expect.objectContaining({ ok: true }),
  })
)
```

- [x] **Step 7: Run focused tests**

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/validation/projectValidationPasses.test.ts packages/core/metadata/validation/projectValidationObjectTable.test.ts
```

Expected: PASS.

- [x] **Step 8: Commit snapshot extension**

```bash
git add packages/core/metadata/validation/projectValidationTypes.ts packages/core/metadata/validation/projectValidationObjectTable.ts packages/core/metadata/validation/projectValidationPasses.ts packages/core/metadata/validation/projectValidationWorker.ts packages/core/metadata/validation/projectValidationWorkerPool.ts packages/core/metadata/validation/projectValidationPasses.test.ts packages/core/metadata/validation/projectValidationObjectTable.test.ts
git commit -m "feat: :sparkles: добавить object и value entries в validation snapshot"
```

### Task 5: Rename Registry To Index Contributors

**Files:**
- Modify: `packages/core/metadata/validation/projectMetadataResolverRegistry.ts`
- Modify: `packages/core/metadata/commonObjects/metadataTargetProjectResolvers/register.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataStyleItem/register.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/register.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataCatalog/register.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataDocument/register.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataExternalDataSource/register.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataEnumeration/register.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataCommonPicture/register.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataSubsystem/register.ts`
- Test: `packages/core/metadata/validation/projectMetadataResolverRegistry.test.ts`
- Test: `packages/core/metadata/importBoundaries.test.ts`

- [x] **Step 1: Add new contributor names while keeping old exports temporarily**

In `projectMetadataResolverRegistry.ts`, add aliases:

```ts
export type ProjectReferenceObjectPathContributor = ProjectObjectPathResolver
export type ProjectReferenceMemberContributor = ProjectMemberResolver
export type ProjectReferenceValueContributor = ProjectValueResolver
export type ProjectReferenceMemberIndexContributor = ProjectMemberIndexContributor

export const registerProjectReferenceObjectPathContributor = registerProjectObjectPathResolver
export const getProjectReferenceObjectPathContributor = getProjectObjectPathResolver
export const registerProjectReferenceMemberContributor = registerProjectMemberResolver
export const getProjectReferenceMemberContributors = getProjectMemberResolvers
export const registerProjectReferenceValueContributor = registerProjectValueResolver
export const getProjectReferenceValueContributor = getProjectValueResolver
export const registerProjectReferenceMemberIndexContributor = registerProjectMemberIndexContributor
export const getProjectReferenceMemberIndexContributors = getProjectMemberIndexContributors
```

This is a temporary bridge for a small commit; Task 9 removes old names completely.

- [x] **Step 2: Update registration imports**

In each listed `register.ts`, replace imports like:

```ts
import { registerProjectObjectPathResolver } from "../../validation/projectMetadataResolverRegistry"
```

with:

```ts
import { registerProjectReferenceObjectPathContributor } from "../../validation/projectMetadataResolverRegistry"
```

Then replace calls:

```ts
registerProjectObjectPathResolver(...)
```

with:

```ts
registerProjectReferenceObjectPathContributor(...)
```

Apply equivalent replacements for member/value/member-index registrations.

- [x] **Step 3: Update tests names**

In `projectMetadataResolverRegistry.test.ts`, change the `describe()` name to:

```ts
describe("project reference index registry", () => {
```

In `importBoundaries.test.ts`, update assertion text:

```ts
it("ProjectReferenceIndex делегирует concrete metadata knowledge регистрациям", () => {
```

- [x] **Step 4: Run boundary/registry tests**

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/validation/projectMetadataResolverRegistry.test.ts packages/core/metadata/importBoundaries.test.ts
```

Expected: PASS.

- [x] **Step 5: Commit registry rename bridge**

```bash
git add packages/core/metadata/validation/projectMetadataResolverRegistry.ts packages/core/metadata/commonObjects/metadataTargetProjectResolvers/register.ts packages/core/metadata/appliedObjects packages/core/metadata/validation/projectMetadataResolverRegistry.test.ts packages/core/metadata/importBoundaries.test.ts
git commit -m "refactor: :recycle: переименовать resolver registry в reference index registry"
```

### Task 6: Port Object Resolution To Index Entries

**Files:**
- Modify: `packages/core/metadata/validation/projectValidationPasses.ts`
- Modify: `packages/core/metadata/validation/projectReferenceIndex.ts`
- Modify: registration files from Task 5 where object path contributors live.
- Test: `packages/core/metadata/validation/projectReferenceIndex.test.ts`

- [x] **Step 1: Port object tests from old resolver**

Move these cases from `projectMetadataResolver.test.ts` into `projectReferenceIndex.test.ts` and adapt them to snapshot/index setup:

```ts
it("resolves top-level objects from indexed project YAML", () => {
  // Справочник/Контрагенты/Свойства.yaml -> Catalog.Контрагенты
})

it("resolves document numerators from their physical YAML directory", () => {
  // Нумератор/ДенежныеДокументы/Свойства.yaml -> DocumentNumerator.ДенежныеДокументы
})

it("checks nested object paths instead of only the top-level object", () => {
  // Подсистема/Администрирование/Подсистемы/Настройки/Свойства.yaml
})

it("returns needsDependency in partial mode when object file exists but is not loaded", () => {
  // partial index uses object path contributor to request dependency
})
```

Use the same helper functions from the old test: `createProject()`, `writeProjectFile()`, `objectTarget()`.

- [x] **Step 2: Add object path dependency lookup**

In `projectReferenceIndex.ts`, extend `createProjectReferenceIndex()` params:

```ts
export function createProjectReferenceIndex(params: {
  projectDir: string
  mode: "full" | "partial"
  snapshot: ProjectReferenceSnapshot
  resolveProjectFile?: (target: Extract<ParsedMetadataTarget, { kind: "object" }>) => ValidationDependencyRequest | undefined
}): ProjectReferenceIndex
```

In `resolveReference()`, when an object entry is missing in partial mode:

```ts
const dependency = params.mode === "partial" && reference.target.kind === "object"
  ? params.resolveProjectFile?.(reference.target)
  : undefined
if (dependency !== undefined) {
  return { ok: false, reason: "needsDependency", dependency, diagnostics: [] }
}
```

- [x] **Step 3: Wire project-file resolver from validation queue**

In `validateProject.ts`, create `resolveProjectFile` near the queue:

```ts
const resolveProjectFileForReference = (target: Extract<ParsedMetadataTarget, { kind: "object" }>) => {
  const file = resolveValidationProjectFile(projectDir, target)
  return file ? { kind: "needsDependency" as const, file, requestedBy: target } : undefined
}
```

Pass it to every `createProjectReferenceIndex()` in partial/in-process path.

- [x] **Step 4: Run object tests**

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/validation/projectReferenceIndex.test.ts
```

Expected: object tests PASS.

- [ ] **Step 5: Commit object index parity**

```bash
git add packages/core/metadata/validation/projectReferenceIndex.ts packages/core/metadata/validation/validateProject.ts packages/core/metadata/validation/projectReferenceIndex.test.ts
git commit -m "feat: :sparkles: перенести object validation в reference index"
```

### Task 7: Port Member Filters To Index

**Files:**
- Modify: `packages/core/metadata/validation/projectReferenceIndex.ts`
- Modify: `packages/core/metadata/validation/projectValidationPasses.ts`
- Test: `packages/core/metadata/validation/projectReferenceIndex.test.ts`

- [ ] **Step 1: Port member filter tests**

Move/adapt old resolver tests covering:

```ts
it("resolves fields including standard attributes and tabular-section attributes", () => {})
it("resolves members for direct YAML owner kinds", () => {})
it("applies directMember filter", () => {})
it("applies hasType filter", () => {})
it("applies stringIndexedAttribute filter", () => {})
it("rejects unsupported member kind with reference diagnostic", () => {})
```

Each test should build index entries through first pass where possible, not by hand, so it exercises real details.

- [ ] **Step 2: Implement `matchesMemberFilters()`**

In `projectReferenceIndex.ts`, add:

```ts
function matchesMemberFilters(params: {
  reference: PendingMetadataTargetReference
  entry: ProjectMemberIndexEntry
}): ProjectReferenceIndexResult {
  if (params.reference.constraint.kind !== "member") return { ok: true }
  const filters = params.reference.constraint.filters
  if (filters === undefined) return { ok: true }
  const details = params.entry.result.ok ? params.entry.result.details : undefined

  if (filters.directMember === true && params.entry.target.segments.length !== 1) {
    return { ok: false, reason: "filter", diagnostics: [referenceDiagnostic(params.reference, `Ссылка "${params.reference.canonical}" должна указывать на прямое поле объекта`)] }
  }

  if (filters.hasType !== undefined && !detailsHasAnyType(details, filters.hasType)) {
    return { ok: false, reason: "filter", diagnostics: [referenceDiagnostic(params.reference, `Поле "${params.reference.canonical}" не подходит по типу`)] }
  }

  if (filters.stringIndexedAttribute === true && !isStringIndexedAttribute(details)) {
    return { ok: false, reason: "filter", diagnostics: [referenceDiagnostic(params.reference, `Поле "${params.reference.canonical}" должно быть индексируемым строковым реквизитом`)] }
  }

  return { ok: true }
}
```

Add narrow helper functions that inspect only neutral `details` shapes already produced by `ObjectField`:

```ts
function detailsHasAnyType(details: unknown, expected: readonly string[]): boolean {
  if (!isRecord(details)) return false
  const typeInfo = details.typeInfo
  if (!isRecord(typeInfo) || !Array.isArray(typeInfo.kinds)) return false
  return typeInfo.kinds.some((kind) => typeof kind === "string" && expected.includes(kind))
}

function isStringIndexedAttribute(details: unknown): boolean {
  if (!isRecord(details)) return false
  return details.kind === "attribute" && details.indexing !== false && detailsHasAnyType(details, ["string"])
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}
```

- [ ] **Step 3: Call filters from `resolveReference()`**

After a member entry resolves successfully:

```ts
if (reference.target.kind === "member") {
  const filterResult = matchesMemberFilters({ reference, entry })
  if (!filterResult.ok) return filterResult
}
```

- [ ] **Step 4: Run member filter tests**

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/validation/projectReferenceIndex.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit member filters**

```bash
git add packages/core/metadata/validation/projectReferenceIndex.ts packages/core/metadata/validation/projectValidationPasses.ts packages/core/metadata/validation/projectReferenceIndex.test.ts
git commit -m "feat: :sparkles: перенести member filters в reference index"
```

### Task 8: Port Style/Common Picture/Named Resource References

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataTargets/validationHandlers.ts`
- Modify: `packages/core/metadata/validation/projectReferenceIndex.ts`
- Modify: `packages/core/metadata/validation/projectValidationPasses.ts`
- Modify: `packages/core/metadata/validation/projectMetadataResolverRegistry.ts`
- Test: `packages/core/metadata/validation/projectReferenceIndex.test.ts`
- Test: `packages/core/metadata/validation/metadataTargetTraversal.test.ts`

- [ ] **Step 1: Make collectors cover style and picture references**

In `metadataTargets/validationHandlers.ts`, add collection handlers for color/font/border/picture validation targets:

```ts
const collectStyleColorReferenceForValidation: CollectMetadataTargetReferencesFunction = (params) => {
  if (!isRecord(params.value) || params.value.type !== "StyleItem" || typeof params.value.value !== "string") return { references: [], diagnostics: [] }
  if (isKnownStyleColor(params.value.value)) return { references: [], diagnostics: [] }
  return collectNamedResourceReference(params, `StyleItem.${params.value.value}`, ["Color"])
}

const collectStyleFontReferenceForValidation: CollectMetadataTargetReferencesFunction = (params) => {
  if (!isRecord(params.value) || params.value.kind !== "StyleItem" || typeof params.value.ref !== "string") return { references: [], diagnostics: [] }
  if (isKnownStyleFont(params.value.ref)) return { references: [], diagnostics: [] }
  return collectNamedResourceReference(params, `StyleItem.${params.value.ref}`, ["Font"])
}

const collectStyleBorderReferenceForValidation: CollectMetadataTargetReferencesFunction = (params) => {
  if (!isRecord(params.value) || typeof params.value.ref !== "string") return { references: [], diagnostics: [] }
  return collectNamedResourceReference(params, `StyleItem.${params.value.ref}`, ["Border"])
}

const collectCommonPictureReferenceForValidation: CollectMetadataTargetReferencesFunction = (params) => {
  if (!isRecord(params.value) || params.value.type !== "CommonPicture" || typeof params.value.ref !== "string") return { references: [], diagnostics: [] }
  return collectCanonicalTarget(params, `CommonPicture.${params.value.ref}`)
}
```

Register them:

```ts
registerTypeRule("Color", "collectMetadataTargetReferences", collectStyleColorReferenceForValidation)
registerTypeRule("Font", "collectMetadataTargetReferences", collectStyleFontReferenceForValidation)
registerTypeRule("Border", "collectMetadataTargetReferences", collectStyleBorderReferenceForValidation)
registerTypeRule("Picture", "collectMetadataTargetReferences", collectCommonPictureReferenceForValidation)
```

- [ ] **Step 2: Represent style filters as object constraints**

If `MetadataTargetConstraint` already has style filters, reuse them. If not, add a neutral named-resource constraint in `metadataTargets/types.ts`:

```ts
export type MetadataTargetConstraint =
  | ExistingConstraint
  | { kind: "namedResource"; resourceKind: "StyleItem"; expectedTypes?: readonly StyleItemTargetType[] }
```

Do not add concrete folder knowledge to validation layer.

- [ ] **Step 3: Add named resource index entries**

If style/common picture are already object entries, use object index. If they are not, add:

```ts
export interface ProjectNamedResourceIndexEntry {
  canonical: string
  resourceKind: string
  name: string
  result: MetadataReferenceResolveResult
  details?: unknown
}
```

Add `namedResourceIndex` and `namedResourceIndexByKey` to snapshot, with `projectNamedResourceIndexKey(kind, name)`.

- [ ] **Step 4: Port named resource tests**

Add tests:

```ts
it("resolves style item with expected type filter", () => {})
it("rejects style item with wrong expected type", () => {})
it("resolves common picture references without resolver", () => {})
```

- [ ] **Step 5: Run traversal tests**

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/validation/projectReferenceIndex.test.ts packages/core/metadata/validation/metadataTargetTraversal.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit named resource migration**

```bash
git add packages/core/metadata/commonObjects/metadataTargets packages/core/metadata/validation/projectReferenceIndex.ts packages/core/metadata/validation/projectValidationPasses.ts packages/core/metadata/validation/projectMetadataResolverRegistry.ts packages/core/metadata/validation/projectReferenceIndex.test.ts packages/core/metadata/validation/metadataTargetTraversal.test.ts
git commit -m "feat: :sparkles: перенести named resources в reference index"
```

### Task 9: Wire Partial Validation Through Index

**Files:**
- Modify: `packages/core/metadata/validation/validateProject.ts`
- Modify: `packages/core/metadata/validation/projectValidationPasses.ts`
- Modify: `packages/core/metadata/validation/projectValidationQueue.ts`
- Test: `packages/core/metadata/validation/validateProject.test.ts`
- Test: `packages/core/metadata/validation/projectValidationQueue.test.ts`

- [ ] **Step 1: Add partial needsDependency regression test**

In `validateProject.test.ts`, add:

```ts
it("uses reference index to enqueue missing dependency in partial validation", async () => {
  const projectDir = createProject()
  writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", "Комментарий: ok")
  writeProjectFile(projectDir, "Документ/Заказ/Свойства.yaml", [
    "Реквизиты:",
    "  Товар:",
    "    Тип:",
    "      - СправочникСсылка.Товары",
  ])

  const result = await validateProject({
    projectDir,
    filePath: join(projectDir, "Документ", "Заказ", "Свойства.yaml"),
    concurrency: 1,
  })

  expect(result.diagnostics.filter((diagnostic) => diagnostic.source === "reference")).toEqual([])
})
```

Use existing helpers in the file; if helper names differ, reuse the local pattern.

- [ ] **Step 2: Change second-pass params**

In `projectValidationPasses.ts`, replace:

```ts
metadataResolver: ProjectMetadataResolver
```

with:

```ts
referenceIndex: ProjectReferenceIndex
```

Remove `createDependencyRecordingResolver()`.

- [ ] **Step 3: Validate collected references through index in second pass**

In `validateProjectFileSecondPass()`, replace `validateMetadataTargetsInModel()` with:

```ts
const collected = collectMetadataTargetReferencesInModel({
  filePath: params.state.file.absolutePath,
  parsed: params.state.parsed,
  model: params.state.model,
  rule: params.state.file.owner.spec.rule,
  owner,
})
const resolved = validatePendingReferencesWithIndex({
  index: params.referenceIndex,
  references: collected.references,
})
const dependencyResult = collected.references
  .map((reference) => params.referenceIndex.resolve(reference))
  .find((result): result is Extract<ProjectReferenceIndexResult, { reason: "needsDependency" }> => !result.ok && result.reason === "needsDependency")
const diagnostics = [...collected.diagnostics, ...resolved.diagnostics]
if (dependencyResult !== undefined) return { status: "needsDependency", diagnostics, dependency: dependencyResult.dependency }
```

Avoid double-resolving by refactoring `validatePendingReferencesWithIndex()` to optionally return `firstDependency`:

```ts
export interface ValidatePendingReferencesWithIndexResult {
  diagnostics: Diagnostic[]
  stats: ProjectReferenceIndexStats
  firstDependency?: ValidationDependencyRequest
}
```

- [ ] **Step 4: Rebuild index after new dependencies are loaded**

In `validateProject.ts`, inside the second-pass loop, build `referenceSnapshot` and `referenceIndex` from the current `objectTable.snapshot()` after every `processPendingFirstPasses()` call.

Use:

```ts
function createReferenceIndexFromObjectTable(params: {
  projectDir: string
  mode: "full" | "partial"
  objectTable: ReturnType<ReturnType<typeof createValidationObjectTable>["snapshot"]>
}): ProjectReferenceIndex {
  const snapshot = createProjectReferenceSnapshot({
    objectIndexEntries: params.objectTable.objectIndexEntries ?? [],
    memberIndexEntries: params.objectTable.memberIndexEntries ?? [],
    valueIndexEntries: params.objectTable.valueIndexEntries ?? [],
    pendingReferences: params.objectTable.pendingReferences ?? [],
  })
  return createProjectReferenceIndex({ projectDir: params.projectDir, mode: params.mode, snapshot })
}
```

- [ ] **Step 5: Run partial validation tests**

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/validation/validateProject.test.ts packages/core/metadata/validation/projectValidationQueue.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit partial index validation**

```bash
git add packages/core/metadata/validation/validateProject.ts packages/core/metadata/validation/projectValidationPasses.ts packages/core/metadata/validation/projectValidationQueue.ts packages/core/metadata/validation/validateProject.test.ts packages/core/metadata/validation/projectValidationQueue.test.ts
git commit -m "feat: :sparkles: использовать reference index в partial validation"
```

### Task 10: Delete Runtime ProjectMetadataResolver

**Files:**
- Delete: `packages/core/metadata/validation/projectMetadataResolver.ts`
- Delete: `packages/core/metadata/validation/projectMetadataResolver.test.ts`
- Modify: `packages/core/metadata/validation/projectMetadataResolverRegistry.ts`
- Modify: `packages/core/metadata/orchestration/property/fn.ts`
- Modify: `packages/core/metadata/commonObjects/metadataTargets/validationHandlers.ts`
- Modify: any files found by `rg`.

- [ ] **Step 1: Search runtime usage**

Run:

```bash
rg -n "ProjectMetadataResolver|createProjectMetadataResolver|createProjectMetadataResolverFromValidationTable|validateMetadataTargetsInModel|projectMetadataResolverRegistry" packages/core/metadata packages/cli packages/mcp
```

Expected before deletion: only known usage remains.

- [ ] **Step 2: Remove resolver validation function**

In `metadataTargetTraversal.ts`, delete `validateMetadataTargetsInModel()` and keep `collectMetadataTargetReferencesInModel()`.

If tests still need direct validation, rewrite them to:

```ts
const collected = collectMetadataTargetReferencesInModel(...)
const result = validatePendingReferencesWithIndex({ index, references: collected.references })
expect([...collected.diagnostics, ...result.diagnostics]).toEqual(...)
```

- [ ] **Step 3: Remove resolver type from property function contracts**

In `fn.ts`, delete:

```ts
import type { ProjectMetadataResolver } from "../../validation/projectMetadataResolver"
export type ValidateMetadataTargetFunction = ...
```

Keep `CollectMetadataTargetReferencesFunction` as the runtime validation contract.

- [ ] **Step 4: Remove old resolver file and test**

Delete:

```bash
git rm packages/core/metadata/validation/projectMetadataResolver.ts packages/core/metadata/validation/projectMetadataResolver.test.ts
```

- [ ] **Step 5: Remove old registry names**

In `projectMetadataResolverRegistry.ts`, remove resolver-named exports:

```ts
registerProjectObjectPathResolver
getProjectObjectPathResolver
registerProjectMemberResolver
getProjectMemberResolvers
getProjectMemberResolver
registerProjectValueResolver
getProjectValueResolver
registerProjectInlineObjectResolver
getProjectInlineObjectResolvers
registerProjectNamedResourceResolver
getProjectNamedResourceResolver
registerProjectMemberIndexContributor
getProjectMemberIndexContributors
```

Keep only index-named contributor APIs and file validators.

- [ ] **Step 6: Verify search is clean**

Run:

```bash
rg -n "ProjectMetadataResolver|createProjectMetadataResolver|createProjectMetadataResolverFromValidationTable|validateMetadataTargetsInModel|projectMetadataResolverRegistry" packages/core/metadata packages/cli packages/mcp
```

Expected: either no matches, or only file names/test descriptions that are intentionally renamed in the next step. Prefer no matches.

- [ ] **Step 7: Run core tests**

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/validation packages/core/metadata/importBoundaries.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit resolver deletion**

```bash
git add packages/core/metadata packages/cli packages/mcp
git commit -m "refactor: :fire: удалить runtime project metadata resolver"
```

### Task 11: Compact Snapshot And Preserve Worker Performance

**Files:**
- Modify: `packages/core/metadata/validation/projectReferenceIndex.ts`
- Modify: `packages/core/metadata/validation/projectValidationWorkerPool.ts`
- Test: `packages/core/metadata/validation/projectReferenceIndex.test.ts`

- [ ] **Step 1: Add snapshot size regression test**

In `projectReferenceIndex.test.ts`, add:

```ts
it("does not duplicate index arrays when lookup maps are enough for worker snapshot", () => {
  const target = memberTarget("Справочник.Номенклатура.Реквизит.Артикул")
  const snapshot = createProjectReferenceSnapshot({
    objectIndexEntries: [],
    memberIndexEntries: [{ canonical: projectMemberIndexKey(target), target, result: { ok: true, filePath: "/tmp/Свойства.yaml" } }],
    valueIndexEntries: [],
    pendingReferences: [],
  })

  expect(snapshot.memberIndexByKey[projectMemberIndexKey(target)]).toBeDefined()
  expect(snapshot.stats.snapshotBytes).toBeGreaterThan(0)
})
```

- [ ] **Step 2: Remove duplicated arrays from worker snapshot if tests allow**

If no code uses `objectIndex`, `memberIndex`, `valueIndex` arrays after snapshot creation, change `ProjectReferenceSnapshot` to keep only `objectIndexByKey`, `memberIndexByKey`, `valueIndexByKey`.

Keep counts in `stats`.

- [ ] **Step 3: Update estimate and tests**

Update tests that read `snapshot.memberIndex` to check `snapshot.stats.memberEntries` or `snapshot.memberIndexByKey`.

- [ ] **Step 4: Run focused tests**

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/validation/projectReferenceIndex.test.ts packages/core/metadata/validation/projectValidationWorkerPool.test.ts
```

Expected: PASS and snapshot bytes lower than before on the real project.

- [ ] **Step 5: Commit snapshot compaction**

```bash
git add packages/core/metadata/validation/projectReferenceIndex.ts packages/core/metadata/validation/projectReferenceIndex.test.ts packages/core/metadata/validation/projectValidationWorkerPool.ts
git commit -m "perf: :zap: уменьшить snapshot reference index"
```

### Task 12: Full Verification And Performance Measurement

**Files:**
- Modify only if verification exposes failures.

- [ ] **Step 1: Run full test suite**

```bash
pnpm test
```

Expected: all packages green, including `core`, `cli`, `mcp`.

- [ ] **Step 2: Run clean search**

```bash
rg -n "ProjectMetadataResolver|createProjectMetadataResolver|createProjectMetadataResolverFromValidationTable|validateMetadataTargetsInModel|projectMetadataResolverRegistry" packages/core/metadata packages/cli packages/mcp
```

Expected: no runtime usage.

- [ ] **Step 3: Run full validation once**

```bash
/usr/bin/time -p pnpm --filter @nakidka/cli exec nkdk validate /Users/nikita/git/nkdk-yaml
```

Expected:

```text
summary: 0 error, 0 warning
fallbacks=0
unsupported=0
```

Performance target: not slower than current baseline `real 41.33-45.45s`.

- [ ] **Step 4: Run profile validation**

```bash
/usr/bin/time -p pnpm --filter @nakidka/cli exec nkdk validate /Users/nikita/git/nkdk-yaml --profile
```

Record:

```text
поиск YAML-файлов: ...
first pass: ...
merge object table: ...
second pass: ...
sort/dedupe diagnostics: ...
всего внутри validation: ...
references: pending=..., entries=..., hits=..., misses=..., conflicts=..., filters=..., dependencies=..., unsupported=0, fallbacks=0, snapshotBytes=...
```

- [ ] **Step 5: Commit verification fixes if any**

If verification required code changes:

```bash
git add packages/core packages/cli packages/mcp
git commit -m "fix: :bug: довести unified reference index validation"
```

If no code changes are needed, do not create an empty commit.

## Self-Review

- Spec coverage:
  - Unified object/member/value mechanism: Tasks 2, 4, 6, 7, 8.
  - Full validation without fallback: Task 3.
  - Partial validation through same mechanism: Task 9.
  - Delete old resolver runtime: Task 10.
  - Worker validation and stats: Tasks 3, 4, 11.
  - Snapshot size measured and improved without SharedArrayBuffer: Task 11 and Task 12.
  - Diagnostics preservation: Tasks 6, 7, 8, 9 through migrated resolver tests.
- Placeholder scan:
  - No placeholder markers or deferred implementation steps.
  - Task 8 contains a conditional path for named resources because the existing target constraint shape must be checked during implementation; both branches have explicit code direction.
- Type consistency:
  - Public index types are introduced in Task 2 and reused by later tasks.
  - `ProjectReferenceIndexStats.fallbacks` is always `0` and replaces old fallback metrics.
  - `PendingMetadataTargetReference` stays the shared unit between first pass and second pass.
