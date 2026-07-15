# YAML Common Mechanism Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a shared YAML project preparation mechanism in `metadata/project` and migrate validation plus metadata operations to reuse parsed YAML data and project indexes.

**Architecture:** Introduce `PreparedYamlProject` as an operation-neutral snapshot built through the worker pool for every full-project run. The first implementation reuses current validation first-pass primitives, keeps the snapshot one-shot, does not store YAML text, and leaves `Metadata-модель` construction outside the common preparation step. Consumers migrate gradually: validation first, then search references, rename, and sync preparation.

**Tech Stack:** TypeScript, Vitest, Piscina, existing `packages/core/metadata/project`, `packages/core/metadata/validation`, `packages/core/metadata/operations`, YAML parser `parseMetadataYaml`.

## Global Constraints

- Follow `.agents/architecture.md`.
- Keep common metadata layers neutral: no concrete metadata item conditions in `metadata/project`, `metadata/validation`, or `metadata/orchestration`.
- Do not modify existing XML fixtures.
- Do not build or store YAML node positions.
- Do not store source YAML text in `Worker данные YAML`; read text, parse YAML, then release text.
- Worker pool is always used for full-project preparation; no `128 files` threshold.
- Worker receives only YAML files. Resource files are discovered as descriptors, not read or assigned to worker.
- First version always prepares the whole YAML project; no one-file preparation mode.
- Code for common preparation lives in `packages/core/metadata/project`.
- `projectPath` is the logical key for worker YAML data.
- Conflicting metadata declarations are a fatal preparation error.
- `Глобальный индекс зависимостей` is temporary and is redistributed to workers by dependency source file.
- Search references returns only external references; no `canDelete`, no internal references.

---

## Spec

Source spec: `docs/superpowers/specs/2026-07-14-yaml-common-mechanism-design.md`.

## File Structure

- Create: `packages/core/metadata/project/preparedYamlProject.ts`
  - Public types and orchestration for `prepareYamlProject()`.
  - Owns `PreparedYamlProject`, `PreparedYamlWorkerPartition`, `PreparedYamlFile`, `PreparedYamlProjectError`.
- Create: `packages/core/metadata/project/preparedYamlProjectWorker.ts`
  - Piscina worker entrypoint for reading/parsing assigned YAML files and extracting worker indexes.
- Create: `packages/core/metadata/project/preparedYamlProjectWorkerPool.ts`
  - Worker pool wrapper that always fans out to the whole pool.
  - Owns partitioning, merging metadata indexes, fatal duplicate declaration detection, and dependency redistribution by source file.
- Create: `packages/core/metadata/project/preparedYamlProject.test.ts`
  - Contract tests for always-worker path, no source text in result, `projectPath` keys, duplicate declaration failure, and source-file dependency partitioning.
- Modify: `packages/core/metadata/project/index.ts`
  - Export common preparation contracts.
- Modify: `packages/core/metadata/validation/projectFiles.ts`
  - Keep compatibility aliases or adapters from `MetadataProjectResourceRef` to validation file shape.
- Modify: `packages/core/metadata/validation/projectValidationPasses.ts`
  - Split reusable YAML preparation first-pass helpers from validation-only schema checks where needed.
- Modify: `packages/core/metadata/validation/projectValidationWorker.ts`
  - Either delegate first-pass parsing/index extraction to the project worker helper or call the same extracted helper.
- Modify: `packages/core/metadata/validation/projectValidationWorkerPool.ts`
  - Remove `MIN_FILES_FOR_WORKER_VALIDATION` behavior from the full-project path after validation migrates to prepared project.
- Modify: `packages/core/metadata/validation/validateProject.ts`
  - Validate full projects from `PreparedYamlProject`; keep one-file validation path isolated and unchanged until explicitly redesigned.
- Modify: `packages/core/metadata/operations/types.ts`
  - Rename delete/search contract or add `findMetadataItemReferences` result type while keeping MCP compatibility if needed.
- Modify: `packages/core/metadata/operations/deleteItem.ts`
  - Convert implementation into search references semantics: no writes, no file removal, return only external references.
- Modify: `packages/core/metadata/operations/projectSnapshot.ts`
  - Add adapter from `PreparedYamlProject` to current operation snapshot for transition only.
- Modify: `packages/core/metadata/operations/renameItem.ts`
  - Build operation snapshot from prepared YAML data and keep resource files out of first version.
- Modify: `packages/core/metadata/operations/deleteItem.test.ts`
  - Update expectations from deletion plan to search references.
- Modify: `packages/core/metadata/operations/renameItem.test.ts`
  - Assert rename uses YAML/path plan only and blocks unsupported dependencies.
- Modify: `packages/core/metadata/operations/projectSnapshot.test.ts`
  - Verify snapshot adapter does not reread YAML and does not require YAML text.
- Modify: `packages/core/metadata/validation/validateProject.test.ts`
  - Assert full validation uses worker path for small projects.
- Modify: `packages/core/metadata/validation/projectValidationWorkerPool.test.ts`
  - Remove threshold expectations and assert all workers receive a request.
- Modify: `packages/mcp/src/services/deleteItem.ts`, `packages/mcp/src/services/deleteItem.test.ts`, `packages/mcp/src/guides/index.ts`
  - Keep service name if public API still uses `delete_item`, but update behavior text to search references.

## Interfaces

Use these names consistently across tasks.

