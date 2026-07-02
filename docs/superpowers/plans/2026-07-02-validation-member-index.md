# Validation Member Index Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ускорить full YAML validation больших metadataTarget member-ссылок за счёт member-index entries и pending references, собранных в `first pass`.

**Architecture:** `first pass` строит два новых результата: `memberIndexEntries` для существующих members и `pendingReferences` для ссылок, которые надо проверить после полного сбора проекта. Главный поток склеивает обычный cloneable snapshot и передаёт его worker-ам, а `second pass` проверяет pending references по индексу с fallback на текущий `ProjectMetadataResolver`. `SharedArrayBuffer` не используется в первом этапе; вместо этого добавляются замеры размера snapshot и hit/miss/fallback.

**Tech Stack:** TypeScript ESM, Vitest, Node.js worker_threads, pnpm workspace.

---

## File Structure

- Create: `packages/core/metadata/validation/projectMetadataReferences.ts`
  - Общие типы `ProjectMemberIndexEntry`, `PendingMetadataTargetReference`, `ProjectReferenceSnapshot`.
  - Helpers для ключей member target, сборки snapshot, lookup и оценки размера.
- Modify: `packages/core/metadata/orchestration/property/fn.ts`
  - Добавить тип `CollectMetadataTargetReferencesFunction`.
  - Добавить operation `"collectMetadataTargetReferences"` в `TypeRulesOperations` и `importExportFunction`.
- Modify: `packages/core/metadata/orchestration/property/typeRuleRegistry.ts`
  - Добавить новый operation в типизацию `getTypeRule`.
- Modify: `packages/core/metadata/commonObjects/metadataTargets/validationHandlers.ts`
  - Зарегистрировать сбор pending references для тех же типов, где сейчас есть `validateMetadataTarget`.
- Modify: `packages/core/metadata/validation/metadataTargetTraversal.ts`
  - Добавить `collectMetadataTargetReferencesInModel`.
- Modify: `packages/core/metadata/validation/metadataTargetTraversal.test.ts`
  - Тесты на сбор pending references, parse diagnostics и вложенные коллекции.
- Modify: `packages/core/metadata/validation/projectMetadataResolverRegistry.ts`
  - Добавить registry для `ProjectMemberIndexContributor`.
- Modify: `packages/core/metadata/commonObjects/metadataTargetProjectResolvers/register.ts`
  - Зарегистрировать contributors для collection members; file-backed forms/templates остаются на fallback в первом этапе.
- Modify: `packages/core/metadata/validation/projectValidationTypes.ts`
  - Добавить `memberIndexEntries` и `pendingReferences` в records/snapshots/results.
- Modify: `packages/core/metadata/validation/projectValidationObjectTable.ts`
  - Сохранять и отдавать reference snapshot рядом с object table.
- Modify: `packages/core/metadata/validation/projectValidationPasses.ts`
  - First pass строит member entries и pending references.
  - Second pass умеет проверять переданные pending references по snapshot.
- Modify: `packages/core/metadata/validation/projectValidationWorker.ts`
  - Worker хранит local pending references и local member entries.
  - Second pass получает общий snapshot и свою часть pending references.
- Modify: `packages/core/metadata/validation/projectValidationWorkerPool.ts`
  - Главный поток склеивает snapshot и распределяет pending references по количеству ссылок.
  - Логирует новые timing/profile поля.
- Modify: `packages/core/metadata/validation/validateProject.ts`
  - In-process full validation использует тот же snapshot path.
- Tests:
  - `packages/core/metadata/validation/projectMetadataReferences.test.ts`
  - `packages/core/metadata/validation/projectValidationPasses.test.ts`
  - `packages/core/metadata/validation/projectValidationWorkerPool.test.ts`
  - Existing resolver/traversal tests.

## Task 1: Add Pending Reference Collection API

**Files:**
- Create: `packages/core/metadata/validation/projectMetadataReferences.ts`
- Modify: `packages/core/metadata/orchestration/property/fn.ts`
- Modify: `packages/core/metadata/orchestration/property/typeRuleRegistry.ts`
- Modify: `packages/core/metadata/commonObjects/metadataTargets/validationHandlers.ts`
- Modify: `packages/core/metadata/validation/metadataTargetTraversal.ts`
- Modify: `packages/core/metadata/validation/metadataTargetTraversal.test.ts`

- [ ] **Step 1: Add failing traversal tests**

Append these tests to `packages/core/metadata/validation/metadataTargetTraversal.test.ts` in the existing top-level metadata target traversal `describe` block:

```ts
  it("collects pending metadata target references without resolving them", () => {
    const rule: MetadataItemRule = {
      itemType: "MetadataFunctionalOption",
      properties: {
        content: {
          type: "MetadataItemLinks",
          yaml: "СоставФункциональнойОпции",
          metadataTarget: { kind: "member", owner: "explicit" },
        },
      },
    } as never

    const references = collectMetadataTargetReferencesInModel({
      filePath: "/tmp/ФункциональнаяОпция/Опция/Свойства.yaml",
      parsed: parseMetadataYaml(["СоставФункциональнойОпции:", "  - Catalog.Номенклатура.Attribute.Артикул"].join("\n")),
      model: {
        itemType: "MetadataFunctionalOption",
        content: ["Catalog.Номенклатура.Attribute.Артикул"],
      } as never,
      rule,
    })

    expect(references.diagnostics).toEqual([])
    expect(references.references).toEqual([
      expect.objectContaining({
        filePath: "/tmp/ФункциональнаяОпция/Опция/Свойства.yaml",
        yamlPath: ["СоставФункциональнойОпции", 0],
        canonical: "Catalog.Номенклатура.Attribute.Артикул",
        target: expect.objectContaining({
          kind: "member",
          root: "Catalog",
          objectName: "Номенклатура",
          segments: [{ kind: "Attribute", name: "Артикул" }],
        }),
        constraint: expect.objectContaining({ kind: "member", owner: "explicit" }),
      }),
    ])
  })

  it("collects structure diagnostics for invalid pending metadata targets", () => {
    const rule: MetadataItemRule = {
      itemType: "MetadataDocument",
      properties: {
        mainForm: {
          type: "string",
          yaml: "ОсновнаяФорма",
          metadataTarget: { kind: "member", owner: "this", memberKinds: ["Form"] },
        },
      },
    } as never

    const references = collectMetadataTargetReferencesInModel({
      filePath: "/tmp/Документ/АвансовыйОтчет/Свойства.yaml",
      parsed: parseMetadataYaml("ОсновнаяФорма: CommonForm.ФормаДокумента"),
      model: { itemType: "MetadataDocument", mainForm: "CommonForm.ФормаДокумента" } as never,
      rule,
      owner: { root: "Document", objectName: "АвансовыйОтчет" },
    })

    expect(references.references).toEqual([])
    expect(references.diagnostics).toEqual([
      expect.objectContaining({
        source: "structure",
        severity: "error",
      }),
    ])
  })
```

Also extend the import at the top:

```ts
import {
  collectMetadataTargetReferencesInModel,
  validateMetadataTargetsInModel,
} from "./metadataTargetTraversal"
```

- [ ] **Step 2: Run focused test and confirm it fails**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/metadataTargetTraversal.test.ts
```

Expected: FAIL because `collectMetadataTargetReferencesInModel` is not exported.

- [ ] **Step 3: Add collection function types**

Create the minimal shared reference module needed by traversal:

```ts
// packages/core/metadata/validation/projectMetadataReferences.ts
import type { MetadataTargetConstraint, ParsedMetadataTarget } from "../commonObjects/metadataTargets"
import type { YamlPath } from "./yamlLocations"

