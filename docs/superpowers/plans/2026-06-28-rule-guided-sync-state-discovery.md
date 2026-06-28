# Rule-Guided Sync State Discovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `.nkdk-sync.yaml` index only rule-described metadata project files and hash them in a bounded parallel pool.

**Architecture:** Add a focused project-file collector that derives candidate paths from `metadataProjectSpecs`, rule resources, and existing metadata project conventions instead of walking the whole YAML tree. Keep `syncState.ts` responsible for hashing, state validation, and state I/O; it consumes collected candidates, sorts them, and hashes existing files with `p-limit`.

**Tech Stack:** TypeScript, Vitest, Node fs APIs, `p-limit`, `@node-rs/xxhash`, existing metadata project rules.

---

## File Structure

- Create `packages/core/metadata/project/syncStateFiles.ts`: collects relative YAML project file paths that may participate in sync state.
- Create `packages/core/metadata/project/syncStateFiles.test.ts`: focused tests for rule-guided collection.
- Modify `packages/core/metadata/appliedObjects/configuration/syncState.ts`: use collected candidates and bounded parallel hashing.
- Modify `packages/core/metadata/appliedObjects/configuration/syncState.test.ts`: update behavior tests from full-tree walk to rule-guided indexing and hash concurrency.
- Modify `packages/core/metadata/appliedObjects/configuration/incrementalSyncToXML.test.ts`: adjust expectations only if the rule-guided state changes fixture coverage.
- Review `packages/core/metadata/project/directoryStructure.ts`, `packages/core/metadata/project/specs.ts`, and `packages/core/metadata/project/ruleResources.ts`: reuse their contracts, do not duplicate top-level metadata type lists.

## Task 1: Add Failing Tests For Rule-Guided Candidate Collection

**Files:**
- Create: `packages/core/metadata/project/syncStateFiles.test.ts`
- Create later in Task 2: `packages/core/metadata/project/syncStateFiles.ts`

- [ ] **Step 1: Read required metadata guidance before core metadata changes**

Run:

```bash
sed -n '1,220p' .agents/knowledge/metadata/INDEX.md
sed -n '1,220p' .agents/knowledge/metadata/sources-of-truth.md
sed -n '1,260p' .agents/knowledge/metadata/yaml-contract.md
sed -n '1,240p' .agents/knowledge/metadata/round-trip-cycle.md
```

Expected: review the rules; do not modify XML fixtures.

- [ ] **Step 2: Add the failing collector test file**

Create `packages/core/metadata/project/syncStateFiles.test.ts`:

```ts
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { dirname, join } from "path"
import { afterEach, describe, expect, it } from "vitest"
import { collectSyncStateFilePaths } from "./syncStateFiles"

describe("collectSyncStateFilePaths", () => {
  const dirs: string[] = []

  afterEach(() => {
    for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
  })

  function tempDir(): string {
    const dir = mkdtempSync(join(tmpdir(), "nkdk-sync-state-files-"))
    dirs.push(dir)
    return dir
  }

  function writeProjectFile(projectDir: string, projectPath: string, content = ""): void {
    const filePath = join(projectDir, ...projectPath.split("/"))
    mkdirSync(dirname(filePath), { recursive: true })
    writeFileSync(filePath, content, "utf-8")
  }

  it("collects rule-described metadata files and skips unknown files", async () => {
    const projectDir = tempDir()

    writeProjectFile(projectDir, "Конфигурация.yaml", "Имя: Тест\n")
    writeProjectFile(projectDir, "Справочник/Товары/Свойства.yaml", "Имя: Товары\n")
    writeProjectFile(projectDir, "Справочник/Товары/МодульОбъекта.bsl", "Процедура Проверка()\nКонецПроцедуры\n")
    writeProjectFile(projectDir, "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml", "Имя: ФормаЭлемента\n")
    writeProjectFile(projectDir, "Справочник/Товары/Формы/ФормаЭлемента/Модуль.bsl", "Процедура Проверка()\nКонецПроцедуры\n")
    writeProjectFile(projectDir, "Справочник/Товары/Справка/ru.html", "<html>help</html>\n")
    writeProjectFile(projectDir, "Справочник/Товары/unknown.tmp", "noise\n")
    writeProjectFile(projectDir, "Миграции/2026-05-05-143000.yaml", "ignored\n")

    await expect(collectSyncStateFilePaths(projectDir)).resolves.toEqual([
      "Конфигурация.yaml",
      "Справочник/Товары/МодульОбъекта.bsl",
      "Справочник/Товары/Свойства.yaml",
      "Справочник/Товары/Справка/ru.html",
      "Справочник/Товары/Формы/ФормаЭлемента/Модуль.bsl",
      "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml",
    ])
  })

  it("collects nested subsystem properties without walking unrelated roots", async () => {
    const projectDir = tempDir()

    writeProjectFile(projectDir, "Подсистема/Продажи/Свойства.yaml", "Имя: Продажи\n")
    writeProjectFile(projectDir, "Подсистема/Продажи/Подсистемы/Розница/Свойства.yaml", "Имя: Розница\n")
    writeProjectFile(projectDir, "ПроизвольныйКаталог/Файл.yaml", "ignored\n")

    await expect(collectSyncStateFilePaths(projectDir)).resolves.toEqual([
      "Подсистема/Продажи/Подсистемы/Розница/Свойства.yaml",
      "Подсистема/Продажи/Свойства.yaml",
    ])
  })
})
```

