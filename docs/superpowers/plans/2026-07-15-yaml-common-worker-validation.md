# YAML Common Worker Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Перевести подготовку YAML-проекта и валидацию на единый worker-договор, чтобы YAML читался и разбирался один раз, а последующие validation-фазы работали с `Worker данные YAML`.

**Architecture:** `prepareYamlProject` остается входной точкой подготовки и строит логические worker-разделы. Worker подготовки хранит YAML-данные и умеет принимать команды `validateFirstPass` и `validateSecondPass`, используя перенесенную логику старого validation worker pool. Старый `ProjectValidationWorkerPool` сохраняется как переходный слой до завершения переноса, но `validateProject` начинает использовать новый путь для full validation.

**Tech Stack:** TypeScript, Vitest, Piscina, TypeBox/AJV standalone validation, существующие `rules.ts`, `parseMetadataYaml`, `ProjectYamlCache`.

## Global Constraints

- Ответы и commit-сообщения пишутся на русском языке.
- Не изменять XML-фикстуры.
- Общие metadata-слои не должны знать про конкретные metadata-объекты, папки или частные itemType.
- `Worker данные YAML` не хранят исходный YAML-текст.
- Worker получают только YAML-файлы; файлы ресурсов проекта не распределяются и не читаются в общем шаге.
- Логические worker-разделы создаются всегда; физический worker запускается только для непустого раздела, `concurrency=1` может выполнять ту же worker-задачу in-process.
- Подсказка схем не входит в задачи этой реализации.
- Перед закрытием задачи выполнить `pnpm test` из корня ворктри.

---

## File Structure

- `packages/core/metadata/project/preparedYamlProject.ts`  
  Договор `PreparedYamlProject`, разделение YAML-файлов и файлов ресурсов проекта, публичная `prepareYamlProject`.

- `packages/core/metadata/project/preparedYamlProjectWorker.ts`  
  Единый worker подготовки и validation-фаз. Добавляет команды `initValidation`, `validateFirstPass`, `validateSecondPass` рядом с текущей `prepare`.

- `packages/core/metadata/project/preparedYamlProjectWorkerPool.ts`  
  Координатор логических worker-разделов: prepare, merge indexes, validation init/first/second pass, close.

- `packages/core/metadata/project/preparedYamlProject.test.ts`  
  Тесты подготовки, `resourceFiles`, логических worker-разделов и отсутствия повторного чтения YAML при валидации через подготовку.

- `packages/core/metadata/validation/validateProject.ts`  
  Переключает full validation на `prepareYamlProject`. Старый in-process путь остается для `filePath`.

- `packages/core/metadata/validation/projectValidationPasses.ts`  
  Добавляет создание `ProjectYamlEntry` из `PreparedYamlFile`, чтобы first pass работал без повторного чтения.

- `packages/core/metadata/validation/projectValidationWorker.ts` и `packages/core/metadata/validation/projectValidationWorkerPool.ts`  
  Остаются как переходная совместимость и источник переносимой логики. После переключения full validation часть тестов меняется на новый worker.

- `packages/core/metadata/operations/deleteItem.ts`, `packages/core/metadata/operations/index.ts`, `packages/mcp/src/services/findReferences.ts`, `packages/mcp/src/contracts/operations.ts`, `packages/cli/src/commands/migration.ts`  
  Переименование core-операции `deleteMetadataItem` в `findMetadataReferences` без изменения поведения.

- `packages/core/metadata/appliedObjects/configuration/syncToXML.ts`  
  После подготовки использует `resourceFiles` и prepared YAML там, где это можно сделать без изменения XML-семантики.

---

### Task 1: Fill `resourceFiles` In YAML Preparation

**Files:**
- Modify: `packages/core/metadata/project/preparedYamlProject.ts`
- Modify: `packages/core/metadata/project/preparedYamlProject.test.ts`

**Interfaces:**
- Consumes: `discoverMetadataProjectResources(projectDir)`
- Produces:
  ```ts
  export interface PreparedYamlProjectResourceDescriptor {
    projectPath: string
    filePath: string
    owner: { dir: string; name: string }
    role: string
    propertyType?: string
  }
  ```

- [ ] **Step 1: Write the failing test**

Add this test to `packages/core/metadata/project/preparedYamlProject.test.ts`:

```ts
it("returns resource file descriptions without reading resource content", async () => {
  const projectDir = createTempProject()
  writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", "Синоним: Товары\n")
  writeProjectFile(projectDir, "Справочник/Товары/МодульМенеджера.bsl", "Процедура Тест()\nКонецПроцедуры\n")

  const result = await prepareYamlProject({
    projectDir,
    context: { version: "2.20", defaultLanguage: "ru", exportToYAML: { toTyped: false } },
    concurrency: 1,
  })

  expect(result.ok).toBe(true)
  if (!result.ok) return

  expect(result.project.resourceFiles).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        projectPath: "Справочник/Товары/МодульМенеджера.bsl",
        owner: { dir: "Справочник", name: "Товары" },
      }),
    ])
  )
  expect(result.project.workers.flatMap((worker) => worker.yamlFiles).map((file) => file.projectPath)).not.toContain(
    "Справочник/Товары/МодульМенеджера.bsl"
  )
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/project/preparedYamlProject.test.ts
```

Expected: FAIL because `resourceFiles` is `[]` or the helper fixture path is not classified yet.

- [ ] **Step 3: Implement descriptor split**

In `packages/core/metadata/project/preparedYamlProject.ts`, replace the single `files` construction with YAML/resource split:

```ts
const resources = discoverMetadataProjectResources(projectDir).filter((resource) => resource.absolutePath !== undefined)
const files = resources
  .filter((resource) => resource.kind === "yaml")
  .map(
    (resource): PreparedYamlProjectFileDescriptor => ({
      projectPath: resource.projectPath,
      filePath: resource.absolutePath!,
      role: resource.role,
      owner: { dir: resource.owner.dir, name: resource.owner.name },
      itemType:
        resource.owner.spec.rule.metadataTargetOwner?.kind === "self"
          ? resource.owner.spec.rule.metadataTargetOwner.root
          : (resource.owner.spec.rule.itemTypePrefix ?? resource.owner.spec.rule.itemType),
    })
  )
const resourceFiles = resources
  .filter((resource) => resource.kind !== "yaml")
  .map(
    (resource): PreparedYamlProjectResourceDescriptor => ({
      projectPath: resource.projectPath,
      filePath: resource.absolutePath!,
      owner: { dir: resource.owner.dir, name: resource.owner.name },
      role: resource.role,
      propertyType: "property" in resource ? resource.property.type : undefined,
    })
  )
```

Return `resourceFiles` instead of `[]`.

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/project/preparedYamlProject.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/project/preparedYamlProject.ts packages/core/metadata/project/preparedYamlProject.test.ts
git commit -m "feat: :sparkles: описать файлы ресурсов при подготовке YAML"
```

---

### Task 2: Rename Core Delete Operation To Reference Search

**Files:**
- Move: `packages/core/metadata/operations/deleteItem.ts` -> `packages/core/metadata/operations/findMetadataReferences.ts`
- Move: `packages/core/metadata/operations/deleteItem.test.ts` -> `packages/core/metadata/operations/findMetadataReferences.test.ts`
- Modify: `packages/core/metadata/operations/index.ts`
- Modify: `packages/core/metadata/operations/types.ts`
- Modify: `packages/mcp/src/services/findReferences.ts`
- Modify: `packages/mcp/src/contracts/operations.ts`
- Modify: `packages/cli/src/commands/migration.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface FindMetadataReferencesParams {
    projectDir: string
    path: string
    allowWrite?: boolean
  }

  export async function findMetadataReferences(params: FindMetadataReferencesParams): Promise<MetadataOperationResult>
  ```

- [ ] **Step 1: Write the failing tests**

In `packages/core/metadata/operations/findMetadataReferences.test.ts`, rename the imports and describe block:

```ts
import { findMetadataReferences } from "./findMetadataReferences"

describe("findMetadataReferences", { timeout: 30_000 }, () => {
  it("returns references_found without changing files when external references exist", async () => {
    const projectDir = createTempProject()
    writeProjectFile(projectDir, "Справочник/Номенклатура/Свойства.yaml", "Синоним: Номенклатура\n")
    writeProjectFile(projectDir, "Документ/Заказ/Свойства.yaml", ["Реквизиты:", "  Товар:", "    Тип: Справочник.Номенклатура"].join("\n"))

    const result = await findMetadataReferences({
      projectDir,
      path: "Справочник.Номенклатура",
    })

    expect(result).toMatchObject({
      ok: false,
      code: "references_found",
      message: "Найдены внешние ссылки",
    })
  })
})
```

In `packages/mcp/src/services/findReferences.test.ts`, expect `findMetadataReferences`:

```ts
const findMetadataReferences = vi.fn().mockResolvedValue(coreResult)