export interface PendingMetadataTargetReference {
  filePath: string
  yamlPath: YamlPath
  canonical: string
  target: ParsedMetadataTarget
  constraint: MetadataTargetConstraint
}
```

In `packages/core/metadata/orchestration/property/fn.ts`, after `ValidateMetadataTargetFunction`, add:

```ts
export interface PendingMetadataTargetReferenceCandidate {
  yamlPath: YamlPath
  canonical: string
  target: ParsedMetadataTarget
  constraint: MetadataTargetConstraint
}

export type CollectMetadataTargetReferencesFunction = (params: {
  filePath: string
  parsed: ParsedYaml
  yamlPath: YamlPath
  propRule: PropertyRule
  propertyName: string
  value: unknown
  owner?: MetadataTargetOwner
}) => {
  references: PendingMetadataTargetReferenceCandidate[]
  diagnostics: Diagnostic[]
}
```

Add imports near the existing metadata target imports:

```ts
import type { MetadataTargetConstraint, ParsedMetadataTarget } from "../../commonObjects/metadataTargets"
```

Add optional property to `TypeRules`:

```ts
  collectMetadataTargetReferences?: CollectMetadataTargetReferencesFunction
```

Add operation to `TypeRulesOperations`:

```ts
  | "collectMetadataTargetReferences"
```

Add branch to `importExportFunction` before the final `never`:

```ts
                              : O extends "collectMetadataTargetReferences"
                                ? CollectMetadataTargetReferencesFunction | undefined
                                : never
```

- [ ] **Step 4: Extend typeRuleRegistry typing**

In `packages/core/metadata/orchestration/property/typeRuleRegistry.ts`, add `CollectMetadataTargetReferencesFunction` to the import list from `./fn`, to the registry union, and to `getTypeRule`:

```ts
                            : O extends "collectMetadataTargetReferences"
                              ? CollectMetadataTargetReferencesFunction | undefined
                              : O extends "xmlSyncWriter"
                                ? XmlSyncWriterFunction | undefined
                                : never
```

- [ ] **Step 5: Register metadata target reference collectors**

In `packages/core/metadata/commonObjects/metadataTargets/validationHandlers.ts`, add a collector helper below `validateCanonicalTarget`:

```ts
function collectCanonicalTarget(
  params: Parameters<CollectMetadataTargetReferencesFunction>[0],
  value: string
): ReturnType<CollectMetadataTargetReferencesFunction> {
  const constraint = params.propRule.metadataTarget
  if (!constraint) return { references: [], diagnostics: [] }

  const parsed = parseMetadataTargetFromModel({ canonical: value, constraint, owner: params.owner })
  if (!parsed.ok) {
    return {
      references: [],
      diagnostics: [
        diagnosticAtYamlPath({
          filePath: params.filePath,
          parsed: params.parsed,
          path: params.yamlPath,
          source: "structure",
          severity: "error",
          message: parsed.message,
        }),
      ],
    }
  }

  return {
    references: [
      {
        yamlPath: params.yamlPath,
        canonical: parsed.canonical,
        target: parsed.target,
        constraint,
      },
    ],
    diagnostics: [],
  }
}
```

Add type import:

```ts
import type {
  CollectMetadataTargetReferencesFunction,
  PendingMetadataTargetReferenceCandidate,
  StructuralReferencesFunction,
  ValidateMetadataTargetFunction,
} from "../../orchestration/property/fn"
import type { Diagnostic } from "../../validation/types"
```

Add collectors:

```ts
const collectStringTargetForValidation: CollectMetadataTargetReferencesFunction = (params) => {
  if (typeof params.value !== "string" || params.value === "") return { references: [], diagnostics: [] }
  if (params.propRule.type === "string" && params.propRule.metadataTarget?.kind !== "member") {
    return { references: [], diagnostics: [] }
  }
  return collectCanonicalTarget(params, params.value)
}

const collectStringTargetListForValidation: CollectMetadataTargetReferencesFunction = (params) => {
  if (!Array.isArray(params.value)) return { references: [], diagnostics: [] }

  const references: PendingMetadataTargetReferenceCandidate[] = []
  const diagnostics: Diagnostic[] = []
  for (const [index, value] of params.value.entries()) {
    const result = collectStringTargetForValidation({
      ...params,
      value,
      yamlPath: [...params.yamlPath, index],
    })
    references.push(...result.references)
    diagnostics.push(...result.diagnostics)
  }
  return { references, diagnostics }
}

const collectMetadataValueTargetForValidation: CollectMetadataTargetReferencesFunction = (params) => {
  if (!isRecord(params.value) || params.value.type !== "ref" || typeof params.value.value !== "string") {
    return { references: [], diagnostics: [] }
  }
  if (params.value.value === "" || isDesignTimeRefUuid(params.value.value)) return { references: [], diagnostics: [] }

  return collectCanonicalTarget(params, params.value.value)
}
```

Then register them at the bottom:

```ts
registerTypeRule("MetadataItemLink", "collectMetadataTargetReferences", collectStringTargetForValidation)
registerTypeRule("string", "collectMetadataTargetReferences", collectStringTargetForValidation)
registerTypeRule("MetadataItemLinks", "collectMetadataTargetReferences", collectStringTargetListForValidation)
registerTypeRule("MetadataField", "collectMetadataTargetReferences", collectStringTargetForValidation)
registerTypeRule("MetadataFields", "collectMetadataTargetReferences", collectStringTargetListForValidation)
registerTypeRule("MetadataObjectRefCollection", "collectMetadataTargetReferences", collectStringTargetListForValidation)
registerTypeRule("MetadataValue", "collectMetadataTargetReferences", collectMetadataValueTargetForValidation)
```

- [ ] **Step 6: Implement traversal collection**

In `packages/core/metadata/validation/metadataTargetTraversal.ts`, add imports:

```ts
import type { PendingMetadataTargetReferenceCandidate } from "../orchestration/property/fn"
import type { PendingMetadataTargetReference } from "./projectMetadataReferences"
```

Add exported function near `validateMetadataTargetsInModel`:

```ts
export function collectMetadataTargetReferencesInModel(params: Omit<ValidateMetadataTargetsInModelParams, "resolver">): {
  references: PendingMetadataTargetReference[]
  diagnostics: Diagnostic[]
} {
  return collectObjectReferences({
    ...params,
    value: params.model,
    yamlPath: [],
  })
}
```

Add helper functions after `validateObject`:

```ts
function collectObjectReferences(
  params: Omit<ValidateMetadataTargetsInModelParams, "resolver"> & { value: unknown; yamlPath: YamlPath }
): { references: PendingMetadataTargetReference[]; diagnostics: Diagnostic[] } {
  const record = asRecord(params.value)
  if (!record) return { references: [], diagnostics: [] }

  const references: PendingMetadataTargetReference[] = []
  const diagnostics: Diagnostic[] = []
  for (const [propertyName, propRule] of Object.entries(params.rule.properties)) {
    if (typeof propRule.yaml !== "string") continue

    const value = record[propertyName]
    if (value === undefined) continue

    if (propRule.metadataTarget) {
      const handler = getTypeRule(propRule.type, "collectMetadataTargetReferences")
      if (handler) {
        const result = handler({
          filePath: params.filePath,
          parsed: params.parsed,
          yamlPath: [...params.yamlPath, propRule.yaml],
          propRule,
          propertyName,
          value,
          owner: params.owner,
        })
        references.push(
          ...result.references.map((reference) =>
            pendingReferenceFromCandidate({
              filePath: params.filePath,
              candidate: reference,
            })
          )
        )
        diagnostics.push(...result.diagnostics)
      }
    }

    const itemRule = nestedItemRule(propRule)
    if (!itemRule) continue

    const nested = collectNestedReferences({
      ...params,
      value,
      itemRule,
      yamlPath: [...params.yamlPath, propRule.yaml],
    })
    references.push(...nested.references)
    diagnostics.push(...nested.diagnostics)
  }

  return { references, diagnostics }
}

