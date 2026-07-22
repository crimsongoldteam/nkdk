# Component MCP Transfer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Перенести MCP-договор компонентов 1С на свежий `develop`: MCP принимает корень NKDK-проекта и необязательный `componentPath`, а core по-прежнему получает каталог одного YAML-компонента.

**Architecture:** Новый `componentResolver` становится единственной границей между MCP-контрактом проекта и core-контрактом одного metadata-проекта. Сервисы MCP нормализуют `projectDir + componentPath`, проверяют ограничения проекта и передают в core `componentDir` как прежний `projectDir`/`yamlDir`. XML-операции работают только с одним компонентом и заданным `xmlDir`; будущий импорт из базы остается только в документации архитектуры.

**Tech Stack:** TypeScript, zod v4, Vitest, `@nkdk/core`, MCP SDK.

## Global Constraints

- Ответственный слой за `cf/cfe/erf/epf` - `packages/mcp`; core на этом этапе не знает о компонентной структуре проекта.
- `projectDir` в MCP означает корень проекта, а не каталог одного YAML-представления.
- Если `componentPath` не передан, использовать `cf`, включая пишущие операции.
- Допустимые `componentPath`: `cf`, `cfe/<Имя>`, `erf/<Имя>`, `epf/<Имя>`.
- Запрещены абсолютные `componentPath`, выход через `..` и пути вне `projectDir`.
- `.nkdk` находится только в `projectDir/.nkdk`; внутри компонента `.nkdk` запрещен.
- `import_from_xml` импортирует один XML-компонент из `xmlDir` в `projectDir/componentPath`.
- `sync_to_xml` выгружает один YAML-компонент `projectDir/componentPath` в заданный `xmlDir`.
- `xmlDir` не является `xmlRootDir/componentPath`.
- При `import_from_xml` целевой каталог компонента должен отсутствовать или быть пустым; импорт не дописывает поверх непустого компонента.
- `validate_project` на первом этапе валидирует только `projectDir/cf`.
- Перед закрытием задачи выполнить `pnpm test` из корня worktree.

---

## File Structure

- Create `packages/mcp/src/services/componentResolver.ts`: нормализация `projectDir`, `componentPath`, `structurePath`, проверка `.nkdk`, создание отсутствующего компонента для импорта.
- Create `packages/mcp/src/services/componentResolver.test.ts`: unit-тесты новой границы.
- Modify `packages/mcp/src/contracts/importFromXml.ts`: заменить `yamlDir` на `projectDir` и `componentPath`.
- Modify `packages/mcp/src/contracts/syncToXml.ts`: заменить `yamlDir` на `projectDir` и `componentPath`.
- Modify `packages/mcp/src/contracts/initSyncState.ts`: заменить `yamlDir` на `projectDir` и `componentPath`.
- Modify `packages/mcp/src/contracts/describeProjectStructure.ts`: заменить `directoryPath` на `structurePath`, добавить `componentPath`.
- Modify `packages/mcp/src/contracts/getSchema.ts`: заменить `target` на пару `metadataRef`/`structurePath`, добавить `componentPath`, оставить старые параметры формата.
- Modify `packages/mcp/src/contracts/operations.ts`: заменить `path` на `metadataRef`, добавить `componentPath`.
- Modify `packages/mcp/src/contracts/validateProject.ts`: убрать `filePath`, если он остался в текущем develop-контракте.
- Modify `packages/mcp/src/services/importFromXml.ts`: разрешить компонент и вызвать core import с `outputDir=componentDir`.
- Modify `packages/mcp/src/services/syncToXml.ts`: разрешить компонент и вызвать core sync/plan с `yamlDir=componentDir`.
- Modify `packages/mcp/src/services/initSyncState.ts`: разрешить компонент и вызвать core init с `yamlDir=componentDir`.
- Modify `packages/mcp/src/services/describeProjectStructure.ts`: разрешить компонент и вызвать core describe с `projectDir=componentDir`, `directoryPath=structurePath`.
- Modify `packages/mcp/src/services/getSchema.ts`: разрешить компонент для `structurePath`, передать core `projectDir=componentDir`, `filePath=structurePath`; для `metadataRef` вызвать schema by name.
- Modify `packages/mcp/src/services/validateProject.ts`: валидировать только `projectDir/cf`.
- Modify `packages/mcp/src/services/renameItem.ts` and `packages/mcp/src/services/findReferences.ts`: передать core `{ projectDir: componentDir, path: metadataRef }`.
- Modify MCP service tests beside each changed service.
- Modify `packages/mcp/src/tools/registerTools.ts`, `packages/mcp/README.md`, `packages/mcp/src/guides/index.ts`, `packages/mcp/src/prompts/index.ts`: обновить описания входов и ограничения.
- Modify `.agents/architecture.md` and `.agents/restrictions.md`: зафиксировать текущий single-component XML import/sync и будущий base import через временный `xmlRootDir`.

---

### Task 1: Component Resolver

**Files:**
- Create: `packages/mcp/src/services/componentResolver.ts`
- Create: `packages/mcp/src/services/componentResolver.test.ts`

