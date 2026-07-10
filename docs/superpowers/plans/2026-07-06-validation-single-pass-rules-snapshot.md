# Validation Single-Pass Rules Snapshot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Перевести validation worker на одно чтение YAML без построения metadata/form model, сохранив текущие shared snapshots и проверку `/Users/nikita/git/nkdk-yaml`.

**Architecture:** Главный процесс строит JSON-совместимый `rulesSnapshot` из текущей полной регистрации. Worker читает YAML один раз, проверяет schema, извлекает компактные facts/checks напрямую из `parsed.data`, а затем разрешает pending checks по текущим shared snapshots без повторного чтения YAML.

**Tech Stack:** TypeScript 5.9, Vitest, Node.js Worker Threads, текущие `validationSnapshotProvider`, `sharedProjectReferenceIndex`, `sharedValidationBinaryOwners`, TypeBox validation.

---

## File Structure

- Create: `packages/core/metadata/validation/rulesSnapshot.ts`
  - JSON-совместимые типы `ValidationRulesSnapshot`, builder из текущих project specs/rules, проверки clone/stringify.
- Create: `packages/core/metadata/validation/rulesSnapshot.test.ts`
  - Проверяет JSON-совместимость и минимальное покрытие объектов/форм.
- Create: `packages/core/metadata/validation/yamlFactExtractor.ts`
  - Тонкий extractor поверх `parsed.data + ValidationProjectFile + ValidationRulesSnapshot`; не импортирует `fromYAML`.
- Create: `packages/core/metadata/validation/yamlFactExtractor.test.ts`
  - TDD для properties/forms facts на существующих fixtures.
- Create: `packages/core/metadata/validation/projectValidationPendingChecks.ts`
  - Компактные отложенные проверки, включая `dataPath`.
- Create: `packages/core/metadata/validation/dataPath/ownerFacts.ts`
  - Компактные owner facts и adapter в current owner snapshot structures.
- Modify: `packages/core/metadata/validation/projectValidationTypes.ts`
  - Заменить model-bearing `ValidationObjectRecord` на compact owner facts.
- Modify: `packages/core/metadata/validation/projectValidationPasses.ts`
  - Переключить first pass на extractor, а state - на pending facts/checks.
- Modify: `packages/core/metadata/validation/projectValidationWorker.ts`
  - Инициализировать `rulesSnapshot`, убрать model/form state retention, очистить state после second pass.
- Modify: `packages/core/metadata/validation/projectValidationWorkerPool.ts`
  - Передавать `rulesSnapshot` при init; логировать размеры facts/snapshot под profile.
- Modify: `packages/core/metadata/validation/validateProject.ts`
  - Строить `rulesSnapshot`, передавать worker pool, сохранить in-process compatibility path.
- Modify: `packages/core/metadata/validation/validationSnapshotProvider.ts`
  - При необходимости принимать compact owner facts без model.
- Test: `packages/core/metadata/validation/validateProject.test.ts`
- Test: `packages/core/metadata/validation/projectValidationWorkerPool.test.ts`
- Test: `packages/cli/src/commands/validate.test.ts`

## Task 1: Baseline Guards For Current Validation State

**Files:**
- Modify: `packages/core/metadata/validation/projectValidationWorkerPool.test.ts`
- Modify: `packages/core/metadata/validation/projectValidationWorker.ts`
- Test: `packages/core/metadata/validation/projectValidationWorkerPool.test.ts`

- [ ] **Step 1: Add worker state test export**

In `packages/core/metadata/validation/projectValidationWorker.ts`, export a test-only state summary near the bottom of the file:

```ts
export function workerStateStatsForTests(): {
  retainedEntries: number
  retainedStates: number
  retainedPropertyModels: number
  retainedFormStates: number
} {
  const states = [...workerState.states.values()]
  return {
    retainedEntries: workerState.entries.size,
    retainedStates: workerState.states.size,
    retainedPropertyModels: states.filter((state) => state.kind === "properties" && "model" in state).length,
    retainedFormStates: states.filter((state) => state.kind === "form" && "formState" in state).length,
  }
}
```