```ts
export interface PreparedYamlProject {
  projectDir: string
  files: PreparedYamlProjectFileDescriptor[]
  resourceFiles: PreparedYamlProjectResourceDescriptor[]
  metadataIndex: PreparedGlobalMetadataIndex
  workers: PreparedYamlWorkerPartition[]
}

export interface PreparedYamlProjectFileDescriptor {
  projectPath: string
  filePath: string
  role: "configuration" | "properties" | "form"
  owner: { dir: string; name: string }
}

export interface PreparedYamlProjectResourceDescriptor {
  projectPath: string
  filePath: string
  owner: { dir: string; name: string }
  role: string
}

export interface PreparedYamlWorkerPartition {
  workerIndex: number
  yamlFiles: PreparedYamlFile[]
  dependencyIndex: PreparedWorkerDependencyIndex
}

export interface PreparedYamlFile {
  projectPath: string
  filePath: string
  role: "configuration" | "properties" | "form"
  owner: { dir: string; name: string }
  data: unknown
  syntaxDiagnostics: import("../validation/types").Diagnostic[]
}

export interface PreparedGlobalMetadataIndex {
  declarations: PreparedMetadataDeclaration[]
}

export interface PreparedMetadataDeclaration {
  canonical: string
  projectPath: string
  filePath: string
}

export interface PreparedWorkerDependencyIndex {
  dependencies: PreparedMetadataDependency[]
}

export interface PreparedMetadataDependency {
  canonical: string
  sourceProjectPath: string
  sourceFilePath: string
  yamlPath: readonly (string | number)[]
  kind: "metadata" | "dataPath" | "filePath" | "resource" | "other"
}

export type PreparedYamlProjectResult =
  | { ok: true; project: PreparedYamlProject }
  | { ok: false; code: "prepare_failed" | "declaration_conflict"; message: string; diagnostics: import("../validation/types").Diagnostic[] }

export async function prepareYamlProject(params: {
  projectDir: string
  context: import("../context/types").ConfigurationContext
  concurrency?: number
}): Promise<PreparedYamlProjectResult>
```

### Task 1: Add Prepared YAML Project Contract

**Files:**
- Create: `packages/core/metadata/project/preparedYamlProject.ts`
- Modify: `packages/core/metadata/project/index.ts`
- Test: `packages/core/metadata/project/preparedYamlProject.test.ts`

**Interfaces:**
- Produces: `PreparedYamlProject`, `PreparedYamlFile`, `PreparedMetadataDependency`, `prepareYamlProject(params)`.

- [ ] **Step 1: Write failing contract tests**

Create `packages/core/metadata/project/preparedYamlProject.test.ts`:

```ts
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { prepareYamlProject } from "./preparedYamlProject"
import { defaultValidationContext } from "../validation/validateProject"

describe("prepareYamlProject", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
  })

  function createProject(): string {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-prepare-yaml-"))
    tempDirs.push(projectDir)
    mkdirSync(join(projectDir, "Справочник", "Товары"), { recursive: true })
    writeFileSync(
      join(projectDir, "Справочник", "Товары", "Свойства.yaml"),
      ["Реквизиты:", "  Артикул:", "    Тип: Строка"].join("\n")
    )
    return projectDir
  }

  it("prepares whole project and uses projectPath as YAML key without source text", async () => {
    const projectDir = createProject()
    const result = await prepareYamlProject({
      projectDir,
      context: defaultValidationContext(),
      concurrency: 2,
    })

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error(result.message)

    expect(result.project.files.map((file) => file.projectPath)).toEqual(["Справочник/Товары/Свойства.yaml"])
    expect(result.project.workers).toHaveLength(2)
    const yamlFiles = result.project.workers.flatMap((worker) => worker.yamlFiles)
    expect(yamlFiles).toHaveLength(1)
    expect(yamlFiles[0]).toMatchObject({
      projectPath: "Справочник/Товары/Свойства.yaml",
      role: "properties",
      owner: { dir: "Справочник", name: "Товары" },
    })
    expect(yamlFiles[0]).not.toHaveProperty("text")
    expect(yamlFiles[0]?.data).toEqual({
      Реквизиты: {
        Артикул: {
          Тип: "Строка",
        },
      },
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/project/preparedYamlProject.test.ts
```

Expected: FAIL with missing module `./preparedYamlProject`.

- [ ] **Step 3: Add public types and temporary implementation**

Create `packages/core/metadata/project/preparedYamlProject.ts`:

```ts
import { resolve } from "node:path"
import type { ConfigurationContext } from "../context/types"
import type { Diagnostic } from "../validation/types"
import { discoverMetadataProjectResources } from "./resources"

export interface PreparedYamlProject {
  projectDir: string
  files: PreparedYamlProjectFileDescriptor[]
  resourceFiles: PreparedYamlProjectResourceDescriptor[]
  metadataIndex: PreparedGlobalMetadataIndex
  workers: PreparedYamlWorkerPartition[]
}

export interface PreparedYamlProjectFileDescriptor {
  projectPath: string
  filePath: string
  role: "configuration" | "properties" | "form"
  owner: { dir: string; name: string }
}

export interface PreparedYamlProjectResourceDescriptor {
  projectPath: string
  filePath: string
  owner: { dir: string; name: string }
  role: string
}

export interface PreparedYamlWorkerPartition {
  workerIndex: number
  yamlFiles: PreparedYamlFile[]
  dependencyIndex: PreparedWorkerDependencyIndex
}

export interface PreparedYamlFile {
  projectPath: string
  filePath: string
  role: "configuration" | "properties" | "form"
  owner: { dir: string; name: string }
  data: unknown
  syntaxDiagnostics: Diagnostic[]
}

export interface PreparedGlobalMetadataIndex {
  declarations: PreparedMetadataDeclaration[]
}

export interface PreparedMetadataDeclaration {
  canonical: string
  projectPath: string
  filePath: string
}

export interface PreparedWorkerDependencyIndex {
  dependencies: PreparedMetadataDependency[]
}

export interface PreparedMetadataDependency {
  canonical: string
  sourceProjectPath: string
  sourceFilePath: string
  yamlPath: readonly (string | number)[]
  kind: "metadata" | "dataPath" | "filePath" | "resource" | "other"
}

export type PreparedYamlProjectResult =
  | { ok: true; project: PreparedYamlProject }
  | { ok: false; code: "prepare_failed" | "declaration_conflict"; message: string; diagnostics: Diagnostic[] }

export async function prepareYamlProject(params: {
  projectDir: string
  context: ConfigurationContext
  concurrency?: number
}): Promise<PreparedYamlProjectResult> {
  const projectDir = resolve(params.projectDir)
  const resources = discoverMetadataProjectResources(projectDir)
  const files = resources
    .filter((resource) => resource.absolutePath !== undefined)
    .map((resource): PreparedYamlProjectFileDescriptor => ({
      projectPath: resource.projectPath,
      filePath: resource.absolutePath!,
      role: resource.role,
      owner: { dir: resource.owner.dir, name: resource.owner.name },
    }))
  return {
    ok: true,
    project: {
      projectDir,
      files,
      resourceFiles: [],
      metadataIndex: { declarations: [] },
      workers: [{ workerIndex: 0, yamlFiles: [], dependencyIndex: { dependencies: [] } }],
    },
  }
}
```