**Interfaces:**
- Produces:
  - `resolveComponent(options: ResolveComponentOptions): ResolveComponentResult`
  - `assertImportTargetEmpty(componentDir: string): ToolFailure | undefined`
  - `resolveStructurePath(componentDir: string, structurePath: string | undefined): string | undefined`
  - `ResolveComponentOptions = { projectDir: string; componentPath?: string; createIfMissing?: boolean }`
  - success result `{ ok: true; projectDir: string; componentPath: string; componentDir: string; nkdkDir: string }`
  - failure result `{ ok: false; error: ToolFailure }`

- [ ] **Step 1: Write resolver tests**

Create `packages/mcp/src/services/componentResolver.test.ts`:

```ts
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, describe, expect, it } from "vitest"
import { assertImportTargetEmpty, resolveComponent, resolveStructurePath } from "./componentResolver"

describe("componentResolver", () => {
  const tempDirs: string[] = []

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true })
  })

  it("defaults componentPath to cf and returns root .nkdk path", () => {
    const projectDir = createProject()

    expect(resolveComponent({ projectDir })).toEqual({
      ok: true,
      projectDir,
      componentPath: "cf",
      componentDir: join(projectDir, "cf"),
      nkdkDir: join(projectDir, ".nkdk"),
    })
  })

  it("accepts nested extension component path", () => {
    const projectDir = createProject()
    mkdirSync(join(projectDir, "cfe", "Расширение"), { recursive: true })

    expect(resolveComponent({ projectDir, componentPath: "cfe/Расширение" })).toMatchObject({
      ok: true,
      componentPath: "cfe/Расширение",
      componentDir: join(projectDir, "cfe", "Расширение"),
    })
  })

  it("rejects absolute and escaping component paths", () => {
    const projectDir = createProject()

    expect(resolveComponent({ projectDir, componentPath: join(projectDir, "cf") })).toMatchObject({
      ok: false,
      error: { code: "invalid_arguments" },
    })
    expect(resolveComponent({ projectDir, componentPath: "../cf" })).toMatchObject({
      ok: false,
      error: { code: "invalid_arguments" },
    })
  })

  it("rejects non-standard component root", () => {
    const projectDir = createProject()

    expect(resolveComponent({ projectDir, componentPath: "src/cf" })).toMatchObject({
      ok: false,
      error: { code: "invalid_arguments" },
    })
  })

  it("requires cf in project root", () => {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-mcp-component-"))
    tempDirs.push(projectDir)

    expect(resolveComponent({ projectDir })).toMatchObject({
      ok: false,
      error: { code: "not_found" },
    })
  })

  it("creates missing component only when createIfMissing is true", () => {
    const projectDir = createProject()

    expect(resolveComponent({ projectDir, componentPath: "epf/Загрузка" })).toMatchObject({
      ok: false,
      error: { code: "not_found" },
    })
    expect(resolveComponent({ projectDir, componentPath: "epf/Загрузка", createIfMissing: true })).toMatchObject({
      ok: true,
      componentDir: join(projectDir, "epf", "Загрузка"),
    })
  })

  it("rejects component that contains its own .nkdk directory", () => {
    const projectDir = createProject()
    mkdirSync(join(projectDir, "cfe", "Расширение", ".nkdk"), { recursive: true })

    expect(resolveComponent({ projectDir, componentPath: "cfe/Расширение" })).toMatchObject({
      ok: false,
      error: { code: "invalid_arguments" },
    })
  })

  it("requires import target directory to be empty", () => {
    const projectDir = createProject()

    expect(assertImportTargetEmpty(join(projectDir, "cf"))).toBeUndefined()
    writeFileSync(join(projectDir, "cf", "Configuration.yaml"), "name: Test\n")
    expect(assertImportTargetEmpty(join(projectDir, "cf"))).toMatchObject({
      code: "invalid_arguments",
    })
  })

  it("normalizes structurePath and rejects escape", () => {
    const projectDir = createProject()

    expect(resolveStructurePath(join(projectDir, "cf"), "Catalogs/Товары.yaml")).toBe("Catalogs/Товары.yaml")
    expect(() => resolveStructurePath(join(projectDir, "cf"), "../secret.yaml")).toThrow(
      "structurePath должен находиться внутри компонента",
    )
  })

  function createProject(): string {
    const projectDir = mkdtempSync(join(tmpdir(), "nkdk-mcp-component-"))
    tempDirs.push(projectDir)
    mkdirSync(join(projectDir, "cf"), { recursive: true })
    return projectDir
  }
})
```

- [ ] **Step 2: Run resolver tests and confirm failure**

Run:

```bash
pnpm --filter @nkdk/mcp test -- src/services/componentResolver.test.ts
```

Expected: FAIL because `./componentResolver` does not exist.

- [ ] **Step 3: Implement resolver**

Create `packages/mcp/src/services/componentResolver.ts`:

```ts
import { existsSync, mkdirSync, readdirSync, statSync } from "fs"
import { isAbsolute, relative, resolve, sep } from "path"
import { toolError, type ToolFailure } from "../contracts/common"

const STANDARD_COMPONENT_ROOTS = new Set(["cf", "cfe", "erf", "epf"])

export interface ResolveComponentOptions {
  projectDir: string
  componentPath?: string
  createIfMissing?: boolean
}

export type ResolveComponentResult =
  | { ok: true; projectDir: string; componentPath: string; componentDir: string; nkdkDir: string }
  | { ok: false; error: ToolFailure }

export function resolveComponent(options: ResolveComponentOptions): ResolveComponentResult {
  const projectDir = resolve(options.projectDir)
  const componentPath = normalizeRelativePath(options.componentPath ?? "cf")

  if (componentPath === undefined) {
    return { ok: false, error: toolError("invalid_arguments", "componentPath должен быть относительным путем") }
  }

  const root = componentPath.split("/")[0]
  if (!STANDARD_COMPONENT_ROOTS.has(root)) {
    return { ok: false, error: toolError("invalid_arguments", "componentPath должен начинаться с cf, cfe, erf или epf") }
  }

  if (!existsSync(projectDir)) {
    return { ok: false, error: toolError("not_found", "Проект не найден", { projectDir: options.projectDir }) }
  }
  if (!statSync(projectDir).isDirectory()) {
    return { ok: false, error: toolError("invalid_arguments", "Путь не является каталогом проекта", { projectDir: options.projectDir }) }
  }

  const cfDir = resolve(projectDir, "cf")
  if (!existsSync(cfDir) || !statSync(cfDir).isDirectory()) {
    return { ok: false, error: toolError("not_found", "Компонент cf не найден", { projectDir: options.projectDir }) }
  }

  const componentDir = resolve(projectDir, ...componentPath.split("/"))
  if (!isInside(projectDir, componentDir)) {
    return { ok: false, error: toolError("invalid_arguments", "componentPath должен находиться внутри projectDir") }
  }

  if (!existsSync(componentDir)) {
    if (options.createIfMissing === true) mkdirSync(componentDir, { recursive: true })
    else {
      return {
        ok: false,
        error: toolError("not_found", "Компонент не найден", { projectDir: options.projectDir, componentPath }),
      }
    }
  }

  if (!statSync(componentDir).isDirectory()) {
    return { ok: false, error: toolError("invalid_arguments", "Путь компонента не является каталогом", { componentPath }) }
  }

  if (existsSync(resolve(componentDir, ".nkdk"))) {
    return {
      ok: false,
      error: toolError("invalid_arguments", ".nkdk должен находиться в корне проекта, а не внутри компонента", {
        projectDir: options.projectDir,
        componentPath,
      }),
    }
  }

  return { ok: true, projectDir, componentPath, componentDir, nkdkDir: resolve(projectDir, ".nkdk") }
}

export function assertImportTargetEmpty(componentDir: string): ToolFailure | undefined {
  const entries = readdirSync(componentDir).filter((entry) => entry !== ".DS_Store")
  if (entries.length === 0) return undefined
  return toolError("invalid_arguments", "Целевой каталог компонента должен быть пустым перед import_from_xml", {
    componentDir,
  })
}

export function resolveStructurePath(componentDir: string, structurePath: string | undefined): string | undefined {
  if (structurePath === undefined || structurePath.trim() === "") return undefined
  if (isAbsolute(structurePath)) throw new Error("structurePath должен быть относительным путем")

  const normalized = structurePath.replaceAll("\\", "/").split("/").filter(Boolean).join("/")
  const absolutePath = resolve(componentDir, ...normalized.split("/"))
  if (!isInside(componentDir, absolutePath)) throw new Error("structurePath должен находиться внутри компонента")
  return normalized
}

function normalizeRelativePath(value: string): string | undefined {
  if (isAbsolute(value)) return undefined
  const normalized = value.replaceAll("\\", "/").split("/").filter(Boolean).join("/")
  if (normalized === "" || normalized.split("/").includes("..")) return undefined
  return normalized
}

function isInside(root: string, candidate: string): boolean {
  const rel = relative(resolve(root), resolve(candidate))
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel) && !rel.split(sep).includes(".."))
}
```

- [ ] **Step 4: Run resolver tests and type-check**

Run:

```bash
pnpm --filter @nkdk/mcp test -- src/services/componentResolver.test.ts
pnpm --filter @nkdk/mcp type-check
```

Expected: both commands PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/mcp/src/services/componentResolver.ts packages/mcp/src/services/componentResolver.test.ts
git commit -m "feat: :sparkles: добавить resolver компонентов MCP"
```

---

### Task 2: XML Write Operations

**Files:**
- Modify: `packages/mcp/src/contracts/importFromXml.ts`
- Modify: `packages/mcp/src/contracts/syncToXml.ts`
- Modify: `packages/mcp/src/contracts/initSyncState.ts`
- Modify: `packages/mcp/src/services/importFromXml.ts`
- Modify: `packages/mcp/src/services/syncToXml.ts`
- Modify: `packages/mcp/src/services/initSyncState.ts`
- Modify tests: `packages/mcp/src/services/importFromXml.test.ts`, `packages/mcp/src/services/syncToXml.test.ts`, `packages/mcp/src/services/initSyncState.test.ts`

**Interfaces:**
- Consumes: `resolveComponent`, `assertImportTargetEmpty` from Task 1.
- Produces:
  - `ImportFromXmlInput = { projectDir: string; componentPath?: string; xmlDir: string; allowWrite?: boolean }`
  - `SyncToXmlInput = { projectDir: string; componentPath?: string; xmlDir: string; baseId?: string; concurrency?: number; allowWrite?: boolean }`
  - `InitSyncStateInput = { projectDir: string; componentPath?: string; xmlDir: string; allowWrite?: boolean }`

- [ ] **Step 1: Update contract tests through existing service tests**

In `packages/mcp/src/services/importFromXml.test.ts`, add or replace scenarios so they assert:

```ts
it("requires allowWrite before resolving a write import", async () => {
  const projectDir = createProject()
  const syncConfigurationFromXML = vi.fn()

  const result = await importFromXml({ projectDir, xmlDir: "/xml" }, { syncConfigurationFromXML })

  expect(result).toEqual({
    ok: false,
    code: "confirmation_required",
    message: "import_from_xml пишет YAML-файлы; повторите вызов с allowWrite=true",
    details: { xmlDir: "/xml", projectDir, componentPath: "cf" },
  })
  expect(syncConfigurationFromXML).not.toHaveBeenCalled()
})