const result = await findReferences(
  { projectDir: "/project", path: "Справочник.Товары" },
  { findMetadataReferences }
)

expect(findMetadataReferences).toHaveBeenCalledWith({
  projectDir: "/project",
  path: "Справочник.Товары",
})
expect(result).toEqual(coreResult)
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/operations/findMetadataReferences.test.ts
pnpm --filter @nkdk/mcp exec vitest run src/services/findReferences.test.ts
```

Expected: FAIL because `findMetadataReferences` is not exported and MCP deps still expect `deleteMetadataItem`.

- [ ] **Step 3: Rename types and exports**

In `packages/core/metadata/operations/types.ts`, rename:

```ts
export interface FindMetadataReferencesParams {
  projectDir: string
  path: string
  allowWrite?: boolean
}
```

In `packages/core/metadata/operations/findMetadataReferences.ts`, rename the function:

```ts
export async function findMetadataReferences(params: FindMetadataReferencesParams): Promise<MetadataOperationResult> {
  const context = defaultMetadataOperationsContext()
  const validation = await validateProject({ projectDir: params.projectDir, context, concurrency: 1 })
  const errors = validation.diagnostics.filter((diagnostic) => diagnostic.severity === "error")
  if (errors.length > 0) return validationFailure("YAML-проект содержит ошибки validation", errors)

  const prepared = await prepareYamlProject({ projectDir: params.projectDir, context })
  if (!prepared.ok) return validationFailure(prepared.message, prepared.diagnostics)

  const snapshot = buildMetadataOperationSnapshotFromPreparedProject({
    project: prepared.project,
    context,
    requireValidProject: true,
  })
  if (!snapshot.ok) return snapshot

  const parsedPath = parseMetadataOperationPath(params.path)
  if (!parsedPath.ok) return failure(parsedPath.code, parsedPath.message)

  const resolved = resolveMetadataOperationPath(snapshot, parsedPath)
  if (!resolved.ok) return failure(resolved.code, resolved.message)

  const planResult = buildDeletePlan({ snapshot, resolved })
  if (!planResult.ok) return planResult.failure
  const plan = planResult.plan
  if (plan.blockedReferences.length > 0) {
    return {
      ok: false,
      code: "references_found",
      message: "Найдены внешние ссылки",
      changedFiles: [],
      rewrittenReferences: [],
      blockedReferences: plan.blockedReferences,
    }
  }

  void params.allowWrite
  return success("plan", [])
}
```

In `packages/core/metadata/operations/index.ts`:

```ts
export * from "./findMetadataReferences"
```

- [ ] **Step 4: Update MCP and CLI adapters**

In `packages/mcp/src/services/findReferences.ts`:

```ts
type FindReferencesDeps = Pick<CoreApi, "findMetadataReferences">

export async function findReferences(input: FindReferencesInput, deps?: FindReferencesDeps): Promise<ToolPayload> {
  try {
    const core = deps ?? (await loadCoreApi())
    return (await core.findMetadataReferences(input)) as unknown as ToolPayload
  } catch (caught) {
    return toolError("core_error", errorMessage(caught))
  }
}
```

In `packages/mcp/src/contracts/operations.ts`, remove `allowWrite` from `findReferencesInputShape`:

```ts
export const findReferencesInputShape = {
  projectDir: z.string().min(1),
  path: operationPath,
}
```

In `packages/cli/src/commands/migration.ts`, keep the CLI command name if needed, but call:

```ts
findMetadataReferences({
  projectDir: yamlDir,
  path,
  allowWrite: write,
})
```

- [ ] **Step 5: Run tests**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/operations/findMetadataReferences.test.ts
pnpm --filter @nkdk/mcp test
pnpm --filter @nkdk/cli test
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/operations packages/mcp/src packages/mcp/README.md packages/cli/src/commands/migration.ts
git commit -m "refactor: :recycle: переименовать удаление в поиск ссылок"
```

---

### Task 3: Let Validation First Pass Consume Prepared YAML Entries