function collectNestedReferences(
  params: Omit<ValidateMetadataTargetsInModelParams, "resolver"> & {
    value: unknown
    itemRule: MetadataItemRule
    yamlPath: YamlPath
  }
): { references: PendingMetadataTargetReference[]; diagnostics: Diagnostic[] } {
  const references: PendingMetadataTargetReference[] = []
  const diagnostics: Diagnostic[] = []

  if (Array.isArray(params.value)) {
    for (const [index, item] of params.value.entries()) {
      const nested = collectObjectReferences({
        ...params,
        value: item,
        rule: params.itemRule,
        yamlPath: [...params.yamlPath, nestedItemPathSegment(item, index)],
      })
      references.push(...nested.references)
      diagnostics.push(...nested.diagnostics)
    }
    return { references, diagnostics }
  }

  const record = asRecord(params.value)
  if (!record) return { references: [], diagnostics: [] }

  for (const [key, item] of Object.entries(record)) {
    const nested = collectObjectReferences({
      ...params,
      value: item,
      rule: params.itemRule,
      yamlPath: [...params.yamlPath, key],
    })
    references.push(...nested.references)
    diagnostics.push(...nested.diagnostics)
  }
  return { references, diagnostics }
}

function pendingReferenceFromCandidate(params: {
  filePath: string
  candidate: PendingMetadataTargetReferenceCandidate
}): PendingMetadataTargetReference {
  return {
    filePath: params.filePath,
    yamlPath: params.candidate.yamlPath,
    canonical: params.candidate.canonical,
    target: params.candidate.target,
    constraint: params.candidate.constraint,
  }
}
```

- [ ] **Step 7: Run focused traversal tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/metadataTargetTraversal.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit Task 1**

```bash
git add packages/core/metadata/orchestration/property/fn.ts packages/core/metadata/orchestration/property/typeRuleRegistry.ts packages/core/metadata/commonObjects/metadataTargets/validationHandlers.ts packages/core/metadata/validation/metadataTargetTraversal.ts packages/core/metadata/validation/metadataTargetTraversal.test.ts
git add packages/core/metadata/validation/projectMetadataReferences.ts
git commit -m "feat: :sparkles: собирать pending metadata target ссылки" -m "Добавлен отдельный сбор validation references без немедленного resolver lookup. Это позволит first pass сохранять список ссылок для быстрой проверки во second pass."
```

## Task 2: Add Project Metadata Reference Snapshot

**Files:**
- Modify: `packages/core/metadata/validation/projectMetadataReferences.ts`
- Create: `packages/core/metadata/validation/projectMetadataReferences.test.ts`

- [ ] **Step 1: Write failing snapshot tests**

Create `packages/core/metadata/validation/projectMetadataReferences.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import type { ParsedMetadataTarget } from "../commonObjects/metadataTargets"
import {
  createProjectReferenceSnapshot,
  estimateProjectReferenceSnapshotBytes,
  projectMemberIndexKey,
  resolvePendingReference,
  type PendingMetadataTargetReference,
  type ProjectMemberIndexEntry,
} from "./projectMetadataReferences"

describe("project metadata references", () => {
  it("resolves indexed member references by canonical target", () => {
    const target = memberTarget("Catalog.Номенклатура.Attribute.Артикул")
    const entries: ProjectMemberIndexEntry[] = [
      {
        canonical: "Catalog.Номенклатура.Attribute.Артикул",
        target,
        result: { ok: true, filePath: "/tmp/Справочник/Номенклатура/Свойства.yaml", details: { kind: "attribute" } },
      },
    ]
    const snapshot = createProjectReferenceSnapshot({ memberIndexEntries: entries, pendingReferences: [] })

    expect(resolvePendingReference({ snapshot, reference: pending(target) })).toEqual({ ok: true })
  })

  it("falls back when member reference is not indexed", () => {
    const target = memberTarget("Catalog.Номенклатура.Attribute.НетТакого")
    const snapshot = createProjectReferenceSnapshot({ memberIndexEntries: [], pendingReferences: [] })

    expect(resolvePendingReference({ snapshot, reference: pending(target) })).toEqual({ ok: false, reason: "miss" })
  })

  it("keeps conflicting entries out of the fast path", () => {
    const target = memberTarget("Catalog.Номенклатура.Attribute.Артикул")
    const entries: ProjectMemberIndexEntry[] = [
      { canonical: "Catalog.Номенклатура.Attribute.Артикул", target, result: { ok: true, filePath: "/tmp/1.yaml" } },
      { canonical: "Catalog.Номенклатура.Attribute.Артикул", target, result: { ok: true, filePath: "/tmp/2.yaml" } },
    ]
    const snapshot = createProjectReferenceSnapshot({ memberIndexEntries: entries, pendingReferences: [] })

    expect(resolvePendingReference({ snapshot, reference: pending(target) })).toEqual({
      ok: false,
      reason: "conflict",
    })
  })

  it("estimates cloneable snapshot bytes", () => {
    const target = memberTarget("Catalog.Номенклатура.Attribute.Артикул")
    const snapshot = createProjectReferenceSnapshot({
      memberIndexEntries: [{ canonical: "Catalog.Номенклатура.Attribute.Артикул", target, result: { ok: true } }],
      pendingReferences: [pending(target)],
    })

    expect(estimateProjectReferenceSnapshotBytes(snapshot)).toBeGreaterThan(100)
  })
})

function pending(target: Extract<ParsedMetadataTarget, { kind: "member" }>): PendingMetadataTargetReference {
  return {
    filePath: "/tmp/ФункциональнаяОпция/Опция/Свойства.yaml",
    yamlPath: ["Состав", 0],
    canonical: projectMemberIndexKey(target),
    target,
    constraint: { kind: "member", owner: "explicit" },
  }
}

function memberTarget(canonical: string): Extract<ParsedMetadataTarget, { kind: "member" }> {
  const [root, objectName, memberKind, name] = canonical.split(".")
  return {
    kind: "member",
    root: root as never,
    objectName: objectName ?? "",
    segments: [{ kind: memberKind as never, name: name ?? "" }],
  }
}
```

- [ ] **Step 2: Run test and confirm it fails**

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/projectMetadataReferences.test.ts
```

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Create projectMetadataReferences module**

Replace `packages/core/metadata/validation/projectMetadataReferences.ts` with:

