# Parallel Validation YAML Snapshot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `validateProject` with an async validation pipeline that reads and parses each needed YAML file once, reuses a shared object table, and runs full-project validation in parallel worker threads.

**Architecture:** First make the public validation path async while preserving current behavior. Then split project and form validation into first-pass local checks and second-pass cross-file checks, backed by a queue and object table. Finally add a worker-thread pool that keeps parsed YAML inside workers, returns serializable object records to the main thread, and preserves deterministic diagnostics through the existing dedupe/sort step.

**Tech Stack:** TypeScript, Vitest, Node `worker_threads`, existing TypeBox schemas, existing validation registries, `pnpm`.

---

## File Structure

- Modify `packages/core/metadata/validation/validateProject.ts`  
  Public async orchestrator, final diagnostic sorting/deduplication, `concurrency` option, compatibility fallback for `concurrency: 1`.
- Create `packages/core/metadata/validation/projectValidationTypes.ts`  
  Serializable contracts shared by the main thread, in-process runner, and worker threads.
- Create `packages/core/metadata/validation/projectValidationQueue.ts`  
  Full/partial validation queue with one state per absolute YAML path and dependency enqueueing.
- Create `packages/core/metadata/validation/projectValidationObjectTable.ts`  
  Shared table of imported object records, owner lookup, known file lookup, and dependency request helpers.
- Create `packages/core/metadata/validation/projectValidationPasses.ts`  
  First-pass and second-pass validation for project files; keeps `ParsedYaml` in the current process/worker.
- Create `packages/core/metadata/validation/projectValidationWorker.ts`  
  Worker-thread entrypoint; stores parsed file states locally and responds to first/second pass messages.
- Create `packages/core/metadata/validation/projectValidationWorkerPool.ts`  
  Main-thread worker pool and in-process runner for `concurrency: 1`.
- Modify `packages/core/metadata/forms/clientApplicationForm/validate.ts`  
  Split form validation into first-pass and second-pass helpers while keeping the existing registered validator as a wrapper.
- Modify `packages/core/metadata/validation/formValidationRegistry.ts`  
  Add optional pass-based form validator registration.
- Modify `packages/core/metadata/validation/dataPath/ownerCache.ts`  
  Add a table-backed owner cache adapter, preserving current file-backed cache for existing callers.
- Modify `packages/core/metadata/validation/projectMetadataResolver.ts`  
  Add a table-backed resolver variant, preserving current file-backed resolver for existing callers.
- Modify `packages/cli/src/commands/validate.ts` and `packages/cli/src/commands/migration.ts`  
  Await async core operations.
- Modify `packages/core/metadata/operations/projectSnapshot.ts`, `renameItem.ts`, `deleteItem.ts` and related tests  
  Propagate async validation through operation snapshots and metadata operations.
- Modify `packages/mcp/src/coreApi.ts`, `packages/mcp/src/services/renameItem.ts`, `packages/mcp/src/services/deleteItem.ts` and related tests  
  Propagate async rename/delete operation results through MCP services.

## Task 1: Make `validateProject` Async Without Changing Behavior

**Files:**
- Modify: `packages/core/metadata/validation/validateProject.ts`
- Modify: `packages/cli/src/commands/validate.ts`
- Modify: `packages/core/metadata/operations/projectSnapshot.ts`
- Modify: `packages/core/metadata/operations/renameItem.ts`
- Modify: `packages/core/metadata/operations/deleteItem.ts`
- Modify: `packages/cli/src/commands/migration.ts`
- Modify: `packages/mcp/src/coreApi.ts`
- Modify: `packages/mcp/src/services/renameItem.ts`
- Modify: `packages/mcp/src/services/deleteItem.ts`
- Test: `packages/core/metadata/validation/validateProject.test.ts`
- Test: `packages/core/metadata/operations/projectSnapshot.test.ts`
- Test: `packages/core/metadata/operations/renameItem.test.ts`
- Test: `packages/core/metadata/operations/deleteItem.test.ts`
- Test: `packages/core/metadata/operations/targetResolver.test.ts`
- Test: `packages/core/metadata/operations/yamlModelIO.test.ts`
- Test: `packages/cli/src/commands/migration.test.ts`
- Test: `packages/mcp/src/services/renameItem.test.ts`
- Test: `packages/mcp/src/services/deleteItem.test.ts`

- [ ] **Step 1: Write the failing async API test**

Add this test near the top of `packages/core/metadata/validation/validateProject.test.ts`:

```ts
it("returns a Promise from the public validateProject API", async () => {
  const projectDir = createProject()
  writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", "{}\n")

  const result = validateProject({ projectDir, context: mockContext })

  expect(result).toBeInstanceOf(Promise)
  await expect(result).resolves.toEqual({ diagnostics: [] })
})
```

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/validateProject.test.ts --no-isolate
```

Expected: FAIL because `validateProject` currently returns a plain object, not a `Promise`.

- [ ] **Step 2: Change the public signature and preserve the old body**

In `packages/core/metadata/validation/validateProject.ts`, extend params and change the signature:

```ts
export interface ValidateProjectParams {
  projectDir: string
  filePath?: string
  context?: ConfigurationContext
  concurrency?: number
}

export async function validateProject(params: ValidateProjectParams): Promise<ValidateProjectResult> {
  return validateProjectSequential(params)
}

function validateProjectSequential(params: ValidateProjectParams): ValidateProjectResult {
  const projectDir = resolve(params.projectDir)
  const context = params.context ?? defaultValidationContext()
  const cache = createProjectYamlCache()
  const ownerCache = createOwnerMetadataCache({ projectDir, yamlCache: cache, context })
  const metadataResolver = createProjectMetadataResolver({ projectDir, yamlCache: cache, context, ownerCache })
  const schemaCache = createValidationSchemaCache(context)
  const files =
    params.filePath === undefined
      ? discoverValidationProjectFiles(projectDir)
      : [resolveSingleProjectFile(projectDir, params.filePath)]

  const diagnostics: Diagnostic[] = []
  for (const file of files) {
    try {
      diagnostics.push(...validateProjectFile({ projectDir, file, cache, context, ownerCache, metadataResolver, schemaCache }))
    } finally {
      cache.release(file.absolutePath)
    }
  }

  return { diagnostics: sortDiagnostics(dedupeDiagnostics(diagnostics)) }
}
```

- [ ] **Step 3: Await `validateProject` callers**

Update `packages/cli/src/commands/validate.ts`:

```ts
diagnostics = (await validateProject({
  projectDir,
  ...(options.file !== undefined ? { filePath: options.file } : {}),
})).diagnostics
```

Update `packages/core/metadata/operations/projectSnapshot.ts`:

```ts
export async function buildMetadataOperationSnapshot(params: {
  projectDir: string
  context?: ConfigurationContext
  requireValidProject: boolean
}): Promise<MetadataOperationSnapshotResult> {
  const projectDir = resolve(params.projectDir)
  const context = params.context ?? defaultMetadataOperationsContext()

  if (params.requireValidProject) {
    const validation = await validateProject({ projectDir, context })
    const errors = validation.diagnostics.filter((diagnostic) => diagnostic.severity === "error")
    if (errors.length > 0) {
      return {
        ok: false,
        code: "validation_failed",
        message: "YAML-проект содержит ошибки validation",
        diagnostics: errors,
      }
    }
  }

  const items: OperationSnapshotItem[] = []
  for (const resource of discoverValidationProjectFiles(projectDir)) {
    const item = importSnapshotItem({ resource, context, requireValidProject: params.requireValidProject })
    if (item.ok) items.push(item.item)
    else if (params.requireValidProject) return item.failure
  }

  return { ok: true, projectDir, context, items }
}
```

Update `renameMetadataItem` and `deleteMetadataItem` to return `Promise<MetadataOperationResult>` and await the snapshot:

```ts
export async function renameMetadataItem(params: RenameMetadataItemParams): Promise<MetadataOperationResult> {
  const snapshot = await buildMetadataOperationSnapshot({ projectDir: params.projectDir, requireValidProject: true })
  if (!snapshot.ok) return snapshot

  const name = validateMetadataLocalName(params.newName)
  if (!name.ok) return failure("invalid_name", name.message)

  const parsedPath = parseMetadataOperationPath(params.path)
  if (!parsedPath.ok) return failure(parsedPath.code, parsedPath.message)

  // Keep the remaining current function body from resolveMetadataOperationPath(...) onward.
}
```

```ts
export async function deleteMetadataItem(params: DeleteMetadataItemParams): Promise<MetadataOperationResult> {
  const snapshot = await buildMetadataOperationSnapshot({ projectDir: params.projectDir, requireValidProject: true })
  if (!snapshot.ok) return snapshot

  const parsedPath = parseMetadataOperationPath(params.path)
  if (!parsedPath.ok) return failure(parsedPath.code, parsedPath.message)

  // Keep the remaining current function body from resolveMetadataOperationPath(...) onward.
}
```

Update `packages/cli/src/commands/migration.ts`:

```ts
export async function renameMigration(yamlDir: string, path: string, newName: string, allowWrite = false): Promise<void> {
  printOperationResult(await renameMetadataItem({
    projectDir: yamlDir,
    path,
    newName,
    allowWrite,
  }))
}