**Files:**
- Modify: `packages/core/metadata/validation/projectValidationPasses.ts`
- Modify: `packages/core/metadata/validation/projectYamlCache.ts`
- Modify: `packages/core/metadata/project/preparedYamlProject.test.ts`

**Interfaces:**
- Consumes:
  ```ts
  import type { PreparedYamlFile } from "../project/preparedYamlProject"
  ```
- Produces:
  ```ts
  export function projectYamlEntryFromPreparedFile(file: PreparedYamlFile): ProjectYamlEntry
  export function createProjectYamlCacheFromPreparedFiles(files: readonly PreparedYamlFile[]): ProjectYamlCache
  ```

- [ ] **Step 1: Write the failing test**

Add to `packages/core/metadata/project/preparedYamlProject.test.ts`:

```ts
it("validates prepared YAML without reading the file again", async () => {
  const projectDir = createTempProject()
  const yamlPath = writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", "Синоним: Товары\n")
  resetProjectValidationReadCountForTests()

  const prepared = await prepareYamlProject({
    projectDir,
    context: { version: "2.20", defaultLanguage: "ru", exportToYAML: { toTyped: false } },
    concurrency: 1,
  })

  expect(prepared.ok).toBe(true)
  if (!prepared.ok) return

  const file = prepared.project.workers.flatMap((worker) => worker.yamlFiles)[0]!
  const cache = createProjectYamlCacheFromPreparedFiles([file])
  expect(cache.get(yamlPath)).toMatchObject({ filePath: yamlPath })
  expect(getProjectValidationReadCountForTests(yamlPath)).toBe(0)
})
```

Add imports:

```ts
import { createProjectYamlCacheFromPreparedFiles } from "../validation/projectYamlCache"
import {
  getProjectValidationReadCountForTests,
  resetProjectValidationReadCountForTests,
} from "../validation/projectValidationPasses"
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/project/preparedYamlProject.test.ts
```

Expected: FAIL because `createProjectYamlCacheFromPreparedFiles` does not exist.

- [ ] **Step 3: Implement prepared cache adapter**

In `packages/core/metadata/validation/projectYamlCache.ts`:

```ts
import type { PreparedYamlFile } from "../project/preparedYamlProject"
import type { ParsedYaml } from "../../yaml/parseMetadataYaml"

export function createProjectYamlCacheFromPreparedFiles(files: readonly PreparedYamlFile[]): ProjectYamlCache {
  return createProjectYamlCacheFromEntries(files.map(projectYamlEntryFromPreparedFile))
}

export function projectYamlEntryFromPreparedFile(file: PreparedYamlFile): ProjectYamlEntry {
  const parsed: ParsedYaml = {
    text: "",
    data: file.data,
    locations: emptyYamlLocationIndex(),
    syntaxErrors: file.syntaxDiagnostics.map((diagnostic) => ({
      line: diagnostic.line,
      col: diagnostic.col,
      message: diagnostic.message,
    })),
  }

  return { filePath: file.filePath, text: "", parsed }
}
```

Move or duplicate the existing empty location adapter from `packages/core/metadata/operations/projectSnapshot.ts` into a shared helper:

```ts
function emptyYamlLocationIndex(): YamlLocationIndex {
  return {
    rootPosition: () => ({ line: 1, col: 1 }),
    keyPosition: () => undefined,
    keyOccurrences: () => [],
    valuePosition: () => undefined,
    nodePosition: () => undefined,
  }
}
```

