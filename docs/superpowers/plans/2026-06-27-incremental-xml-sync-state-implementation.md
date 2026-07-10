# Incremental XML Sync State Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить `.nkdk-sync.yaml`, инкрементальный YAML -> XML sync, отдельную инициализацию state для CLI/MCP и сохранить полный sync для round-trip.

**Architecture:** Существующий `syncConfigurationToXML` остаётся полным режимом и не обновляет `ConfigDumpInfo.xml`. Новый инкрементальный слой живёт рядом с configuration sync: он читает state, считает хэши YAML-файлов, через декларативные описатели правил определяет области XML-записи и вызывает точечные операции. `orchestration` получает нейтральные договоры для частичной записи, а конкретные обновления `ConfigDumpInfo.xml` и MCP-поведение остаются во внешних слоях.

**Tech Stack:** TypeScript, Node.js `fs/promises`, `crypto`, `yaml`, Vitest, existing `@nakidka/core` metadata orchestration, Commander CLI, MCP services/contracts.

---

## Scope

Этот план реализует v1 без миграций и без попытки распознавать переименования. Для сложных областей допустимо временно вызвать существующую запись владельца во временный каталог, но решение о том, какие XML-файлы заменить, должно браться из декларативного описания правил, а не из условий в оркестраторе по конкретным типам 1С.

Полный sync через CLI и явный full sync через MCP сохраняются для round-trip и не обновляют `ConfigDumpInfo.xml`.

## File Structure

- Create `packages/core/metadata/appliedObjects/configuration/syncState.ts`
  - read/write `.nkdk-sync.yaml`;
  - sha256 от сырых байтов;
  - сбор файлов для хэширования;
  - diff `added/changed/deleted`;
  - init state от XML через временный YAML.
- Create `packages/core/metadata/appliedObjects/configuration/incrementalPlan.ts`
  - преобразование changed paths в нейтральные области записи;
  - группировка областей;
  - ошибка для неизвестных путей.
- Create `packages/core/metadata/appliedObjects/configuration/incrementalSyncToXML.ts`
  - публичный `syncConfigurationIncrementallyToXML`;
  - вызов точечных операций записи;
  - обновление `.nkdk-sync.yaml` после полного успеха;
  - частичное обновление `ConfigDumpInfo.xml`.
- Create `packages/core/metadata/orchestration/appliedObject/xmlAreas.ts`
  - нейтральные типы `XmlSyncArea`, `XmlSyncAreaDescriptor`;
  - вычисление путей для owner, form, module, help, template, filePath property.
- Modify `packages/core/metadata/orchestration/property/types.ts`
  - добавить необязательное декларативное поле `syncArea`.
- Modify selected `rules.ts`
  - добавить `syncArea` только там, где без него путь нельзя вывести из существующих `filePath`, `childCollections`, `externalMetadata`.
- Modify `packages/core/metadata/orchestration/appliedObject/syncToXML.ts`
  - вынести повторно используемую запись отдельных частей в экспортируемые функции;
  - существующий `syncAppliedObjectToXML` оставить совместимым.
- Modify `packages/core/metadata/appliedObjects/configuration/syncToXML.ts`
  - перестать обновлять `ConfigDumpInfo.xml` в полном режиме;
  - оставить очистку полного sync как сейчас.
- Modify `packages/core/metadata/appliedObjects/configDumpInfo/sync.ts`
  - добавить функцию точечного обновления версий по списку dump-info names;
  - сохранить существующую полную сборку как отдельную утилиту только для внутренних тестов, если нужна.
- Modify `packages/core/index.ts`
  - экспортировать `syncConfigurationIncrementallyToXML`, `initializeXmlSyncState`, типы результата.
- Modify `packages/cli/src/cli.ts`
  - добавить отдельную команду `init-sync-state <xml-dir>`.
- Modify `packages/cli/src/commands/sync.ts`
  - обычный CLI sync: если state есть, вызвать инкрементальный sync; если state нет, вызвать полный sync.
- Create `packages/cli/src/commands/initSyncState.ts`
  - CLI-обёртка над `initializeXmlSyncState`.
- Modify MCP:
  - `packages/mcp/src/contracts/syncToXml.ts`;
  - `packages/mcp/src/services/syncToXml.ts`;
  - `packages/mcp/src/contracts/initSyncState.ts`;
  - `packages/mcp/src/services/initSyncState.ts`;
  - `packages/mcp/src/tools/registerTools.ts`.
- Tests:
  - core state tests;
  - core incremental planning tests;
  - core incremental sync smoke tests on a small fixture;
  - CLI command tests;
  - MCP contract/service/register tests.

## Task 1: Preflight And Invariants

**Files:**
- Read: `.agents/knowledge/metadata/INDEX.md`
- Read: `.agents/knowledge/metadata/sources-of-truth.md`
- Read: `.agents/knowledge/metadata/yaml-contract.md`
- Read: `.agents/knowledge/metadata/round-trip-cycle.md`
- Read: `.agents/architecture-orchestration.md`

- [ ] **Step 1: Read required metadata docs**

Run:

```bash
sed -n '1,260p' .agents/knowledge/metadata/sources-of-truth.md
sed -n '1,260p' .agents/knowledge/metadata/yaml-contract.md
sed -n '1,260p' .agents/knowledge/metadata/round-trip-cycle.md
sed -n '1,260p' .agents/architecture-orchestration.md
```

Expected: docs are readable; no code changes.

- [ ] **Step 2: Create implementation branch or worktree**

Use `superpowers:using-git-worktrees` before code changes. The worktree branch name should be:

```bash
incremental-xml-sync-state
```

Expected: `git status --short` is clean in the implementation worktree before edits.

## Task 2: State File Read, Write, Hash, Diff

**Files:**
- Create: `packages/core/metadata/appliedObjects/configuration/syncState.ts`
- Test: `packages/core/metadata/appliedObjects/configuration/syncState.test.ts`

- [ ] **Step 1: Write failing state tests**

Create `packages/core/metadata/appliedObjects/configuration/syncState.test.ts`:

```ts
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"
import { mkdtempSync } from "fs"
import { afterEach, describe, expect, it } from "vitest"
import {
  diffSyncState,
  hashProjectFiles,
  readXmlSyncState,
  SYNC_STATE_FILE,
  writeXmlSyncState,
} from "./syncState"

describe("xml sync state", () => {
  const dirs: string[] = []

  afterEach(() => {
    for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
  })

  function tempDir(): string {
    const dir = mkdtempSync(join(tmpdir(), "nkdk-sync-state-"))
    dirs.push(dir)
    return dir
  }

  it("writes and reads flat sha256 state", async () => {
    const xmlDir = tempDir()

    await writeXmlSyncState(xmlDir, {
      version: 1,
      files: {
        "Справочник/Товары/Свойства.yaml": "sha256:aaa",
        "Справочник/Товары/Модуль.bsl": "sha256:bbb",
      },
    })

    expect(readFileSync(join(xmlDir, SYNC_STATE_FILE), "utf-8")).toContain("version: 1")
    await expect(readXmlSyncState(xmlDir)).resolves.toEqual({
      version: 1,
      files: {
        "Справочник/Товары/Свойства.yaml": "sha256:aaa",
        "Справочник/Товары/Модуль.bsl": "sha256:bbb",
      },
    })
  })

  it("hashes raw file bytes and ignores directories", async () => {
    const yamlDir = tempDir()
    mkdirSync(join(yamlDir, "Справочник", "Товары"), { recursive: true })
    writeFileSync(join(yamlDir, "Справочник", "Товары", "Свойства.yaml"), "a\n", "utf-8")
    writeFileSync(join(yamlDir, "Справочник", "Товары", "Модуль.bsl"), "b\r\n", "utf-8")

    const hashes = await hashProjectFiles(yamlDir)

    expect(Object.keys(hashes).sort()).toEqual([
      "Справочник/Товары/Модуль.bsl",
      "Справочник/Товары/Свойства.yaml",
    ])
    expect(hashes["Справочник/Товары/Свойства.yaml"]).toMatch(/^sha256:[0-9a-f]{64}$/)
    expect(hashes["Справочник/Товары/Модуль.bsl"]).toMatch(/^sha256:[0-9a-f]{64}$/)
  })

  it("detects added changed and deleted files", () => {
    expect(
      diffSyncState(
        {
          "a.yaml": "sha256:old",
          "deleted.yaml": "sha256:gone",
          "same.yaml": "sha256:same",
        },
        {
          "a.yaml": "sha256:new",
          "added.yaml": "sha256:add",
          "same.yaml": "sha256:same",
        },
      ),
    ).toEqual({
      added: ["added.yaml"],
      changed: ["a.yaml"],
      deleted: ["deleted.yaml"],
    })
  })
})
```