```ts
import type { MetadataTargetConstraint, ParsedMetadataTarget } from "../commonObjects/metadataTargets"
import type { MetadataResolveResult } from "./projectMetadataResolver"
import type { YamlPath } from "./yamlLocations"

export interface ProjectMemberIndexEntry {
  canonical: string
  target: Extract<ParsedMetadataTarget, { kind: "member" }>
  result: MetadataResolveResult
}

export interface PendingMetadataTargetReference {
  filePath: string
  yamlPath: YamlPath
  canonical: string
  target: ParsedMetadataTarget
  constraint: MetadataTargetConstraint
}

export interface ProjectReferenceSnapshot {
  memberIndex: Array<ProjectMemberIndexEntry | ProjectMemberIndexConflict>
  pendingReferences: PendingMetadataTargetReference[]
  stats: {
    memberEntries: number
    pendingReferences: number
    conflicts: number
    snapshotBytes: number
  }
}

export interface ProjectMemberIndexConflict {
  canonical: string
  conflict: true
}

export type PendingReferenceFastResult =
  | { ok: true; result?: MetadataResolveResult }
  | { ok: false; reason: "miss" | "conflict" | "unsupported" }

export function projectMemberIndexKey(target: Extract<ParsedMetadataTarget, { kind: "member" }>): string {
  return [
    target.root,
    target.objectName,
    ...(target.objectSegments ?? []).flatMap((segment) => [segment.kind, segment.objectName]),
    ...target.segments.flatMap((segment) => [segment.kind, segment.name]),
  ].join(".")
}

export function createProjectReferenceSnapshot(params: {
  memberIndexEntries: readonly ProjectMemberIndexEntry[]
  pendingReferences: readonly PendingMetadataTargetReference[]
}): ProjectReferenceSnapshot {
  const entriesByKey = new Map<string, ProjectMemberIndexEntry | ProjectMemberIndexConflict>()
  for (const entry of params.memberIndexEntries) {
    const existing = entriesByKey.get(entry.canonical)
    if (existing === undefined) {
      entriesByKey.set(entry.canonical, entry)
      continue
    }

    entriesByKey.set(entry.canonical, { canonical: entry.canonical, conflict: true })
  }

  const memberIndex = [...entriesByKey.values()]
  const snapshotWithoutBytes = {
    memberIndex,
    pendingReferences: [...params.pendingReferences],
    stats: {
      memberEntries: memberIndex.length,
      pendingReferences: params.pendingReferences.length,
      conflicts: memberIndex.filter(isConflict).length,
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

export function resolvePendingReference(params: {
  snapshot: ProjectReferenceSnapshot
  reference: PendingMetadataTargetReference
}): PendingReferenceFastResult {
  if (params.reference.target.kind !== "member") return { ok: false, reason: "unsupported" }

  const index = new Map(params.snapshot.memberIndex.map((entry) => [entry.canonical, entry]))
  const entry = index.get(projectMemberIndexKey(params.reference.target))
  if (entry === undefined) return { ok: false, reason: "miss" }
  if (isConflict(entry)) return { ok: false, reason: "conflict" }
  return { ok: true, result: entry.result }
}

export function estimateProjectReferenceSnapshotBytes(snapshot: Omit<ProjectReferenceSnapshot, "stats"> | ProjectReferenceSnapshot): number {
  return Buffer.byteLength(JSON.stringify(snapshot), "utf8")
}

function isConflict(entry: ProjectMemberIndexEntry | ProjectMemberIndexConflict): entry is ProjectMemberIndexConflict {
  return "conflict" in entry
}
```

- [ ] **Step 4: Run snapshot tests**

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/projectMetadataReferences.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 2**

```bash
git add packages/core/metadata/validation/projectMetadataReferences.ts packages/core/metadata/validation/projectMetadataReferences.test.ts
git commit -m "feat: :sparkles: добавить snapshot metadata references" -m "Добавлен cloneable snapshot для member index entries и pending references. Snapshot умеет fast lookup, конфликтные ключи и оценку размера передаваемых данных."
```

## Task 3: Build Member Index Entries in First Pass

**Files:**
- Modify: `packages/core/metadata/validation/projectMetadataResolverRegistry.ts`
- Modify: `packages/core/metadata/commonObjects/metadataTargetProjectResolvers/register.ts`
- Modify: `packages/core/metadata/validation/projectValidationPasses.ts`
- Modify: `packages/core/metadata/validation/projectValidationTypes.ts`
- Create: `packages/core/metadata/validation/projectValidationPasses.test.ts`

- [ ] **Step 1: Add failing first-pass test**

Create `packages/core/metadata/validation/projectValidationPasses.test.ts`:

```ts
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { dirname, join } from "path"
import { afterEach, describe, expect, it } from "vitest"
import { mockContext } from "../../tests/mockContext"
import { createProjectYamlCache } from "./projectYamlCache"
import { resolveValidationProjectFile } from "./projectFiles"
import { createValidationSchemaCache, validateProjectFileFirstPass } from "./projectValidationPasses"

describe("validateProjectFileFirstPass references", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
  })

  it("builds member index entries from owner fields", () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-validation-first-pass-"))
    tempDirs.push(projectDir)
    writeProjectFile(projectDir, "Справочник/Номенклатура/Свойства.yaml", [
      "Реквизиты:",
      "  Артикул:",
      "    Тип: Строка",
    ])
    const file = resolveValidationProjectFile(projectDir, join(projectDir, "Справочник/Номенклатура/Свойства.yaml"))
    if (!file) throw new Error("file not resolved")

    const first = validateProjectFileFirstPass({
      projectDir,
      file,
      cache: createProjectYamlCache(),
      context: mockContext,
      schemaCache: createValidationSchemaCache(mockContext),
    })

    expect(first.memberIndexEntries).toEqual([
      expect.objectContaining({
        canonical: "Catalog.Номенклатура.Attribute.Артикул",
        result: expect.objectContaining({
          ok: true,
          filePath: join(projectDir, "Справочник", "Номенклатура", "Свойства.yaml"),
          details: expect.objectContaining({ kind: "attribute", name: "Артикул" }),
        }),
      }),
    ])
  })
})

function writeProjectFile(projectDir: string, projectPath: string, lines: string[] | string): void {
  const filePath = join(projectDir, ...projectPath.split("/"))
  mkdirSync(dirname(filePath), { recursive: true })
  const text = Array.isArray(lines) ? lines.join("\n") : lines
  writeFileSync(filePath, `${text.trimEnd()}\n`)
}
```

- [ ] **Step 2: Run first-pass test and confirm it fails**

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/projectValidationPasses.test.ts
```

Expected: FAIL because `memberIndexEntries` is not present.

- [ ] **Step 3: Extend validation result types**

In `packages/core/metadata/validation/projectValidationTypes.ts`, import:

```ts
import type { PendingMetadataTargetReference, ProjectMemberIndexEntry } from "./projectMetadataReferences"
```

Add fields:

```ts
export interface ValidationObjectRecord {
  filePath: string
  projectPath: string
  kind: ValidationProjectFile["kind"]
  owner: { dir: string; name: string }
  ownerRef?: OwnerTypeRef
  model?: unknown
  fieldIndex?: ObjectFieldIndex
  memberIndexEntries?: ProjectMemberIndexEntry[]
  pendingReferences?: PendingMetadataTargetReference[]
  importDiagnostics: Diagnostic[]
}
```

In `packages/core/metadata/validation/projectValidationPasses.ts`, import the same types and extend `ProjectValidationFirstPassResult`:

```ts
export interface ProjectValidationFirstPassResult {
  state: ProjectValidationFileState
  objectRecords: ValidationObjectRecord[]
  memberIndexEntries: ProjectMemberIndexEntry[]
  pendingReferences: PendingMetadataTargetReference[]
  diagnostics: Diagnostic[]
}
```

Update `failedFirstPass` and form first pass returns to include empty arrays:

```ts
memberIndexEntries: [],
pendingReferences: [],
```

- [ ] **Step 4: Add member index contributor registry**

In `packages/core/metadata/validation/projectMetadataResolverRegistry.ts`, import `ProjectMemberIndexEntry`:

```ts
import type { ProjectMemberIndexEntry } from "./projectMetadataReferences"
```

Add type and registry:

```ts
export type ProjectMemberIndexContributor = (params: {
  projectDir: string
  owner: OwnerMetadata
  hasFile: (filePath: string) => boolean
}) => Iterable<ProjectMemberIndexEntry>