Modify `packages/core/metadata/project/index.ts`:

```ts
export * from "./preparedYamlProject"
export {
  describeMetadataRuleOperationTargets,
  describeMetadataRuleResources,
  type MetadataProjectAssetDescriptor,
  type MetadataProjectConfigurationYamlDescriptor,
  type MetadataProjectDynamicDescriptor,
  type MetadataProjectExternalXmlBaseDescriptor,
  type MetadataProjectExternalXmlDescriptor,
  type MetadataProjectExternalXmlPathDescriptor,
  type MetadataProjectObjectXmlDescriptor,
  type MetadataProjectPropertiesYamlDescriptor,
  type MetadataProjectResourceDescriptor,
  type MetadataProjectXmlDescriptor,
  type MetadataProjectYamlDescriptor,
  type MetadataRuleOperationTargetDescriptor,
} from "./ruleResources"
```

- [ ] **Step 4: Run test and keep expected failure focused**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/project/preparedYamlProject.test.ts
```

Expected: FAIL because `yamlFiles` is still empty. This proves the contract test now reaches implementation.

- [ ] **Step 5: Commit contract scaffold**

```bash
git add packages/core/metadata/project/preparedYamlProject.ts packages/core/metadata/project/index.ts packages/core/metadata/project/preparedYamlProject.test.ts
git commit -m "test: :white_check_mark: описать подготовку YAML-проекта"
```

### Task 2: Implement Always-Worker YAML Reading And Parsing

**Files:**
- Create: `packages/core/metadata/project/preparedYamlProjectWorker.ts`
- Create: `packages/core/metadata/project/preparedYamlProjectWorkerPool.ts`
- Modify: `packages/core/metadata/project/preparedYamlProject.ts`
- Test: `packages/core/metadata/project/preparedYamlProject.test.ts`

**Interfaces:**
- Consumes: `PreparedYamlProjectFileDescriptor`.
- Produces: `runPreparedYamlProjectWorkerTask(message)`, `createPreparedYamlProjectWorkerPool({ concurrency })`.

- [ ] **Step 1: Extend failing tests for whole-pool fanout**

Append to `packages/core/metadata/project/preparedYamlProject.test.ts`:

```ts
  it("keeps one partition per worker even when some workers receive no YAML files", async () => {
    const projectDir = createProject()
    const result = await prepareYamlProject({
      projectDir,
      context: defaultValidationContext(),
      concurrency: 4,
    })

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error(result.message)

    expect(result.project.workers.map((worker) => worker.workerIndex)).toEqual([0, 1, 2, 3])
    expect(result.project.workers.flatMap((worker) => worker.yamlFiles)).toHaveLength(1)
    expect(result.project.workers.filter((worker) => worker.yamlFiles.length === 0).length).toBeGreaterThan(0)
  })
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/project/preparedYamlProject.test.ts
```

Expected: FAIL because implementation returns one partition and does not parse YAML.

- [ ] **Step 3: Implement worker entrypoint**

Create `packages/core/metadata/project/preparedYamlProjectWorker.ts`:

```ts
import { readFileSync } from "node:fs"
import { parseMetadataYaml } from "../../yaml/parseMetadataYaml"
import type { Diagnostic } from "../validation/types"
import type { PreparedYamlFile, PreparedYamlProjectFileDescriptor } from "./preparedYamlProject"

export type PreparedYamlProjectWorkerTask = {
  kind: "prepare"
  files: PreparedYamlProjectFileDescriptor[]
}

export type PreparedYamlProjectWorkerTaskResult = {
  kind: "prepareResult"
  yamlFiles: PreparedYamlFile[]
  diagnostics: Diagnostic[]
}

export default async function runPreparedYamlProjectWorkerTask(
  message: PreparedYamlProjectWorkerTask
): Promise<PreparedYamlProjectWorkerTaskResult> {
  const yamlFiles: PreparedYamlFile[] = []
  const diagnostics: Diagnostic[] = []

  for (const file of message.files) {
    try {
      const text = readFileSync(file.filePath, "utf8")
      const parsed = parseMetadataYaml(text)
      yamlFiles.push({
        projectPath: file.projectPath,
        filePath: file.filePath,
        role: file.role,
        owner: file.owner,
        data: parsed.data,
        syntaxDiagnostics: parsed.errors.map((error) => ({
          filePath: file.filePath,
          line: error.line,
          col: error.col,
          severity: "error",
          source: "syntax",
          message: error.message,
        })),
      })
    } catch (caught) {
      diagnostics.push({
        filePath: file.filePath,
        line: 1,
        col: 1,
        severity: "error",
        source: "external-file",
        message: `Не удалось прочитать YAML-файл: ${caught instanceof Error ? caught.message : String(caught)}`,
      })
    }
  }

  return { kind: "prepareResult", yamlFiles, diagnostics }
}
```

- [ ] **Step 4: Implement worker pool wrapper**

Create `packages/core/metadata/project/preparedYamlProjectWorkerPool.ts`:

```ts
import { fileURLToPath } from "node:url"
import Piscina from "piscina"
import type { PreparedYamlProjectFileDescriptor, PreparedYamlWorkerPartition } from "./preparedYamlProject"
import type { PreparedYamlProjectWorkerTask, PreparedYamlProjectWorkerTaskResult } from "./preparedYamlProjectWorker"