it("imports xmlDir into the selected empty component", async () => {
  const projectDir = createProject()
  mkdirSync(join(projectDir, "cfe", "Расширение"), { recursive: true })
  const syncConfigurationFromXML = vi.fn().mockResolvedValue({
    succeeded: 1,
    failed: [],
    warnings: [],
    configurationIndexPath: join(projectDir, ".nkdk", "configuration-index.json"),
  })

  const result = await importFromXml(
    { projectDir, componentPath: "cfe/Расширение", xmlDir: "/xml", allowWrite: true },
    { syncConfigurationFromXML },
  )

  expect(syncConfigurationFromXML).toHaveBeenCalledWith(expect.objectContaining({
    inputDir: "/xml",
    outputDir: join(projectDir, "cfe", "Расширение"),
  }))
  expect(result).toMatchObject({
    ok: true,
    succeeded: 1,
    failed: [],
    warnings: [],
    configurationIndexPath: join(projectDir, ".nkdk", "configuration-index.json"),
  })
})

it("refuses to import into a non-empty component", async () => {
  const projectDir = createProject()
  writeFileSync(join(projectDir, "cf", "Configuration.yaml"), "name: Test\n")
  const syncConfigurationFromXML = vi.fn()

  const result = await importFromXml({ projectDir, xmlDir: "/xml", allowWrite: true }, { syncConfigurationFromXML })

  expect(result).toMatchObject({ ok: false, code: "invalid_arguments" })
  expect(syncConfigurationFromXML).not.toHaveBeenCalled()
})
```

In `packages/mcp/src/services/syncToXml.test.ts`, add or replace scenarios so they assert:

```ts
it("plans sync for selected component when allowWrite is not true", async () => {
  const projectDir = createProject()
  mkdirSync(join(projectDir, "epf", "Загрузка"), { recursive: true })
  const planSyncToXml = vi.fn().mockResolvedValue({ ok: true, mode: "plan" })
  const syncConfigurationToXML = vi.fn()

  const result = await syncToXml(
    { projectDir, componentPath: "epf/Загрузка", xmlDir: "/xml", baseId: "base" },
    { planSyncToXml, syncConfigurationToXML },
  )

  expect(result).toEqual({ ok: true, result: { ok: true, mode: "plan" } })
  expect(planSyncToXml).toHaveBeenCalledWith({
    yamlDir: join(projectDir, "epf", "Загрузка"),
    xmlDir: "/xml",
    baseId: "base",
  })
  expect(syncConfigurationToXML).not.toHaveBeenCalled()
})

it("syncs selected component and preserves develop result fields", async () => {
  const projectDir = createProject()
  const syncConfigurationToXML = vi.fn().mockResolvedValue({
    succeeded: 2,
    failed: [{ severity: "error", code: "bad_yaml", message: "bad yaml" }],
    warnings: [{ severity: "warning", code: "weak_ref", message: "weak ref" }],
    configurationIndexPath: join(projectDir, ".nkdk", "configuration-index.json"),
  })

  const result = await syncToXml(
    { projectDir, xmlDir: "/xml", baseId: "base", concurrency: 3, allowWrite: true },
    { syncConfigurationToXML },
  )

  expect(syncConfigurationToXML).toHaveBeenCalledWith(expect.objectContaining({
    yamlDir: join(projectDir, "cf"),
    xmlDir: "/xml",
    baseId: "base",
    concurrency: 3,
  }))
  expect(result).toEqual({
    ok: true,
    succeeded: 2,
    configurationIndexPath: join(projectDir, ".nkdk", "configuration-index.json"),
    warnings: [{ severity: "warning", code: "weak_ref", message: "weak ref" }],
    failed: [{ severity: "error", code: "bad_yaml", message: "bad yaml" }],
  })
})
```

In `packages/mcp/src/services/initSyncState.test.ts`, ensure there is a scenario:

```ts
it("initializes sync state for selected component", async () => {
  const projectDir = createProject()
  mkdirSync(join(projectDir, "cfe", "Расширение"), { recursive: true })
  const initializeXmlSyncState = vi.fn().mockResolvedValue(undefined)

  const result = await initSyncState(
    { projectDir, componentPath: "cfe/Расширение", xmlDir: "/xml", allowWrite: true },
    { initializeXmlSyncState },
  )

  expect(initializeXmlSyncState).toHaveBeenCalledWith({
    yamlDir: join(projectDir, "cfe", "Расширение"),
    xmlDir: "/xml",
  })
  expect(result).toEqual({ ok: true, stateFile: ".nkdk-sync.yaml" })
})
```

- [ ] **Step 2: Run XML service tests and confirm failure**

Run:

```bash
pnpm --filter @nkdk/mcp test -- src/services/importFromXml.test.ts src/services/syncToXml.test.ts src/services/initSyncState.test.ts
```

Expected: FAIL because contracts still require `yamlDir`, and services still pass `input.yamlDir`.

- [ ] **Step 3: Update XML contracts**

Change each input shape:

```ts
// importFromXml.ts
export const importFromXmlInputShape = {
  projectDir: z.string().min(1),
  componentPath: z.string().min(1).optional(),
  xmlDir: z.string().min(1),
  allowWrite: z.boolean().optional(),
}