export async function deleteMigration(yamlDir: string, path: string, allowWrite = false): Promise<void> {
  printOperationResult(await deleteMetadataItem({
    projectDir: yamlDir,
    path,
    allowWrite,
  }))
}
```

Update `packages/mcp/src/coreApi.ts` return types:

```ts
validateProject(params: { projectDir: string; filePath?: string }): Promise<{ diagnostics: Diagnostic[] }>
renameMetadataItem(params: {
  projectDir: string
  path: string
  newName: string
  allowWrite?: boolean
}): Promise<MetadataOperationResult>
deleteMetadataItem(params: {
  projectDir: string
  path: string
  allowWrite?: boolean
}): Promise<MetadataOperationResult>
```

Update MCP services:

```ts
return await core.renameMetadataItem(input) as unknown as ToolPayload
```

```ts
return await core.deleteMetadataItem(input) as unknown as ToolPayload
```

- [ ] **Step 4: Update tests to await async operations**

Mechanically update direct calls:

```ts
const diagnostics = (await validateProject({ projectDir, context: mockContext })).diagnostics
const result = await buildMetadataOperationSnapshot({ projectDir, requireValidProject: false })
const result = await renameMetadataItem({ projectDir, path, newName })
const result = await deleteMetadataItem({ projectDir, path })
```

For tests that assert thrown errors, use:

```ts
await expect(renameMetadataItem({ projectDir, path, newName })).resolves.toMatchObject({
  ok: false,
  code: "invalid_path",
})
```

- [ ] **Step 5: Verify async migration commands**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/validateProject.test.ts metadata/operations/projectSnapshot.test.ts metadata/operations/renameItem.test.ts metadata/operations/deleteItem.test.ts metadata/operations/targetResolver.test.ts metadata/operations/yamlModelIO.test.ts --no-isolate
pnpm --filter @nakidka/cli exec vitest run src/commands/validate.test.ts src/commands/migration.test.ts
pnpm --filter @nakidka/mcp exec vitest run src/services/renameItem.test.ts src/services/deleteItem.test.ts
```

Expected: all selected tests pass.

- [ ] **Step 6: Commit**

```bash
git add packages/core packages/cli packages/mcp
git commit -m "refactor: :recycle: сделать validation асинхронной"
```

## Task 2: Add Queue and Object-Table Contracts

**Files:**
- Create: `packages/core/metadata/validation/projectValidationTypes.ts`
- Create: `packages/core/metadata/validation/projectValidationQueue.ts`
- Create: `packages/core/metadata/validation/projectValidationObjectTable.ts`
- Test: `packages/core/metadata/validation/projectValidationQueue.test.ts`
- Test: `packages/core/metadata/validation/projectValidationObjectTable.test.ts`

- [ ] **Step 1: Write queue tests first**

Create `packages/core/metadata/validation/projectValidationQueue.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { createValidationYamlQueue } from "./projectValidationQueue"
import type { ValidationProjectFile } from "./projectFiles"

describe("ValidationYamlQueue", () => {
  it("deduplicates absolute paths", () => {
    const file = validationFile("/project/Справочник/Товары/Свойства.yaml", "Справочник/Товары/Свойства.yaml")
    const queue = createValidationYamlQueue({ mode: "full", initialFiles: [file, file] })

    expect(queue.takePending(10)).toEqual([file])
    queue.markRunning(file.absolutePath)
    queue.markReady(file.absolutePath)
    expect(queue.takePending(10)).toEqual([])
  })

  it("tracks dependency requests without re-enqueueing ready files", () => {
    const file = validationFile("/project/Справочник/Товары/Свойства.yaml", "Справочник/Товары/Свойства.yaml")
    const queue = createValidationYamlQueue({ mode: "partial", initialFiles: [file] })

    queue.markRunning(file.absolutePath)
    queue.markReady(file.absolutePath)

    expect(queue.enqueueDependency(file)).toBe("already-known")
    expect(queue.takePending(10)).toEqual([])
  })
})

function validationFile(absolutePath: string, projectPath: string): ValidationProjectFile {
  return {
    absolutePath,
    projectPath,
    kind: "properties",
    owner: {
      dir: "Справочник",
      name: "Товары",
      spec: {
        kind: "catalog",
        dir: "Справочник",
        rule: { itemType: "Catalog", properties: {} },
        exportSchema: () => ({ type: "object" }) as never,
        importModel: () => ({ itemType: "Catalog", name: "Товары" }) as never,
      },
    },
  }
}
```

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/projectValidationQueue.test.ts --no-isolate
```

Expected: FAIL because `projectValidationQueue.ts` does not exist.

- [ ] **Step 2: Implement queue contracts**

Create `packages/core/metadata/validation/projectValidationTypes.ts`:

```ts
import type { ObjectFieldIndex } from "./dataPath/objectFields"
import type { OwnerTypeRef } from "./dataPath/types"
import type { ValidationProjectFile } from "./projectFiles"
import type { Diagnostic } from "./types"

export type ValidationMode = "full" | "partial"

export type ValidationQueueStatus = "pending" | "running" | "ready" | "error"

export interface ValidationQueueEntry {
  file: ValidationProjectFile
  status: ValidationQueueStatus
}

export type EnqueueDependencyResult = "enqueued" | "already-known"

export interface ValidationObjectRecord {
  filePath: string
  projectPath: string
  kind: ValidationProjectFile["kind"]
  owner: { dir: string; name: string }
  ownerRef?: OwnerTypeRef
  model?: unknown
  fieldIndex?: ObjectFieldIndex
  importDiagnostics: Diagnostic[]
}

export interface ValidationObjectTableSnapshot {
  records: ValidationObjectRecord[]
}

export interface ValidationDependencyRequest {
  kind: "needsDependency"
  file: ValidationProjectFile
  requestedBy: string
}
```

Create `packages/core/metadata/validation/projectValidationQueue.ts`:

```ts
import { resolve } from "path"
import type {
  EnqueueDependencyResult,
  ValidationMode,
  ValidationQueueEntry,
} from "./projectValidationTypes"
import type { ValidationProjectFile } from "./projectFiles"

export interface ValidationYamlQueue {
  readonly mode: ValidationMode
  takePending(limit: number): ValidationProjectFile[]
  markRunning(filePath: string): void
  markReady(filePath: string): void
  markError(filePath: string): void
  enqueueDependency(file: ValidationProjectFile): EnqueueDependencyResult
  entries(): ValidationQueueEntry[]
  hasPending(): boolean
}