export interface PreparedYamlProjectWorkerPool {
  run(files: PreparedYamlProjectFileDescriptor[]): Promise<PreparedYamlWorkerPartition[]>
  close(): Promise<void>
}

export function createPreparedYamlProjectWorkerPool(params: { concurrency: number }): PreparedYamlProjectWorkerPool {
  const pools = Array.from({ length: params.concurrency }, () => new Piscina({ filename: workerPath() }))

  return {
    async run(files) {
      const partitions = partitionRoundRobin(files, pools.length)
      const results = await Promise.all(
        pools.map(async (pool, index): Promise<PreparedYamlWorkerPartition> => {
          const response = (await pool.run({
            kind: "prepare",
            files: partitions[index] ?? [],
          } satisfies PreparedYamlProjectWorkerTask)) as PreparedYamlProjectWorkerTaskResult
          if (response.kind !== "prepareResult") throw new Error("Worker вернул неожиданный результат prepare")
          return {
            workerIndex: index,
            yamlFiles: response.yamlFiles,
            dependencyIndex: { dependencies: [] },
          }
        })
      )
      return results
    },
    async close() {
      await Promise.all(pools.map((pool) => pool.destroy()))
    },
  }
}

function partitionRoundRobin<T>(items: readonly T[], count: number): T[][] {
  const partitions = Array.from({ length: count }, () => [] as T[])
  for (let index = 0; index < items.length; index += 1) {
    partitions[index % count]!.push(items[index]!)
  }
  return partitions
}

function workerPath(): string {
  return fileURLToPath(new URL("./preparedYamlProjectWorker.ts", import.meta.url))
}
```

- [ ] **Step 5: Wire `prepareYamlProject()` through the pool**

Replace the body of `prepareYamlProject()` in `preparedYamlProject.ts` after `files` creation:

```ts
  const pool = createPreparedYamlProjectWorkerPool({ concurrency: Math.max(1, params.concurrency ?? 1) })
  try {
    const workers = await pool.run(files)
    return {
      ok: true,
      project: {
        projectDir,
        files,
        resourceFiles: [],
        metadataIndex: { declarations: [] },
        workers,
      },
    }
  } finally {
    await pool.close()
  }
```

Add import:

```ts
import { createPreparedYamlProjectWorkerPool } from "./preparedYamlProjectWorkerPool"
```

- [ ] **Step 6: Run tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/project/preparedYamlProject.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/core/metadata/project/preparedYamlProject.ts packages/core/metadata/project/preparedYamlProjectWorker.ts packages/core/metadata/project/preparedYamlProjectWorkerPool.ts packages/core/metadata/project/preparedYamlProject.test.ts
git commit -m "feat: :sparkles: добавить worker-подготовку YAML-проекта"
```

### Task 3: Build Metadata And Dependency Indexes In Preparation

**Files:**
- Modify: `packages/core/metadata/project/preparedYamlProject.ts`
- Modify: `packages/core/metadata/project/preparedYamlProjectWorker.ts`
- Modify: `packages/core/metadata/project/preparedYamlProjectWorkerPool.ts`
- Test: `packages/core/metadata/project/preparedYamlProject.test.ts`
- Reuse: `packages/core/metadata/validation/projectValidationPasses.ts`, `packages/core/metadata/validation/projectReferenceIndex.ts`

**Interfaces:**
- Consumes: parsed YAML data from worker.
- Produces: `metadataIndex.declarations`, worker `dependencyIndex.dependencies`.

- [ ] **Step 1: Add tests for declarations, dependency source partitioning, and conflicts**

Append to `preparedYamlProject.test.ts`:

```ts
  it("builds metadata declarations and keeps dependencies on the source worker", async () => {
    const projectDir = createProject()
    mkdirSync(join(projectDir, "Документ", "Заказ"), { recursive: true })
    writeFileSync(
      join(projectDir, "Документ", "Заказ", "Свойства.yaml"),
      ["Реквизиты:", "  Товар:", "    Тип: Справочник.Товары"].join("\n")
    )

    const result = await prepareYamlProject({
      projectDir,
      context: defaultValidationContext(),
      concurrency: 2,
    })

    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error(result.message)

    expect(result.project.metadataIndex.declarations.map((item) => item.canonical).sort()).toContain(
      "Catalog.Товары"
    )
    const dependency = result.project.workers
      .flatMap((worker) => worker.dependencyIndex.dependencies)
      .find((item) => item.canonical === "Catalog.Товары")
    expect(dependency).toMatchObject({
      sourceProjectPath: "Документ/Заказ/Свойства.yaml",
      kind: "metadata",
    })
  })

  it("fails preparation on duplicate metadata declaration", async () => {
    const projectDir = createProject()
    mkdirSync(join(projectDir, "Справочник", "Товары2"), { recursive: true })
    writeFileSync(join(projectDir, "Справочник", "Товары2", "Свойства.yaml"), "{}")

    const result = await prepareYamlProject({
      projectDir,
      context: defaultValidationContext(),
      concurrency: 2,
    })

    expect(result).toMatchObject({
      ok: false,
      code: "declaration_conflict",
    })
  })
```

Before running, adjust the duplicate fixture so the second file declares the same canonical through a helper if owner name drives canonical. If current declaration canonical is derived only from path owner, create duplicate conflict test at the merge function level instead:

```ts
import { mergePreparedMetadataDeclarationsForTests } from "./preparedYamlProjectWorkerPool"

expect(mergePreparedMetadataDeclarationsForTests([
  { canonical: "Catalog.Товары", projectPath: "a.yaml", filePath: "/p/a.yaml" },
  { canonical: "Catalog.Товары", projectPath: "b.yaml", filePath: "/p/b.yaml" },
])).toMatchObject({ ok: false, code: "declaration_conflict" })
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/project/preparedYamlProject.test.ts
```