const memberIndexContributors: ProjectMemberIndexContributor[] = []

export function registerProjectMemberIndexContributor(contributor: ProjectMemberIndexContributor): void {
  memberIndexContributors.push(contributor)
}

export function getProjectMemberIndexContributors(): readonly ProjectMemberIndexContributor[] {
  return memberIndexContributors
}
```

Add it to snapshot/restore/clear test helpers.

- [ ] **Step 5: Add field contributor in projectValidationPasses**

In `packages/core/metadata/validation/projectValidationPasses.ts`, add helper:

```ts
function buildMemberIndexEntries(params: {
  projectDir: string
  owner: OwnerMetadata
  hasFile: (filePath: string) => boolean
}): ProjectMemberIndexEntry[] {
  const entries: ProjectMemberIndexEntry[] = []

  for (const field of params.owner.fieldIndex.fields.values()) {
    const target = fieldTarget(params.owner, field)
    entries.push({
      canonical: projectMemberIndexKey(target),
      target,
      result: { ok: true, filePath: params.owner.filePath, details: field },
    })

    if (field.kind === "tabularSection" && field.tableSource) {
      for (const column of field.tableSource.columns.values()) {
        const nestedTarget = nestedFieldTarget(params.owner, field.name, column)
        entries.push({
          canonical: projectMemberIndexKey(nestedTarget),
          target: nestedTarget,
          result: { ok: true, filePath: params.owner.filePath, details: column },
        })
      }
    }
  }

  for (const contributor of getProjectMemberIndexContributors()) {
    entries.push(...contributor(params))
  }

  return entries
}
```

Add field target helpers:

```ts
function fieldTarget(owner: OwnerMetadata, field: ObjectField): Extract<ParsedMetadataTarget, { kind: "member" }> {
  return {
    kind: "member",
    root: rootFromYAML[owner.ref.kind] as never,
    objectName: owner.ref.name ?? "",
    segments: [{ kind: metadataFieldKindFromObjectFieldKind(field.kind), name: field.name }],
  }
}

function nestedFieldTarget(
  owner: OwnerMetadata,
  tabularSectionName: string,
  field: ObjectField
): Extract<ParsedMetadataTarget, { kind: "member" }> {
  return {
    kind: "member",
    root: rootFromYAML[owner.ref.kind] as never,
    objectName: owner.ref.name ?? "",
    segments: [
      { kind: "TabularSection", name: tabularSectionName },
      { kind: metadataFieldKindFromObjectFieldKind(field.kind), name: field.name },
    ],
  }
}

function metadataFieldKindFromObjectFieldKind(kind: ObjectFieldKind): MetadataFieldKind {
  switch (kind) {
    case "attribute":
      return "Attribute"
    case "standardAttribute":
      return "StandardAttribute"
    case "tabularSection":
      return "TabularSection"
    case "dimension":
      return "Dimension"
    case "resource":
      return "Resource"
    case "addressingAttribute":
      return "AddressingAttribute"
  }
}
```

Use exact imports:

```ts
import type { MetadataFieldKind, ParsedMetadataTarget } from "../commonObjects/metadataTargets"
import type { OwnerMetadata } from "./dataPath/ownerCache"
import type { ObjectField, ObjectFieldKind } from "./dataPath/objectFields"
import { getProjectMemberIndexContributors } from "./projectMetadataResolverRegistry"
import { projectMemberIndexKey, type ProjectMemberIndexEntry } from "./projectMetadataReferences"
```

- [ ] **Step 6: Return member entries from properties first pass**

In `validateProjectPropertiesFirstPass`, build `fieldIndex` once:

```ts
  const fieldIndex = buildObjectFieldIndex(ownerWithoutIndex)
  const owner: OwnerMetadata = {
    ...ownerWithoutIndex,
    fieldIndex,
  }
  const memberIndexEntries = buildMemberIndexEntries({
    projectDir: params.projectDir,
    owner,
    hasFile: (filePath) => fs.existsSync(filePath),
  })
```

Use `fieldIndex` in `objectRecords[0].fieldIndex`, and return:

```ts
    memberIndexEntries,
    pendingReferences: [],
```

Also include on the object record:

```ts
memberIndexEntries,
```

- [ ] **Step 7: Register collection/file-backed contributors**

In `packages/core/metadata/commonObjects/metadataTargetProjectResolvers/register.ts`, add import:

```ts
import { rootFromYAML } from "../metadataTargets/roots"
import {
  registerProjectMemberIndexContributor,
  registerProjectMemberResolver,
  type ProjectMemberIndexContributor,
  type ProjectMemberResolver,
} from "../../validation/projectMetadataResolverRegistry"
import { projectMemberIndexKey, type ProjectMemberIndexEntry } from "../../validation/projectMetadataReferences"
```

Add helper:

```ts
function collectionMemberIndexContributor(params: {
  modelName: string
  kind: ProjectMemberIndexEntry["target"]["segments"][number]["kind"]
}): ProjectMemberIndexContributor {
  return ({ owner }) => {
    const root = rootFromYAML[owner.ref.kind]
    if (!root || !owner.ref.name) return []
    const collection = metadataRecord(owner.model)[params.modelName]
    const entries: ProjectMemberIndexEntry[] = []

    for (const item of collectionItems(collection)) {
      const target = {
        kind: "member",
        root,
        objectName: owner.ref.name,
        segments: [{ kind: params.kind, name: item.name }],
      } as const
      entries.push({
        canonical: projectMemberIndexKey(target),
        target,
        result: { ok: true, filePath: owner.filePath, details: { kind: params.kind, name: item.name, item: item.item } },
      })
    }

    return entries
  }
}

function collectionItems(collection: unknown): Array<{ name: string; item: unknown }> {
  if (typeof collection === "string") return [{ name: collection, item: collection }]
  if (Array.isArray(collection)) {
    return collection.flatMap((item) => {
      if (typeof item === "string") return [{ name: item, item }]
      if (typeof item === "object" && item !== null && typeof (item as Record<string, unknown>)["name"] === "string") {
        return [{ name: (item as Record<string, unknown>)["name"] as string, item }]
      }
      return []
    })
  }
  if (typeof collection === "object" && collection !== null) {
    return Object.entries(collection).map(([name, item]) => ({ name, item }))
  }
  return []
}
```

Register collection contributors after existing resolver registrations:

```ts
registerProjectMemberIndexContributor(collectionMemberIndexContributor({ modelName: "forms", kind: "Form" }))
registerProjectMemberIndexContributor(collectionMemberIndexContributor({ modelName: "templates", kind: "Template" }))
registerProjectMemberIndexContributor(collectionMemberIndexContributor({ modelName: "commands", kind: "Command" }))
registerProjectMemberIndexContributor(collectionMemberIndexContributor({ modelName: "accountingFlags", kind: "AccountingFlag" }))
registerProjectMemberIndexContributor(collectionMemberIndexContributor({ modelName: "extDimensionAccountingFlags", kind: "ExtDimensionAccountingFlag" }))
registerProjectMemberIndexContributor(collectionMemberIndexContributor({ modelName: "fields", kind: "Field" }))
registerProjectMemberIndexContributor(collectionMemberIndexContributor({ modelName: "dimensions", kind: "Dimension" }))
registerProjectMemberIndexContributor(collectionMemberIndexContributor({ modelName: "resources", kind: "Resource" }))
```

Skip file-backed form/template contributors in this task. They remain covered by fallback and can be added after profiling if needed.

- [ ] **Step 8: Run first-pass and resolver registry tests**

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/projectValidationPasses.test.ts metadata/validation/projectMetadataResolverRegistry.test.ts
```