- [ ] **Step 2: Add a failing retention test**

In `packages/core/metadata/validation/projectValidationWorkerPool.test.ts`, add:

```ts
it("does not retain YAML entries or model state after worker validation", async () => {
  const worker = await import("./projectValidationWorker")

  expect(worker.workerStateStatsForTests()).toEqual({
    retainedEntries: 0,
    retainedStates: 0,
    retainedPropertyModels: 0,
    retainedFormStates: 0,
  })
})
```

- [ ] **Step 3: Run the focused test**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/projectValidationWorkerPool.test.ts -t "does not retain YAML entries"
```

Expected: PASS initially because the worker module is freshly imported. This establishes the exported guard for later tasks.

- [ ] **Step 4: Commit the guard**

```bash
git add packages/core/metadata/validation/projectValidationWorker.ts packages/core/metadata/validation/projectValidationWorkerPool.test.ts
git commit -m "test: :white_check_mark: добавить guard состояния validation worker"
```

## Task 2: Introduce Pending Checks And Compact File State

**Files:**
- Create: `packages/core/metadata/validation/projectValidationPendingChecks.ts`
- Modify: `packages/core/metadata/validation/projectValidationPasses.ts`
- Modify: `packages/core/metadata/validation/projectValidationWorker.ts`
- Test: `packages/core/metadata/validation/projectValidationPasses.test.ts`
- Test: `packages/core/metadata/validation/projectValidationWorkerPool.test.ts`

- [ ] **Step 1: Create pending check types**

Create `packages/core/metadata/validation/projectValidationPendingChecks.ts`:

```ts
import type { OwnerTypeRef } from "./dataPath/types"
import type { Diagnostic } from "./types"
import type { YamlPath } from "./yamlLocations"

export type ValidationPendingCheck =
  | {
      kind: "dataPath"
      filePath: string
      yamlPath: YamlPath
      owner: OwnerTypeRef
      value: string
      policy: "formDataPath"
    }

export interface ValidationPendingCheckResult {
  diagnostics: Diagnostic[]
}
```

- [ ] **Step 2: Compact `ProjectValidationFileState`**

In `packages/core/metadata/validation/projectValidationPasses.ts`, replace the current state type with:

```ts
export type ProjectValidationFileState =
  | {
      kind: "properties"
      file: ValidationProjectFile
      pendingReferences: PendingMetadataTargetReference[]
      firstPassDiagnostics: Diagnostic[]
    }
  | {
      kind: "form"
      file: ValidationProjectFile
      pendingChecks: ValidationPendingCheck[]
      firstPassDiagnostics: Diagnostic[]
    }
  | { kind: "failed"; file: ValidationProjectFile; diagnostics: Diagnostic[] }
```

Add:

```ts
import type { ValidationPendingCheck } from "./projectValidationPendingChecks"
```

- [ ] **Step 3: Keep current extraction but stop retaining model/form state**

In `validateProjectPropertiesFirstPass`, keep the current model-based extraction for this task, but return:

```ts
state: {
  kind: "properties",
  file: params.file,
  pendingReferences: pendingReferences.references,
  firstPassDiagnostics: diagnostics,
},
```

In `validateProjectFormFirstPass`, return:

```ts
state: {
  kind: "form",
  file: params.file,
  pendingChecks: [],
  firstPassDiagnostics: diagnostics,
},
```

- [ ] **Step 4: Update second pass for compact state**

In `validateProjectFileSecondPass`, for properties use `params.state.pendingReferences` directly. For forms, temporarily return no extra diagnostics:

```ts
if (params.state.kind === "form") return { status: "ok", diagnostics: [] }
```

This is temporary and will be replaced by pending form checks in Task 6.

- [ ] **Step 5: Stop storing worker YAML entries**

In `packages/core/metadata/validation/projectValidationWorker.ts`, remove `entries` from `WorkerValidationState` and `createEmptyWorkerValidationState()`. In `runFirstPass`, remove:

```ts
workerState.entries.set(resolve(entry.filePath), entry)
```

- [ ] **Step 6: Clear worker state after second pass**

In `runSecondPass`, before returning, store validation timing and clear state:

```ts
const validationMs = performance.now() - validationStartedAt
workerState = createEmptyWorkerValidationState()
```

Use `validationMs` in the returned timing instead of recalculating after cleanup.

- [ ] **Step 7: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/projectValidationPasses.test.ts metadata/validation/projectValidationWorkerPool.test.ts
```