Expected: FAIL because indexes are empty and conflict helper does not exist.

- [ ] **Step 3: Implement declaration and dependency extraction by reusing validation first pass**

In `preparedYamlProjectWorker.ts`, import validation helpers:

```ts
import { createProjectYamlCacheFromEntries } from "../validation/projectYamlCache"
import { createValidationSchemaCache, validateProjectFileFirstPass } from "../validation/projectValidationPasses"
import { resolveValidationProjectFile } from "../validation/projectFiles"
import { defaultValidationContext } from "../validation/validateProject"
```

Extend worker task:

```ts
export type PreparedYamlProjectWorkerTask = {
  kind: "prepare"
  projectDir: string
  files: PreparedYamlProjectFileDescriptor[]
  context: import("../context/types").ConfigurationContext
}
```

After parsing each file, create a validation entry without retaining `text` in `PreparedYamlFile`, then call `validateProjectFileFirstPass()`:

```ts
const cache = createProjectYamlCacheFromEntries([{ filePath: file.filePath, text, parsed }])
const validationFile = resolveValidationProjectFile(message.projectDir, file.filePath)
if (validationFile !== undefined) {
  const first = validateProjectFileFirstPass({
    projectDir: message.projectDir,
    file: validationFile,
    cache,
    context: message.context,
    schemaCache,
  })
  declarations.push(...first.objectIndexEntries.map((entry) => ({
    canonical: entry.canonical,
    projectPath: file.projectPath,
    filePath: file.filePath,
  })))
  dependencies.push(...first.pendingReferences.map((reference) => ({
    canonical: reference.canonical,
    sourceProjectPath: file.projectPath,
    sourceFilePath: file.filePath,
    yamlPath: reference.yamlPath,
    kind: "metadata" as const,
  })))
}
```

Return `declarations` and `dependencies` from the worker.

- [ ] **Step 4: Merge declarations and redistribute dependencies**

In `preparedYamlProjectWorkerPool.ts`, add:

```ts
export function mergePreparedMetadataDeclarationsForTests(
  declarations: readonly PreparedMetadataDeclaration[]
): { ok: true; index: PreparedGlobalMetadataIndex } | { ok: false; code: "declaration_conflict"; message: string; diagnostics: Diagnostic[] } {
  const byCanonical = new Map<string, PreparedMetadataDeclaration>()
  for (const declaration of declarations) {
    const existing = byCanonical.get(declaration.canonical)
    if (existing !== undefined) {
      return {
        ok: false,
        code: "declaration_conflict",
        message: `Повторное объявление metadata: ${declaration.canonical}`,
        diagnostics: [
          {
            filePath: declaration.filePath,
            line: 1,
            col: 1,
            severity: "error",
            source: "reference",
            message: `Повторное объявление metadata: ${declaration.canonical}`,
          },
        ],
      }
    }
    byCanonical.set(declaration.canonical, declaration)
  }
  return { ok: true, index: { declarations: [...byCanonical.values()] } }
}
```

Redistribute dependencies by `sourceProjectPath` to the worker partition that owns that YAML file. Keep `Глобальный индекс зависимостей` as local temporary array in `run()`.

- [ ] **Step 5: Run tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/project/preparedYamlProject.test.ts packages/core/metadata/validation/projectValidationPasses.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/project/preparedYamlProject.ts packages/core/metadata/project/preparedYamlProjectWorker.ts packages/core/metadata/project/preparedYamlProjectWorkerPool.ts packages/core/metadata/project/preparedYamlProject.test.ts
git commit -m "feat: :sparkles: собрать индексы подготовки YAML"
```

### Task 4: Migrate Full Project Validation To Prepared YAML Project

**Files:**
- Modify: `packages/core/metadata/validation/validateProject.ts`
- Modify: `packages/core/metadata/validation/projectValidationWorkerPool.ts`
- Modify: `packages/core/metadata/validation/projectValidationWorker.ts`
- Test: `packages/core/metadata/validation/validateProject.test.ts`
- Test: `packages/core/metadata/validation/projectValidationWorkerPool.test.ts`

**Interfaces:**
- Consumes: `prepareYamlProject({ projectDir, context, concurrency })`.
- Produces: validation result parity for full-project validation.

- [ ] **Step 1: Add regression test for small project worker path**

In `packages/core/metadata/validation/validateProject.test.ts`, add:

```ts
it("uses worker preparation for full project below previous 128 file threshold", async () => {
  const projectDir = createProject()
  writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", "{}")

  const result = await validateProject({ projectDir, concurrency: 2 })

  expect(result.diagnostics).toEqual([])
})
```

Use existing local helpers in the file. If helpers have different names, keep this assertion and adapt only helper calls to existing test style.

- [ ] **Step 2: Run test to capture current behavior**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/validation/validateProject.test.ts
```

Expected: PASS may occur because behavior is externally same. Add a test-only spy by exporting `MIN_FILES_FOR_WORKER_VALIDATION_FOR_TESTS` removal is not worth it; the real regression is enforced in Task 2/3 project tests. Continue.

- [ ] **Step 3: Remove threshold fallback**

In `validateProject.ts`, delete `MIN_FILES_FOR_WORKER_VALIDATION` and the block:

```ts
if (files.length < MIN_FILES_FOR_WORKER_VALIDATION) {
  return validateProjectInProcess({ ...params, concurrency: 1 })
}
```

Full-project validation with `concurrency > 1` must call worker path for all file counts.

- [ ] **Step 4: Keep one-file validation in-process**

Do not change:

```ts
if (params.filePath !== undefined || concurrency === 1) {
  return validateProjectInProcess({ ...params, concurrency: 1 })
}
```

This preserves existing one-file behavior outside this spec.