Expected: PASS.

- [ ] **Step 9: Commit Task 3**

```bash
git add packages/core/metadata/validation/projectMetadataResolverRegistry.ts packages/core/metadata/commonObjects/metadataTargetProjectResolvers/register.ts packages/core/metadata/validation/projectValidationPasses.ts packages/core/metadata/validation/projectValidationTypes.ts packages/core/metadata/validation/projectValidationPasses.test.ts
git commit -m "feat: :sparkles: строить member index в first pass" -m "First pass теперь формирует memberIndexEntries из fieldIndex и зарегистрированных collection contributors. Это готовит fast lookup для second pass без повторного обхода owner-моделей."
```

## Task 4: Collect Pending References in First Pass

**Files:**
- Modify: `packages/core/metadata/validation/projectValidationPasses.ts`
- Modify: `packages/core/metadata/validation/projectValidationTypes.ts`
- Modify: `packages/core/metadata/validation/projectValidationPasses.test.ts`

- [ ] **Step 1: Add failing test for pending references**

Append to `projectValidationPasses.test.ts`:

```ts
  it("collects pending metadata target references during first pass", () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-validation-first-pass-"))
    tempDirs.push(projectDir)
    writeProjectFile(projectDir, "ФункциональнаяОпция/ИспользоватьАртикулы/Свойства.yaml", [
      "СоставФункциональнойОпции:",
      "  - Catalog.Номенклатура.Attribute.Артикул",
    ])
    const file = resolveValidationProjectFile(
      projectDir,
      join(projectDir, "ФункциональнаяОпция/ИспользоватьАртикулы/Свойства.yaml")
    )
    if (!file) throw new Error("file not resolved")

    const first = validateProjectFileFirstPass({
      projectDir,
      file,
      cache: createProjectYamlCache(),
      context: mockContext,
      schemaCache: createValidationSchemaCache(mockContext),
    })

    expect(first.pendingReferences).toEqual([
      expect.objectContaining({
        canonical: "Catalog.Номенклатура.Attribute.Артикул",
        target: expect.objectContaining({ kind: "member", objectName: "Номенклатура" }),
      }),
    ])
  })
```

- [ ] **Step 2: Run test and confirm it fails**

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/projectValidationPasses.test.ts
```

Expected: FAIL because pending references are empty.

- [ ] **Step 3: Collect pending references in properties first pass**

In `projectValidationPasses.ts`, import:

```ts
import { collectMetadataTargetReferencesInModel } from "./metadataTargetTraversal"
```

After `memberIndexEntries`, compute owner context:

```ts
  const ownerRoot = rootFromYAML[params.file.owner.dir]
  const metadataTargetOwner = ownerRoot ? { root: ownerRoot, objectName: params.file.owner.name } : undefined
  const pendingReferences = collectMetadataTargetReferencesInModel({
    filePath: params.file.absolutePath,
    parsed,
    model: imported.model,
    rule: params.file.owner.spec.rule,
    owner: metadataTargetOwner,
  })
```

Add `...pendingReferences.diagnostics` into `diagnostics`, and return:

```ts
pendingReferences: pendingReferences.references,
```

Add `pendingReferences: pendingReferences.references` to the object record.

- [ ] **Step 4: Run first-pass tests**

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/projectValidationPasses.test.ts metadata/validation/metadataTargetTraversal.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 4**

```bash
git add packages/core/metadata/validation/projectValidationPasses.ts packages/core/metadata/validation/projectValidationTypes.ts packages/core/metadata/validation/projectValidationPasses.test.ts
git commit -m "feat: :sparkles: собирать pending references в first pass" -m "First pass теперь сохраняет metadataTarget-ссылки для последующей проверки по общему snapshot. Structure diagnostics при разборе ссылок остаются диагностикой first pass."
```

## Task 5: Wire Snapshot Through Workers

**Files:**
- Modify: `packages/core/metadata/validation/projectValidationObjectTable.ts`
- Modify: `packages/core/metadata/validation/projectValidationWorker.ts`
- Modify: `packages/core/metadata/validation/projectValidationWorkerPool.ts`
- Modify: `packages/core/metadata/validation/validateProject.ts`
- Test: `packages/core/metadata/validation/projectValidationWorkerPool.test.ts`

- [ ] **Step 1: Add failing worker pool test**

In `packages/core/metadata/validation/projectValidationWorkerPool.test.ts`, add a unit test for partitioning helper after existing `createWorkerTableSupplement` tests:

```ts
import { partitionPendingReferencesForWorkers } from "./projectValidationWorkerPool"
import type { PendingMetadataTargetReference } from "./projectMetadataReferences"

it("partitions pending references by count instead of file ownership", () => {
  const references = Array.from({ length: 7 }, (_, index) => pendingReference(index))

  expect(partitionPendingReferencesForWorkers(references, 3).map((items) => items.length)).toEqual([3, 2, 2])
})

function pendingReference(index: number): PendingMetadataTargetReference {
  return {
    filePath: `/tmp/${index}.yaml`,
    yamlPath: ["Состав", index],
    canonical: `Catalog.Номенклатура.Attribute.Поле${index}`,
    target: {
      kind: "member",
      root: "Catalog",
      objectName: "Номенклатура",
      segments: [{ kind: "Attribute", name: `Поле${index}` }],
    },
    constraint: { kind: "member", owner: "explicit" },
  }
}
```

- [ ] **Step 2: Run worker pool test and confirm it fails**

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/projectValidationWorkerPool.test.ts
```

Expected: FAIL because `partitionPendingReferencesForWorkers` is not exported.

- [ ] **Step 3: Extend object table snapshot**

In `projectValidationObjectTable.ts`, update `snapshot()` to include pending/member entries collected from records:

```ts
snapshot() {
  const records = [...recordsByOwner.values()]
  return {
    records,
    filePaths: [...filePaths],
    memberIndexEntries: records.flatMap((record) => record.memberIndexEntries ?? []),
    pendingReferences: records.flatMap((record) => record.pendingReferences ?? []),
  }
}
```

In `createValidationObjectTable`, no extra merge map is needed for first iteration because entries live on records.

- [ ] **Step 4: Extend worker message types**

In `projectValidationWorker.ts`, import `ProjectReferenceSnapshot` and `PendingMetadataTargetReference`.

Add fields to second pass message:

```ts
referenceSnapshot: ProjectReferenceSnapshot
pendingReferences: PendingMetadataTargetReference[]
```

Extend `WorkerValidationState`:

```ts
memberIndexEntries: ProjectMemberIndexEntry[]
pendingReferences: PendingMetadataTargetReference[]
```