- [ ] **Step 2: Run failing tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/configuration/syncState.test.ts
```

Expected: FAIL because `syncState.ts` does not exist.

- [ ] **Step 3: Implement state module**

Create `packages/core/metadata/appliedObjects/configuration/syncState.ts`:

```ts
import { createHash } from "crypto"
import fs from "fs"
import { join, relative, resolve, sep } from "path"
import YAML from "yaml"

export const SYNC_STATE_FILE = ".nkdk-sync.yaml"

export interface XmlSyncState {
  version: 1
  files: Record<string, string>
}

export interface XmlSyncStateDiff {
  added: string[]
  changed: string[]
  deleted: string[]
}

export async function readXmlSyncState(xmlDir: string): Promise<XmlSyncState | undefined> {
  const path = join(xmlDir, SYNC_STATE_FILE)
  if (!fs.existsSync(path)) return undefined
  const parsed = YAML.parse(await fs.promises.readFile(path, "utf-8")) as unknown
  if (!isXmlSyncState(parsed)) throw new Error(`Некорректный ${SYNC_STATE_FILE}`)
  return { version: 1, files: sortRecord(parsed.files) }
}

export async function writeXmlSyncState(xmlDir: string, state: XmlSyncState): Promise<void> {
  await fs.promises.mkdir(xmlDir, { recursive: true })
  const content = YAML.stringify({ version: 1, files: sortRecord(state.files) })
  await fs.promises.writeFile(join(xmlDir, SYNC_STATE_FILE), content, "utf-8")
}

export async function hashProjectFiles(projectDir: string): Promise<Record<string, string>> {
  const root = resolve(projectDir)
  const files: Record<string, string> = {}
  await collect(root, root, files)
  return sortRecord(files)
}

export function diffSyncState(previous: Record<string, string>, current: Record<string, string>): XmlSyncStateDiff {
  const added: string[] = []
  const changed: string[] = []
  const deleted: string[] = []

  for (const path of Object.keys(current).sort()) {
    if (!(path in previous)) added.push(path)
    else if (previous[path] !== current[path]) changed.push(path)
  }
  for (const path of Object.keys(previous).sort()) {
    if (!(path in current)) deleted.push(path)
  }

  return { added, changed, deleted }
}

async function collect(root: string, currentDir: string, result: Record<string, string>): Promise<void> {
  if (!fs.existsSync(currentDir)) return
  for (const entry of await fs.promises.readdir(currentDir, { withFileTypes: true })) {
    const absPath = join(currentDir, entry.name)
    if (entry.isDirectory()) {
      await collect(root, absPath, result)
      continue
    }
    if (!entry.isFile()) continue
    const rel = relative(root, absPath).split(sep).join("/")
    if (rel === SYNC_STATE_FILE) continue
    result[rel] = `sha256:${createHash("sha256").update(await fs.promises.readFile(absPath)).digest("hex")}`
  }
}

function isXmlSyncState(value: unknown): value is XmlSyncState {
  if (!value || typeof value !== "object") return false
  const record = value as Record<string, unknown>
  if (record.version !== 1) return false
  if (!record.files || typeof record.files !== "object" || Array.isArray(record.files)) return false
  return Object.values(record.files).every((hash) => typeof hash === "string" && /^sha256:[0-9a-f]+$/.test(hash))
}

function sortRecord(input: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(input).sort(([left], [right]) => left.localeCompare(right, "ru")))
}
```

- [ ] **Step 4: Run state tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/configuration/syncState.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/appliedObjects/configuration/syncState.ts packages/core/metadata/appliedObjects/configuration/syncState.test.ts
git commit -m "feat: add xml sync state file"
```

## Task 3: State Initialization From XML

**Files:**
- Modify: `packages/core/metadata/appliedObjects/configuration/syncState.ts`
- Test: `packages/core/metadata/appliedObjects/configuration/syncState.test.ts`
- Modify: `packages/core/index.ts`

- [ ] **Step 1: Add failing init test**

Append to `syncState.test.ts`:

```ts
import type { ConfigurationContextFromXML } from "~/metadata/context/types"
import { initializeXmlSyncState } from "./syncState"

it("initializes state from XML by importing to a temporary YAML directory", async () => {
  const xmlDir = tempDir()
  const tempRoot = tempDir()
  let importedOutputDir = ""

  await initializeXmlSyncState({
    context: { defaultLanguage: "ru", version: "2.20", fromXML: { forReference: false } } satisfies ConfigurationContextFromXML,
    xmlDir,
    createTempDir: async () => join(tempRoot, "yaml"),
    importFromXML: async ({ outputDir }) => {
      importedOutputDir = outputDir
      mkdirSync(join(outputDir, "Справочник", "Товары"), { recursive: true })
      writeFileSync(join(outputDir, "Справочник", "Товары", "Свойства.yaml"), "Наименование: Товары\n", "utf-8")
    },
  })

  expect(importedOutputDir).toBe(join(tempRoot, "yaml"))
  await expect(readXmlSyncState(xmlDir)).resolves.toEqual({
    version: 1,
    files: {
      "Справочник/Товары/Свойства.yaml": expect.stringMatching(/^sha256:[0-9a-f]{64}$/),
    },
  })
})
```

- [ ] **Step 2: Run failing init test**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/configuration/syncState.test.ts
```

Expected: FAIL because `initializeXmlSyncState` is missing.

- [ ] **Step 3: Implement initialization**

Add to `syncState.ts`:

```ts
import { mkdtemp } from "fs/promises"
import { tmpdir } from "os"
import type { ConfigurationContextFromXML } from "~/metadata/context/types"
import { syncConfigurationFromXML } from "./convertFromXML"

export interface InitializeXmlSyncStateParams {
  context: ConfigurationContextFromXML
  xmlDir: string
  createTempDir?: () => Promise<string>
  importFromXML?: (params: { context: ConfigurationContextFromXML; inputDir: string; outputDir: string }) => Promise<unknown>
}

export async function initializeXmlSyncState(params: InitializeXmlSyncStateParams): Promise<XmlSyncState> {
  const createTempDir = params.createTempDir ?? (() => mkdtemp(join(tmpdir(), "nkdk-sync-state-yaml-")))
  const importFromXML = params.importFromXML ?? syncConfigurationFromXML
  const yamlDir = await createTempDir()

  try {
    await importFromXML({ context: params.context, inputDir: params.xmlDir, outputDir: yamlDir })
    const files = await hashProjectFiles(yamlDir)
    const state: XmlSyncState = { version: 1, files }
    await writeXmlSyncState(params.xmlDir, state)
    return state
  } finally {
    await fs.promises.rm(yamlDir, { recursive: true, force: true })
  }
}
```

If imports collide, merge them cleanly instead of duplicating `fs` imports.

- [ ] **Step 4: Export core API**

Modify `packages/core/index.ts`:

```ts
export {
  SYNC_STATE_FILE,
  diffSyncState,
  hashProjectFiles,
  initializeXmlSyncState,
  readXmlSyncState,
  writeXmlSyncState,
  type InitializeXmlSyncStateParams,
  type XmlSyncState,
  type XmlSyncStateDiff,
} from "./metadata/appliedObjects/configuration/syncState"
```

- [ ] **Step 5: Run tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/configuration/syncState.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/appliedObjects/configuration/syncState.ts packages/core/metadata/appliedObjects/configuration/syncState.test.ts packages/core/index.ts
git commit -m "feat: initialize xml sync state from xml"
```

## Task 4: Full Sync Must Not Update ConfigDumpInfo

**Files:**
- Modify: `packages/core/metadata/appliedObjects/configuration/syncToXML.ts`
- Test: `packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts`

- [ ] **Step 1: Add failing full-sync test**

Create or extend `packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts` with a mocked `syncConfigDumpInfoToXML`:

```ts
import { mkdirSync, rmSync, writeFileSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"
import { mkdtempSync } from "fs"
import { afterEach, describe, expect, it, vi } from "vitest"
import { syncConfigurationToXML } from "./syncToXML"

const mocks = vi.hoisted(() => ({
  syncConfigDumpInfoToXML: vi.fn(async () => undefined),
}))

vi.mock("../configDumpInfo/sync", () => ({
  syncConfigDumpInfoToXML: mocks.syncConfigDumpInfoToXML,
}))

describe("syncConfigurationToXML", () => {
  const dirs: string[] = []

  afterEach(() => {
    for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
    vi.clearAllMocks()
  })

  function tempDir(): string {
    const dir = mkdtempSync(join(tmpdir(), "nkdk-full-sync-"))
    dirs.push(dir)
    return dir
  }

  it("does not update ConfigDumpInfo.xml in full sync mode", async () => {
    const yamlDir = tempDir()
    const xmlDir = tempDir()
    mkdirSync(yamlDir, { recursive: true })
    writeFileSync(join(yamlDir, "Конфигурация.yaml"), "Имя: Конфигурация\n", "utf-8")

    await syncConfigurationToXML({
      context: {
        defaultLanguage: "ru",
        version: "2.20",
        exportToYAML: { toTyped: false },
        exportToXML: {
          itemsTree: [],
          configDumpInfo: new Map(),
          version: "2.20",
          context: { forms: [], templates: [], parentName: "", metadataForNumbering: [] },
        },
      },
      inputDir: yamlDir,
      outputDir: xmlDir,
    })

    expect(mocks.syncConfigDumpInfoToXML).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run failing test**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts
```