- [ ] **Step 3: Run the new collector tests and verify RED**

Run:

```bash
pnpm exec vitest run --no-isolate --sequence.shuffle metadata/project/syncStateFiles.test.ts
```

from `packages/core`.

Expected: FAIL because `./syncStateFiles` does not exist.

## Task 2: Implement Rule-Guided Candidate Collection

**Files:**
- Create: `packages/core/metadata/project/syncStateFiles.ts`
No barrel export is needed for `packages/core/metadata/project/syncStateFiles.ts`; `syncState.ts` imports it by direct project path.

- [ ] **Step 1: Create `syncStateFiles.ts`**

Create `packages/core/metadata/project/syncStateFiles.ts`:

```ts
import fs from "fs"
import { join } from "path"
import { CONFIGURATION_YAML_FILE } from "~/metadata/appliedObjects/configuration/rootIO"
import type { PropertyRule } from "~/metadata/orchestration/property/types"
import { describeMetadataRuleResources } from "./ruleResources"
import type { MetadataProjectSpec } from "./specs"
import { metadataProjectSpecs } from "./specs"

const PROPERTIES_YAML = "Свойства.yaml"
const FORMS_DIR = "Формы"
const FORM_YAML = "Форма.yaml"
const FORM_MODULE = "Модуль.bsl"
const CHILD_SUBSYSTEMS_DIR = "Подсистемы"
const SUBSYSTEM_DIR = "Подсистема"

export async function collectSyncStateFilePaths(projectDir: string): Promise<string[]> {
  const result = new Set<string>()

  await addFileIfExists(result, projectDir, CONFIGURATION_YAML_FILE)

  for (const spec of metadataProjectSpecs) {
    await collectSpecFiles(result, projectDir, spec)
  }

  return [...result].sort((left, right) => left.localeCompare(right, "ru"))
}

async function collectSpecFiles(result: Set<string>, projectDir: string, spec: MetadataProjectSpec): Promise<void> {
  const kindDir = join(projectDir, spec.dir)
  if (!(await isDirectory(kindDir))) return

  for (const entry of await fs.promises.readdir(kindDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    await collectObjectFiles(result, projectDir, spec, `${spec.dir}/${entry.name}`)
  }
}

async function collectObjectFiles(
  result: Set<string>,
  projectDir: string,
  spec: MetadataProjectSpec,
  objectPath: string,
): Promise<void> {
  await addFileIfExists(result, projectDir, `${objectPath}/${PROPERTIES_YAML}`)
  await collectForms(result, projectDir, objectPath)
  await collectDeclaredRuleResources(result, projectDir, spec, objectPath)

  if (objectPath.startsWith(`${SUBSYSTEM_DIR}/`)) {
    await collectNestedSubsystems(result, projectDir, objectPath)
  }
}

async function collectForms(result: Set<string>, projectDir: string, objectPath: string): Promise<void> {
  const formsDir = join(projectDir, ...objectPath.split("/"), FORMS_DIR)
  if (!(await isDirectory(formsDir))) return

  for (const entry of await fs.promises.readdir(formsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const formPath = `${objectPath}/${FORMS_DIR}/${entry.name}`
    await addFileIfExists(result, projectDir, `${formPath}/${FORM_YAML}`)
    await addFileIfExists(result, projectDir, `${formPath}/${FORM_MODULE}`)
  }
}

async function collectDeclaredRuleResources(
  result: Set<string>,
  projectDir: string,
  spec: MetadataProjectSpec,
  objectPath: string,
): Promise<void> {
  for (const resource of describeMetadataRuleResources(spec.rule)) {
    if (resource.kind === "asset") {
      await collectDirectoryFiles(result, projectDir, `${objectPath}/${resource.nkdkDir}`)
    }
  }

  for (const propertyRule of Object.values(spec.rule.properties) as PropertyRule[]) {
    const syncArea = propertyRule.syncArea
    if (syncArea?.kind === "objectModule") {
      await addFileIfExists(result, projectDir, `${objectPath}/${syncArea.yamlFile}`)
    }

    if ("nkdkDir" in propertyRule && typeof propertyRule.nkdkDir === "string") {
      await collectDirectoryFiles(result, projectDir, `${objectPath}/${propertyRule.nkdkDir}`)
    }

    if ("nkdkPath" in propertyRule && typeof propertyRule.nkdkPath === "string") {
      await addFileIfExists(result, projectDir, `${objectPath}/${propertyRule.nkdkPath}`)
    }
  }
}

async function collectDirectoryFiles(result: Set<string>, projectDir: string, projectPath: string): Promise<void> {
  const absPath = join(projectDir, ...projectPath.split("/"))
  if (!(await isDirectory(absPath))) return

  for (const entry of await fs.promises.readdir(absPath, { withFileTypes: true })) {
    const childPath = `${projectPath}/${entry.name}`
    if (entry.isDirectory()) {
      await collectDirectoryFiles(result, projectDir, childPath)
    } else if (entry.isFile()) {
      result.add(childPath)
    }
  }
}

async function collectNestedSubsystems(result: Set<string>, projectDir: string, objectPath: string): Promise<void> {
  const childRoot = `${objectPath}/${CHILD_SUBSYSTEMS_DIR}`
  const childRootAbs = join(projectDir, ...childRoot.split("/"))
  if (!(await isDirectory(childRootAbs))) return

  for (const entry of await fs.promises.readdir(childRootAbs, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const childPath = `${childRoot}/${entry.name}`
    await addFileIfExists(result, projectDir, `${childPath}/${PROPERTIES_YAML}`)
    await collectNestedSubsystems(result, projectDir, childPath)
  }
}

async function addFileIfExists(result: Set<string>, projectDir: string, projectPath: string): Promise<void> {
  if (await isFile(join(projectDir, ...projectPath.split("/")))) result.add(projectPath)
}

async function isDirectory(path: string): Promise<boolean> {
  try {
    return (await fs.promises.stat(path)).isDirectory()
  } catch (caught) {
    if (isNotFoundError(caught)) return false
    throw caught
  }
}

async function isFile(path: string): Promise<boolean> {
  try {
    return (await fs.promises.stat(path)).isFile()
  } catch (caught) {
    if (isNotFoundError(caught)) return false
    throw caught
  }
}

function isNotFoundError(caught: unknown): boolean {
  return typeof caught === "object" && caught !== null && "code" in caught && caught.code === "ENOENT"
}
```