Expected: PASS or targeted failures only around missing form second-pass checks, fixed in Task 6.

- [ ] **Step 8: Commit compact state**

```bash
git add packages/core/metadata/validation/projectValidationPendingChecks.ts packages/core/metadata/validation/projectValidationPasses.ts packages/core/metadata/validation/projectValidationWorker.ts packages/core/metadata/validation/projectValidationPasses.test.ts packages/core/metadata/validation/projectValidationWorkerPool.test.ts
git commit -m "refactor: :recycle: сократить состояние validation worker"
```

## Task 3: Add Compact Owner Facts

**Files:**
- Create: `packages/core/metadata/validation/dataPath/ownerFacts.ts`
- Modify: `packages/core/metadata/validation/projectValidationTypes.ts`
- Modify: `packages/core/metadata/validation/projectValidationObjectTable.ts`
- Modify: `packages/core/metadata/validation/sharedValidationBinaryOwners.ts`
- Test: `packages/core/metadata/validation/projectValidationObjectTable.test.ts`
- Test: `packages/core/metadata/validation/sharedValidationBinaryOwners.test.ts`

- [ ] **Step 1: Create owner facts type**

Create `packages/core/metadata/validation/dataPath/ownerFacts.ts`:

```ts
import type { TypeDescription } from "../../commonObjects/typeDescription/types"
import type { ObjectFieldIndex } from "./objectFields"
import type { OwnerTypeRef } from "./types"

export interface ValidationOwnerFacts {
  ref: OwnerTypeRef
  filePath: string
  fieldIndex: ObjectFieldIndex
  type?: TypeDescription
  commonAttributeOwnerLinks?: string[]
}

export function ownerFactsFromModel(params: {
  ref: OwnerTypeRef
  filePath: string
  model: unknown
  fieldIndex: ObjectFieldIndex
}): ValidationOwnerFacts {
  const record = typeof params.model === "object" && params.model !== null ? (params.model as Record<string, unknown>) : {}
  const content = Array.isArray(record["content"]) ? record["content"] : []
  const commonAttributeOwnerLinks = content.flatMap((item) => {
    const itemRecord = typeof item === "object" && item !== null ? (item as Record<string, unknown>) : {}
    return itemRecord["use"] === "Use" && typeof itemRecord["metadata"] === "string" ? [itemRecord["metadata"]] : []
  })

  return {
    ref: params.ref,
    filePath: params.filePath,
    fieldIndex: params.fieldIndex,
    ...(typeof record["type"] === "object" && record["type"] !== null ? { type: record["type"] as TypeDescription } : {}),
    ...(commonAttributeOwnerLinks.length === 0 ? {} : { commonAttributeOwnerLinks }),
  }
}
```

- [ ] **Step 2: Add facts to validation records**

In `packages/core/metadata/validation/projectValidationTypes.ts`, add:

```ts
import type { ValidationOwnerFacts } from "./dataPath/ownerFacts"
```

Change `ValidationObjectRecord` to include:

```ts
ownerFacts?: ValidationOwnerFacts
```

Keep `model?` temporarily for compatibility in this task.

- [ ] **Step 3: Populate owner facts in first pass**