Initialize arrays in `createEmptyWorkerValidationState`.

In `runFirstPass`, push:

```ts
workerState.memberIndexEntries.push(...first.memberIndexEntries)
workerState.pendingReferences.push(...first.pendingReferences)
```

Return them from first pass result:

```ts
return { diagnostics, objectRecords, memberIndexEntries: workerState.memberIndexEntries, pendingReferences: workerState.pendingReferences }
```

Update message response types in worker and pool to include the arrays.

- [ ] **Step 5: Build and partition snapshot in worker pool**

In `projectValidationWorkerPool.ts`, import:

```ts
import {
  createProjectReferenceSnapshot,
  type PendingMetadataTargetReference,
  type ProjectMemberIndexEntry,
} from "./projectMetadataReferences"
```

Extend `FirstPassPoolResult`:

```ts
memberIndexEntries: ProjectMemberIndexEntry[]
pendingReferences: PendingMetadataTargetReference[]
```

Merge first pass arrays:

```ts
return {
  diagnostics: results.flatMap((result) => result.diagnostics),
  objectRecords: results.flatMap((result) => result.objectRecords),
  memberIndexEntries: results.flatMap((result) => result.memberIndexEntries),
  pendingReferences: results.flatMap((result) => result.pendingReferences),
}
```

Export partition helper:

```ts
export function partitionPendingReferencesForWorkers(
  references: readonly PendingMetadataTargetReference[],
  count: number
): PendingMetadataTargetReference[][] {
  const partitions = Array.from({ length: count }, () => [] as PendingMetadataTargetReference[])
  references.forEach((reference, index) => partitions[index % count]?.push(reference))
  return partitions
}
```

In `runSecondPass`, build snapshot before worker requests:

```ts
const referenceSnapshot = createProjectReferenceSnapshot({
  memberIndexEntries: secondPassParams.objectTable.memberIndexEntries ?? [],
  pendingReferences: secondPassParams.objectTable.pendingReferences ?? [],
})
const referencePartitions = partitionPendingReferencesForWorkers(referenceSnapshot.pendingReferences, workers.length)
```

Pass `referenceSnapshot` and `pendingReferences: referencePartitions[index] ?? []` to workers.

- [ ] **Step 6: Wire validateProject object table snapshot**

In `validateProjectWithWorkers`, after first pass:

```ts
const objectTable = createValidationObjectTable({
  records: first.objectRecords,
  filePaths: [],
})
```

The `memberIndexEntries` and `pendingReferences` values come from `ValidationObjectRecord` fields and are exposed by `objectTable.snapshot()`. Add these optional fields to `ValidationObjectTableSnapshot`:

```ts
memberIndexEntries?: ProjectMemberIndexEntry[]
pendingReferences?: PendingMetadataTargetReference[]
```

For in-process path, after `processPendingFirstPasses`, build snapshot from `objectTable.snapshot()`. Do not yet change validation semantics in this task.

- [ ] **Step 7: Run worker pool tests**

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/projectValidationWorkerPool.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit Task 5**

```bash
git add packages/core/metadata/validation/projectValidationObjectTable.ts packages/core/metadata/validation/projectValidationWorker.ts packages/core/metadata/validation/projectValidationWorkerPool.ts packages/core/metadata/validation/validateProject.ts packages/core/metadata/validation/projectValidationWorkerPool.test.ts packages/core/metadata/validation/projectValidationTypes.ts
git commit -m "feat: :sparkles: передавать reference snapshot в worker validation" -m "Worker pool собирает member index и pending references из first pass, строит cloneable snapshot и распределяет pending references по worker-ам второго прохода."
```

## Task 6: Validate Pending References by Snapshot

**Files:**
- Modify: `packages/core/metadata/validation/projectMetadataReferences.ts`
- Modify: `packages/core/metadata/validation/projectValidationPasses.ts`
- Modify: `packages/core/metadata/validation/projectValidationWorker.ts`
- Modify: `packages/core/metadata/validation/validateProject.ts`
- Test: `packages/core/metadata/validation/validateProject.test.ts`

- [ ] **Step 1: Add failing fast validation test**

Append this test to `packages/core/metadata/validation/projectMetadataReferences.test.ts` in the existing `project metadata references` `describe` block:

```ts
  it("validates pending references through the fast path", () => {
    const target = memberTarget("Catalog.Номенклатура.Attribute.Артикул")
    const snapshot = createProjectReferenceSnapshot({
      memberIndexEntries: [
        {
          canonical: "Catalog.Номенклатура.Attribute.Артикул",
          target,
          result: { ok: true, filePath: "/tmp/Справочник/Номенклатура/Свойства.yaml" },
        },
      ],
      pendingReferences: [pending(target)],
    })

    expect(
      validatePendingReferences({
        snapshot,
        references: snapshot.pendingReferences,
        resolver: {} as never,
      })
    ).toEqual({ diagnostics: [], hits: 1, misses: 0, fallbacks: 0 })
  })
```

Extend the import from `./projectMetadataReferences`:

```ts
  validatePendingReferences,
```

- [ ] **Step 2: Run fast validation test and confirm it fails**

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/projectMetadataReferences.test.ts -t "validates pending references through the fast path"
```

Expected: FAIL because `validatePendingReferences` is not exported.

- [ ] **Step 3: Add fast validation function**

In `projectMetadataReferences.ts`, add:

```ts
import type { Diagnostic } from "./types"
import type { ProjectMetadataResolver } from "./projectMetadataResolver"

export interface ValidatePendingReferencesResult {
  diagnostics: Diagnostic[]
  hits: number
  misses: number
  fallbacks: number
}

export function validatePendingReferences(params: {
  snapshot: ProjectReferenceSnapshot
  references: readonly PendingMetadataTargetReference[]
  resolver: ProjectMetadataResolver
}): ValidatePendingReferencesResult {
  const diagnostics: Diagnostic[] = []
  let hits = 0
  let misses = 0
  let fallbacks = 0

  for (const reference of params.references) {
    const fast = resolvePendingReference({ snapshot: params.snapshot, reference })
    if (fast.ok) {
      hits += 1
      continue
    }

    misses += 1
    fallbacks += 1
    diagnostics.push(...resolveReferenceByResolver({ reference, resolver: params.resolver }))
  }

  return { diagnostics, hits, misses, fallbacks }
}

function resolveReferenceByResolver(params: {
  reference: PendingMetadataTargetReference
  resolver: ProjectMetadataResolver
}): Diagnostic[] {
  const { target, constraint } = params.reference
  if (target.kind === "object") {
    const result = params.resolver.resolveObject({
      target,
      filters: constraint.kind === "object" ? constraint.filters : undefined,
    })
    return result.ok ? [] : result.diagnostics
  }

  if (target.kind === "member" && constraint.kind === "member") {
    const result = params.resolver.resolveMember({ target, filters: constraint.filters })
    return result.ok ? [] : result.diagnostics
  }

  if (target.kind === "value") {
    const result = params.resolver.resolveValue({ target })
    return result.ok ? [] : result.diagnostics
  }

  return []
}
```

- [ ] **Step 4: Add integration test for full validation**

In `packages/core/metadata/validation/validateProject.test.ts`, add this test in the existing `validateProject` `describe` block:

```ts
  it("validates functional option content through pending reference snapshot", async () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-validation-"))
    tempDirs.push(projectDir)
    writeProjectFile(projectDir, "Справочник/Номенклатура/Свойства.yaml", [
      "Реквизиты:",
      "  Артикул:",
      "    Тип: Строка",
    ])
    writeProjectFile(projectDir, "ФункциональнаяОпция/ИспользоватьАртикулы/Свойства.yaml", [
      "СоставФункциональнойОпции:",
      "  - Catalog.Номенклатура.Attribute.Артикул",
    ])

    await expect(validateProject({ projectDir, concurrency: 2 })).resolves.toEqual({ diagnostics: [] })
  })