export function createValidationYamlQueue(params: {
  mode: ValidationMode
  initialFiles: readonly ValidationProjectFile[]
}): ValidationYamlQueue {
  const entries = new Map<string, ValidationQueueEntry>()
  for (const file of params.initialFiles) {
    const key = normalizePath(file.absolutePath)
    if (!entries.has(key)) entries.set(key, { file, status: "pending" })
  }

  return {
    mode: params.mode,
    takePending(limit) {
      return [...entries.values()]
        .filter((entry) => entry.status === "pending")
        .slice(0, limit)
        .map((entry) => entry.file)
    },
    markRunning(filePath) {
      setStatus(entries, filePath, "running")
    },
    markReady(filePath) {
      setStatus(entries, filePath, "ready")
    },
    markError(filePath) {
      setStatus(entries, filePath, "error")
    },
    enqueueDependency(file) {
      const key = normalizePath(file.absolutePath)
      if (entries.has(key)) return "already-known"
      entries.set(key, { file, status: "pending" })
      return "enqueued"
    },
    entries() {
      return [...entries.values()]
    },
    hasPending() {
      return [...entries.values()].some((entry) => entry.status === "pending")
    },
  }
}

function setStatus(
  entries: Map<string, ValidationQueueEntry>,
  filePath: string,
  status: ValidationQueueEntry["status"],
): void {
  const entry = entries.get(normalizePath(filePath))
  if (entry) entry.status = status
}

function normalizePath(filePath: string): string {
  return resolve(filePath)
}
```

- [ ] **Step 3: Write object table tests**

Create `packages/core/metadata/validation/projectValidationObjectTable.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { createValidationObjectTable } from "./projectValidationObjectTable"
import type { ValidationObjectRecord } from "./projectValidationTypes"

describe("ValidationObjectTable", () => {
  it("resolves owner records by kind and name", () => {
    const table = createValidationObjectTable()
    table.mergeRecords([record({ kind: "Справочник", name: "Товары" })])

    expect(table.getOwner({ kind: "Справочник", name: "Товары" })?.filePath)
      .toBe("/project/Справочник/Товары/Свойства.yaml")
  })

  it("returns undefined for missing owners", () => {
    const table = createValidationObjectTable()

    expect(table.getOwner({ kind: "Справочник", name: "НеСуществует" })).toBeUndefined()
  })
})

function record(owner: { kind: string; name: string }): ValidationObjectRecord {
  return {
    filePath: `/project/${owner.kind}/${owner.name}/Свойства.yaml`,
    projectPath: `${owner.kind}/${owner.name}/Свойства.yaml`,
    kind: "properties",
    owner: { dir: owner.kind, name: owner.name },
    ownerRef: { kind: owner.kind, name: owner.name },
    model: { itemType: owner.kind, name: owner.name },
    importDiagnostics: [],
  }
}
```

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/projectValidationObjectTable.test.ts --no-isolate
```

Expected: FAIL because `projectValidationObjectTable.ts` does not exist.

- [ ] **Step 4: Implement object table**

Create `packages/core/metadata/validation/projectValidationObjectTable.ts`:

```ts
import type { OwnerTypeRef } from "./dataPath/types"
import type {
  ValidationObjectRecord,
  ValidationObjectTableSnapshot,
} from "./projectValidationTypes"

export interface ValidationObjectTable {
  mergeRecords(records: readonly ValidationObjectRecord[]): void
  getOwner(ref: OwnerTypeRef): ValidationObjectRecord | undefined
  hasFile(filePath: string): boolean
  snapshot(): ValidationObjectTableSnapshot
}

export function createValidationObjectTable(
  snapshot: ValidationObjectTableSnapshot = { records: [] },
): ValidationObjectTable {
  const recordsByOwner = new Map<string, ValidationObjectRecord>()
  const filePaths = new Set<string>()

  const table: ValidationObjectTable = {
    mergeRecords(records) {
      for (const record of records) {
        filePaths.add(record.filePath)
        if (record.ownerRef) recordsByOwner.set(ownerKey(record.ownerRef), record)
      }
    },
    getOwner(ref) {
      return recordsByOwner.get(ownerKey(ref))
    },
    hasFile(filePath) {
      return filePaths.has(filePath)
    },
    snapshot() {
      return { records: [...recordsByOwner.values()] }
    },
  }

  table.mergeRecords(snapshot.records)
  return table
}

function ownerKey(ref: OwnerTypeRef): string {
  return `${ref.kind}:${ref.name ?? ""}`
}
```

- [ ] **Step 5: Verify and commit**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/projectValidationQueue.test.ts metadata/validation/projectValidationObjectTable.test.ts --no-isolate
pnpm --filter @nakidka/core type-check
```

Expected: PASS.

Commit:

```bash
git add packages/core/metadata/validation/projectValidationTypes.ts packages/core/metadata/validation/projectValidationQueue.ts packages/core/metadata/validation/projectValidationObjectTable.ts packages/core/metadata/validation/projectValidationQueue.test.ts packages/core/metadata/validation/projectValidationObjectTable.test.ts
git commit -m "feat: :sparkles: добавить очередь validation"
```

## Task 3: Split Form Validation Into First and Second Passes

**Files:**
- Modify: `packages/core/metadata/validation/formValidationRegistry.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/validate.ts`
- Test: `packages/core/metadata/validation/validateForm.test.ts`
- Test: `packages/core/metadata/forms/clientApplicationForm/validate.test.ts` if present; otherwise add tests to `packages/core/metadata/validation/validateForm.test.ts`

- [ ] **Step 1: Write pass-equivalence test**

Add to `packages/core/metadata/validation/validateForm.test.ts`:

```ts
it("returns the same diagnostics through form validation passes and the registered wrapper", () => {
  const project = createProjectWithForm({
    propertiesYaml: [
      "Реквизиты:",
      "  Товар:",
      "    Тип: Справочник.Номенклатура",
    ].join("\n"),
    formYaml: [
      "Реквизиты:",
      "  Объект:",
      "    Тип: СправочникОбъект.Товары",
      "Элементы:",
      "  Поле:",
      "    Вид: ПолеВвода",
      "    ПутьКДанным: Объект.Товар",
    ].join("\n"),
  })
  const cache = createProjectYamlCache()
  const ownerCache = createOwnerMetadataCache({ projectDir: project.projectDir, yamlCache: cache, context: mockContext })

  const wrapperDiagnostics = validateForm({
    projectDir: project.projectDir,
    formDir: project.formDir,
    formName: "ФормаЭлемента",
    owner: { dir: "Справочник", name: "Товары" },
    cache,
    context: mockContext,
    ownerCache,
  })

  const first = validateClientApplicationFormFirstPass({
    projectDir: project.projectDir,
    formDir: project.formDir,
    formName: "ФормаЭлемента",
    owner: { dir: "Справочник", name: "Товары" },
    cache,
    context: mockContext,
  })
  expect(first.status).toBe("ok")
  if (first.status !== "ok") return
  const passDiagnostics = [
    ...first.diagnostics,
    ...validateClientApplicationFormSecondPass({
      state: first.state,
      ownerCache,
    }),
  ]

  expect(passDiagnostics).toEqual(wrapperDiagnostics)
})
```

If `createProjectWithForm` is not available in the file, use the existing local fixture helpers from `validateForm.test.ts`; do not create XML fixtures.

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/validateForm.test.ts --no-isolate
```

Expected: FAIL because the pass helpers are not exported.

- [ ] **Step 2: Add pass types to registry**

In `packages/core/metadata/validation/formValidationRegistry.ts`, add:

```ts
export interface RegisteredFormFirstPassOk {
  status: "ok"
  diagnostics: Diagnostic[]
  state: unknown
}

export interface RegisteredFormFirstPassFailed {
  status: "failed"
  diagnostics: Diagnostic[]
}

export type RegisteredFormFirstPassResult =
  | RegisteredFormFirstPassOk
  | RegisteredFormFirstPassFailed

export interface RegisteredFormFirstPassParams extends RegisteredFormValidatorParams {}

export interface RegisteredFormSecondPassParams {
  state: unknown
  ownerCache: OwnerMetadataCache
}

export type RegisteredFormFirstPassValidator = (
  params: RegisteredFormFirstPassParams,
) => RegisteredFormFirstPassResult

export type RegisteredFormSecondPassValidator = (
  params: RegisteredFormSecondPassParams,
) => Diagnostic[]

let formFirstPassValidator: RegisteredFormFirstPassValidator | undefined
let formSecondPassValidator: RegisteredFormSecondPassValidator | undefined

export function registerFormValidationPasses(params: {
  firstPass: RegisteredFormFirstPassValidator
  secondPass: RegisteredFormSecondPassValidator
}): void {
  formFirstPassValidator = params.firstPass
  formSecondPassValidator = params.secondPass
}

export function getRegisteredFormValidationPasses():
  | { firstPass: RegisteredFormFirstPassValidator; secondPass: RegisteredFormSecondPassValidator }
  | undefined {
  return formFirstPassValidator && formSecondPassValidator
    ? { firstPass: formFirstPassValidator, secondPass: formSecondPassValidator }
    : undefined
}
```

- [ ] **Step 3: Split client form validation**

In `packages/core/metadata/forms/clientApplicationForm/validate.ts`, introduce state and two exported helpers:

```ts
interface ClientApplicationFormValidationState {
  filePath: string
  parsed: ParsedYaml
  form: ReturnType<typeof importClientApplicationFormFromYAML>
  index: ReturnType<typeof buildFormDataPathIndex>
  occurrences: ReturnType<typeof collectFormDataPathOccurrences>
}

export function validateClientApplicationFormFirstPass(
  params: RegisteredFormValidatorParams,
): { status: "ok"; diagnostics: Diagnostic[]; state: ClientApplicationFormValidationState } | { status: "failed"; diagnostics: Diagnostic[] } {
  const filePath = join(params.formDir, "Форма.yaml")
  const entry = params.cache.get(filePath)
  if ("error" in entry) return { status: "failed", diagnostics: [readFormError(entry.filePath, params.formName, entry.error)] }
  if (entry.parsed.doc.errors.length > 0) return { status: "failed", diagnostics: syntaxDiagnostics(entry.filePath, entry.parsed) }

  const context = params.context ?? defaultValidationContext()
  const form = importForm({ context, yaml: entry.parsed.data, filePath: entry.filePath })
  if ("diagnostics" in form) return { status: "failed", diagnostics: params.suppressFormImportDiagnostics === true ? [] : form.diagnostics }

  const index = buildFormDataPathIndex({ filePath: entry.filePath, parsed: entry.parsed, form: form.value })
  const diagnostics = [
    ...validateExcludedEqualNameYAML({
      filePath: entry.filePath,
      parsed: entry.parsed,
      rule: ClientApplicationFormRules,
      context,
      name: params.formName,
    }),
    ...index.duplicateDiagnostics,
  ]
  for (const provider of getFormWarningProviders()) {
    diagnostics.push(...provider({ filePath: entry.filePath, parsed: entry.parsed }))
  }

  return {
    status: "ok",
    diagnostics,
    state: {
      filePath: entry.filePath,
      parsed: entry.parsed,
      form: form.value,
      index,
      occurrences: collectFormDataPathOccurrences(form.value),
    },
  }
}
```

Add the second pass:

```ts
export function validateClientApplicationFormSecondPass(params: {
  state: ClientApplicationFormValidationState
  ownerCache: OwnerMetadataCache
}): Diagnostic[] {
  const diagnostics: Diagnostic[] = []

  for (const occurrence of params.state.occurrences) {
    if (isAcceptedOpaqueMultipleValueDataPath(occurrence)) continue

    const result = resolveDataPath({
      filePath: params.state.filePath,
      parsed: params.state.parsed,
      yamlPath: occurrence.yamlPath,
      value: occurrence.value,
      index: params.state.index,
      ownerCache: params.ownerCache,
      ...(occurrence.tableContext !== undefined ? { tableContext: occurrence.tableContext } : {}),
    })

    diagnostics.push(...result.diagnostics)
    if (result.status === "error" || result.target === undefined) continue

    diagnostics.push(
      ...validateResolvedDataPathPolicy({
        filePath: params.state.filePath,
        parsed: params.state.parsed,
        yamlPath: occurrence.yamlPath,
        value: occurrence.value,
        rule: occurrence.rule,
        target: result.target,
        ...(occurrence.elementType !== undefined ? { elementType: occurrence.elementType } : {}),
        ...(occurrence.hasValuesPicture !== undefined ? { hasValuesPicture: occurrence.hasValuesPicture } : {}),
      }),
    )
  }

  return dedupeDiagnostics(diagnostics)
}
```

Then make `validateClientApplicationForm` a wrapper:

```ts
export const validateClientApplicationForm: RegisteredFormValidator = (params) => {
  const first = validateClientApplicationFormFirstPass(params)
  if (first.status === "failed") return first.diagnostics

  const context = params.context ?? defaultValidationContext()
  const ownerCache =
    params.ownerCache ??
    createOwnerMetadataCache({ projectDir: params.projectDir, yamlCache: params.cache, context })

  return dedupeDiagnostics([
    ...first.diagnostics,
    ...validateClientApplicationFormSecondPass({ state: first.state, ownerCache }),
  ])
}
```

Extract existing inline syntax/read diagnostics into small helpers `readFormError()` and `syntaxDiagnostics()` so the old messages remain byte-for-byte the same.

- [ ] **Step 4: Register form passes**

Where `validateClientApplicationForm` is registered, also register:

```ts
registerFormValidationPasses({
  firstPass: validateClientApplicationFormFirstPass,
  secondPass: ({ state, ownerCache }) =>
    validateClientApplicationFormSecondPass({
      state: state as ClientApplicationFormValidationState,
      ownerCache,
    }),
})
```

Use the existing form registration file; do not add validation-specific imports into unrelated metadata layers.

- [ ] **Step 5: Verify and commit**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/validateForm.test.ts --no-isolate
pnpm --filter @nakidka/core type-check
```

Expected: PASS.

Commit:

```bash
git add packages/core/metadata/validation/formValidationRegistry.ts packages/core/metadata/forms/clientApplicationForm/validate.ts packages/core/metadata/validation/validateForm.test.ts
git commit -m "refactor: :recycle: разделить validation формы"
```

## Task 4: Extract Project Validation Passes In Process

**Files:**
- Create: `packages/core/metadata/validation/projectValidationPasses.ts`
- Modify: `packages/core/metadata/validation/validateProject.ts`
- Test: `packages/core/metadata/validation/validateProject.test.ts`

- [ ] **Step 1: Write equivalence test for `concurrency: 1`**

Add to `packages/core/metadata/validation/validateProject.test.ts`:

```ts
it("concurrency 1 keeps existing project diagnostics", async () => {
  const projectDir = createProject()
  writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", [
    "Реквизиты:",
    "  Товар:",
    "    Тип: Справочник.Номенклатура",
  ])
  writeProjectFile(projectDir, "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml", [
    "Реквизиты:",
    "  Объект:",
    "    Тип: СправочникОбъект.Товары",
    "Элементы:",
    "  Поле:",
    "    Вид: ПолеВвода",
    "    ПутьКДанным: Объект.НетТакогоРеквизита",
  ])

  const result = await validateProject({ projectDir, context: mockContext, concurrency: 1 })

  expect(result.diagnostics).toEqual([
    expect.objectContaining({
      filePath: expect.stringContaining("Форма.yaml"),
      message: 'ПутьКДанным "Объект.НетТакогоРеквизита": неизвестный реквизит "НетТакогоРеквизита"',
    }),
  ])
})
```

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/validateProject.test.ts --no-isolate
```

Expected: PASS before extraction; keep it as a guard.

- [ ] **Step 2: Move per-file logic into pass functions**

Create `packages/core/metadata/validation/projectValidationPasses.ts`:

```ts
import { TypeCompiler } from "@sinclair/typebox/compiler"
import { join } from "path"
import { rootFromYAML } from "~/metadata/commonObjects/metadataTargets/roots"
import type { ConfigurationContext } from "~/metadata/context/types"
import type { MetadataItem } from "~/metadata/orchestration/property/types"
import type { ParsedYaml } from "~/yaml/parseMetadataYaml"
import { createOwnerMetadataCache, type OwnerMetadataCache } from "./dataPath/ownerCache"
import { buildObjectFieldIndex } from "./dataPath/objectFields"
import { validateMetadataTargetsInModel } from "./metadataTargetTraversal"
import { createProjectMetadataResolver, type ProjectMetadataResolver } from "./projectMetadataResolver"
import { getRegisteredFormValidationPasses } from "./formValidationRegistry"
import { getProjectFileValidators } from "./projectMetadataResolverRegistry"
import { exportJSONSchemaForSchemaName } from "./projectFileSchema"
import type { ValidationProjectFile } from "./projectFiles"
import type { ProjectYamlCache, ProjectYamlEntry } from "./projectYamlCache"
import type { ValidationProjectSpec } from "./projectSpecs"
import type { ValidationObjectRecord } from "./projectValidationTypes"
import type { Diagnostic } from "./types"
import { validateExcludedEqualNameYAML } from "./excludeIfEqualNameYAML"
import { validateParsedFile } from "./validateFile"
import { validateUniqueNameScopes } from "./uniqueNameScopes"
```

Then define local state:

```ts
export type ProjectValidationFileState =
  | { kind: "properties"; file: ValidationProjectFile; parsed: ParsedYaml; model: MetadataItem; firstPassDiagnostics: Diagnostic[] }
  | { kind: "form"; file: ValidationProjectFile; formState: unknown; firstPassDiagnostics: Diagnostic[] }
  | { kind: "failed"; file: ValidationProjectFile; diagnostics: Diagnostic[] }

export interface ProjectValidationFirstPassResult {
  state: ProjectValidationFileState
  objectRecords: ValidationObjectRecord[]
  diagnostics: Diagnostic[]
}

export interface ProjectValidationSecondPassParams {
  state: ProjectValidationFileState
  projectDir: string
  context: ConfigurationContext
  cache: ProjectYamlCache
  ownerCache: OwnerMetadataCache
  metadataResolver: ProjectMetadataResolver
}
```

Move `createValidationSchemaCache`, `validateProjectFileSchema`, `parsedForProjectFile`, `importPropertiesModel`, and equal-name suppression helpers from `validateProject.ts` into this file. Export:

```ts
export function createValidationSchemaCache(context: ConfigurationContext): ValidationSchemaCache
export function validateProjectFileFirstPass(params: {
  projectDir: string
  file: ValidationProjectFile
  cache: ProjectYamlCache
  context: ConfigurationContext
  schemaCache: ValidationSchemaCache
}): ProjectValidationFirstPassResult
export function validateProjectFileSecondPass(params: ProjectValidationSecondPassParams): Diagnostic[]
```

For properties first pass, return an object record:

```ts
const ownerRoot = rootFromYAML[params.file.owner.dir]
const ownerRef = ownerRoot ? { kind: params.file.owner.dir, name: params.file.owner.name } : undefined
const ownerWithoutIndex = {
  ref: ownerRef ?? { kind: params.file.owner.dir, name: params.file.owner.name },
  filePath: params.file.absolutePath,
  model: imported.model,
  rule: params.file.owner.spec.rule,
  spec: params.file.owner.spec,
}

return {
  state: { kind: "properties", file: params.file, parsed, model: imported.model, firstPassDiagnostics: firstDiagnostics },
  diagnostics: firstDiagnostics,
  objectRecords: [{
    filePath: params.file.absolutePath,
    projectPath: params.file.projectPath,
    kind: params.file.kind,
    owner: { dir: params.file.owner.dir, name: params.file.owner.name },
    ownerRef,
    model: imported.model,
    fieldIndex: buildObjectFieldIndex(ownerWithoutIndex),
    importDiagnostics: [],
  }],
}
```

For form first pass, use the registered form pass validator. If no pass validator is registered, return no form diagnostics, matching current `validateForm` fallback.

- [ ] **Step 3: Wire the sequential path through passes**

In `validateProject.ts`, keep `validateProjectSequential` but rewrite its loop:

```ts
const states: ProjectValidationFileState[] = []
const objectRecords: ValidationObjectRecord[] = []
for (const file of files) {
  try {
    const first = validateProjectFileFirstPass({ projectDir, file, cache, context, schemaCache })
    states.push(first.state)
    objectRecords.push(...first.objectRecords)
    diagnostics.push(...first.diagnostics)
  } finally {
    cache.release(file.absolutePath)
  }
}

const ownerCache = createOwnerMetadataCache({ projectDir, yamlCache: cache, context })
const metadataResolver = createProjectMetadataResolver({ projectDir, yamlCache: cache, context, ownerCache })
for (const state of states) {
  diagnostics.push(...validateProjectFileSecondPass({ projectDir, state, cache, context, ownerCache, metadataResolver }))
}
```

Do not use the `objectRecords` yet; this task only extracts phases without changing resolver behavior.

- [ ] **Step 4: Verify and commit**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/validateProject.test.ts metadata/validation/validateForm.test.ts --no-isolate
pnpm --filter @nakidka/core type-check
```

Expected: PASS.

Commit:

```bash
git add packages/core/metadata/validation/validateProject.ts packages/core/metadata/validation/projectValidationPasses.ts packages/core/metadata/validation/validateProject.test.ts
git commit -m "refactor: :recycle: выделить фазы project validation"
```

## Task 5: Add Table-Backed Owner Cache and Metadata Resolver

**Files:**
- Modify: `packages/core/metadata/validation/dataPath/ownerCache.ts`
- Modify: `packages/core/metadata/validation/projectMetadataResolver.ts`
- Modify: `packages/core/metadata/validation/projectValidationObjectTable.ts`
- Test: `packages/core/metadata/validation/dataPath/ownerCache.test.ts`
- Test: `packages/core/metadata/validation/projectMetadataResolver.test.ts`

- [ ] **Step 1: Write table-backed owner cache test**

Add to `packages/core/metadata/validation/dataPath/ownerCache.test.ts`:

```ts
it("can resolve owner metadata from validation object table without reading YAML", () => {
  const table = createValidationObjectTable({
    records: [{
      filePath: "/project/Справочник/Товары/Свойства.yaml",
      projectPath: "Справочник/Товары/Свойства.yaml",
      kind: "properties",
      owner: { dir: "Справочник", name: "Товары" },
      ownerRef: { kind: "Справочник", name: "Товары" },
      model: ownerModel({ name: "Товары" }),
      fieldIndex: buildObjectFieldIndex(owner({ ref: { kind: "Справочник", name: "Товары" } })),
      importDiagnostics: [],
    }],
  })
  const cache = createOwnerMetadataCacheFromValidationTable({ projectDir: "/project", table })

  const result = cache.get({ kind: "Справочник", name: "Товары" })

  expect(result.status).toBe("ok")
  if (result.status !== "ok") return
  expect(result.owner.filePath).toBe("/project/Справочник/Товары/Свойства.yaml")
})
```

Use existing `owner()` fixture helpers in the file; if they are local and not suitable, create the smallest `MetadataItem` model that `buildObjectFieldIndex` accepts.

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/dataPath/ownerCache.test.ts --no-isolate
```

Expected: FAIL because `createOwnerMetadataCacheFromValidationTable` does not exist.

- [ ] **Step 2: Implement table-backed owner cache**

In `ownerCache.ts`, add:

```ts
import type { ValidationObjectTable } from "../projectValidationObjectTable"

export function createOwnerMetadataCacheFromValidationTable(params: {
  projectDir: string
  table: ValidationObjectTable
}): OwnerMetadataCache {
  return {
    get(ref) {
      const record = params.table.getOwner(ref)
      if (record === undefined) {
        return {
          status: "not-found",
          diagnostics: [crossFileDiagnostic(ownerFilePath(params.projectDir, ref.kind, ref.name ?? ""), ownerNotFoundMessage(ref))],
        }
      }
      if (record.importDiagnostics.length > 0) {
        return { status: "import-error", diagnostics: record.importDiagnostics }
      }
      const ownerKind = getDataPathOwnerKind(ref.kind)
      if (ownerKind === undefined || record.model === undefined || record.fieldIndex === undefined) {
        return {
          status: "import-error",
          diagnostics: [crossFileDiagnostic(record.filePath, `Не удалось импортировать владельца ${formatOwnerRef(ref)}`)],
        }
      }
      const spec = createValidationSpecFromOwnerKind(ownerKind)
      return {
        status: "ok",
        owner: {
          ref,
          filePath: record.filePath,
          model: record.model as MetadataItem,
          rule: spec.rule,
          spec,
          fieldIndex: record.fieldIndex,
        },
      }
    },
  }
}
```