Expected: FAIL because full sync currently calls `syncConfigDumpInfoToXML`.

- [ ] **Step 3: Remove ConfigDumpInfo update from full sync**

Modify `packages/core/metadata/appliedObjects/configuration/syncToXML.ts`:

```ts
// Remove the await syncConfigDumpInfoToXML call from the successful full-sync branch.
// Keep preserveUnsupportedRootExternalFilesToXML, pruneXmlByManifest,
// normalizeRootExternalDirCasing and writeAppliedMigrationsState.
```

The successful branch should look like:

```ts
if (batchResult.failed.length === 0) {
  try {
    if (referenceDir) {
      await preserveUnsupportedRootExternalFilesToXML({ outputDir, referenceDir, xmlManifest })
    }
  } catch (error) {
    return {
      succeeded: batchResult.succeeded,
      failed: [{ kind: "rootExternalFiles", name: "Ext", error: toError(error) }],
    }
  }

  await pruneXmlByManifest({
    xmlRoot: outputDir,
    xmlDirs: [
      ROOT_EXTERNAL_XML_DIR,
      ...TopLevelMetadataItemRules.flatMap((rule) => (rule.xmlDir ? [rule.xmlDir] : [])),
    ],
    expectedFiles: xmlManifest.expectedFiles(),
  })
  await normalizeRootExternalDirCasing(outputDir)
  if (!hasRootYAML) {
    await fs.promises.rm(join(outputDir, CONFIGURATION_XML_FILE), { force: true })
  }
  writeAppliedMigrationsState(outputDir, {
    applied: [...appliedState.applied, ...migrationResult.appliedFileNames],
  })
}
```

- [ ] **Step 4: Remove unused imports**

Remove unused imports from `syncToXML.ts`:

```ts
import { syncConfigDumpInfoToXML } from "../configDumpInfo/sync"
```

Also remove variables that become unused only because of this change.

- [ ] **Step 5: Run test**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/appliedObjects/configuration/syncToXML.ts packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts
git commit -m "fix: keep full xml sync from updating dump info"
```

## Task 5: Declarative Area Types And Path Resolution

**Files:**
- Create: `packages/core/metadata/orchestration/appliedObject/xmlAreas.ts`
- Modify: `packages/core/metadata/orchestration/property/types.ts`
- Test: `packages/core/metadata/orchestration/appliedObject/xmlAreas.test.ts`

- [ ] **Step 1: Write failing area tests**

Create `xmlAreas.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { MetadataCatalogRules } from "~/metadata/appliedObjects/metadataCatalog/rules"
import { resolveXmlSyncAreaForProjectPath } from "./xmlAreas"