In `validateProjectPropertiesFirstPass`, import `ownerFactsFromModel` and add `ownerFacts` to the returned object record:

```ts
const ownerFacts = ownerFactsFromModel({
  ref: ownerRef,
  filePath: params.file.absolutePath,
  model: imported.model,
  fieldIndex,
})
```

Then set:

```ts
ownerFacts,
```

- [ ] **Step 4: Prefer owner facts in shared owner snapshot**

In `packages/core/metadata/validation/sharedValidationBinaryOwners.ts`, update snapshot creation to read `record.ownerFacts?.fieldIndex` and `record.ownerFacts?.filePath` before falling back to `record.fieldIndex` / `record.filePath`.

- [ ] **Step 5: Run owner snapshot tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/projectValidationObjectTable.test.ts metadata/validation/sharedValidationBinaryOwners.test.ts metadata/validation/dataPath/ownerCache.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit owner facts**

```bash
git add packages/core/metadata/validation/dataPath/ownerFacts.ts packages/core/metadata/validation/projectValidationTypes.ts packages/core/metadata/validation/projectValidationPasses.ts packages/core/metadata/validation/sharedValidationBinaryOwners.ts packages/core/metadata/validation/projectValidationObjectTable.test.ts packages/core/metadata/validation/sharedValidationBinaryOwners.test.ts
git commit -m "refactor: :recycle: добавить compact owner facts"
```

## Task 4: Build A JSON-Compatible Rules Snapshot

**Files:**
- Create: `packages/core/metadata/validation/rulesSnapshot.ts`
- Create: `packages/core/metadata/validation/rulesSnapshot.test.ts`
- Modify: `packages/core/metadata/validation/projectValidationWorker.ts`
- Modify: `packages/core/metadata/validation/projectValidationWorkerPool.ts`
- Modify: `packages/core/metadata/validation/validateProject.ts`

- [ ] **Step 1: Create minimal snapshot types and builder**

Create `packages/core/metadata/validation/rulesSnapshot.ts`:

```ts
import { rootFromYAML } from "../commonObjects/metadataTargets/roots"
import type { ConfigurationContext } from "../context/types"
import { validationProjectSpecs } from "./projectSpecs"

export interface ValidationRulesSnapshot {
  version: 1
  context: {
    platformVersion?: string
    defaultLanguage?: string
  }
  projectDirs: Record<string, ValidationRulesProjectDir>
  form: {
    schemaName: "ClientApplicationForm"
  }
}

export interface ValidationRulesProjectDir {
  dir: string
  itemType: string
  root?: string
  namePath: readonly string[]
}

export function createValidationRulesSnapshot(context: ConfigurationContext): ValidationRulesSnapshot {
  return {
    version: 1,
    context: {
      platformVersion: context.version,
      defaultLanguage: context.defaultLanguage,
    },
    projectDirs: Object.fromEntries(
      validationProjectSpecs.map((spec) => [
        spec.dir,
        {
          dir: spec.dir,
          itemType: spec.rule.itemType,
          root: rootFromYAML[spec.dir],
          namePath: ["Имя"],
        },
      ])
    ),
    form: { schemaName: "ClientApplicationForm" },
  }
}
```

- [ ] **Step 2: Add JSON compatibility tests**

Create `packages/core/metadata/validation/rulesSnapshot.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { createValidationRulesSnapshot } from "./rulesSnapshot"

describe("validation rules snapshot", () => {
  it("is JSON-compatible and cloneable", () => {
    const snapshot = createValidationRulesSnapshot({ version: "8.3.24", defaultLanguage: "ru" })

    expect(structuredClone(snapshot)).toEqual(snapshot)
    expect(JSON.parse(JSON.stringify(snapshot))).toEqual(snapshot)
  })

  it("contains project directory descriptors for validation", () => {
    const snapshot = createValidationRulesSnapshot({ version: "8.3.24", defaultLanguage: "ru" })

    expect(snapshot.projectDirs["Справочник"]).toMatchObject({
      dir: "Справочник",
      itemType: "MetadataCatalog",
      root: "Catalog",
    })
  })
})
```