- [ ] **Step 2: Run collector tests and verify GREEN**

Run from `packages/core`:

```bash
pnpm exec vitest run --no-isolate --sequence.shuffle metadata/project/syncStateFiles.test.ts
```

Expected: PASS, 2 tests.

- [ ] **Step 3: Commit collector**

Run:

```bash
git add packages/core/metadata/project/syncStateFiles.ts packages/core/metadata/project/syncStateFiles.test.ts
git commit -m "feat: :sparkles: добавить сбор файлов sync state"
```

Expected: commit succeeds.

## Task 3: Wire Collector Into Hashing With Parallel Reads

**Files:**
- Modify: `packages/core/metadata/appliedObjects/configuration/syncState.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/syncState.test.ts`

- [ ] **Step 1: Update imports and public options**

In `syncState.ts`, replace:

```ts
import { join, relative, resolve, sep } from "path"
import { xxh3 } from "@node-rs/xxhash"
import YAML from "yaml"
```

with:

```ts
import { join, resolve } from "path"
import { xxh3 } from "@node-rs/xxhash"
import pLimit from "p-limit"
import YAML from "yaml"
import { collectSyncStateFilePaths } from "~/metadata/project/syncStateFiles"
```

Then add:

```ts
const DEFAULT_HASH_CONCURRENCY = 16

export interface HashProjectFilesOptions {
  concurrency?: number
}
```