// syncToXml.ts
export const syncToXmlInputShape = {
  projectDir: z.string().min(1),
  componentPath: z.string().min(1).optional(),
  xmlDir: z.string().min(1),
  baseId: z.string().min(1).optional(),
  concurrency: z.number().int().positive().optional(),
  allowWrite: z.boolean().optional(),
}

// initSyncState.ts
export const initSyncStateInputShape = {
  projectDir: z.string().min(1),
  componentPath: z.string().min(1).optional(),
  xmlDir: z.string().min(1),
  allowWrite: z.boolean().optional(),
}
```

- [ ] **Step 4: Update XML services**

In `importFromXml`, before core call:

```ts
if (input.allowWrite !== true) {
  return toolError("confirmation_required", "import_from_xml пишет YAML-файлы; повторите вызов с allowWrite=true", {
    xmlDir: input.xmlDir,
    projectDir: input.projectDir,
    componentPath: input.componentPath ?? "cf",
  })
}

const component = resolveComponent({
  projectDir: input.projectDir,
  componentPath: input.componentPath,
  createIfMissing: true,
})
if (!component.ok) return component.error

const emptyTargetError = assertImportTargetEmpty(component.componentDir)
if (emptyTargetError !== undefined) return emptyTargetError
```

Then pass `outputDir: component.componentDir`.

In `syncToXml`, resolve before plan/write:

```ts
const component = resolveComponent({ projectDir: input.projectDir, componentPath: input.componentPath })
if (!component.ok) return component.error
```

Then use `yamlDir: component.componentDir` in both `planSyncToXml` and `syncConfigurationToXML`.

In `initSyncState`, require confirmation details `{ projectDir, componentPath: input.componentPath ?? "cf", xmlDir }`, resolve component, and pass `yamlDir: component.componentDir`.

- [ ] **Step 5: Run XML service tests and type-check**

Run:

```bash
pnpm --filter @nkdk/mcp test -- src/services/importFromXml.test.ts src/services/syncToXml.test.ts src/services/initSyncState.test.ts
pnpm --filter @nkdk/mcp type-check
```

Expected: both commands PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/mcp/src/contracts/importFromXml.ts packages/mcp/src/contracts/syncToXml.ts packages/mcp/src/contracts/initSyncState.ts packages/mcp/src/services/importFromXml.ts packages/mcp/src/services/syncToXml.ts packages/mcp/src/services/initSyncState.ts packages/mcp/src/services/importFromXml.test.ts packages/mcp/src/services/syncToXml.test.ts packages/mcp/src/services/initSyncState.test.ts
git commit -m "feat: :sparkles: перевести XML-операции MCP на компоненты"
```

---

### Task 3: Read and Metadata Operations

**Files:**
- Modify: `packages/mcp/src/contracts/describeProjectStructure.ts`
- Modify: `packages/mcp/src/contracts/getSchema.ts`
- Modify: `packages/mcp/src/contracts/operations.ts`
- Modify: `packages/mcp/src/contracts/validateProject.ts`
- Modify: `packages/mcp/src/services/describeProjectStructure.ts`
- Modify: `packages/mcp/src/services/getSchema.ts`
- Modify: `packages/mcp/src/services/validateProject.ts`
- Modify: `packages/mcp/src/services/renameItem.ts`
- Modify: `packages/mcp/src/services/findReferences.ts`
- Modify related tests beside those services.

**Interfaces:**
- Consumes: `resolveComponent`, `resolveStructurePath`.
- Produces:
  - `describe_project_structure { projectDir, componentPath?, structurePath?, depth? }`
  - `get_schema { projectDir, componentPath?, metadataRef?, structurePath?, format?, mode?, keys?, required?, search?, exact? }`
  - `validate_project { projectDir }`
  - `rename_item { projectDir, componentPath?, metadataRef, newName, allowWrite? }`
  - `find_references { projectDir, componentPath?, metadataRef }`

- [ ] **Step 1: Update tests for component-aware reads**

In `describeProjectStructure.test.ts`, assert that core receives component dir and normalized `directoryPath`:

```ts
it("describes structure inside selected component", async () => {
  const projectDir = createProject()
  mkdirSync(join(projectDir, "cfe", "Расширение"), { recursive: true })
  const describeMetadataProjectDirectoryStructure = vi.fn().mockReturnValue({
    projectDir: join(projectDir, "cfe", "Расширение"),
    directoryPath: "Catalogs",
    depth: 1,
    node: minimalNode,
  })

  const result = await describeProjectStructure(
    { projectDir, componentPath: "cfe/Расширение", structurePath: "Catalogs", depth: 1 },
    { describeMetadataProjectDirectoryStructure },
  )

  expect(describeMetadataProjectDirectoryStructure).toHaveBeenCalledWith({
    projectDir: join(projectDir, "cfe", "Расширение"),
    directoryPath: "Catalogs",
    depth: 1,
  })
  expect(result).toMatchObject({ ok: true })
})
```