- [ ] **Step 5: Run validation worker tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/validation/validateProject.test.ts packages/core/metadata/validation/projectValidationWorkerPool.test.ts packages/core/metadata/validation/projectValidationWorker.test.ts
```

Expected: PASS. If a test explicitly expects threshold fallback, update it to expect worker execution for small full projects.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/validation/validateProject.ts packages/core/metadata/validation/validateProject.test.ts packages/core/metadata/validation/projectValidationWorkerPool.test.ts
git commit -m "refactor: :recycle: убрать порог worker-валидации"
```

### Task 5: Convert Delete Operation Into Search References

**Files:**
- Modify: `packages/core/metadata/operations/deleteItem.ts`
- Modify: `packages/core/metadata/operations/deleteItem.test.ts`
- Modify: `packages/core/metadata/operations/types.ts`
- Modify: `packages/mcp/src/services/deleteItem.test.ts`
- Modify: `packages/mcp/src/guides/index.ts`

**Interfaces:**
- Consumes: existing `parseMetadataOperationPath`, `resolveMetadataOperationPath`, `collectBlockedReferences`.
- Produces: no write steps; result returns only external references in `blockedReferences`.

- [ ] **Step 1: Update tests to express search-only behavior**

In `packages/core/metadata/operations/deleteItem.test.ts`, replace write/delete expectations with:

```ts
it("returns external references without deleting files", async () => {
  const projectDir = createProject()
  const catalogPath = writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", "{}")
  writeProjectFile(projectDir, "Документ/Заказ/Свойства.yaml", [
    "Реквизиты:",
    "  Товар:",
    "    Тип: Справочник.Товары",
  ])

  const result = await deleteMetadataItem({
    projectDir,
    path: "Справочник.Товары",
    allowWrite: true,
  })

  expect(result.ok).toBe(false)
  expect(result).toMatchObject({ code: "references_found" })
  if (result.ok) throw new Error("expected references_found")
  expect(result.blockedReferences).toHaveLength(1)
  expect(existsSync(catalogPath)).toBe(true)
})

it("returns plan with no changed files when external references are absent", async () => {
  const projectDir = createProject()
  const catalogPath = writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", "{}")

  const result = await deleteMetadataItem({
    projectDir,
    path: "Справочник.Товары",
    allowWrite: true,
  })

  expect(result).toMatchObject({
    ok: true,
    mode: "plan",
    changedFiles: [],
    rewrittenReferences: [],
    blockedReferences: [],
  })
  expect(existsSync(catalogPath)).toBe(true)
})
```

- [ ] **Step 2: Run tests to verify failure**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/operations/deleteItem.test.ts
```

Expected: FAIL because current implementation deletes when `allowWrite: true`.

- [ ] **Step 3: Remove write plan from delete operation**

In `deleteItem.ts`, remove `applyMetadataOperationFilePlan`, `MetadataOperationFileStep`, `exportOperationItemToYamlText`, and `removeNamedNode()`. Replace the end of `deleteMetadataItem()` after `plan`:

```ts
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

  return success("plan", [])
```

Change `DeletePlan`:

```ts
interface DeletePlan {
  blockedReferences: MetadataOperationBlockedReference[]
}
```

Change `buildDeletePlan()` return:

```ts
  return {
    ok: true,
    plan: {
      blockedReferences,
    },
  }
```

Delete all `steps`, `plannedChangedFiles`, `filesForStep()`, and actual remove/write logic.

- [ ] **Step 4: Update MCP service test language**

In `packages/mcp/src/services/deleteItem.test.ts`, change core result fixture:

```ts
const coreResult = {
  ok: true,
  mode: "plan",
  changedFiles: [],
  rewrittenReferences: [],
  blockedReferences: [],
}
```

Keep service name and call shape unchanged unless public tool naming is changed in a separate task.

- [ ] **Step 5: Update MCP guide**

In `packages/mcp/src/guides/index.ts`, replace text saying delete tool deletes with wording:

```ts
"Если пользователь хочет проверить возможность удаления metadata-объекта, реквизита, табличной части, формы или макета, не правь YAML руками. Вызови `nkdk.delete_item`: сейчас инструмент ищет внешние ссылки и не удаляет файлы."
```

- [ ] **Step 6: Run tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/operations/deleteItem.test.ts
pnpm --filter @nakidka/mcp exec vitest run packages/mcp/src/services/deleteItem.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/core/metadata/operations/deleteItem.ts packages/core/metadata/operations/deleteItem.test.ts packages/mcp/src/services/deleteItem.test.ts packages/mcp/src/guides/index.ts
git commit -m "refactor: :recycle: сделать delete поиском ссылок"
```

### Task 6: Add Prepared YAML Adapter For Metadata Operations

**Files:**
- Modify: `packages/core/metadata/operations/projectSnapshot.ts`
- Test: `packages/core/metadata/operations/projectSnapshot.test.ts`
- Modify: `packages/core/metadata/operations/renameItem.ts`
- Modify: `packages/core/metadata/operations/deleteItem.ts`

**Interfaces:**
- Consumes: `PreparedYamlProject`.
- Produces: `buildMetadataOperationSnapshotFromPreparedProject(prepared, { requireValidProject })`.

- [ ] **Step 1: Add adapter test**

Create or extend `packages/core/metadata/operations/projectSnapshot.test.ts`:

```ts
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import { defaultValidationContext } from "../validation/validateProject"
import { prepareYamlProject } from "../project/preparedYamlProject"
import { buildMetadataOperationSnapshotFromPreparedProject } from "./projectSnapshot"

describe("buildMetadataOperationSnapshotFromPreparedProject", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
  })

  it("imports operation models from prepared YAML data without requiring YAML text", async () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-operation-snapshot-"))
    tempDirs.push(projectDir)
    mkdirSync(join(projectDir, "Справочник", "Товары"), { recursive: true })
    writeFileSync(join(projectDir, "Справочник", "Товары", "Свойства.yaml"), "{}")

    const prepared = await prepareYamlProject({ projectDir, context: defaultValidationContext(), concurrency: 2 })
    expect(prepared.ok).toBe(true)
    if (!prepared.ok) throw new Error(prepared.message)

    const snapshot = buildMetadataOperationSnapshotFromPreparedProject({
      project: prepared.project,
      context: defaultValidationContext(),
      requireValidProject: false,
    })

    expect(snapshot.ok).toBe(true)
    if (!snapshot.ok) throw new Error(snapshot.message)
    expect(snapshot.items).toHaveLength(1)
    expect(snapshot.items[0]).toMatchObject({
      projectPath: "Справочник/Товары/Свойства.yaml",
      kind: "properties",
    })
  })
})
```