- [ ] **Step 2: Add a test that unknown project files are not hashed**

In `syncState.test.ts`, replace `it("hashes raw file bytes and ignores directories", ...)` and `it("ignores service metadata files", ...)` with one rule-guided test:

```ts
  it("hashes only rule-guided project files", async () => {
    const yamlDir = tempDir()
    mkdirSync(join(yamlDir, "Справочник", "Товары", "Формы", "ФормаЭлемента"), { recursive: true })
    mkdirSync(join(yamlDir, "Миграции"), { recursive: true })
    writeFileSync(join(yamlDir, "Конфигурация.yaml"), "Имя: Тест\n", "utf-8")
    writeFileSync(join(yamlDir, "Справочник", "Товары", "Свойства.yaml"), "a\n", "utf-8")
    writeFileSync(join(yamlDir, "Справочник", "Товары", "МодульОбъекта.bsl"), "b\r\n", "utf-8")
    writeFileSync(join(yamlDir, "Справочник", "Товары", "Формы", "ФормаЭлемента", "Форма.yaml"), "Имя: ФормаЭлемента\n", "utf-8")
    mkdirSync(join(yamlDir, "Справочник", "Товары", "Справка"), { recursive: true })
    writeFileSync(join(yamlDir, "Справочник", "Товары", "Справка", "ru.html"), "<html>help</html>\n", "utf-8")
    writeFileSync(join(yamlDir, "Справочник", "Товары", "unknown.tmp"), "noise\n", "utf-8")
    writeFileSync(join(yamlDir, "Миграции", "2026-05-05-143000.yaml"), "ignored\n", "utf-8")

    const hashes = await hashProjectFiles(yamlDir, { concurrency: 2 })

    expect(Object.keys(hashes)).toEqual([
      "Конфигурация.yaml",
      "Справочник/Товары/МодульОбъекта.bsl",
      "Справочник/Товары/Свойства.yaml",
      "Справочник/Товары/Справка/ru.html",
      "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml",
    ])
    expect(hashes["Справочник/Товары/Свойства.yaml"]).toMatch(/^xxh3-64:[0-9a-f]{16}$/)
  })
```

- [ ] **Step 3: Add a test that invalid concurrency is rejected**

Add after the rule-guided hash test:

```ts
  it("rejects invalid hash concurrency", async () => {
    await expect(hashProjectFiles(tempDir(), { concurrency: 0 })).rejects.toThrow("concurrency")
  })
```

- [ ] **Step 4: Run syncState tests and verify RED**

Run from `packages/core`:

```bash
pnpm exec vitest run --no-isolate --sequence.shuffle metadata/appliedObjects/configuration/syncState.test.ts
```

Expected: FAIL because `hashProjectFiles` does not accept options and still walks unknown files.

- [ ] **Step 5: Replace `hashProjectFiles` implementation**

In `syncState.ts`, replace:

```ts
export async function hashProjectFiles(projectDir: string): Promise<Record<string, string>> {
  const root = resolve(projectDir)
  const files: Record<string, string> = {}
  await collectProjectFileHashes(root, root, files)
  return sortRecord(files)
}
```