- [ ] **Step 3: Pass snapshot through worker init**

In `projectValidationWorkerPool.ts`, extend init request:

```ts
rulesSnapshot: ValidationRulesSnapshot
```

In `validateProject.ts`, create once:

```ts
const rulesSnapshot = createValidationRulesSnapshot(context)
```

Pass it to `pool.start(context, rulesSnapshot)` or extend start params as an object:

```ts
start({ context, rulesSnapshot })
```

- [ ] **Step 4: Store snapshot in worker**

In `projectValidationWorker.ts`, add:

```ts
let workerRulesSnapshot: ValidationRulesSnapshot | undefined
```

In `runInit`, assign `workerRulesSnapshot = message.rulesSnapshot`.

- [ ] **Step 5: Run snapshot tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/rulesSnapshot.test.ts metadata/validation/projectValidationWorkerPool.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit rules snapshot foundation**

```bash
git add packages/core/metadata/validation/rulesSnapshot.ts packages/core/metadata/validation/rulesSnapshot.test.ts packages/core/metadata/validation/projectValidationWorker.ts packages/core/metadata/validation/projectValidationWorkerPool.ts packages/core/metadata/validation/validateProject.ts
git commit -m "feat: :sparkles: добавить rulesSnapshot для validation"
```

## Task 5: Add YAML Fact Extractor For Properties

**Files:**
- Create: `packages/core/metadata/validation/yamlFactExtractor.ts`
- Create: `packages/core/metadata/validation/yamlFactExtractor.test.ts`
- Modify: `packages/core/metadata/validation/projectValidationPasses.ts`
- Test: `packages/core/metadata/validation/yamlFactExtractor.test.ts`

- [ ] **Step 1: Add extractor result types**

Create `packages/core/metadata/validation/yamlFactExtractor.ts`:

```ts
import { projectObjectIndexKey, type ProjectObjectIndexEntry } from "./projectReferenceIndex"
import type { ValidationProjectFile } from "./projectFiles"
import type { ValidationRulesSnapshot } from "./rulesSnapshot"
import type { Diagnostic } from "./types"

export interface ValidationYamlFacts {
  diagnostics: Diagnostic[]
  objectIndexEntries: ProjectObjectIndexEntry[]
}

export function extractValidationYamlFacts(params: {
  file: ValidationProjectFile
  data: unknown
  rulesSnapshot: ValidationRulesSnapshot
}): ValidationYamlFacts {
  if (params.file.kind !== "properties" && params.file.kind !== "configuration") {
    return { diagnostics: [], objectIndexEntries: [] }
  }

  const dirRules = params.rulesSnapshot.projectDirs[params.file.owner.dir]
  if (dirRules === undefined || dirRules.root === undefined || params.file.owner.name.length === 0) {
    return { diagnostics: [], objectIndexEntries: [] }
  }

  const target = {
    kind: "object" as const,
    root: dirRules.root as never,
    objectName: params.file.owner.name,
  }

  return {
    diagnostics: [],
    objectIndexEntries: [
      {
        canonical: projectObjectIndexKey(target),
        target,
        result: { ok: true, filePath: params.file.absolutePath },
      },
    ],
  }
}
```

- [ ] **Step 2: Test object entry extraction**

Create `packages/core/metadata/validation/yamlFactExtractor.test.ts`:

```ts
import { resolve } from "path"
import { describe, expect, it } from "vitest"
import { createValidationRulesSnapshot } from "./rulesSnapshot"
import { resolveValidationProjectFile } from "./projectFiles"
import { extractValidationYamlFacts } from "./yamlFactExtractor"

describe("validation YAML fact extractor", () => {
  it("extracts catalog object index entry without importing a model", () => {
    const projectDir = resolve("metadata/validation/__fixtures__/project-with-form")
    const filePath = resolve(projectDir, "Справочник/СправочникСФормой/Свойства.yaml")
    const file = resolveValidationProjectFile(projectDir, filePath)

    expect(file).toBeDefined()
    const facts = extractValidationYamlFacts({
      file: file!,
      data: { Имя: "СправочникСФормой" },
      rulesSnapshot: createValidationRulesSnapshot({ version: "8.3.24", defaultLanguage: "ru" }),
    })

    expect(facts.objectIndexEntries.map((entry) => entry.canonical)).toContain("Catalog.СправочникСФормой")
  })
})
```

- [ ] **Step 3: Run the extractor test**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/yamlFactExtractor.test.ts
```

Expected: PASS.

- [ ] **Step 4: Wire extractor as an additive check**

In `validateProjectPropertiesFirstPass`, call the extractor after schema validation using `parsed.data`. For now compare only object index parity in a test, without replacing current model extraction:

```ts
const yamlFacts = extractValidationYamlFacts({
  file: params.file,
  data: parsed.data,
  rulesSnapshot: params.rulesSnapshot,
})
```

This step also requires extending `validateProjectFileFirstPass` params with `rulesSnapshot`.

- [ ] **Step 5: Commit properties extractor foundation**

```bash
git add packages/core/metadata/validation/yamlFactExtractor.ts packages/core/metadata/validation/yamlFactExtractor.test.ts packages/core/metadata/validation/projectValidationPasses.ts packages/core/metadata/validation/projectValidationWorker.ts packages/core/metadata/validation/validateProject.ts
git commit -m "feat: :sparkles: извлекать validation facts из YAML"
```

## Task 6: Move References And Form Checks To YAML Facts

**Files:**
- Modify: `packages/core/metadata/validation/rulesSnapshot.ts`
- Modify: `packages/core/metadata/validation/yamlFactExtractor.ts`
- Modify: `packages/core/metadata/validation/projectValidationPendingChecks.ts`
- Modify: `packages/core/metadata/validation/projectValidationPasses.ts`
- Test: `packages/core/metadata/validation/yamlFactExtractor.test.ts`
- Test: `packages/core/metadata/validation/validateProject.test.ts`

- [ ] **Step 1: Extend snapshot with metadata target paths**

Add to `ValidationRulesProjectDir`:

```ts
metadataTargetPaths: readonly ValidationYamlPathRule[]
```

Add:

```ts
export interface ValidationYamlPathRule {
  yamlPath: readonly string[]
  constraint: "metadataTarget"
}
```

Initially populate `metadataTargetPaths: []`. Then add explicit paths only through data collected from existing rule registrations; do not hardcode object-specific behavior in the extractor.

- [ ] **Step 2: Add pending reference extraction tests**

In `yamlFactExtractor.test.ts`, add a fixture-driven test that uses a known broken metadata target from `project-with-errors` and expects one `pendingReferences` entry with file path and YAML path.

- [ ] **Step 3: Extend extractor result**

Update `ValidationYamlFacts`:

```ts
pendingReferences: PendingMetadataTargetReference[]
memberIndexEntries: ProjectMemberIndexEntry[]
valueIndexEntries: ProjectValueIndexEntry[]
pendingChecks: ValidationPendingCheck[]
```

Return empty arrays for unsupported facts until the rule path is implemented.

- [ ] **Step 4: Add form pending check extraction**

Use existing form traversal behavior as the reference, but extract compact checks from YAML:

```ts
{
  kind: "dataPath",
  filePath: params.file.absolutePath,
  yamlPath: ["Элементы", elementName, "ПутьКДанным"],
  owner: { kind: params.file.owner.dir, name: params.file.owner.name },
  value,
  policy: "formDataPath",
}
```

The actual element paths must come from `rulesSnapshot.form`, not from a hardcoded `Элементы` branch in final code. A temporary test may name the path while the next step moves it into snapshot.

- [ ] **Step 5: Resolve pending checks in second pass**

Add a resolver function in `projectValidationPendingChecks.ts`:

```ts
export function validatePendingChecks(params: {
  checks: readonly ValidationPendingCheck[]
  ownerCache: OwnerMetadataCache
}): Diagnostic[] {
  return params.checks.flatMap((check) => {
    if (check.kind === "dataPath") {
      return validateDataPathPendingCheck({ check, ownerCache })
    }
    return []
  })
}
```

Use existing dataPath resolver APIs for the implementation.

- [ ] **Step 6: Run validation tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/yamlFactExtractor.test.ts metadata/validation/validateProject.test.ts metadata/validation/dataPath/formTraversal.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit YAML references and checks**

```bash
git add packages/core/metadata/validation/rulesSnapshot.ts packages/core/metadata/validation/yamlFactExtractor.ts packages/core/metadata/validation/projectValidationPendingChecks.ts packages/core/metadata/validation/projectValidationPasses.ts packages/core/metadata/validation/yamlFactExtractor.test.ts packages/core/metadata/validation/validateProject.test.ts
git commit -m "feat: :sparkles: проверять ссылки через YAML facts"
```

## Task 7: Remove Model-Based First Pass From Workers

**Files:**
- Modify: `packages/core/metadata/validation/projectValidationPasses.ts`
- Modify: `packages/core/metadata/validation/projectValidationWorker.ts`
- Modify: `packages/core/metadata/validation/projectValidationTypes.ts`
- Modify: `packages/core/metadata/validation/projectValidationObjectTable.ts`
- Test: `packages/core/metadata/validation/projectValidationWorkerPool.test.ts`
- Test: `packages/core/metadata/validation/validateProject.test.ts`

- [ ] **Step 1: Add import boundary test**

In `projectValidationWorkerPool.test.ts`, read `projectValidationWorker.ts` and assert worker no longer imports full metadata registration:

```ts
it("validation worker does not import fromYAML or full metadata models", async () => {
  const source = await import("node:fs/promises").then((fs) =>
    fs.readFile(new URL("./projectValidationWorker.ts", import.meta.url), "utf8")
  )

  expect(source).not.toContain("fromYAML")
  expect(source).not.toContain("registerCoreMetadata")
})
```

- [ ] **Step 2: Switch first pass to YAML facts**

In `validateProjectPropertiesFirstPass`, remove `importPropertiesModel`, `buildObjectFieldIndex(ownerWithoutIndex)`, `collectMetadataTargetReferencesInModel`, and `validateUniqueNameScopes` calls only after equivalent facts/checks exist in `yamlFactExtractor`.

The return should use `yamlFacts`:

```ts
return {
  state: {
    kind: "properties",
    file: params.file,
    pendingReferences: yamlFacts.pendingReferences,
    firstPassDiagnostics: diagnostics,
  },
  diagnostics,
  objectIndexEntries: yamlFacts.objectIndexEntries,
  memberIndexEntries: yamlFacts.memberIndexEntries,
  valueIndexEntries: yamlFacts.valueIndexEntries,
  pendingReferences: yamlFacts.pendingReferences,
  objectRecords: yamlFacts.ownerFacts.map(ownerFactsToValidationRecord),
  profile,
}
```

- [ ] **Step 3: Remove model from records**

In `projectValidationTypes.ts`, delete `model?: unknown` from `ValidationObjectRecord`. Keep `ownerFacts` and any compact fields required by shared owner snapshot.

- [ ] **Step 4: Update object table tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/projectValidationObjectTable.test.ts metadata/validation/sharedValidationBinaryOwners.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run worker tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/projectValidationWorkerPool.test.ts metadata/validation/validateProject.test.ts
```