- [ ] **Step 2: Run test to verify failure**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/operations/projectSnapshot.test.ts
```

Expected: FAIL because adapter does not exist.

- [ ] **Step 3: Implement adapter**

In `projectSnapshot.ts`, add:

```ts
import type { PreparedYamlProject, PreparedYamlFile } from "../project/preparedYamlProject"
```

Add exported function:

```ts
export function buildMetadataOperationSnapshotFromPreparedProject(params: {
  project: PreparedYamlProject
  context: ConfigurationContext
  requireValidProject: boolean
}): MetadataOperationSnapshotResult {
  const items: OperationSnapshotItem[] = []
  for (const worker of params.project.workers) {
    for (const yamlFile of worker.yamlFiles) {
      const item = importPreparedSnapshotItem({
        projectDir: params.project.projectDir,
        yamlFile,
        context: params.context,
        requireValidProject: params.requireValidProject,
      })
      if (item.ok) items.push(item.item)
      else if (params.requireValidProject) return item.failure
    }
  }
  return { ok: true, projectDir: params.project.projectDir, context: params.context, items }
}
```

Implement `importPreparedSnapshotItem()` as a sibling of `importSnapshotItem()` with the same import rules, but pass `yamlFile.data` directly into `importMetadataItemFromYAML()` / `importClientApplicationFormFromYAML()` instead of reading and parsing the file again.

During this task keep `OperationSnapshotItem.parsed` only as a transitional field for existing reference collectors. Create it through a named helper so Task 8 has a single removal point:

```ts
function parsedYamlForOperationTransition(data: unknown): ParsedYaml {
  return {
    text: "",
    data,
    locations: emptyYamlLocationIndex(),
    syntaxErrors: [],
  }
}
```

`emptyYamlLocationIndex()` must implement the `YamlLocationIndex` methods by returning `undefined` / empty collections. Do not store source YAML text in `PreparedYamlFile`.

- [ ] **Step 4: Wire rename/search to prepared project**

In `renameItem.ts` and `deleteItem.ts`, replace:

```ts
const snapshot = await buildMetadataOperationSnapshot({ projectDir: params.projectDir, requireValidProject: true })
```

with:

```ts
const context = defaultMetadataOperationsContext()
const prepared = await prepareYamlProject({ projectDir: params.projectDir, context })
if (!prepared.ok) return {
  ok: false,
  code: "validation_failed",
  message: prepared.message,
  diagnostics: prepared.diagnostics,
  changedFiles: [],
  rewrittenReferences: [],
  blockedReferences: [],
}
const snapshot = buildMetadataOperationSnapshotFromPreparedProject({
  project: prepared.project,
  context,
  requireValidProject: true,
})
```

Keep `buildMetadataOperationSnapshot()` exported for callers not yet migrated.

- [ ] **Step 5: Run operation tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/operations/projectSnapshot.test.ts packages/core/metadata/operations/renameItem.test.ts packages/core/metadata/operations/deleteItem.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/operations/projectSnapshot.ts packages/core/metadata/operations/projectSnapshot.test.ts packages/core/metadata/operations/renameItem.ts packages/core/metadata/operations/deleteItem.ts
git commit -m "refactor: :recycle: использовать подготовку YAML в операциях"
```

### Task 7: Sync Preparation Uses Prepared YAML Data Without New Blocking Validation

**Files:**
- `packages/core/metadata/appliedObjects/configuration/syncToXML.ts`
- `packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts`
- `packages/core/metadata/orchestration/appliedObject/syncToXML.ts`
- `packages/core/metadata/orchestration/appliedObject/syncToXML.test.ts`
- `packages/core/metadata/appliedObjects/configuration/incrementalSyncToXML.ts`
- `packages/core/metadata/appliedObjects/configuration/incrementalSyncToXML.test.ts`

**Interfaces:**
- Consumes: `PreparedYamlProject`.
- Produces: sync path obtains YAML data from preparation but does not add schema/dependency blocking validation.

- [ ] **Step 1: Add sync preparation contract tests**

In `configuration/syncToXML.test.ts`, mock `prepareYamlProject()` and add a test that verifies full sync calls it before object sync:

```ts
it("prepares YAML project before full XML sync", async () => {
  await syncConfigurationToXML({ context, inputDir: yamlDir, outputDir: xmlDir, referenceDir })

  expect(prepareYamlProject).toHaveBeenCalledWith(expect.objectContaining({
    projectDir: yamlDir,
    context: expect.any(Object),
  }))
})
```

In `incrementalSyncToXML.test.ts`, add the same expectation for the full-sync fallback path. This keeps incremental behavior covered because `syncConfigurationIncrementallyToXML()` delegates to `syncConfigurationToXML()` when it cannot use the migration state.

- [ ] **Step 2: Add prepared YAML input to applied-object sync**

Extend `SyncAppliedObjectToXMLParams` in `orchestration/appliedObject/syncToXML.ts`:

```ts
preparedYamlFile?: PreparedYamlFile
```

Replace only the root `Свойства.yaml` read/parse block:

```ts
const yamlObj =
  params.preparedYamlFile?.data ??
  importFromYAML<unknown>(await fs.promises.readFile(yamlPath, "utf-8"))
```

Keep the fallback so direct tests of `syncAppliedObjectToXML()` continue to work while the configuration-level sync is migrated.

- [ ] **Step 3: Build a prepared YAML lookup in configuration sync**