with:

```ts
export async function hashProjectFiles(
  projectDir: string,
  options: HashProjectFilesOptions = {},
): Promise<Record<string, string>> {
  const root = resolve(projectDir)
  const concurrency = normalizeHashConcurrency(options.concurrency)
  const limit = pLimit(concurrency)
  const paths = await collectSyncStateFilePaths(root)

  const entries = await Promise.all(
    paths.map((projectPath) =>
      limit(async () => {
        const absPath = join(root, ...projectPath.split("/"))
        if (!fs.existsSync(absPath)) return undefined
        const hash = xxh3.xxh64(await fs.promises.readFile(absPath))
        return [projectPath, `xxh3-64:${hash.toString(16).padStart(16, "0")}`] as const
      }),
    ),
  )

  return sortRecord(Object.fromEntries(entries.filter((entry): entry is readonly [string, string] => entry !== undefined)))
}
```

- [ ] **Step 6: Remove recursive full-tree collector and add concurrency normalization**

Delete `collectProjectFileHashes(...)` from `syncState.ts`.

Add before `isXmlSyncState(...)`:

```ts
function normalizeHashConcurrency(value: number | undefined): number {
  if (value === undefined) return DEFAULT_HASH_CONCURRENCY
  if (!Number.isInteger(value) || value < 1) throw new Error("hash concurrency must be a positive integer")
  return value
}
```

- [ ] **Step 7: Run syncState tests and verify GREEN**

Run from `packages/core`:

```bash
pnpm exec vitest run --no-isolate --sequence.shuffle metadata/appliedObjects/configuration/syncState.test.ts
```

Expected: PASS.

## Task 4: Pass Optional Hash Concurrency Through Initialization

**Files:**
- Modify: `packages/core/metadata/appliedObjects/configuration/syncState.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/syncState.test.ts`

- [ ] **Step 1: Extend initialization params**

In `syncState.ts`, change:

```ts
export interface InitializeXmlSyncStateParams {
  yamlDir: string
  xmlDir: string
}
```

to:

```ts
export interface InitializeXmlSyncStateParams {
  yamlDir: string
  xmlDir: string
  hashConcurrency?: number
}
```

- [ ] **Step 2: Pass concurrency to hashing**

In `initializeXmlSyncState`, replace:

```ts
const files = await hashProjectFiles(params.yamlDir)
```

with:

```ts
const files = await hashProjectFiles(params.yamlDir, { concurrency: params.hashConcurrency })
```

- [ ] **Step 3: Add a focused initialization test**

In `syncState.test.ts`, after `initializes state from an existing YAML directory`, add:

```ts
  it("passes hash concurrency during initialization", async () => {
    const xmlDir = tempDir()
    const yamlDir = tempDir()
    mkdirSync(join(yamlDir, "Справочник", "Товары"), { recursive: true })
    writeFileSync(join(yamlDir, "Справочник", "Товары", "Свойства.yaml"), "Наименование: Товары\n", "utf-8")

    await initializeXmlSyncState({ yamlDir, xmlDir, hashConcurrency: 1 })

    await expect(readXmlSyncState(xmlDir)).resolves.toEqual({
      version: 1,
      files: {
        "Справочник/Товары/Свойства.yaml": expect.stringMatching(/^xxh3-64:[0-9a-f]{16}$/),
      },
    })
  })
```

- [ ] **Step 4: Run core sync-state tests**

Run from `packages/core`:

```bash
pnpm exec vitest run --no-isolate --sequence.shuffle metadata/appliedObjects/configuration/syncState.test.ts metadata/project/syncStateFiles.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit hashing integration**

Run:

```bash
git add packages/core/metadata/appliedObjects/configuration/syncState.ts packages/core/metadata/appliedObjects/configuration/syncState.test.ts
git commit -m "perf: :zap: ускорить хеширование sync state"
```

Expected: commit succeeds.

## Task 5: Verify Incremental Sync And Package Boundaries

**Files:**
- Review: `packages/core/metadata/appliedObjects/configuration/incrementalSyncToXML.test.ts`
- Review: `packages/cli/src/commands/initSyncState.ts`
- Review: `packages/mcp/src/coreApi.ts`
- Review: `packages/mcp/src/services/initSyncState.ts`

- [ ] **Step 1: Search for stale assumptions**

Run:

```bash
rg "hashProjectFiles\\(|initializeXmlSyncState\\(|sha256:|Миграции" packages/core packages/cli packages/mcp
```

Expected: `sha256:` only appears in the rejection test; `Миграции` references may appear in migration tests but not in sync-state expected files.

- [ ] **Step 2: Run focused incremental sync test**

Run from `packages/core`:

```bash
pnpm exec vitest run --no-isolate --sequence.shuffle metadata/appliedObjects/configuration/incrementalSyncToXML.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run focused CLI/MCP tests**

Run:

```bash
cd packages/cli && pnpm exec vitest run --passWithNoTests src/commands/initSyncState.test.ts
cd ../mcp && pnpm exec vitest run --passWithNoTests src/services/initSyncState.test.ts
```

Expected: both PASS.

- [ ] **Step 4: Commit boundary updates if any files changed**

If only tests ran and no files changed, skip this step. If files changed, run:

```bash
git add packages/core/metadata/appliedObjects/configuration/incrementalSyncToXML.test.ts packages/cli/src/commands/initSyncState.ts packages/mcp/src/coreApi.ts packages/mcp/src/services/initSyncState.ts
git commit -m "test: :white_check_mark: закрепить rule-guided sync state"
```

Expected: commit succeeds only when there are staged changes.

## Task 6: Type Checks, Full Tests, And ERP Timing

**Files:**
- External output: `/Users/nikita/git/round-trip/erp/.nkdk-sync.yaml`

- [ ] **Step 1: Run type checks and builds**

Run from repo root:

```bash
pnpm --filter @nakidka/core type-check
pnpm --filter @nakidka/cli build
pnpm --filter @nakidka/mcp type-check
```

Expected: all PASS.

- [ ] **Step 2: Run focused tests**

Run:

```bash
cd packages/core && pnpm exec vitest run --no-isolate --sequence.shuffle metadata/project/syncStateFiles.test.ts metadata/appliedObjects/configuration/syncState.test.ts metadata/appliedObjects/configuration/incrementalSyncToXML.test.ts
cd ../cli && pnpm exec vitest run --passWithNoTests src/commands/initSyncState.test.ts
cd ../mcp && pnpm exec vitest run --passWithNoTests src/services/initSyncState.test.ts
```

Expected: all PASS.

- [ ] **Step 3: Rebuild ERP sync state with timing**

Run from repo root:

```bash
/usr/bin/time -p pnpm --filter @nakidka/cli dev -- init-sync-state /Users/nikita/git/nkdk-yaml /Users/nikita/git/round-trip/erp
```

Expected:

```text
Файл .nkdk-sync.yaml обновлён
real <number less than the previous 99.63s baseline>
user <number>
sys <number>
```

- [ ] **Step 4: Verify generated state content**

Run:

```bash
sed -n '1,8p' /Users/nikita/git/round-trip/erp/.nkdk-sync.yaml
rg "sha256:" /Users/nikita/git/round-trip/erp/.nkdk-sync.yaml
rg "^  Миграции/" /Users/nikita/git/round-trip/erp/.nkdk-sync.yaml
rg -m 5 "xxh3-64:" /Users/nikita/git/round-trip/erp/.nkdk-sync.yaml
```

Expected: first command shows `version: 1` and `files:`; `sha256:` and `Миграции/` searches have no output; `xxh3-64:` search shows entries.

- [ ] **Step 5: Run full project tests**

Run from repo root:

```bash
pnpm test
```

Expected: PASS across core, CLI, and MCP. If the first full run times out in unrelated schema tests, re-run once without other local load and report both attempts.

- [ ] **Step 6: Report final result**

Include:

- commits created;
- ERP timing before and after;
- confirmation that state is `xxh3-64`;
- confirmation that migrations are absent from state;
- whether `pnpm test` passed.