```

- [ ] **Step 5: Run integration test**

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/validateProject.test.ts -t "validates functional option content through pending reference snapshot"
```

Expected: PASS.

- [ ] **Step 6: Use pending references in worker second pass**

In `projectValidationWorker.ts`, after creating `metadataResolver` and before per-file loop, run:

```ts
const referenceStartedAt = performance.now()
const referenceResult = validatePendingReferences({
  snapshot: message.referenceSnapshot,
  references: message.pendingReferences,
  resolver: metadataResolver,
})
diagnostics.push(...referenceResult.diagnostics)
```

Then adjust the per-file loop so it no longer calls `validateMetadataTargetsInModel` for full worker mode. Add a parameter to `validateProjectFileSecondPass`:

```ts
skipMetadataTargetValidation?: boolean
```

In `validateProjectFileSecondPass`, wrap metadata target validation:

```ts
const diagnostics = params.skipMetadataTargetValidation
  ? []
  : validateMetadataTargetsInModel({
      filePath: params.state.file.absolutePath,
      parsed: params.state.parsed,
      model: params.state.model,
      rule: params.state.file.owner.spec.rule,
      resolver: recorder.resolver,
      owner,
    })
```

Call it from worker with `skipMetadataTargetValidation: true`.

- [ ] **Step 7: Use pending references in in-process full validation**

In `validateProjectInProcess`, after first pass has completed and before `secondPassPending`, build:

```ts
const referenceSnapshot = createProjectReferenceSnapshot({
  memberIndexEntries: objectTable.snapshot().memberIndexEntries ?? [],
  pendingReferences: objectTable.snapshot().pendingReferences ?? [],
})
```

For full mode only (`params.filePath === undefined`), validate references once:

```ts
const referenceResult = validatePendingReferences({
  snapshot: referenceSnapshot,
  references: referenceSnapshot.pendingReferences,
  resolver: createProjectMetadataResolverFromValidationTable({
    projectDir,
    table: objectTable,
    mode: queue.mode,
    ownerCache: createOwnerMetadataCacheFromValidationTable({ projectDir, table: objectTable }),
    yamlCache: createProjectYamlCacheFromEntries([...entries.values()]),
  }),
})
diagnostics.push(...referenceResult.diagnostics)
```

Then pass `skipMetadataTargetValidation: params.filePath === undefined` into `validateProjectFileSecondPass`. Keep partial mode unchanged.

- [ ] **Step 8: Run validation tests**

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/projectMetadataReferences.test.ts metadata/validation/validateProject.test.ts metadata/validation/projectValidationPasses.test.ts
```

Expected: PASS.

- [ ] **Step 9: Commit Task 6**

```bash
git add packages/core/metadata/validation/projectMetadataReferences.ts packages/core/metadata/validation/projectValidationPasses.ts packages/core/metadata/validation/projectValidationWorker.ts packages/core/metadata/validation/validateProject.ts packages/core/metadata/validation/validateProject.test.ts
git commit -m "perf: :zap: проверять references через snapshot" -m "Full validation проверяет pending metadataTarget references по member index snapshot. Старый ProjectMetadataResolver остаётся запасным путём для miss/conflict/unsupported cases и partial validation."
```

## Task 7: Add Profiling and Measurement

**Files:**
- Modify: `packages/core/metadata/validation/projectValidationWorker.ts`
- Modify: `packages/core/metadata/validation/projectValidationWorkerPool.ts`
- Modify: `packages/core/metadata/validation/validateProject.ts`

- [ ] **Step 1: Add timing/profile fields**

In `projectValidationWorker.ts`, extend timing:

```ts
referenceValidationMs: number
referenceHits: number
referenceMisses: number
referenceFallbacks: number
snapshotBytes: number
pendingReferences: number
memberIndexEntries: number
```

Populate from `referenceResult` and `message.referenceSnapshot.stats`.

- [ ] **Step 2: Log reference timing in worker pool**

In `logSecondPassTiming`, append fields:

```ts
`referenceValidation=${result.timing.referenceValidationMs.toFixed(2)}ms`,
`referenceHits=${result.timing.referenceHits}`,
`referenceMisses=${result.timing.referenceMisses}`,
`referenceFallbacks=${result.timing.referenceFallbacks}`,
`snapshotBytes=${result.timing.snapshotBytes}`,
```

In `logSecondPassProfile`, add one summary line before by-kind summary:

```ts
console.error(
  [
    "[validation-profile] references second-pass",
    `hits=${totals.hits}`,
    `misses=${totals.misses}`,
    `fallbacks=${totals.fallbacks}`,
    `snapshotBytes=${totals.snapshotBytes}`,
    `pending=${totals.pendingReferences}`,
    `entries=${totals.memberIndexEntries}`,
  ].join(" ")
)
```

- [ ] **Step 3: Run focused tests**

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/projectValidationWorkerPool.test.ts metadata/validation/validateProject.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit Task 7**

```bash
git add packages/core/metadata/validation/projectValidationWorker.ts packages/core/metadata/validation/projectValidationWorkerPool.ts packages/core/metadata/validation/validateProject.ts
git commit -m "chore: :wrench: профилировать reference snapshot validation" -m "Validation timing показывает размер reference snapshot, число pending references и hit/miss/fallback статистику fast path."
```

## Task 8: Full Verification and Validation Measurement

**Files:**
- No code changes unless verification reveals a bug.

- [ ] **Step 1: Run full tests**

Run:

```bash
pnpm test
```

Expected: all package tests pass.

- [ ] **Step 2: Run validation without profile**

Run:

```bash
/usr/bin/time -p pnpm --filter @nakidka/cli exec tsx src/cli.ts validate /Users/nikita/git/nkdk-yaml
```

Expected:

```text
summary: 0 error, 0 warning
```

Record `real`, `user`, `sys`.

If this fails with `listen EPERM` for `tsx` pipe under system temp, rerun the same command with sandbox escalation.

- [ ] **Step 3: Run validation with profile**

Run:

```bash
env NKDK_VALIDATION_PROFILE=1 NKDK_VALIDATION_TIMING=1 /usr/bin/time -p pnpm --filter @nakidka/cli exec tsx src/cli.ts validate /Users/nikita/git/nkdk-yaml
```

Expected:

```text
summary: 0 error, 0 warning
[validation-profile] references second-pass hits=<n> misses=<n> fallbacks=<n> snapshotBytes=<n> pending=<n> entries=<n>
```

Record:

- `properties:ФункциональнаяОпция total`;
- `properties:КритерийОтбора total`;
- combined total compared with current `35.23s`;
- `referenceHits/referenceMisses/referenceFallbacks`;
- `snapshotBytes`;
- worker `second pass validation`;
- `real/user/sys`.

If sandbox EPERM happens, rerun with escalation.

- [ ] **Step 4: Inspect diff and history**

Run:

```bash
git status --short
git log --oneline -8
```

Expected: clean tree after task commits.