Expected: PASS, including the import boundary test.

- [ ] **Step 6: Commit worker model removal**

```bash
git add packages/core/metadata/validation/projectValidationPasses.ts packages/core/metadata/validation/projectValidationWorker.ts packages/core/metadata/validation/projectValidationTypes.ts packages/core/metadata/validation/projectValidationObjectTable.ts packages/core/metadata/validation/projectValidationWorkerPool.test.ts packages/core/metadata/validation/validateProject.test.ts
git commit -m "refactor: :recycle: убрать model из validation worker"
```

## Task 8: Add Validation-Only Registration

**Files:**
- Create: `packages/core/metadata/validation/registerValidationMetadata.ts`
- Modify: `packages/core/metadata/validation/projectValidationWorker.ts`
- Test: `packages/core/metadata/validation/projectValidationWorkerPool.test.ts`

- [ ] **Step 1: Add minimal validation registration wrapper**

Create `packages/core/metadata/validation/registerValidationMetadata.ts`:

```ts
let validationMetadataRegistered = false

export function registerValidationMetadata(): void {
  if (validationMetadataRegistered) return
  validationMetadataRegistered = true
}
```

Because worker no longer imports `fromYAML` or model rules, this wrapper starts empty. Add imports only if tests prove schema/check execution still needs them.