If private helpers are needed, keep them in the same file and do not export them.

- [ ] **Step 3: Add table-backed resolver test**

Add to `projectMetadataResolver.test.ts`:

```ts
it("returns needsDependency in partial mode when an object file can be resolved but is not loaded yet", () => {
  const table = createValidationObjectTable()
  const resolver = createProjectMetadataResolverFromValidationTable({
    projectDir: "/project",
    table,
    mode: "partial",
  })

  const result = resolver.resolveObject({
    target: { kind: "object", root: "Catalog", objectName: "Товары" },
  })

  expect(result).toMatchObject({
    ok: false,
    dependency: expect.objectContaining({
      kind: "needsDependency",
      file: expect.objectContaining({ projectPath: "Справочник/Товары/Свойства.yaml" }),
    }),
  })
})
```

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/projectMetadataResolver.test.ts --no-isolate
```

Expected: FAIL because the resolver function and dependency result do not exist.

- [ ] **Step 4: Implement resolver dependency contract**

In `projectValidationTypes.ts`, add:

```ts
export type ValidationResolveResult =
  | { ok: true; filePath?: string; details?: unknown }
  | { ok: false; diagnostics: Diagnostic[]; dependency?: ValidationDependencyRequest }
```

In `projectMetadataResolver.ts`, add `createProjectMetadataResolverFromValidationTable`. Keep the existing `createProjectMetadataResolver` unchanged.

Use this shape:

```ts
export function createProjectMetadataResolverFromValidationTable(params: {
  projectDir: string
  table: ValidationObjectTable
  mode: ValidationMode
  ownerCache?: OwnerMetadataCache
}): ProjectMetadataResolver {
  const projectDir = resolve(params.projectDir)
  const ownerCache = params.ownerCache ?? createOwnerMetadataCacheFromValidationTable({ projectDir, table: params.table })

  function missingObject(target: Extract<ParsedMetadataTarget, { kind: "object" }>, filePath: string): MetadataResolveResult {
    if (params.mode === "partial") {
      const file = resolveValidationProjectFile(projectDir, filePath)
      if (file !== undefined) {
        return {
          ok: false,
          diagnostics: [],
          dependency: { kind: "needsDependency", file, requestedBy: filePath },
        } as MetadataResolveResult
      }
    }
    return referenceError(filePath, `Не найден объект "${formatObjectTarget(target)}"`)
  }

  return {
    resolveObject({ target, filters }) {
      const rootResolver = getProjectObjectPathResolver(target.root)
      const rootPath = rootResolver?.({ projectDir, target: { kind: "object", root: target.root, objectName: target.objectName } })
      const filePath = rootPath?.filePath
      if (!filePath) return referenceError(projectDir, `Не найден объект "${formatObjectTarget(target)}"`)
      if (!params.table.hasFile(filePath)) return missingObject(target, filePath)
      // Continue with the current resolver logic, but read owners from ownerCache and table.
    },
    // resolveMember / resolveValue / resolveStyleItem / resolveCommonPicture mirror current behavior.
  }
}
```

During implementation, keep helper formatting functions shared by both resolver factories. If TypeScript requires `ProjectMetadataResolver` to know `dependency`, extend the `MetadataResolveResult` type in both `projectMetadataResolver.ts` and `projectMetadataResolverRegistry.ts`.

- [ ] **Step 5: Verify and commit**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/dataPath/ownerCache.test.ts metadata/validation/projectMetadataResolver.test.ts --no-isolate
pnpm --filter @nakidka/core type-check
```

Expected: PASS.

Commit:

```bash
git add packages/core/metadata/validation/dataPath/ownerCache.ts packages/core/metadata/validation/projectMetadataResolver.ts packages/core/metadata/validation/projectValidationTypes.ts packages/core/metadata/validation/projectValidationObjectTable.ts packages/core/metadata/validation/dataPath/ownerCache.test.ts packages/core/metadata/validation/projectMetadataResolver.test.ts
git commit -m "feat: :sparkles: добавить table-backed validation resolver"
```

## Task 6: Use Queue and Object Table in `validateProject` In Process

**Files:**
- Modify: `packages/core/metadata/validation/validateProject.ts`
- Modify: `packages/core/metadata/validation/projectValidationPasses.ts`
- Modify: `packages/core/metadata/validation/projectYamlCache.ts`
- Test: `packages/core/metadata/validation/validateProject.test.ts`
- Test: `packages/core/metadata/validation/projectYamlCache.test.ts`

- [ ] **Step 1: Add a snapshot-backed YAML cache test**

Add to `projectYamlCache.test.ts`:

```ts
it("can serve pre-parsed entries without invoking the reader again", () => {
  const parsed = parseMetadataYaml("Имя: Товары\n")
  const cache = createProjectYamlCacheFromEntries([
    { filePath: "/project/Справочник/Товары/Свойства.yaml", text: parsed.text, parsed },
  ])

  expect(cache.get("/project/Справочник/Товары/Свойства.yaml")).toMatchObject({
    filePath: "/project/Справочник/Товары/Свойства.yaml",
    parsed,
  })
  cache.release("/project/Справочник/Товары/Свойства.yaml")
  expect(cache.get("/project/Справочник/Товары/Свойства.yaml")).toMatchObject({
    filePath: "/project/Справочник/Товары/Свойства.yaml",
    parsed,
  })
})
```

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/projectYamlCache.test.ts --no-isolate
```

Expected: FAIL because `createProjectYamlCacheFromEntries` does not exist.

- [ ] **Step 2: Implement snapshot-backed cache**

In `projectYamlCache.ts`, add:

```ts
export function createProjectYamlCacheFromEntries(entries: readonly ProjectYamlEntry[]): ProjectYamlCache {
  const byPath = new Map(entries.map((entry) => [resolve(entry.filePath), entry]))

  return {
    get(filePath) {
      const absolutePath = resolve(filePath)
      const entry = byPath.get(absolutePath)
      if (entry) return entry
      return { filePath: absolutePath, error: new Error(`YAML-файл отсутствует в validation snapshot: ${absolutePath}`) }
    },
    release() {
      // Snapshot-backed entries are owned by the current validation pass and remain available until it finishes.
    },
  }
}
```

- [ ] **Step 3: Add no-duplicate-read test**

Add to `validateProject.test.ts`:

```ts
it("does not read a YAML file twice during full validation", async () => {
  const projectDir = createProject()
  writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", "{}\n")
  writeProjectFile(projectDir, "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml", "Элементы: {}\n")

  resetProjectValidationReadCountForTests()
  await validateProject({ projectDir, context: mockContext, concurrency: 1 })

  expect(getProjectValidationReadCountForTests(join(projectDir, "Справочник", "Товары", "Свойства.yaml"))).toBe(1)
  expect(getProjectValidationReadCountForTests(join(projectDir, "Справочник", "Товары", "Формы", "ФормаЭлемента", "Форма.yaml"))).toBe(1)
})
```

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/validateProject.test.ts --no-isolate
```

Expected: FAIL because the test counters and new pipeline do not exist.

- [ ] **Step 4: Implement in-process queue orchestration**

In `projectValidationPasses.ts`, add test-only counters near the YAML read helper:

```ts
const readCountsForTests = new Map<string, number>()

export function resetProjectValidationReadCountForTests(): void {
  readCountsForTests.clear()
}

export function getProjectValidationReadCountForTests(filePath: string): number {
  return readCountsForTests.get(resolve(filePath)) ?? 0
}

export function readProjectYamlEntryForValidation(filePath: string): ProjectYamlEntry | { filePath: string; error: Error } {
  const absolutePath = resolve(filePath)
  readCountsForTests.set(absolutePath, (readCountsForTests.get(absolutePath) ?? 0) + 1)
  try {
    const text = readFileSync(absolutePath, "utf8")
    return { filePath: absolutePath, text, parsed: parseMetadataYaml(text) }
  } catch (caught) {
    return { filePath: absolutePath, error: caught instanceof Error ? caught : new Error(String(caught)) }
  }
}
```

In `validateProject.ts`, replace `validateProjectSequential` with an in-process queue runner:

```ts
async function validateProjectInProcess(params: ValidateProjectParams): Promise<ValidateProjectResult> {
  const projectDir = resolve(params.projectDir)
  const context = params.context ?? defaultValidationContext()
  const files = params.filePath === undefined
    ? discoverValidationProjectFiles(projectDir)
    : [resolveSingleProjectFile(projectDir, params.filePath)]
  const queue = createValidationYamlQueue({ mode: params.filePath === undefined ? "full" : "partial", initialFiles: files })
  const objectTable = createValidationObjectTable()
  const schemaCache = createValidationSchemaCache(context)
  const states: ProjectValidationFileState[] = []
  const diagnostics: Diagnostic[] = []

  while (queue.hasPending()) {
    const batch = queue.takePending(64)
    const entries: ProjectYamlEntry[] = []
    for (const file of batch) {
      queue.markRunning(file.absolutePath)
      const entry = readProjectYamlEntryForValidation(file.absolutePath)
      if ("error" in entry) {
        queue.markError(file.absolutePath)
        diagnostics.push(readProjectYamlDiagnostic(entry))
        continue
      }
      entries.push(entry)
      const cache = createProjectYamlCacheFromEntries(entries)
      const first = validateProjectFileFirstPass({ projectDir, file, cache, context, schemaCache })
      states.push(first.state)
      objectTable.mergeRecords(first.objectRecords)
      diagnostics.push(...first.diagnostics)
      queue.markReady(file.absolutePath)
    }
  }

  const cache = createProjectYamlCacheFromEntries(states.flatMap(stateEntries))
  const ownerCache = createOwnerMetadataCacheFromValidationTable({ projectDir, table: objectTable })
  const metadataResolver = createProjectMetadataResolverFromValidationTable({ projectDir, table: objectTable, mode: queue.mode, ownerCache })
  for (const state of states) {
    diagnostics.push(...validateProjectFileSecondPass({ projectDir, state, cache, context, ownerCache, metadataResolver }))
  }

  return { diagnostics: sortDiagnostics(dedupeDiagnostics(diagnostics)) }
}
```

During implementation, keep the code compiling by storing each successful `ProjectYamlEntry` in a `Map<string, ProjectYamlEntry>` rather than deriving it from state. The snippet above shows the shape, not a separate abstraction requirement.

- [ ] **Step 5: Add partial dependency retry**

In the second-pass loop, collect dependency requests returned by the table-backed resolver. If `queue.mode === "partial"` and a dependency is returned:

```ts
const dependencyDiagnostics = validateProjectFileSecondPass(...)
const dependency = firstDependencyRequest(dependencyDiagnostics)
if (dependency !== undefined && queue.enqueueDependency(dependency.file) === "enqueued") {
  secondPassPending.add(state.file.absolutePath)
  continue
}
```

Represent dependency requests as a structured side channel from `validateProjectFileSecondPass`, not as fake diagnostics. Update `ProjectValidationSecondPassResult` to:

```ts
export type ProjectValidationSecondPassResult =
  | { status: "ok"; diagnostics: Diagnostic[] }
  | { status: "needsDependency"; diagnostics: Diagnostic[]; dependency: ValidationDependencyRequest }
```

Only emit "не найдено" diagnostics after a dependency cannot be resolved or has already been attempted.

- [ ] **Step 6: Verify and commit**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/projectYamlCache.test.ts metadata/validation/validateProject.test.ts metadata/validation/validateForm.test.ts --no-isolate
pnpm --filter @nakidka/core type-check
```

Expected: PASS.

Commit:

```bash
git add packages/core/metadata/validation
git commit -m "feat: :sparkles: использовать snapshot validation"
```

## Task 7: Add Worker-Thread Pool for Full Validation

**Files:**
- Create: `packages/core/metadata/validation/projectValidationWorker.ts`
- Create: `packages/core/metadata/validation/projectValidationWorkerPool.ts`
- Modify: `packages/core/metadata/validation/validateProject.ts`
- Test: `packages/core/metadata/validation/validateProject.test.ts`
- Test: `packages/core/metadata/validation/projectValidationWorkerPool.test.ts`

- [ ] **Step 1: Write parallel equivalence test**

Add to `validateProject.test.ts`:

```ts
it("parallel full validation returns the same diagnostics as concurrency 1", async () => {
  const projectDir = createProject()
  writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", [
    "Реквизиты:",
    "  Товар:",
    "    Тип: Справочник.Номенклатура",
  ])
  writeProjectFile(projectDir, "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml", [
    "Реквизиты:",
    "  Объект:",
    "    Тип: СправочникОбъект.Товары",
    "Элементы:",
    "  Поле:",
    "    Вид: ПолеВвода",
    "    ПутьКДанным: Объект.НетТакогоРеквизита",
  ])

  const sequential = await validateProject({ projectDir, context: mockContext, concurrency: 1 })
  const parallel = await validateProject({ projectDir, context: mockContext, concurrency: 2 })

  expect(parallel.diagnostics).toEqual(sequential.diagnostics)
})
```

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/validateProject.test.ts --no-isolate
```

Expected: PASS for now if `concurrency` is ignored; this becomes the regression guard.

- [ ] **Step 2: Add worker pool loading test**

Create `projectValidationWorkerPool.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { createProjectValidationWorkerPool } from "./projectValidationWorkerPool"

describe("ProjectValidationWorkerPool", () => {
  it("starts and stops worker threads", async () => {
    const pool = createProjectValidationWorkerPool({ concurrency: 2 })

    await pool.start()
    await pool.close()

    expect(pool.size()).toBe(2)
  })
})
```

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/projectValidationWorkerPool.test.ts --no-isolate
```

Expected: FAIL because the worker pool does not exist.

- [ ] **Step 3: Implement worker protocol**

Create `projectValidationWorker.ts`:

```ts
import { parentPort } from "node:worker_threads"
import type { ConfigurationContext } from "~/metadata/context/types"
import { createValidationSchemaCache, validateProjectFileFirstPass, validateProjectFileSecondPass } from "./projectValidationPasses"
import { createProjectYamlCacheFromEntries, type ProjectYamlEntry } from "./projectYamlCache"
import { createValidationObjectTable } from "./projectValidationObjectTable"
import { createOwnerMetadataCacheFromValidationTable } from "./dataPath/ownerCache"
import { createProjectMetadataResolverFromValidationTable } from "./projectMetadataResolver"

interface WorkerState {
  context?: ConfigurationContext
  projectDir?: string
  entries: Map<string, ProjectYamlEntry>
  states: Map<string, ProjectValidationFileState>
}

const state: WorkerState = { entries: new Map(), states: new Map() }