In `configuration/syncToXML.ts`, call preparation after `syncContext` is constructed and before `rootYAMLPath` / task creation:

```ts
const prepared = await prepareYamlProject({ projectDir: inputDir, context: syncContext })
if (!prepared.ok) {
  return {
    succeeded: 0,
    failed: [{ kind: "configuration", name: inputDir, error: new Error(prepared.message) }],
  }
}
```

Build a lookup by `projectPath`:

```ts
const preparedYamlByProjectPath = new Map(
  prepared.project.workers.flatMap((worker) => worker.yamlFiles).map((file) => [file.projectPath, file])
)
```

- [ ] **Step 4: Pass prepared YAML to object sync tasks**

When creating each `syncAppliedObjectToXML()` task, pass the matching properties YAML:

```ts
preparedYamlFile: preparedYamlByProjectPath.get(`${itemTypePrefix}/${name}/Свойства.yaml`),
```

Do not use prepared data for root configuration YAML or external files in this task; those paths stay on existing readers to keep the change bounded.

- [ ] **Step 5: Preserve behavior: no new blocking validation**

Do not call `validateProject()` from sync as part of this task. If current sync already validates somewhere, leave that existing behavior unchanged; do not add new validation gates.

- [ ] **Step 6: Run sync tests**

Run the narrow changed test first, then representative sync tests:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts packages/core/metadata/appliedObjects/configuration/incrementalSyncToXML.test.ts packages/core/metadata/orchestration/appliedObject/syncToXML.test.ts
pnpm --filter @nakidka/mcp exec vitest run packages/mcp/src/services/syncToXml.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/core/metadata/appliedObjects/configuration/syncToXML.ts packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts packages/core/metadata/appliedObjects/configuration/incrementalSyncToXML.ts packages/core/metadata/appliedObjects/configuration/incrementalSyncToXML.test.ts packages/core/metadata/orchestration/appliedObject/syncToXML.ts packages/core/metadata/orchestration/appliedObject/syncToXML.test.ts
git commit -m "refactor: :recycle: готовить YAML перед sync XML"
```

### Task 8: Remove YAML Text And Position Assumptions From Validation Preparation

**Files:**
- Modify: `packages/core/metadata/validation/projectYamlCache.ts`
- Modify: `packages/core/metadata/validation/projectValidationPasses.ts`
- Modify/Test: `packages/core/metadata/validation/projectYamlCache.test.ts`
- Modify/Test: `packages/core/metadata/validation/yamlLocations.test.ts`

**Interfaces:**
- Consumes: `PreparedYamlFile.data`.
- Produces: validation code no longer requires YAML source text or project-built YAML node positions for full-project prepared path.

- [ ] **Step 1: Add test that prepared full validation does not expose text**

In `projectYamlCache.test.ts` or `preparedYamlProject.test.ts`, add:

```ts
expect(JSON.stringify(result.project)).not.toContain("Реквизиты:")
```

This asserts source text is not retained in prepared project. Keep syntax diagnostics line/col from parser.

- [ ] **Step 2: Keep parser syntax diagnostics only**

Do not delete `packages/core/yaml/locationIndex.ts` in this task if other tests still use it. Instead, remove usage from project preparation and add a follow-up note in the final task summary if runtime validation still imports location index.

- [ ] **Step 3: Run YAML/validation tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/project/preparedYamlProject.test.ts packages/core/metadata/validation/projectYamlCache.test.ts packages/core/yaml/jsYamlParser.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/core/metadata/project/preparedYamlProject.test.ts packages/core/metadata/validation/projectYamlCache.test.ts packages/core/metadata/validation/projectYamlCache.ts packages/core/metadata/validation/projectValidationPasses.ts
git commit -m "refactor: :recycle: не хранить текст YAML в подготовке"
```

### Task 9: Final Verification And Documentation Alignment

**Files:**
- Modify if needed: `.agents/architecture.md`
- Modify if needed: `docs/superpowers/specs/2026-07-14-yaml-common-mechanism-design.md`
- Modify if needed: `packages/core/metadata/project/index.ts`

**Interfaces:**
- Consumes: all previous task outputs.
- Produces: verified implementation matching architecture and spec.

- [ ] **Step 1: Run focused test suite**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/project packages/core/metadata/validation packages/core/metadata/operations
pnpm --filter @nakidka/mcp exec vitest run packages/mcp/src/services
```

Expected: PASS.

- [ ] **Step 2: Run import boundary checks**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/importBoundaries.test.ts
```

Expected: PASS. If it fails because `metadata/project` imports a forbidden applied layer, move that dependency behind existing neutral registration or rules snapshot.

- [ ] **Step 3: Run full project tests**

Run:

```bash
pnpm test
```

Expected: PASS. If baseline failures unrelated to this branch appear, record exact failing package/test and command output in the final handoff.

- [ ] **Step 4: Search for forbidden old behavior**

Run:

```bash
rg -n "MIN_FILES_FOR_WORKER_VALIDATION|locations|text: string|removePath|Удаление заблокировано" packages/core/metadata packages/mcp/src
```

Expected:
- no `MIN_FILES_FOR_WORKER_VALIDATION`;
- no `locations` usage from prepared YAML project;
- no `text: string` in `PreparedYamlFile`;
- `removePath` may exist in generic file plan or other operations, but not in `deleteItem.ts`;
- no old delete message in `deleteItem.ts`.

- [ ] **Step 5: Commit docs alignment if needed**

If implementation changed a term in the spec or architecture, update docs and commit:

```bash
git add .agents/architecture.md docs/superpowers/specs/2026-07-14-yaml-common-mechanism-design.md
git commit -m "docs: :memo: синхронизировать спеку подготовки YAML"
```

If docs already match, skip this commit.

- [ ] **Step 6: Final handoff**

Report:
- final commit list;
- `pnpm test` result;
- any baseline failures;
- any remaining follow-up explicitly outside this spec, especially one-file preparation and long-lived prepared project handles.