- [ ] **Step 2: Switch worker registration**

In `projectValidationWorker.ts`, replace `registerCoreMetadata()` with:

```ts
registerValidationMetadata()
```

and import it from `./registerValidationMetadata`.

- [ ] **Step 3: Run import boundary test**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/projectValidationWorkerPool.test.ts -t "validation worker does not import"
```

Expected: PASS.

- [ ] **Step 4: Commit validation registration**

```bash
git add packages/core/metadata/validation/registerValidationMetadata.ts packages/core/metadata/validation/projectValidationWorker.ts packages/core/metadata/validation/projectValidationWorkerPool.test.ts
git commit -m "refactor: :recycle: облегчить регистрацию validation worker"
```

## Task 9: Full Verification And nkdk-yaml Check

**Files:**
- Modify: code only if verification exposes issues.
- Test: full repository and `/Users/nikita/git/nkdk-yaml`.

- [ ] **Step 1: Run focused validation suite**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation
```

Expected: PASS.

- [ ] **Step 2: Run CLI validation tests**

Run:

```bash
pnpm --filter @nakidka/cli exec vitest run src/commands/validate.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run full project tests**

Run:

```bash
pnpm test
```

Expected: all tests PASS.

- [ ] **Step 4: Run validation on nkdk-yaml**

Run:

```bash
pnpm --filter @nakidka/cli exec nkdk validate /Users/nikita/git/nkdk-yaml
```

Expected: command completes without process crash. Record exit code and diagnostics count.

- [ ] **Step 5: Run profiled validation on nkdk-yaml**

Run:

```bash
NKDK_VALIDATION_PROFILE=1 pnpm --filter @nakidka/cli exec nkdk validate /Users/nikita/git/nkdk-yaml
```

Expected: command completes or reports validation diagnostics normally. Record profile lines for worker init, first pass, snapshot, second pass, and total time.

- [ ] **Step 6: Commit verification notes if added**

If measurements are written to docs, commit them:

```bash
git add docs/superpowers/measurements
git commit -m "docs: :memo: измерить validation без модели"
```

If no docs are added, do not create an empty commit.

## Self-Review

- Spec coverage: plan covers one YAML read, no worker model retention, `rulesSnapshot`, compact facts/checks, shared snapshot compatibility, full tests, and `/Users/nikita/git/nkdk-yaml` verification.
- Placeholder scan: plan intentionally leaves no unfinished markers or unspecified test commands. The only staged growth is explicit: unsupported facts return empty arrays until their task implements them.
- Type consistency: `ValidationRulesSnapshot`, `ValidationYamlFacts`, `ValidationPendingCheck`, and `ValidationOwnerFacts` are introduced before use. Later tasks replace temporary compatibility fields only after tests exist.