If `describeProjectStructure` does not yet accept dependency injection, add it in the implementation step.

In `getSchema.test.ts`, cover both modes:

```ts
it("exports schema for structurePath inside selected component", async () => {
  const projectDir = createProject()
  const core = createCoreSchemaMock()

  const result = await getSchema({ projectDir, structurePath: "Catalogs/Товары.yaml" }, core)

  expect(core.exportJSONSchemaForProjectFile).toHaveBeenCalledWith(expect.objectContaining({
    projectDir: join(projectDir, "cf"),
    filePath: "Catalogs/Товары.yaml",
    mode: "externalRefs",
  }))
  expect(result).toMatchObject({ ok: true, target: "Catalogs/Товары.yaml" })
})

it("exports schema by metadataRef without requiring a structurePath", async () => {
  const projectDir = createProject()
  const core = createCoreSchemaMock()

  const result = await getSchema({ projectDir, metadataRef: "Catalog.Товары", format: "jsonSchema" }, core)

  expect(core.exportJSONSchemaForSchemaName).toHaveBeenCalledWith(expect.objectContaining({
    name: "Catalog.Товары",
    mode: "externalRefs",
  }))
  expect(result).toMatchObject({ ok: true, target: "Catalog.Товары" })
})

it("requires exactly one schema source", async () => {
  const projectDir = createProject()
  const core = createCoreSchemaMock()

  await expect(getSchema({ projectDir }, core)).resolves.toMatchObject({ ok: false, code: "invalid_arguments" })
  await expect(getSchema({ projectDir, metadataRef: "Catalog.Товары", structurePath: "Catalogs/Товары.yaml" }, core))
    .resolves.toMatchObject({ ok: false, code: "invalid_arguments" })
})
```

In `validateProject.test.ts`, assert `projectDir/cf`:

```ts
it("validates cf component from project root", async () => {
  const projectDir = createProject()
  const validateProject = vi.fn().mockResolvedValue({ diagnostics: [] })

  const result = await validateYamlProject({ projectDir }, { validateProject })

  expect(validateProject).toHaveBeenCalledWith({ projectDir: join(projectDir, "cf") })
  expect(result).toEqual({ ok: true, diagnostics: [], summary: { errors: 0, warnings: 0 } })
})
```

In `renameItem.test.ts` and `findReferences.test.ts`, assert metadata ref mapping:

```ts
it("passes metadataRef as core path inside selected component", async () => {
  const projectDir = createProject()
  const renameMetadataItem = vi.fn().mockResolvedValue({ ok: true })

  await renameItem(
    { projectDir, componentPath: "cf", metadataRef: "Catalog.Товары", newName: "Номенклатура", allowWrite: true },
    { renameMetadataItem },
  )

  expect(renameMetadataItem).toHaveBeenCalledWith({
    projectDir: join(projectDir, "cf"),
    path: "Catalog.Товары",
    newName: "Номенклатура",
    allowWrite: true,
  })
})
```

- [ ] **Step 2: Run read/metadata tests and confirm failure**

Run:

```bash
pnpm --filter @nkdk/mcp test -- src/services/describeProjectStructure.test.ts src/services/getSchema.test.ts src/services/validateProject.test.ts src/services/renameItem.test.ts src/services/findReferences.test.ts
```

Expected: FAIL because contracts and services still use `directoryPath`, `target`, and `path`.

- [ ] **Step 3: Update contracts**

Use these shapes:

```ts
export const describeProjectStructureInputShape = {
  projectDir: z.string().min(1),
  componentPath: z.string().min(1).optional(),
  structurePath: z.string().optional(),
  depth: z.number().int().positive().optional(),
}

export const getSchemaInputShape = {
  projectDir: z.string().min(1),
  componentPath: z.string().min(1).optional(),
  metadataRef: z.string().min(1).optional(),
  structurePath: z.string().min(1).optional(),
  format: z.enum(["summary", "jsonSchema"]).optional(),
  mode: z.enum(["externalRefs", "inline"]).optional(),
  keys: z.union([z.literal(true), z.string().min(1)]).optional(),
  required: z.boolean().optional(),
  search: z.string().optional(),
  exact: z.boolean().optional(),
}

export const renameItemInputShape = {
  projectDir: z.string().min(1),
  componentPath: z.string().min(1).optional(),
  metadataRef: operationPath,
  newName: localName,
  allowWrite: z.boolean().optional(),
}

export const findReferencesInputShape = {
  projectDir: z.string().min(1),
  componentPath: z.string().min(1).optional(),
  metadataRef: operationPath,
}

export const validateProjectInputShape = {
  projectDir: z.string().min(1),
}
```

- [ ] **Step 4: Update services**

For `describeProjectStructure`, resolve component and call core:

```ts
const component = resolveComponent({ projectDir: input.projectDir, componentPath: input.componentPath })
if (!component.ok) return component.error
const directoryPath = resolveStructurePath(component.componentDir, input.structurePath)
const structure = core.describeMetadataProjectDirectoryStructure({
  projectDir: component.componentDir,
  ...(directoryPath !== undefined ? { directoryPath } : {}),
  ...(input.depth !== undefined ? { depth: input.depth } : {}),
})
```

For `getSchema`, validate exactly one source:

```ts
const hasMetadataRef = input.metadataRef !== undefined
const hasStructurePath = input.structurePath !== undefined
if (hasMetadataRef === hasStructurePath) {
  return toolError("invalid_arguments", "Укажите ровно один источник схемы: metadataRef или structurePath")
}
```

If `structurePath` is used, resolve component and call:

```ts
const component = resolveComponent({ projectDir: input.projectDir, componentPath: input.componentPath })
if (!component.ok) return component.error
const filePath = resolveStructurePath(component.componentDir, input.structurePath)
return core.exportJSONSchemaForProjectFile({
  context,
  filePath: filePath ?? "",
  projectDir: component.componentDir,
  mode,
})
```

If `metadataRef` is used, call:

```ts
return core.exportJSONSchemaForSchemaName({
  context,
  name: input.metadataRef,
  mode,
})
```

For `validateProject`, resolve `{ projectDir, componentPath: "cf" }` and call validation handle with `projectDir: component.componentDir`; map diagnostics relative to `component.componentDir`.

For operations, map into core inputs:

```ts
const component = resolveComponent({ projectDir: input.projectDir, componentPath: input.componentPath })
if (!component.ok) return component.error
return (await core.renameMetadataItem({
  projectDir: component.componentDir,
  path: input.metadataRef,
  newName: input.newName,
  allowWrite: input.allowWrite,
})) as unknown as ToolPayload
```

Use the same pattern for `findMetadataReferences`.

- [ ] **Step 5: Run read/metadata tests and type-check**

Run:

```bash
pnpm --filter @nkdk/mcp test -- src/services/describeProjectStructure.test.ts src/services/getSchema.test.ts src/services/validateProject.test.ts src/services/renameItem.test.ts src/services/findReferences.test.ts
pnpm --filter @nkdk/mcp type-check
```

Expected: both commands PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/mcp/src/contracts/describeProjectStructure.ts packages/mcp/src/contracts/getSchema.ts packages/mcp/src/contracts/operations.ts packages/mcp/src/contracts/validateProject.ts packages/mcp/src/services/describeProjectStructure.ts packages/mcp/src/services/getSchema.ts packages/mcp/src/services/validateProject.ts packages/mcp/src/services/renameItem.ts packages/mcp/src/services/findReferences.ts packages/mcp/src/services/describeProjectStructure.test.ts packages/mcp/src/services/getSchema.test.ts packages/mcp/src/services/validateProject.test.ts packages/mcp/src/services/renameItem.test.ts packages/mcp/src/services/findReferences.test.ts
git commit -m "feat: :sparkles: адаптировать MCP-чтение к компонентам"
```

---

### Task 4: Tool Descriptions, Guides, Prompts, and Project Docs

**Files:**
- Modify: `packages/mcp/src/tools/registerTools.ts`
- Modify: `packages/mcp/src/tools/registerTools.test.ts`
- Modify: `packages/mcp/README.md`
- Modify: `packages/mcp/src/guides/index.ts`
- Modify: `packages/mcp/src/guides/index.test.ts`
- Modify: `packages/mcp/src/prompts/index.ts`
- Modify: `packages/mcp/src/prompts/index.test.ts`
- Modify: `.agents/architecture.md`
- Modify: `.agents/restrictions.md`

**Interfaces:**
- Consumes all new contracts from Tasks 2 and 3.
- Produces user-facing MCP documentation that consistently says `projectDir` is the root project, `componentPath` defaults to `cf`, and XML operations use a single explicit `xmlDir`.

- [ ] **Step 1: Update registration and documentation tests**

In `registerTools.test.ts`, assert that all changed tool schemas expose `projectDir` and no longer expose `yamlDir`, `directoryPath`, `target`, or `path`:

```ts
expect(tool("nkdk.import_from_xml").inputSchema).toHaveProperty("projectDir")
expect(tool("nkdk.import_from_xml").inputSchema).toHaveProperty("componentPath")
expect(tool("nkdk.import_from_xml").inputSchema).not.toHaveProperty("yamlDir")
expect(tool("nkdk.describe_project_structure").inputSchema).toHaveProperty("structurePath")
expect(tool("nkdk.describe_project_structure").inputSchema).not.toHaveProperty("directoryPath")
expect(tool("nkdk.get_schema").inputSchema).toHaveProperty("metadataRef")
expect(tool("nkdk.get_schema").inputSchema).toHaveProperty("structurePath")
expect(tool("nkdk.get_schema").inputSchema).not.toHaveProperty("target")
expect(tool("nkdk.rename_item").inputSchema).toHaveProperty("metadataRef")
expect(tool("nkdk.rename_item").inputSchema).not.toHaveProperty("path")
```

In guide and prompt tests, update snapshots or text assertions so they include:

```ts
expect(text).toContain("projectDir")
expect(text).toContain("componentPath")
expect(text).toContain("componentPath не передан, используется cf")
expect(text).toContain("xmlDir не строится как xmlRootDir/componentPath")
```

- [ ] **Step 2: Run documentation tests and confirm failure**

Run:

```bash
pnpm --filter @nkdk/mcp test -- src/tools/registerTools.test.ts src/guides/index.test.ts src/prompts/index.test.ts
```

Expected: FAIL because descriptions and text still mention old fields.

- [ ] **Step 3: Update tool descriptions**

In `registerTools.ts`, update descriptions to this meaning:

```ts
"nkdk.import_from_xml": "Импортирует готовую XML-выгрузку одного компонента 1С из xmlDir в projectDir/componentPath. componentPath по умолчанию cf. Не подключается к 1С и пишет файлы только при allowWrite=true; целевой компонент должен быть пустым."