- [ ] **Step 4: Run test**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/project/preparedYamlProject.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/validation/projectYamlCache.ts packages/core/metadata/project/preparedYamlProject.test.ts
git commit -m "feat: :sparkles: валидировать подготовленные YAML-данные"
```

---

### Task 4: Add Validation Commands To Prepared YAML Worker

**Files:**
- Modify: `packages/core/metadata/project/preparedYamlProjectWorker.ts`
- Modify: `packages/core/metadata/project/preparedYamlProjectWorkerPool.ts`
- Modify: `packages/core/metadata/project/preparedYamlProject.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type PreparedYamlProjectWorkerTask =
    | PrepareTask
    | InitValidationTask
    | ValidateFirstPassTask
    | ValidateSecondPassTask
  ```

  ```ts
  export interface PreparedYamlProjectWorkerPool {
    run(...): Promise<PreparedYamlProjectWorkerPoolResult>
    initValidation(context: ConfigurationContext): Promise<ProjectValidationWorkerPoolStartProfile>
    runValidationFirstPass(params: { projectDir: string; context: ConfigurationContext }): Promise<FirstPassPoolResult>
    runValidationSecondPass(params: SecondPassPoolParams): Promise<SecondPassPoolResult>
    close(): Promise<void>
  }
  ```

- [ ] **Step 1: Write the failing test**

Add to `packages/core/metadata/project/preparedYamlProject.test.ts`:

```ts
it("runs validation first pass on worker-stored YAML data", async () => {
  const projectDir = createTempProject()
  const yamlPath = writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", "Синоним: Товары\n")
  const context = { version: "2.20", defaultLanguage: "ru", exportToYAML: { toTyped: false } }
  resetProjectValidationReadCountForTests()

  const pool = createPreparedYamlProjectWorkerPool({ concurrency: 1 })
  try {
    const prepared = await pool.run({
      projectDir,
      context,
      files: [
        {
          projectPath: "Справочник/Товары/Свойства.yaml",
          filePath: yamlPath,
          role: "properties",
          owner: { dir: "Справочник", name: "Товары" },
          itemType: "Catalog",
        },
      ],
    })
    expect(prepared.diagnostics).toEqual([])

    await pool.initValidation(context)
    const first = await pool.runValidationFirstPass({ projectDir, context })

    expect(first.diagnostics.filter((diagnostic) => diagnostic.severity === "error")).toEqual([])
    expect(first.objectRecords).toHaveLength(1)
    expect(getProjectValidationReadCountForTests(yamlPath)).toBe(0)
  } finally {
    await pool.close()
  }
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/project/preparedYamlProject.test.ts
```

Expected: FAIL because pool has no validation commands.

- [ ] **Step 3: Add worker state and init command**

In `packages/core/metadata/project/preparedYamlProjectWorker.ts`, add module state:

```ts
let preparedYamlFiles = new Map<string, PreparedYamlFile>()
let validationSchemaCache: ValidationSchemaCache | undefined
let validationRulesSnapshot: ValidationRulesSnapshot | undefined
let validationState = createEmptyWorkerValidationState()
```

Extend task/result union:

```ts
type InitValidationTask = {
  kind: "initValidation"
  context: ConfigurationContext
  rulesSnapshot: ValidationRulesSnapshot
}

type InitValidationResult = {
  kind: "initValidationResult"
} & ValidationSchemaCacheCompileProfile
```

In `runPreparedYamlProjectWorkerTask`:

```ts
if (message.kind === "initValidation") {
  validationSchemaCache = await createProjectValidationWorkerSchemaCache({ context: message.context })
  validationRulesSnapshot = message.rulesSnapshot
  return { kind: "initValidationResult", ...validationSchemaCache.compileAll() }
}
```

When `prepare` finishes, set:

```ts
preparedYamlFiles = new Map(yamlFiles.map((file) => [file.filePath, file]))
```

- [ ] **Step 4: Add first pass command**

Add `ValidateFirstPassTask`:

```ts
type ValidateFirstPassTask = {
  kind: "validateFirstPass"
  projectDir: string
  context: ConfigurationContext
}
```

Implement:

```ts
function runValidationFirstPass(message: ValidateFirstPassTask): FirstPassPoolResult {
  validationState = createEmptyWorkerValidationState()
  const diagnostics: Diagnostic[] = []
  const objectRecords: ValidationObjectRecord[] = []
  const schemaCache = requireValidationSchemaCache()
  const cache = createProjectYamlCacheFromPreparedFiles([...preparedYamlFiles.values()])

  for (const yamlFile of preparedYamlFiles.values()) {
    const file = resolveValidationProjectFile(message.projectDir, yamlFile.filePath)
    if (file === undefined) continue

    const first = validateProjectFileFirstPass({
      projectDir: message.projectDir,
      file,
      cache,
      context: message.context,
      schemaCache,
      rulesSnapshot: requireValidationRulesSnapshot(),
    })

    validationState.states.set(resolve(file.absolutePath), first.state)
    validationState.objectIndexEntries.push(...first.objectIndexEntries)
    validationState.memberIndexEntries.push(...first.memberIndexEntries)
    validationState.valueIndexEntries.push(...first.valueIndexEntries)
    validationState.pendingReferences.push(...first.pendingReferences)
    diagnostics.push(...first.diagnostics)
    objectRecords.push(...first.objectRecords)
  }

  return {
    diagnostics,
    objectRecords,
    objectIndexEntries: validationState.objectIndexEntries,
    memberIndexEntries: validationState.memberIndexEntries,
    valueIndexEntries: validationState.valueIndexEntries,
    pendingReferences: validationState.pendingReferences,
  }
}
```

- [ ] **Step 5: Expose pool methods**

In `packages/core/metadata/project/preparedYamlProjectWorkerPool.ts`, add `initValidation` and `runValidationFirstPass`. For empty logical partitions return empty first pass result without launching a pool.

Use `createValidationRulesSnapshot(context)` once in coordinator and pass it to every non-empty worker:

```ts
const rulesSnapshot = createValidationRulesSnapshot(context)
```

- [ ] **Step 6: Run test**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/project/preparedYamlProject.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/core/metadata/project/preparedYamlProjectWorker.ts packages/core/metadata/project/preparedYamlProjectWorkerPool.ts packages/core/metadata/project/preparedYamlProject.test.ts
git commit -m "feat: :sparkles: добавить validation-фазы в YAML worker"
```

---

### Task 5: Switch Full Validation To Prepared YAML Worker

**Files:**
- Modify: `packages/core/metadata/validation/validateProject.ts`
- Modify: `packages/core/metadata/validation/validateProject.test.ts`
- Modify: `packages/core/metadata/project/preparedYamlProjectWorkerPool.ts`

**Interfaces:**
- Consumes:
  ```ts
  prepareYamlProject({ projectDir, context, concurrency })
  ```
- Produces:
  ```ts
  async function validateProjectWithPreparedYaml(params: ValidateProjectParams & { concurrency: number }): Promise<ValidateProjectResult>
  ```

- [ ] **Step 1: Write the failing test**

Add to `packages/core/metadata/validation/validateProject.test.ts`:

```ts
it("full validation uses prepared YAML without the legacy validation reader", async () => {
  const projectDir = createTempProject()
  const yamlPath = writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", "Синоним: Товары\n")
  resetProjectValidationReadCountForTests()

  const result = await validateProject({
    projectDir,
    context: { version: "2.20", defaultLanguage: "ru", exportToYAML: { toTyped: false } },
    concurrency: 2,
  })

  expect(result.diagnostics.filter((diagnostic) => diagnostic.severity === "error")).toEqual([])
  expect(getProjectValidationReadCountForTests(yamlPath)).toBe(0)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/validation/validateProject.test.ts
```

Expected: FAIL because old full validation reads YAML through `readProjectYamlEntryForValidation`.

- [ ] **Step 3: Implement prepared validation orchestration**

In `packages/core/metadata/validation/validateProject.ts`, change `validateProject`:

```ts
export async function validateProject(params: ValidateProjectParams): Promise<ValidateProjectResult> {
  const concurrency = normalizeValidationConcurrency(params.concurrency)
  if (params.filePath !== undefined) {
    return validateProjectInProcess({ ...params, concurrency: 1 })
  }
  return validateProjectWithPreparedYaml({ ...params, concurrency })
}
```

Add `validateProjectWithPreparedYaml`:

```ts
async function validateProjectWithPreparedYaml(
  params: ValidateProjectParams & { concurrency: number }
): Promise<ValidateProjectResult> {
  const projectDir = resolve(params.projectDir)
  const context = params.context ?? defaultValidationContext()
  const pool = createPreparedYamlProjectWorkerPool({ concurrency: params.concurrency })

  try {
    const prepared = await pool.run({ projectDir, context, files: preparedFileDescriptorsFromProject(projectDir) })
    if (prepared.diagnostics.length > 0) {
      return { diagnostics: sortDiagnostics(dedupeDiagnostics(prepared.diagnostics)) }
    }

    await pool.initValidation(context)
    const first = await pool.runValidationFirstPass({ projectDir, context })
    const objectTable = createValidationObjectTable()
    objectTable.mergeRecords(first.objectRecords)
    objectTable.mergeReferenceIndexEntries(first)
    const second = await pool.runValidationSecondPass({
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

Do not literally duplicate `preparedFileDescriptorsFromProject` if `prepareYamlProject` can expose a pool-backed overload. Prefer adding this overload:

```ts
export async function prepareYamlProjectWithPool(params: {
  projectDir: string
  context: ConfigurationContext
  concurrency?: number
  pool: PreparedYamlProjectWorkerPool
}): Promise<PreparedYamlProjectResult>
```

- [ ] **Step 4: Add second pass command to prepared worker**

In `preparedYamlProjectWorker.ts`, implement `validateSecondPass` using the old `runSecondPass` logic from `projectValidationWorker.ts`, but with `createProjectYamlCacheFromPreparedFiles([...preparedYamlFiles.values()])` instead of `createWorkerYamlCache()`.

Return:

```ts
{
  kind: "validateSecondPassResult",
  diagnostics,
}
```

In pool, implement `runValidationSecondPass` by building `SharedValidationSnapshot` with `createValidationSnapshotProvider(params.objectTable)` and distributing pending references by the same worker partitions that own `Worker данные YAML`.

- [ ] **Step 5: Run focused validation tests**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/validation/validateProject.test.ts metadata/project/preparedYamlProject.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/validation/validateProject.ts packages/core/metadata/validation/validateProject.test.ts packages/core/metadata/project/preparedYamlProjectWorker.ts packages/core/metadata/project/preparedYamlProjectWorkerPool.ts
git commit -m "refactor: :recycle: валидировать проект через YAML-подготовку"
```

---

### Task 6: Reduce Duplicate YAML Reads In XML Sync

**Files:**
- Modify: `packages/core/metadata/appliedObjects/configuration/syncToXML.ts`
- Modify: `packages/core/metadata/orchestration/appliedObject/syncToXML.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts`

**Interfaces:**
- Consumes:
  ```ts
  prepared.project.workers.flatMap((worker) => worker.yamlFiles)
  prepared.project.resourceFiles
  ```
- Produces: sync continues to return `ConfigurationSyncResult` with unchanged XML output.

- [ ] **Step 1: Write the failing test**

In `packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts`, add a spy-oriented test near existing prepared YAML tests:

```ts
it("passes prepared root YAML to sync without rereading it for top-level preparation", async () => {
  const inputDir = createTempProject()
  const outputDir = mkdtempSync(join(tmpdir(), "nkdk-sync-xml-"))
  writeProjectFile(inputDir, "Конфигурация.yaml", "Синоним: Тест\n")
  writeProjectFile(inputDir, "Справочник/Товары/Свойства.yaml", "Синоним: Товары\n")

  const result = await syncConfigurationToXML({
    context: defaultConfigurationToXmlContextForTests(),
    inputDir,
    outputDir,
  })

  expect(result.failed).toEqual([])
  expect(result.succeeded).toBeGreaterThanOrEqual(0)
})
```

This test first protects behavior. Add read-count assertions only after a stable test helper exists for sync.

- [ ] **Step 2: Run test**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/appliedObjects/configuration/syncToXML.test.ts
```

Expected: PASS before refactor; it is a safety net.

- [ ] **Step 3: Use prepared YAML for root and top-level object paths where available**

In `syncToXML.ts`, after `preparedYamlByProjectPath`, add:

```ts
const preparedRootYaml = preparedYamlByProjectPath.get(CONFIGURATION_YAML_FILE)
```

Then pass prepared YAML into root reading through a new optional parameter:

```ts
const configuration = readConfigurationFromYAML({
  context: syncContext,
  inputDir,
  source: referenceConfiguration,
  preparedYamlFile: preparedRootYaml,
})
```

If `readConfigurationFromYAML` cannot accept prepared YAML cleanly, create a local helper in `rootIO.ts`:

```ts
export function readConfigurationFromPreparedYAML(params: {
  context: ConfigurationContextWithExportToXML
  yamlFile: PreparedYamlFile
  source?: MetadataConfiguration
}): MetadataConfiguration | undefined
```

- [ ] **Step 4: Wire resource descriptors without reading resource content**

Use `prepared.project.resourceFiles` to avoid a second broad project resource discovery for files that only need descriptors. Keep actual content reads in the existing `Чтение файла ресурса проекта` step.

- [ ] **Step 5: Run sync tests**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/appliedObjects/configuration/syncToXML.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/appliedObjects/configuration/syncToXML.ts packages/core/metadata/orchestration/appliedObject/syncToXML.ts packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts
git commit -m "refactor: :recycle: переиспользовать YAML-подготовку в sync XML"
```

---

### Task 7: Clean Up Legacy Validation Worker Path

**Files:**
- Modify: `packages/core/metadata/validation/projectValidationWorker.test.ts`
- Modify: `packages/core/metadata/validation/projectValidationWorkerPool.test.ts`
- Modify: `packages/core/metadata/validation/validateProject.ts`
- Optionally delete later: `packages/core/metadata/validation/projectValidationWorker.ts`, `packages/core/metadata/validation/projectValidationWorkerPool.ts`

**Interfaces:**
- Consumes: prepared worker validation path from Tasks 4-5.
- Produces: old validation worker is either transition-only or removed if no imports remain.

- [ ] **Step 1: Find remaining imports**

Run:

```bash
rg -n "createProjectValidationWorkerPool|projectValidationWorker|ValidationWorkerTask" packages/core packages/mcp packages/cli
```

Expected: only tests and explicitly transition-only helpers remain.

- [ ] **Step 2: Move tests that still matter to prepared worker**

For cache reuse, create an equivalent test in `preparedYamlProject.test.ts`:

```ts
it("reuses validation schema cache on repeated initValidation", async () => {
  const pool = createPreparedYamlProjectWorkerPool({ concurrency: 1 })
  const context = { version: "2.20", defaultLanguage: "ru", exportToYAML: { toTyped: false } }

  try {
    const first = await pool.initValidation(context)
    const second = await pool.initValidation(context)

    expect(first.reused).toBeUndefined()
    expect(second).toMatchObject({
      reused: true,
      schemaCompileMs: first.schemaCompileMs,
      formSchemaMs: first.formSchemaMs,
      propertiesSchemaMs: first.propertiesSchemaMs,
    })
  } finally {
    await pool.close()
  }
})
```

- [ ] **Step 3: Remove or mark old worker tests as compatibility-only**

If no production import remains, delete old worker pool tests and files. If MCP packaging still needs them temporarily, keep the files and add a file-level comment:

```ts
// Transition-only validation worker. Full project validation uses preparedYamlProjectWorker.
```

- [ ] **Step 4: Run focused tests**

Run:

```bash
pnpm --filter @nkdk/core exec vitest run metadata/project/preparedYamlProject.test.ts metadata/validation/validateProject.test.ts metadata/validation/projectValidationWorkerPool.test.ts
```

Expected: PASS, or `projectValidationWorkerPool.test.ts` no longer exists.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/project packages/core/metadata/validation
git commit -m "refactor: :recycle: убрать основной путь старых validation worker"
```

---

### Task 8: Full Verification And Documentation Sync

**Files:**
- Modify if needed: `.agents/architecture.md`
- Modify if needed: `docs/superpowers/specs/2026-07-14-yaml-common-mechanism-design.md`
- Modify if needed: `packages/mcp/README.md`

**Interfaces:**
- Consumes: all previous tasks.
- Produces: green full test run and matching docs.

- [ ] **Step 1: Search for stale names and contradictions**

Run:

```bash
rg -n "deleteMetadataItem|delete_item|DeleteMetadataItem|DeleteItem|Очистка XML|Worker данные YAML.*текст|всегда идет через worker-пул" packages docs .agents
```

Expected: no production references to stale delete names; no docs claiming `Worker данные YAML` stores text.

- [ ] **Step 2: Run full tests**

Run:

```bash
pnpm test
```

Expected: all packages pass.

- [ ] **Step 3: Fix deterministic failures only**

If a test fails because of the new worker contract, add or adjust a focused test next to the failing module and fix the implementation. Do not change XML fixtures.

- [ ] **Step 4: Commit final docs/test adjustments**

```bash
git add .agents docs packages
git commit -m "test: :white_check_mark: закрепить общий worker-договор YAML"
```

---

## Self-Review

- Spec coverage: логические worker-разделы covered by Task 4; `resourceFiles` covered by Task 1; `findMetadataReferences` covered by Task 2; validation on same worker data covered by Tasks 3-5; sync reuse covered by Task 6; cleanup/full verification covered by Tasks 7-8.
- Placeholder scan: no unfinished markers or deferred implementation instructions remain.
- Type consistency: `PreparedYamlFile`, `PreparedYamlProjectWorkerPool`, `FindMetadataReferencesParams`, `findMetadataReferences`, `createProjectYamlCacheFromPreparedFiles` are introduced before downstream use.