parentPort?.on("message", async (message: ValidationWorkerMessage) => {
  try {
    if (message.kind === "firstPass") {
      state.context = message.context
      state.projectDir = message.projectDir
      const schemaCache = createValidationSchemaCache(message.context)
      const diagnostics: Diagnostic[] = []
      const objectRecords: ValidationObjectRecord[] = []
      for (const file of message.files) {
        const entry = readProjectYamlEntryForValidation(file.absolutePath)
        if ("error" in entry) {
          diagnostics.push(readProjectYamlDiagnostic(entry))
          continue
        }
        state.entries.set(file.absolutePath, entry)
        const cache = createProjectYamlCacheFromEntries([entry])
        const first = validateProjectFileFirstPass({ projectDir: message.projectDir, file, cache, context: message.context, schemaCache })
        state.states.set(file.absolutePath, first.state)
        diagnostics.push(...first.diagnostics)
        objectRecords.push(...first.objectRecords)
      }
      parentPort?.postMessage({ kind: "firstPassResult", diagnostics, objectRecords })
    }

    if (message.kind === "secondPass") {
      const table = createValidationObjectTable(message.objectTable)
      const cache = createProjectYamlCacheFromEntries([...state.entries.values()])
      const ownerCache = createOwnerMetadataCacheFromValidationTable({ projectDir: message.projectDir, table })
      const metadataResolver = createProjectMetadataResolverFromValidationTable({ projectDir: message.projectDir, table, mode: message.mode, ownerCache })
      const diagnostics: Diagnostic[] = []
      for (const filePath of message.filePaths) {
        const fileState = state.states.get(filePath)
        if (fileState === undefined) continue
        const second = validateProjectFileSecondPass({ projectDir: message.projectDir, state: fileState, cache, context: message.context, ownerCache, metadataResolver })
        diagnostics.push(...second.diagnostics)
      }
      parentPort?.postMessage({ kind: "secondPassResult", diagnostics })
    }
  } catch (caught) {
    parentPort?.postMessage({ kind: "error", message: caught instanceof Error ? caught.message : String(caught) })
  }
})
```

Define `ValidationWorkerMessage` and result types in `projectValidationTypes.ts`; import the concrete types in the worker.

- [ ] **Step 4: Implement worker pool**

Create `projectValidationWorkerPool.ts`:

```ts
import { Worker } from "node:worker_threads"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

export interface ProjectValidationWorkerPool {
  start(): Promise<void>
  close(): Promise<void>
  size(): number
  runFirstPass(params: FirstPassPoolParams): Promise<FirstPassPoolResult>
  runSecondPass(params: SecondPassPoolParams): Promise<SecondPassPoolResult>
}

export function createProjectValidationWorkerPool(params: { concurrency: number }): ProjectValidationWorkerPool {
  const workers: Worker[] = []
  return {
    async start() {
      while (workers.length < params.concurrency) workers.push(createWorker())
    },
    async close() {
      await Promise.all(workers.map((worker) => worker.terminate()))
    },
    size() {
      return workers.length
    },
    async runFirstPass(params) {
      return runFirstPassOnWorkers(workers, params)
    },
    async runSecondPass(params) {
      return runSecondPassOnWorkers(workers, params)
    },
  }
}

function createWorker(): Worker {
  const currentFile = fileURLToPath(import.meta.url)
  const workerFile = currentFile.endsWith(".ts")
    ? join(dirname(currentFile), "projectValidationWorker.ts")
    : join(dirname(currentFile), "projectValidationWorker.js")
  const execArgv = workerFile.endsWith(".ts") && !process.execArgv.some((arg) => arg.includes("tsx"))
    ? ["--import", "tsx", ...process.execArgv]
    : process.execArgv

  return new Worker(workerFile, { execArgv })
}
```

Implement `runFirstPassOnWorkers` by splitting files round-robin by index:

```ts
function partitionRoundRobin<T>(items: readonly T[], count: number): T[][] {
  const result = Array.from({ length: count }, () => [] as T[])
  items.forEach((item, index) => result[index % count]!.push(item))
  return result
}
```

Each worker receives one `firstPass` message for its batch and one `secondPass` message for the same file paths. Keep a `Map<Worker, string[]>` of assigned file paths inside the pool.

- [ ] **Step 5: Switch full validation to workers when `concurrency > 1`**

In `validateProject.ts`, normalize concurrency:

```ts
import { availableParallelism } from "node:os"

function normalizeValidationConcurrency(value: number | undefined): number {
  if (value !== undefined) {
    if (!Number.isInteger(value) || value < 1) throw new Error("validation concurrency must be a positive integer")
    return value
  }
  return Math.max(1, Math.min(4, availableParallelism() - 1))
}
```

Use worker pool only for full validation:

```ts
export async function validateProject(params: ValidateProjectParams): Promise<ValidateProjectResult> {
  const concurrency = normalizeValidationConcurrency(params.concurrency)
  if (params.filePath !== undefined || concurrency === 1) {
    return validateProjectInProcess({ ...params, concurrency: 1 })
  }
  return validateProjectWithWorkers({ ...params, concurrency })
}
```

Implement `validateProjectWithWorkers`:

```ts
async function validateProjectWithWorkers(params: ValidateProjectParams & { concurrency: number }): Promise<ValidateProjectResult> {
  const projectDir = resolve(params.projectDir)
  const context = params.context ?? defaultValidationContext()
  const files = discoverValidationProjectFiles(projectDir)
  const pool = createProjectValidationWorkerPool({ concurrency: params.concurrency })
  try {
    await pool.start()
    const first = await pool.runFirstPass({ projectDir, context, files })
    const objectTable = createValidationObjectTable()
    objectTable.mergeRecords(first.objectRecords)
    const second = await pool.runSecondPass({
      projectDir,
      context,
      mode: "full",
      objectTable: objectTable.snapshot(),
    })
    return { diagnostics: sortDiagnostics(dedupeDiagnostics([...first.diagnostics, ...second.diagnostics])) }
  } finally {
    await pool.close()
  }
}
```

Keep partial validation in-process until a later optimization; the spec allows this because partial mode is dependency-driven and should avoid full project reads.

- [ ] **Step 6: Verify and commit**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/projectValidationWorkerPool.test.ts metadata/validation/validateProject.test.ts --no-isolate
pnpm --filter @nakidka/core type-check
```

Expected: PASS.

Commit:

```bash
git add packages/core/metadata/validation
git commit -m "feat: :sparkles: распараллелить full validation"
```

## Task 8: Final Verification and Timing

**Files:**
- Modify only if tests expose issues.

- [ ] **Step 1: Run focused validation tests**

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/validateFile.test.ts metadata/validation/validateProject.test.ts metadata/validation/validateForm.test.ts metadata/validation/projectYamlCache.test.ts metadata/validation/projectMetadataResolver.test.ts metadata/validation/dataPath/ownerCache.test.ts --no-isolate
```

Expected: all selected tests pass.

- [ ] **Step 2: Run type-check**

```bash
pnpm --filter @nakidka/core type-check
pnpm --filter @nakidka/cli exec tsc --noEmit
pnpm --filter @nakidka/mcp exec tsc --noEmit
```

Expected: all type checks pass.

- [ ] **Step 3: Run full test suite**

```bash
pnpm test
```

Expected: all workspace tests pass.

- [ ] **Step 4: Measure full validation**

Run outside the sandbox if `tsx` pipe permissions fail:

```bash
/usr/bin/time -p pnpm --filter @nakidka/cli dev validate /Users/nikita/git/nkdk-yaml >/tmp/nkdk-validation-parallel.log 2>&1
tail -20 /tmp/nkdk-validation-parallel.log
```

Expected:
- exit code may be `1` because the target YAML project currently has validation errors;
- output contains `summary: 49533 error, 0 warning` or the current equivalent;
- `real` time should be compared with the last measured baseline around `204.99` seconds.

- [ ] **Step 5: Commit final fixes if needed**

If verification required follow-up fixes:

```bash
git add packages/core packages/cli packages/mcp
git commit -m "fix: :bug: стабилизировать parallel validation"
```

If no fixes were needed, do not create an empty commit.

## Self-Review Notes

- Spec coverage: async replacement, full/partial queue, one parse per file, object table, form phases, table-backed resolver, worker parallelism, deterministic diagnostics, tests, and timing measurement are each covered by at least one task.
- Intentional staging: full validation gets worker-thread parallelism first; partial validation uses the same queue/table contract in-process. This preserves the spec’s unified behavior while avoiding a more complex live dependency protocol across worker threads in the first implementation.
- No XML fixtures are changed.
- Shared validation/project layers remain metadata-neutral: object-specific behavior stays in existing rules, registries, and form registration.