"nkdk.sync_to_xml": "Выгружает один YAML-компонент projectDir/componentPath в указанный xmlDir. componentPath по умолчанию cf. Не синхронизирует все компоненты проекта за один вызов."

"nkdk.init_sync_state": "Создаёт состояние XML-синхронизации для одного компонента projectDir/componentPath и заданного xmlDir. Пишет файл только при allowWrite=true."

"nkdk.describe_project_structure": "Возвращает допустимые файлы и подкаталоги внутри выбранного компонента NKDK-проекта."

"nkdk.get_schema": "Возвращает JSON Schema или краткую JSON-сводку по metadataRef или structurePath внутри выбранного компонента."

"nkdk.validate_project": "Проверяет основной компонент cf в корне NKDK-проекта."
```

- [ ] **Step 4: Update README, guides, prompts**

Make the text consistently use this project shape:

```text
projectDir/
  .nkdk/
  cf/
  cfe/<ИмяРасширения>/
  erf/<ИмяОтчета>/
  epf/<ИмяОбработки>/
```

Mention these exact rules:

```text
componentPath не передан, используется cf.
import_from_xml принимает xmlDir готовой XML-выгрузки одного компонента.
sync_to_xml выгружает один выбранный компонент в указанный xmlDir.
xmlDir не строится как xmlRootDir/componentPath.
Текущий MCP-договор не подключается к 1С и не импортирует все компоненты проекта за один вызов.
```

- [ ] **Step 5: Update architecture and restrictions**

In `.agents/architecture.md`, add a short component MCP section:

````md
## Component MCP Project Contract

MCP-слой работает с корнем NKDK-проекта:

```text
projectDir/
  .nkdk/
  cf/
  cfe/<ИмяРасширения>/
  erf/<ИмяОтчета>/
  epf/<ИмяОбработки>/
```

Core metadata-операции на текущем этапе получают каталог одного компонента. MCP разрешает `projectDir + (componentPath ?? "cf")` в `componentDir` и передает его в core как прежний `projectDir` или `yamlDir`.

Текущий `import_from_xml` принимает готовую XML-выгрузку одного компонента в `xmlDir`. Будущий импорт из базы должен сначала выгрузить базу во временный структурированный `xmlRootDir` с подпапками `cf`, `cfe/*`, `erf/*`, `epf/*`, а затем импортировать выбранные компоненты.
````

In `.agents/restrictions.md`, add:

```md
- Текущие MCP XML-операции не подключаются к 1С и не обрабатывают все компоненты проекта за один вызов.
- `import_from_xml` требует, чтобы целевой каталог компонента отсутствовал или был пустым.
- `.nkdk` должен находиться в корне проекта `projectDir/.nkdk`, а не внутри `cf`, `cfe/*`, `erf/*` или `epf/*`.
- В текущем MCP-договоре `xmlDir` является каталогом XML одного компонента; не вычисляй его как `xmlRootDir/componentPath`.
```

- [ ] **Step 6: Run documentation tests**

Run:

```bash
pnpm --filter @nkdk/mcp test -- src/tools/registerTools.test.ts src/guides/index.test.ts src/prompts/index.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/mcp/src/tools/registerTools.ts packages/mcp/src/tools/registerTools.test.ts packages/mcp/README.md packages/mcp/src/guides/index.ts packages/mcp/src/guides/index.test.ts packages/mcp/src/prompts/index.ts packages/mcp/src/prompts/index.test.ts .agents/architecture.md .agents/restrictions.md
git commit -m "docs: :memo: описать MCP-договор компонентов"
```

---

### Task 5: Integration Verification

**Files:**
- Modify only if tests reveal type or integration errors from earlier tasks.

**Interfaces:**
- Consumes all task outputs.
- Produces verified branch with component MCP transfer complete.

- [ ] **Step 1: Run focused MCP test suite**

Run:

```bash
pnpm --filter @nkdk/mcp test
pnpm --filter @nkdk/mcp type-check
```

Expected: PASS.

- [ ] **Step 2: Run full repository tests**

Run from `/Users/nikita/git/nkdk/.worktrees/component-mcp-transfer`:

```bash
pnpm test
```

Expected: PASS.

- [ ] **Step 3: Check git diff hygiene**

Run:

```bash
git diff --check
git status --short
```

Expected: `git diff --check` prints nothing. `git status --short` contains only intentional files if a verification fix was needed.

- [ ] **Step 4: Commit verification fixes if any**

If Step 1 or Step 2 required changes, commit them:

```bash
git add <changed-files>
git commit -m "fix: :bug: стабилизировать MCP-договор компонентов"
```

If no changes were needed, do not create an empty commit.

---

## Self-Review

- Spec coverage: resolver, XML import/sync/init, read operations, metadata operations, docs, architecture, restrictions, MCP tests, package tests, and full `pnpm test` are covered.
- Placeholder scan: no unfinished-marker or copy-forward instructions remain.
- Type consistency: all service tasks consume `projectDir` and optional `componentPath`; core receives `componentDir` as `projectDir` or `yamlDir`; operations map `metadataRef` to core `path`; `structurePath` maps to core `directoryPath` only inside the adapter.