describe("resolveXmlSyncAreaForProjectPath", () => {
  it("maps owner properties yaml to owner xml area", () => {
    expect(resolveXmlSyncAreaForProjectPath("Справочник/Товары/Свойства.yaml", [MetadataCatalogRules])).toEqual({
      kind: "owner",
      itemType: "MetadataCatalog",
      itemTypePrefix: "Справочник",
      itemName: "Товары",
      xmlDir: "Catalogs",
    })
  })

  it("maps form yaml to form xml area", () => {
    expect(resolveXmlSyncAreaForProjectPath("Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml", [MetadataCatalogRules])).toEqual({
      kind: "fileItem",
      itemType: "MetadataCatalog",
      itemTypePrefix: "Справочник",
      itemName: "Товары",
      childKind: "form",
      childName: "ФормаЭлемента",
      xmlDir: "Catalogs",
      xmlBasePath: "Catalogs/Товары/Forms/ФормаЭлемента",
      ownerCompositionChanges: false,
    })
  })

  it("maps form module to form module area", () => {
    expect(resolveXmlSyncAreaForProjectPath("Справочник/Товары/Формы/ФормаЭлемента/Модуль.bsl", [MetadataCatalogRules])).toMatchObject({
      kind: "externalFile",
      itemName: "Товары",
      childName: "ФормаЭлемента",
      xmlPath: "Catalogs/Товары/Forms/ФормаЭлемента/Ext/Form/Module.bsl",
      dumpInfoNames: [
        "Catalog.Товары.Form.ФормаЭлемента",
        "Catalog.Товары.Form.ФормаЭлемента.Form",
      ],
    })
  })

  it("returns undefined for unknown project path", () => {
    expect(resolveXmlSyncAreaForProjectPath("Неизвестно/file.txt", [MetadataCatalogRules])).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run failing tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/orchestration/appliedObject/xmlAreas.test.ts
```

Expected: FAIL because `xmlAreas.ts` does not exist.

- [ ] **Step 3: Add neutral area types**

Create `xmlAreas.ts`:

```ts
import { posix } from "path"
import type { MetadataItemRule, PropertyRule } from "~/metadata/orchestration/property/types"

export type XmlSyncArea =
  | {
      kind: "owner"
      itemType: MetadataItemRule["itemType"]
      itemTypePrefix: string
      itemName: string
      xmlDir: string
    }
  | {
      kind: "fileItem"
      itemType: MetadataItemRule["itemType"]
      itemTypePrefix: string
      itemName: string
      childKind: "form" | "template"
      childName: string
      xmlDir: string
      xmlBasePath: string
      ownerCompositionChanges: boolean
    }
  | {
      kind: "externalFile"
      itemType: MetadataItemRule["itemType"]
      itemTypePrefix: string
      itemName: string
      childKind?: "form" | "template" | "command"
      childName?: string
      xmlDir: string
      xmlPath: string
      deleteParentAreaBeforeWrite?: boolean
      dumpInfoNames: string[]
    }

export type SyncAreaDeclaration =
  | { kind: "objectModule"; yamlFile: string; xmlPath: string }
  | { kind: "formModule"; yamlFile: string; xmlPath: string }
  | { kind: "formHelp"; yamlDir: string; xmlBasePath: string }
  | { kind: "templateContent"; yamlFile: string; xmlPath: string }
  | { kind: "commandModule"; yamlFile: string; xmlPath: string }

const PROPERTIES = "Свойства.yaml"
const FORM = "Форма.yaml"

export function resolveXmlSyncAreaForProjectPath(
  projectPath: string,
  rules: readonly MetadataItemRule[],
): XmlSyncArea | undefined {
  const parts = normalize(projectPath).split("/")
  const rule = rules.find((candidate) => candidate.itemTypePrefix === parts[0] && candidate.xmlDir)
  if (!rule || !rule.itemTypePrefix || !rule.xmlDir || !parts[1]) return undefined
  const itemTypePrefix = rule.itemTypePrefix
  const xmlDir = rule.xmlDir
  const itemName = parts[1]

  if (parts.length === 3 && parts[2] === PROPERTIES) {
    return { kind: "owner", itemType: rule.itemType, itemTypePrefix, itemName, xmlDir }
  }

  if (parts[2] === "Формы" && parts[3]) {
    const formName = parts[3]
    if (parts.length === 5 && parts[4] === FORM) {
      return {
        kind: "fileItem",
        itemType: rule.itemType,
        itemTypePrefix,
        itemName,
        childKind: "form",
        childName: formName,
        xmlDir,
        xmlBasePath: posix.join(xmlDir, itemName, "Forms", formName),
        ownerCompositionChanges: false,
      }
    }
    if (parts.length === 5 && parts[4] === "Модуль.bsl") {
      return {
        kind: "externalFile",
        itemType: rule.itemType,
        itemTypePrefix,
        itemName,
        childKind: "form",
        childName: formName,
        xmlDir,
        xmlPath: posix.join(xmlDir, itemName, "Forms", formName, "Ext", "Form", "Module.bsl"),
        dumpInfoNames: [`${dumpRoot(rule)}.${itemName}.Form.${formName}`, `${dumpRoot(rule)}.${itemName}.Form.${formName}.Form`],
      }
    }
  }

  return resolveDeclaredArea({ rule, itemTypePrefix, itemName, xmlDir, parts })
}

function resolveDeclaredArea(params: {
  rule: MetadataItemRule
  itemTypePrefix: string
  itemName: string
  xmlDir: string
  parts: string[]
}): XmlSyncArea | undefined {
  for (const [, propertyRule] of Object.entries(params.rule.properties) as [string, PropertyRule][]) {
    const declaration = propertyRule.syncArea
    if (!declaration) continue
    if (declaration.kind === "objectModule" && matchesTail(params.parts, declaration.yamlFile)) {
      return {
        kind: "externalFile",
        itemType: params.rule.itemType,
        itemTypePrefix: params.itemTypePrefix,
        itemName: params.itemName,
        xmlDir: params.xmlDir,
        xmlPath: posix.join(params.xmlDir, params.itemName, declaration.xmlPath),
        dumpInfoNames: [`${dumpRoot(params.rule)}.${params.itemName}`, `${dumpRoot(params.rule)}.${params.itemName}.ObjectModule`],
      }
    }
  }
  return undefined
}

function normalize(path: string): string {
  return path.split(/[\\/]+/).filter(Boolean).join("/")
}

function matchesTail(parts: string[], tail: string): boolean {
  return parts.slice(2).join("/") === normalize(tail)
}

function dumpRoot(rule: MetadataItemRule): string {
  const external = rule.externalMetadata
  if (external?.segment) return external.segment
  if (rule.itemType === "MetadataCatalog") return "Catalog"
  return String(rule.itemType).replace(/^Metadata/, "")
}
```

- [ ] **Step 4: Add `syncArea` to property types**

Modify `packages/core/metadata/orchestration/property/types.ts`:

```ts
import type { SyncAreaDeclaration } from "~/metadata/orchestration/appliedObject/xmlAreas"
```

Add to `BasePropertyRule`:

```ts
  /** Декларативная подсказка для инкрементального XML sync: какой YAML-файл пишет какую XML-область. */
  syncArea?: SyncAreaDeclaration
```

- [ ] **Step 5: Run area tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/orchestration/appliedObject/xmlAreas.test.ts
```

Expected: PASS after fixing type-only import cycles if TypeScript reports one.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/orchestration/appliedObject/xmlAreas.ts packages/core/metadata/orchestration/appliedObject/xmlAreas.test.ts packages/core/metadata/orchestration/property/types.ts
git commit -m "feat: describe incremental xml sync areas"
```

## Task 6: Incremental Plan From State Diff

**Files:**
- Create: `packages/core/metadata/appliedObjects/configuration/incrementalPlan.ts`
- Test: `packages/core/metadata/appliedObjects/configuration/incrementalPlan.test.ts`

- [ ] **Step 1: Write failing incremental plan tests**

Create `incrementalPlan.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { MetadataCatalogRules } from "../metadataCatalog/rules"
import { buildIncrementalXmlSyncPlan } from "./incrementalPlan"

describe("buildIncrementalXmlSyncPlan", () => {
  it("groups duplicate areas and marks Configuration.xml when owner set changes", () => {
    const plan = buildIncrementalXmlSyncPlan({
      diff: {
        added: ["Справочник/Товары/Формы/НоваяФорма/Форма.yaml"],
        changed: ["Справочник/Товары/Свойства.yaml", "Справочник/Товары/Свойства.yaml"],
        deleted: [],
      },
      rules: [MetadataCatalogRules],
    })

    expect(plan.rebuildConfigurationXml).toBe(true)
    expect(plan.areas.map((area) => area.key).sort()).toEqual([
      "fileItem:Справочник/Товары/form/НоваяФорма",
      "owner:Справочник/Товары",
    ])
  })

  it("throws when a deleted path cannot be resolved by rules", () => {
    expect(() =>
      buildIncrementalXmlSyncPlan({
        diff: { added: [], changed: [], deleted: ["x/y/z.txt"] },
        rules: [MetadataCatalogRules],
      }),
    ).toThrow('Нет правила инкрементальной XML-синхронизации для "x/y/z.txt"')
  })
})
```

- [ ] **Step 2: Run failing tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/configuration/incrementalPlan.test.ts
```

Expected: FAIL because module does not exist.

- [ ] **Step 3: Implement incremental plan**

Create `incrementalPlan.ts`:

```ts
import type { MetadataItemRule } from "~/metadata/orchestration/property/types"
import { resolveXmlSyncAreaForProjectPath, type XmlSyncArea } from "~/metadata/orchestration/appliedObject/xmlAreas"
import type { XmlSyncStateDiff } from "./syncState"

export interface PlannedXmlSyncArea {
  key: string
  area: XmlSyncArea
  changedPaths: string[]
}

export interface IncrementalXmlSyncPlan {
  areas: PlannedXmlSyncArea[]
  rebuildConfigurationXml: boolean
}

export function buildIncrementalXmlSyncPlan(params: {
  diff: XmlSyncStateDiff
  rules: readonly MetadataItemRule[]
}): IncrementalXmlSyncPlan {
  const grouped = new Map<string, PlannedXmlSyncArea>()
  const changedPaths = [...params.diff.added, ...params.diff.changed, ...params.diff.deleted]

  for (const path of changedPaths) {
    const area = resolveXmlSyncAreaForProjectPath(path, params.rules)
    if (!area) throw new Error(`Нет правила инкрементальной XML-синхронизации для "${path}"`)
    const key = areaKey(area)
    const existing = grouped.get(key)
    if (existing) existing.changedPaths.push(path)
    else grouped.set(key, { key, area, changedPaths: [path] })
  }

  const areas = [...grouped.values()].sort((left, right) => left.key.localeCompare(right.key, "ru"))
  return {
    areas,
    rebuildConfigurationXml: areas.some((item) => item.area.kind === "owner" || item.area.ownerCompositionChanges),
  }
}

export function areaKey(area: XmlSyncArea): string {
  if (area.kind === "owner") return `owner:${area.itemTypePrefix}/${area.itemName}`
  if (area.kind === "fileItem") return `fileItem:${area.itemTypePrefix}/${area.itemName}/${area.childKind}/${area.childName}`
  return `externalFile:${area.xmlPath}`
}
```

- [ ] **Step 4: Run tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/configuration/incrementalPlan.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/appliedObjects/configuration/incrementalPlan.ts packages/core/metadata/appliedObjects/configuration/incrementalPlan.test.ts
git commit -m "feat: plan incremental xml sync areas"
```

## Task 7: Partial XML Writers

**Files:**
- Modify: `packages/core/metadata/orchestration/appliedObject/syncToXML.ts`
- Test: existing `packages/core/metadata/appliedObjects/*/syncToXML.test.ts`
- Test: `packages/core/metadata/orchestration/appliedObject/syncToXML.partial.test.ts`

- [ ] **Step 1: Add partial writer tests**

Create `packages/core/metadata/orchestration/appliedObject/syncToXML.partial.test.ts` with tests that call the new exports on a small catalog/data processor fixture:

```ts
import { existsSync, rmSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"
import { mkdtempSync } from "fs"
import { afterEach, describe, expect, it } from "vitest"
import { MetadataDataProcessorRules } from "~/metadata/appliedObjects/metadataDataProcessor/rules"
import { syncAppliedObjectAreaToXML } from "./syncToXML"

describe("syncAppliedObjectAreaToXML", () => {
  const dirs: string[] = []

  afterEach(() => {
    for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
  })

  function tempDir(): string {
    const dir = mkdtempSync(join(tmpdir(), "nkdk-partial-xml-"))
    dirs.push(dir)
    return dir
  }

  it("writes only owner area when requested", async () => {
    const inputDir = "packages/core/metadata/appliedObjects/metadataDataProcessor/__fixtures__/sync/yaml"
    const outputDir = tempDir()

    await syncAppliedObjectAreaToXML({
      area: { kind: "owner" },
      rule: MetadataDataProcessorRules,
      context: {
        defaultLanguage: "ru",
        version: "2.20",
        exportToYAML: { toTyped: false },
        exportToXML: {
          itemsTree: [],
          configDumpInfo: new Map(),
          version: "2.20",
          context: { forms: [], templates: [], parentName: "", metadataForNumbering: [] },
        },
      },
      inputDir,
      name: "ОбработкаВсеСвойства",
      outputDir,
      externalOutputDir: join(outputDir, "ОбработкаВсеСвойства"),
      referenceDir: "packages/core/metadata/appliedObjects/metadataDataProcessor/__fixtures__/sync/xml",
      externalReferenceDir: "packages/core/metadata/appliedObjects/metadataDataProcessor/__fixtures__/sync/xml/ОбработкаВсеСвойства",
    })

    expect(existsSync(join(outputDir, "ОбработкаВсеСвойства.xml"))).toBe(true)
    expect(existsSync(join(outputDir, "ОбработкаВсеСвойства", "Ext", "ObjectModule.bsl"))).toBe(false)
  })
})
```

- [ ] **Step 2: Run failing partial tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/orchestration/appliedObject/syncToXML.partial.test.ts
```

Expected: FAIL because `syncAppliedObjectAreaToXML` is missing.

- [ ] **Step 3: Refactor existing writer**

Modify `syncToXML.ts` so `syncAppliedObjectToXML` builds a reusable `PreparedAppliedObjectForXML` and calls area writers. Export:

```ts
export type AppliedObjectXmlAreaRequest =
  | { kind: "owner" }
  | { kind: "all" }

export async function syncAppliedObjectAreaToXML(params: Omit<Parameters<typeof syncAppliedObjectToXML>[0], "xmlManifest"> & {
  area: AppliedObjectXmlAreaRequest
  xmlManifest?: XmlWriteManifest
}): Promise<void> {
  if (params.area.kind === "all") return syncAppliedObjectToXML(params)

  const prepared = await prepareAppliedObjectForXML(params)
  if (!prepared) return
  await writeAppliedObjectOwnerXML(prepared)
}
```

Keep `syncAppliedObjectToXML` behavior by making it:

```ts
export const syncAppliedObjectToXML = async (params: SyncAppliedObjectToXMLParams): Promise<void> => {
  const prepared = await prepareAppliedObjectForXML(params)
  if (!prepared) return
  await writeAppliedObjectOwnerXML(prepared)
  await writeAppliedObjectExternalFilesXML(prepared)
  await writeAppliedObjectFilePathPropertiesXML(prepared)
}
```

Use the existing code bodies for `writeAppliedObjectOwnerXML`, `writeAppliedObjectExternalFilesXML` and `writeAppliedObjectFilePathPropertiesXML`. Do not change XML output in this task.

- [ ] **Step 4: Run partial and existing sync tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/orchestration/appliedObject/syncToXML.partial.test.ts packages/core/metadata/appliedObjects/metadataDataProcessor/syncToXML.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/orchestration/appliedObject/syncToXML.ts packages/core/metadata/orchestration/appliedObject/syncToXML.partial.test.ts
git commit -m "refactor: expose partial applied object xml writers"
```

## Task 8: Incremental Sync Core

**Files:**
- Create: `packages/core/metadata/appliedObjects/configuration/incrementalSyncToXML.ts`
- Test: `packages/core/metadata/appliedObjects/configuration/incrementalSyncToXML.test.ts`
- Modify: `packages/core/index.ts`

- [ ] **Step 1: Write failing incremental sync tests**

Create `incrementalSyncToXML.test.ts`:

```ts
import { existsSync, mkdirSync, rmSync, writeFileSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"
import { mkdtempSync } from "fs"
import { afterEach, describe, expect, it } from "vitest"
import { syncConfigurationIncrementallyToXML } from "./incrementalSyncToXML"
import { readXmlSyncState, writeXmlSyncState } from "./syncState"

describe("syncConfigurationIncrementallyToXML", () => {
  const dirs: string[] = []

  afterEach(() => {
    for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
  })

  function tempDir(): string {
    const dir = mkdtempSync(join(tmpdir(), "nkdk-incremental-sync-"))
    dirs.push(dir)
    return dir
  }

  it("returns an error when state is missing", async () => {
    const result = await syncConfigurationIncrementallyToXML({
      context: baseContext(),
      inputDir: tempDir(),
      outputDir: tempDir(),
    })

    expect(result.failed[0]?.error.message).toContain(".nkdk-sync.yaml")
  })

  it("updates state without writing XML when there are no changes", async () => {
    const yamlDir = tempDir()
    const xmlDir = tempDir()
    mkdirSync(join(yamlDir, "Справочник", "Товары"), { recursive: true })
    writeFileSync(join(yamlDir, "Справочник", "Товары", "Свойства.yaml"), "Имя: Товары\n", "utf-8")
    const current = await import("./syncState").then((m) => m.hashProjectFiles(yamlDir))
    await writeXmlSyncState(xmlDir, { version: 1, files: current })

    const result = await syncConfigurationIncrementallyToXML({
      context: baseContext(),
      inputDir: yamlDir,
      outputDir: xmlDir,
    })

    expect(result.failed).toEqual([])
    expect(result.succeeded).toBe(0)
    await expect(readXmlSyncState(xmlDir)).resolves.toEqual({ version: 1, files: current })
    expect(existsSync(join(xmlDir, "Catalogs"))).toBe(false)
  })
})

function baseContext() {
  return {
    defaultLanguage: "ru" as const,
    version: "2.20" as const,
    exportToYAML: { toTyped: false as const },
    exportToXML: {
      itemsTree: [],
      configDumpInfo: new Map(),
      version: "2.20" as const,
      context: { forms: [], templates: [], parentName: "", metadataForNumbering: [] },
    },
  }
}
```

- [ ] **Step 2: Run failing tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/configuration/incrementalSyncToXML.test.ts
```

Expected: FAIL because module does not exist.

- [ ] **Step 3: Implement initial incremental sync**

Create `incrementalSyncToXML.ts`:

```ts
import fs from "fs"
import { join } from "path"
import type { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { syncAppliedObjectAreaToXML } from "~/metadata/orchestration/appliedObject/syncToXML"
import { ConfigurationSyncResult } from "./convertFromXML"
import { buildIncrementalXmlSyncPlan } from "./incrementalPlan"
import { TopLevelMetadataItemRules } from "./topLevelRules"
import { diffSyncState, hashProjectFiles, readXmlSyncState, SYNC_STATE_FILE, writeXmlSyncState } from "./syncState"
import { writeConfigurationToXML, readConfigurationFromYAML } from "./rootIO"
import { buildConfigurationChildObjects, readConfigurationChildObjectsFromXML } from "./childObjects"

export async function syncConfigurationIncrementallyToXML(params: {
  context: ConfigurationContextWithExportToXML
  inputDir: string
  outputDir: string
  referenceDir?: string
}): Promise<ConfigurationSyncResult> {
  const previousState = await readXmlSyncState(params.outputDir)
  if (!previousState) {
    return {
      succeeded: 0,
      failed: [{ kind: "syncState", name: SYNC_STATE_FILE, error: new Error(`Файл ${SYNC_STATE_FILE} не найден`) }],
    }
  }

  const currentFiles = await hashProjectFiles(params.inputDir)
  const diff = diffSyncState(previousState.files, currentFiles)
  if (diff.added.length === 0 && diff.changed.length === 0 && diff.deleted.length === 0) {
    return { succeeded: 0, failed: [] }
  }

  let plan
  try {
    plan = buildIncrementalXmlSyncPlan({ diff, rules: TopLevelMetadataItemRules })
  } catch (error) {
    return {
      succeeded: 0,
      failed: [{ kind: "incrementalPlan", name: "changed paths", error: toError(error) }],
    }
  }

  try {
    if (plan.rebuildConfigurationXml) {
      await writeConfigurationArea(params)
    }

    for (const planned of plan.areas) {
      if (planned.area.kind !== "owner") continue
      const rule = TopLevelMetadataItemRules.find((candidate) => candidate.itemType === planned.area.itemType)
      if (!rule || !rule.itemTypePrefix || !rule.xmlDir) throw new Error(`Не найдено правило для ${planned.key}`)
      await syncAppliedObjectAreaToXML({
        area: { kind: "owner" },
        rule,
        context: { ...params.context, exportToXML: { ...params.context.exportToXML } },
        inputDir: join(params.inputDir, rule.itemTypePrefix),
        name: planned.area.itemName,
        outputDir: join(params.outputDir, rule.xmlDir),
        externalOutputDir: join(params.outputDir, rule.xmlDir, planned.area.itemName),
        referenceDir: params.referenceDir ? join(params.referenceDir, rule.xmlDir) : join(params.outputDir, rule.xmlDir),
        externalReferenceDir: params.referenceDir
          ? join(params.referenceDir, rule.xmlDir, planned.area.itemName)
          : join(params.outputDir, rule.xmlDir, planned.area.itemName),
      })
    }

    await writeXmlSyncState(params.outputDir, { version: 1, files: currentFiles })
    return { succeeded: plan.areas.length, failed: [] }
  } catch (error) {
    return {
      succeeded: 0,
      failed: [{ kind: "incrementalSync", name: "XML", error: toError(error) }],
    }
  }
}

async function writeConfigurationArea(params: {
  context: ConfigurationContextWithExportToXML
  inputDir: string
  outputDir: string
  referenceDir?: string
}): Promise<void> {
  const rootPath = join(params.inputDir, "Конфигурация.yaml")
  if (!fs.existsSync(rootPath)) return
  const referenceChildObjects = params.referenceDir ? readConfigurationChildObjectsFromXML(params.referenceDir) : undefined
  const configuration = readConfigurationFromYAML({ context: params.context, inputDir: params.inputDir })
  writeConfigurationToXML({
    context: params.context,
    configuration,
    outputDir: params.outputDir,
    childObjects: buildConfigurationChildObjects({ yamlDir: params.inputDir, referenceChildObjects }),
  })
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error))
}
```

This first implementation only supports owner areas. Later tasks add external files, file items, deletion and `ConfigDumpInfo.xml`.

- [ ] **Step 4: Export API**

Modify `packages/core/index.ts`:

```ts
export { syncConfigurationIncrementallyToXML } from "./metadata/appliedObjects/configuration/incrementalSyncToXML"
```

- [ ] **Step 5: Run tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/configuration/incrementalSyncToXML.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/appliedObjects/configuration/incrementalSyncToXML.ts packages/core/metadata/appliedObjects/configuration/incrementalSyncToXML.test.ts packages/core/index.ts
git commit -m "feat: add incremental xml sync entrypoint"
```

## Task 9: External Areas, Deletes, And Known File Cleanup

**Files:**
- Modify: `packages/core/metadata/appliedObjects/configuration/incrementalSyncToXML.ts`
- Modify: `packages/core/metadata/orchestration/appliedObject/xmlAreas.ts`
- Modify: selected metadata `rules.ts`
- Tests:
  - `packages/core/metadata/appliedObjects/configuration/incrementalSyncToXML.test.ts`
  - `packages/core/metadata/orchestration/appliedObject/xmlAreas.test.ts`

- [ ] **Step 1: Add tests for external file path examples**

Extend `xmlAreas.test.ts` with:

```ts
it("maps object module through declarative rule", () => {
  expect(resolveXmlSyncAreaForProjectPath("Справочник/Товары/МодульОбъекта.bsl", [MetadataCatalogRules])).toMatchObject({
    kind: "externalFile",
    xmlPath: "Catalogs/Товары/Ext/ObjectModule.bsl",
    dumpInfoNames: ["Catalog.Товары", "Catalog.Товары.ObjectModule"],
  })
})
```

- [ ] **Step 2: Add `syncArea` declarations to module rules**

In rules with object modules, add declarations like:

```ts
objectModule: {
  yaml: "МодульОбъекта",
  type: "Module",
  syncExternalOnly: true,
  syncArea: { kind: "objectModule", yamlFile: "МодульОбъекта.bsl", xmlPath: "Ext/ObjectModule.bsl" },
}
```

Use the existing property keys and YAML names in each rule; do not rename YAML files.

- [ ] **Step 3: Implement external file replacement**

First extend `syncAppliedObjectAreaToXML` from Task 7 with an external-file request:

```ts
export type AppliedObjectXmlAreaRequest =
  | { kind: "owner" }
  | { kind: "all" }
  | { kind: "externalFile"; xmlPath: string }
```

Inside `syncAppliedObjectAreaToXML`, after `prepareAppliedObjectForXML(params)`:

```ts
if (params.area.kind === "externalFile") {
  const prepared = await prepareAppliedObjectForXML(params)
  if (!prepared) return
  await writeAppliedObjectExternalFilesXML(prepared, { onlyXmlPath: params.area.xmlPath })
  await writeAppliedObjectFilePathPropertiesXML(prepared, { onlyXmlPath: params.area.xmlPath })
  return
}
```

Change `writeAppliedObjectExternalFilesXML` and `writeAppliedObjectFilePathPropertiesXML` to accept:

```ts
type XmlPathFilter = { onlyXmlPath?: string }
```

When a writer is about to write an XML path, skip it if the normalized path relative to the XML root does not equal `onlyXmlPath`.

Then in `incrementalSyncToXML.ts`, add handling for `area.kind === "externalFile"`:

```ts
if (planned.area.kind === "externalFile") {
  const rule = TopLevelMetadataItemRules.find((candidate) => candidate.itemType === planned.area.itemType)
  if (!rule || !rule.itemTypePrefix || !rule.xmlDir) throw new Error(`Не найдено правило для ${planned.key}`)
  await fs.promises.rm(join(params.outputDir, planned.area.xmlPath), { force: true })
  await syncAppliedObjectAreaToXML({
    area: { kind: "externalFile", xmlPath: planned.area.xmlPath },
    rule,
    context: { ...params.context, exportToXML: { ...params.context.exportToXML } },
    inputDir: join(params.inputDir, rule.itemTypePrefix),
    name: planned.area.itemName,
    outputDir: join(params.outputDir, rule.xmlDir),
    externalOutputDir: join(params.outputDir, rule.xmlDir, planned.area.itemName),
    referenceDir: params.referenceDir ? join(params.referenceDir, rule.xmlDir) : join(params.outputDir, rule.xmlDir),
    externalReferenceDir: params.referenceDir
      ? join(params.referenceDir, rule.xmlDir, planned.area.itemName)
      : join(params.outputDir, rule.xmlDir, planned.area.itemName),
  })
}
```

- [ ] **Step 4: Implement delete behavior**

For deleted paths:

```ts
const deleted = new Set(diff.deleted)
```

When every changed path for an external file is deleted, remove only the known output path:

```ts
await fs.promises.rm(join(params.outputDir, planned.area.xmlPath), { force: true })
```

When a file item properties file is deleted, remove the known XML area:

```ts
await fs.promises.rm(join(params.outputDir, planned.area.xmlBasePath + ".xml"), { force: true })
await fs.promises.rm(join(params.outputDir, planned.area.xmlBasePath), { recursive: true, force: true })
```

- [ ] **Step 5: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/orchestration/appliedObject/xmlAreas.test.ts packages/core/metadata/appliedObjects/configuration/incrementalSyncToXML.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/orchestration/appliedObject/xmlAreas.ts packages/core/metadata/orchestration/appliedObject/xmlAreas.test.ts packages/core/metadata/appliedObjects/configuration/incrementalSyncToXML.ts packages/core/metadata/appliedObjects/configuration/incrementalSyncToXML.test.ts packages/core/metadata/appliedObjects/*/rules.ts
git commit -m "feat: replace incremental external xml areas"
```

## Task 10: Incremental ConfigDumpInfo Update

**Files:**
- Modify: `packages/core/metadata/appliedObjects/configDumpInfo/sync.ts`
- Test: `packages/core/metadata/appliedObjects/configDumpInfo/sync.test.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/incrementalSyncToXML.ts`

- [ ] **Step 1: Add failing dump-info partial update test**

Create `configDumpInfo/sync.test.ts` or extend it:

```ts
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"
import { mkdtempSync } from "fs"
import { afterEach, describe, expect, it } from "vitest"
import { updateConfigDumpInfoVersionsToXML } from "./sync"

describe("updateConfigDumpInfoVersionsToXML", () => {
  const dirs: string[] = []

  afterEach(() => {
    for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
  })

  function tempDir(): string {
    const dir = mkdtempSync(join(tmpdir(), "nkdk-dump-info-"))
    dirs.push(dir)
    return dir
  }

  it("changes only requested configVersion entries", async () => {
    const xmlDir = tempDir()
    mkdirSync(xmlDir, { recursive: true })
    writeFileSync(
      join(xmlDir, "ConfigDumpInfo.xml"),
      `<?xml version="1.0" encoding="UTF-8"?>
<ConfigDumpInfo xmlns="http://v8.1c.ru/8.3/xcf/dumpinfo">
  <ConfigVersions>
    <Metadata name="Catalog.Товары" id="owner" configVersion="old-owner"/>
    <Metadata name="Catalog.Товары.ObjectModule" id="owner.0" configVersion="old-module"/>
    <Metadata name="Language.Русский" id="lang" configVersion="old-lang"/>
  </ConfigVersions>
</ConfigDumpInfo>`,
      "utf-8",
    )

    await updateConfigDumpInfoVersionsToXML({
      context: { defaultLanguage: "ru", version: "2.20" },
      outputDir: xmlDir,
      names: ["Catalog.Товары.ObjectModule"],
      generateVersion: () => "new-version",
    })

    const result = readFileSync(join(xmlDir, "ConfigDumpInfo.xml"), "utf-8")
    expect(result).toContain('name="Catalog.Товары" id="owner" configVersion="old-owner"')
    expect(result).toContain('name="Catalog.Товары.ObjectModule" id="owner.0" configVersion="new-version"')
    expect(result).toContain('name="Language.Русский" id="lang" configVersion="old-lang"')
  })
})
```

- [ ] **Step 2: Run failing test**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/configDumpInfo/sync.test.ts
```

Expected: FAIL because `updateConfigDumpInfoVersionsToXML` is missing.

- [ ] **Step 3: Implement partial dump-info update**

Add to `configDumpInfo/sync.ts`:

```ts
export async function updateConfigDumpInfoVersionsToXML(params: {
  context: ConfigurationContext
  outputDir: string
  names: readonly string[]
  generateVersion?: () => string
}): Promise<void> {
  const path = join(params.outputDir, CONFIG_DUMP_INFO_FILE)
  if (!fs.existsSync(path) || params.names.length === 0) return
  const source = await fs.promises.readFile(path, "utf-8")
  const validation = XMLValidator.validate(source)
  if (validation !== true) throw new Error(`Некорректный ConfigDumpInfo.xml: ${validation.err.msg}`)
  const parsed = importContentFromXML<{ ConfigDumpInfo: ConfigDumpInfoXML }>(source)
  const idMap = importConfigDumpInfoFromXML({ context: params.context, xml: parsed.ConfigDumpInfo })
  const names = new Set(params.names)
  for (const [name, entry] of idMap) {
    if (names.has(name)) entry.configVersion = (params.generateVersion ?? generateConfigVersion)()
  }
  const xml = exportConfigDumpInfoToXML({ context: params.context, idMap })
  await fs.promises.writeFile(path, preserveReferenceLineEndings(xmlExport({ ConfigDumpInfo: xml }), source), "utf-8")
}

function generateConfigVersion(): string {
  return `${crypto.randomUUID().replace(/-/g, "")}00000000`
}
```

Add `import crypto from "crypto"` or `import { randomUUID } from "crypto"` consistently.

- [ ] **Step 4: Call from incremental sync**

In `incrementalSyncToXML.ts`, collect dump names:

```ts
const dumpInfoNames = new Set<string>()
for (const planned of plan.areas) {
  if (planned.area.kind === "externalFile") {
    for (const name of planned.area.dumpInfoNames) dumpInfoNames.add(name)
  }
}
```

After all XML writes succeed and before `writeXmlSyncState`, call:

```ts
await updateConfigDumpInfoVersionsToXML({
  context: params.context,
  outputDir: params.outputDir,
  names: [...dumpInfoNames],
})
```

- [ ] **Step 5: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/configDumpInfo/sync.test.ts packages/core/metadata/appliedObjects/configuration/incrementalSyncToXML.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/appliedObjects/configDumpInfo/sync.ts packages/core/metadata/appliedObjects/configDumpInfo/sync.test.ts packages/core/metadata/appliedObjects/configuration/incrementalSyncToXML.ts
git commit -m "feat: update dump info for incremental sync"
```

## Task 11: CLI Commands

**Files:**
- Create: `packages/cli/src/commands/initSyncState.ts`
- Modify: `packages/cli/src/commands/sync.ts`
- Modify: `packages/cli/src/cli.ts`
- Test: `packages/cli/src/commands/sync.test.ts`
- Test: `packages/cli/src/commands/initSyncState.test.ts`

- [ ] **Step 1: Update CLI command tests**

Modify `sync.test.ts` mock:

```ts
const mocks = vi.hoisted(() => ({
  syncConfigurationToXML: vi.fn(async () => ({ succeeded: 0, failed: [] })),
  syncConfigurationIncrementallyToXML: vi.fn(async () => ({ succeeded: 0, failed: [] })),
  readXmlSyncState: vi.fn(async () => undefined),
}))

vi.mock("@nakidka/core", () => ({
  syncConfigurationToXML: mocks.syncConfigurationToXML,
  syncConfigurationIncrementallyToXML: mocks.syncConfigurationIncrementallyToXML,
  readXmlSyncState: mocks.readXmlSyncState,
}))
```

Add tests:

```ts
it("uses full sync when state file is missing", async () => {
  vi.spyOn(process.stdout, "write").mockImplementation(() => true)
  vi.spyOn(process.stderr, "write").mockImplementation(() => true)
  mocks.readXmlSyncState.mockResolvedValueOnce(undefined)

  await syncConfiguration("yaml", "xml")

  expect(mocks.syncConfigurationToXML).toHaveBeenCalled()
  expect(mocks.syncConfigurationIncrementallyToXML).not.toHaveBeenCalled()
})

it("uses incremental sync when state file exists", async () => {
  vi.spyOn(process.stdout, "write").mockImplementation(() => true)
  vi.spyOn(process.stderr, "write").mockImplementation(() => true)
  mocks.readXmlSyncState.mockResolvedValueOnce({ version: 1, files: {} })

  await syncConfiguration("yaml", "xml")

  expect(mocks.syncConfigurationIncrementallyToXML).toHaveBeenCalled()
  expect(mocks.syncConfigurationToXML).not.toHaveBeenCalled()
})
```

- [ ] **Step 2: Add init command test**

Create `initSyncState.test.ts`:

```ts
import { initializeXmlSyncState } from "@nakidka/core"
import { afterEach, describe, expect, it, vi } from "vitest"
import { initSyncState } from "./initSyncState"

const mocks = vi.hoisted(() => ({
  initializeXmlSyncState: vi.fn(async () => ({ version: 1, files: { "a.yaml": "sha256:aaa" } })),
}))

vi.mock("@nakidka/core", () => ({
  initializeXmlSyncState: mocks.initializeXmlSyncState,
}))

describe("init sync state command", () => {
  afterEach(() => vi.restoreAllMocks())

  it("initializes state from xml", async () => {
    vi.spyOn(process.stdout, "write").mockImplementation(() => true)

    await initSyncState("xml")

    expect(initializeXmlSyncState).toHaveBeenCalledWith(expect.objectContaining({ xmlDir: "xml" }))
    expect(process.stdout.write).toHaveBeenCalledWith("Готово: .nkdk-sync.yaml обновлён, файлов: 1\n")
  })
})
```

- [ ] **Step 3: Implement CLI init command**

Create `initSyncState.ts`:

```ts
import { initializeXmlSyncState } from "@nakidka/core"

export async function initSyncState(xmlDir: string): Promise<void> {
  const state = await initializeXmlSyncState({
    context: { defaultLanguage: "ru", version: "2.20", fromXML: { forReference: false } },
    xmlDir,
  })
  process.stdout.write(`Готово: .nkdk-sync.yaml обновлён, файлов: ${Object.keys(state.files).length}\n`)
}
```

- [ ] **Step 4: Switch CLI sync by state presence**

Modify `sync.ts`:

```ts
import { readXmlSyncState, syncConfigurationIncrementallyToXML, syncConfigurationToXML } from "@nakidka/core"
```

Replace the sync call with:

```ts
const hasState = (await readXmlSyncState(xmlDir)) !== undefined
const result = hasState
  ? await syncConfigurationIncrementallyToXML({
      context,
      inputDir: yamlDir,
      outputDir: xmlDir,
      ...(options.referenceDir ? { referenceDir: options.referenceDir } : {}),
    })
  : await syncConfigurationToXML({
      context,
      inputDir: yamlDir,
      outputDir: xmlDir,
      ...(options.referenceDir ? { referenceDir: options.referenceDir } : {}),
    })
```

- [ ] **Step 5: Register CLI command**

Modify `cli.ts`:

```ts
import { initSyncState } from "./commands/initSyncState"
```

Add command:

```ts
program
  .command("init-sync-state")
  .description("Инициализировать .nkdk-sync.yaml по текущей XML-выгрузке")
  .argument("<xml-dir>", "путь к каталогу XML-выгрузки")
  .action((xmlDir: string) => {
    run(() => initSyncState(xmlDir), options)
  })
```

- [ ] **Step 6: Run CLI tests**

Run:

```bash
pnpm --filter @nakidka/cli exec vitest run packages/cli/src/commands/sync.test.ts packages/cli/src/commands/initSyncState.test.ts packages/cli/src/cli.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/cli/src/commands/initSyncState.ts packages/cli/src/commands/initSyncState.test.ts packages/cli/src/commands/sync.ts packages/cli/src/commands/sync.test.ts packages/cli/src/cli.ts
git commit -m "feat: add cli sync state initialization"
```

## Task 12: MCP Init Tool And Sync Behavior

**Files:**
- Create: `packages/mcp/src/contracts/initSyncState.ts`
- Create: `packages/mcp/src/services/initSyncState.ts`
- Modify: `packages/mcp/src/contracts/syncToXml.ts`
- Modify: `packages/mcp/src/services/syncToXml.ts`
- Modify: `packages/mcp/src/tools/registerTools.ts`
- Tests:
  - `packages/mcp/src/services/initSyncState.test.ts`
  - `packages/mcp/src/services/syncToXml.test.ts`
  - `packages/mcp/src/tools/registerTools.test.ts`

- [ ] **Step 1: Add MCP init contract**

Create `contracts/initSyncState.ts`:

```ts
import { z } from "zod/v4"
import { toolErrorOutputShape } from "./common"

export const initSyncStateInputShape = {
  xmlDir: z.string().min(1),
  allowWrite: z.boolean().optional(),
}

export const initSyncStateSuccessOutputShape = {
  ok: z.literal(true),
  files: z.number(),
}

export const initSyncStateOutputShape = z.union([
  z.object(initSyncStateSuccessOutputShape),
  z.object(toolErrorOutputShape),
])

export type InitSyncStateInput = z.infer<z.ZodObject<typeof initSyncStateInputShape>>
```

- [ ] **Step 2: Add MCP init service test**

Create `services/initSyncState.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest"
import { initSyncState } from "./initSyncState"

describe("initSyncState", () => {
  it("requires write confirmation", async () => {
    await expect(initSyncState({ xmlDir: "xml" }, {} as never)).resolves.toMatchObject({
      ok: false,
      code: "confirmation_required",
    })
  })

  it("initializes state when allowWrite is true", async () => {
    const deps = {
      initializeXmlSyncState: vi.fn(async () => ({ version: 1, files: { "a.yaml": "sha256:aaa" } })),
    }

    await expect(initSyncState({ xmlDir: "xml", allowWrite: true }, deps)).resolves.toEqual({
      ok: true,
      files: 1,
    })
  })
})
```

- [ ] **Step 3: Implement MCP init service**

Create `services/initSyncState.ts`:

```ts
import { loadCoreApi } from "../coreApi"
import { errorMessage, toolError, toolSuccess, type ToolPayload } from "../contracts/common"
import type { InitSyncStateInput } from "../contracts/initSyncState"

interface InitSyncStateDeps {
  initializeXmlSyncState: (params: {
    context: { defaultLanguage: "ru"; version: "2.20"; fromXML: { forReference: false } }
    xmlDir: string
  }) => Promise<{ version: 1; files: Record<string, string> }>
}

export type InitSyncStatePayload = ToolPayload<{ files: number }>

export async function initSyncState(input: InitSyncStateInput, deps?: InitSyncStateDeps): Promise<InitSyncStatePayload> {
  if (input.allowWrite !== true) {
    return toolError("confirmation_required", "init_sync_state пишет .nkdk-sync.yaml; повторите вызов с allowWrite=true", {
      xmlDir: input.xmlDir,
    })
  }

  try {
    const core = deps ?? (await loadCoreApi())
    const state = await core.initializeXmlSyncState({
      context: { defaultLanguage: "ru", version: "2.20", fromXML: { forReference: false } },
      xmlDir: input.xmlDir,
    })
    return toolSuccess({ files: Object.keys(state.files).length })
  } catch (caught) {
    return toolError("core_error", errorMessage(caught))
  }
}
```

- [ ] **Step 4: Change MCP sync behavior**

Update `services/syncToXml.ts` dependencies:

```ts
readXmlSyncState: (xmlDir: string) => Promise<{ version: 1; files: Record<string, string> } | undefined>
syncConfigurationIncrementallyToXML: SyncToXmlDeps["syncConfigurationToXML"]
syncConfigurationToXML: SyncToXmlDeps["syncConfigurationToXML"]
```

Before sync:

```ts
const hasState = (await core.readXmlSyncState(input.xmlDir)) !== undefined
if (!hasState && input.fullSync !== true) {
  return toolError(
    "sync_state_required",
    "Для MCP sync_to_xml нужен .nkdk-sync.yaml. Вызовите nkdk.init_sync_state для XML-каталога или явно передайте fullSync=true.",
    { xmlDir: input.xmlDir },
  )
}
```

Then choose:

```ts
const sync = input.fullSync === true ? core.syncConfigurationToXML : core.syncConfigurationIncrementallyToXML
const result = await sync({
  context: {
    defaultLanguage: "ru",
    version: "2.20",
    exportToYAML: { toTyped: false },
    exportToXML: {
      itemsTree: [],
      configDumpInfo: new Map(),
      version: "2.20",
      context: {
        forms: [],
        templates: [],
        parentName: "",
        metadataForNumbering: [],
      },
    },
  },
  inputDir: input.yamlDir,
  outputDir: input.xmlDir,
  referenceDir,
})
```

- [ ] **Step 5: Add `fullSync` to MCP contract**

Modify `contracts/syncToXml.ts`:

```ts
fullSync: z.boolean().optional(),
```

- [ ] **Step 6: Register MCP tool**

Modify `tools/registerTools.ts` imports and registration:

```ts
import { initSyncStateInputShape } from "../contracts/initSyncState"
import { initSyncState } from "../services/initSyncState"
```

Add:

```ts
server.registerTool(
  "nkdk.init_sync_state",
  {
    title: "Initialize NKDK XML sync state",
    description: "Создаёт .nkdk-sync.yaml по текущей XML-выгрузке. Пишет файл только при allowWrite=true.",
    inputSchema: initSyncStateInputShape,
  },
  async (input) => jsonToolResult(await initSyncState(input)),
)
```

- [ ] **Step 7: Run MCP tests**

Run:

```bash
pnpm --filter @nakidka/mcp exec vitest run packages/mcp/src/services/initSyncState.test.ts packages/mcp/src/services/syncToXml.test.ts packages/mcp/src/tools/registerTools.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/mcp/src/contracts/initSyncState.ts packages/mcp/src/services/initSyncState.ts packages/mcp/src/services/initSyncState.test.ts packages/mcp/src/contracts/syncToXml.ts packages/mcp/src/services/syncToXml.ts packages/mcp/src/services/syncToXml.test.ts packages/mcp/src/tools/registerTools.ts packages/mcp/src/tools/registerTools.test.ts
git commit -m "feat: add mcp sync state initialization"
```

## Task 13: End-To-End Verification

**Files:**
- Modify tests only if failures expose a real mismatch with the agreed spec.

- [ ] **Step 1: Type check affected packages**

Run:

```bash
pnpm --filter @nakidka/core type-check
pnpm --filter @nakidka/cli type-check
pnpm --filter @nakidka/mcp type-check
```

Expected: all commands exit `0`.

- [ ] **Step 2: Run focused test suite**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/configuration/syncState.test.ts packages/core/metadata/appliedObjects/configuration/incrementalPlan.test.ts packages/core/metadata/appliedObjects/configuration/incrementalSyncToXML.test.ts packages/core/metadata/orchestration/appliedObject/xmlAreas.test.ts packages/core/metadata/appliedObjects/configDumpInfo/sync.test.ts
pnpm --filter @nakidka/cli exec vitest run packages/cli/src/commands/sync.test.ts packages/cli/src/commands/initSyncState.test.ts packages/cli/src/cli.test.ts
pnpm --filter @nakidka/mcp exec vitest run packages/mcp/src/services/initSyncState.test.ts packages/mcp/src/services/syncToXml.test.ts packages/mcp/src/tools/registerTools.test.ts
```

Expected: all focused tests pass.

- [ ] **Step 3: Run full project tests**

Run:

```bash
pnpm test
```

Expected: all package tests pass.

- [ ] **Step 4: Manual CLI smoke**

Use a temporary copy of an existing fixture or a small XML project:

```bash
pnpm --filter @nakidka/cli exec nkdk init-sync-state /path/to/xml
pnpm --filter @nakidka/cli exec nkdk sync /path/to/yaml /path/to/xml
```

Expected:
- first command writes `/path/to/xml/.nkdk-sync.yaml`;
- second command uses incremental sync when state exists;
- if no YAML files changed, XML files are not rewritten and result says `0 успешно, 0 с ошибкой`.

- [ ] **Step 5: Commit final adjustments**

If verification required test or implementation edits, stage only the files shown by `git status --short` that belong to this feature and commit them:

```bash
git status --short
git add docs/superpowers/plans/2026-06-27-incremental-xml-sync-state-implementation.md
git commit -m "test: cover incremental xml sync state"
```

Replace the `git add` path above with the actual files edited during verification. Skip this commit if Step 1-4 required no edits after Task 12.

## Self-Review Checklist

- [ ] `.nkdk-sync.yaml` хранится в XML-каталоге and is flat: `version`, `files`.
- [ ] Хэши считаются от сырых байтов YAML/resource files.
- [ ] CLI without state uses full sync.
- [ ] MCP without state returns `sync_state_required`, unless `fullSync=true`.
- [ ] Init state imports XML to temp YAML before hashing.
- [ ] Full sync does not update `ConfigDumpInfo.xml`.
- [ ] Incremental sync updates state only after all XML writes and dump-info updates succeed.
- [ ] Unknown paths from state diff fail with a clear error.
- [ ] No XML paths are stored in `.nkdk-sync.yaml`.
- [ ] `orchestration` has neutral area contracts only; concrete ConfigDumpInfo names are resolved outside generic writer code or via declarative metadata.
- [ ] `pnpm test` passes before marking implementation done.
