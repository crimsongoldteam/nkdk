# XML Change Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove full XML tree diffing from `sync` and keep `changedXmlFiles` only for incremental sync through operation tracking.

**Architecture:** Full sync stops importing and calling `snapshotXmlTree`/`diffXmlTree`, so it never reads the generated XML tree just to report changes. Incremental sync uses a small `XmlChangeTracker` wrapper around the existing `XmlWriteManifest`: sync writers still register expected files through `addFile`, while the tracker records `added`/`changed` before the write and `deleted` before removals. The report is an action log, not byte-for-byte diff.

**Tech Stack:** TypeScript, Node.js `fs`, Vitest, existing `@nakidka/core` metadata sync code.

## Global Constraints

- Do not use `git` inside core.
- Do not keep a hash/content diff fallback.
- Full sync must not return `changedXmlFiles`.
- Incremental sync must still return `changedXmlFiles`.
- `changed` means a file was overwritten, even when new contents equal old contents.
- Keep existing XML fixtures unchanged.
- Prefer existing rules and metadata contracts over new object-specific conditions.

---

## File Structure

- Modify `packages/core/metadata/appliedObjects/configuration/syncToXML.ts`: remove full sync snapshot/diff calls and stop returning `changedXmlFiles`.
- Create `packages/core/metadata/appliedObjects/configuration/xmlChangeTracker.ts`: implement operation-based `XmlChangeTracker`.
- Create `packages/core/metadata/appliedObjects/configuration/xmlChangeTracker.test.ts`: unit-test add/change/delete tracking and sorting.
- Modify `packages/core/metadata/appliedObjects/configuration/incrementalSyncToXML.ts`: use `XmlChangeTracker`, record removes explicitly, return tracker changes.
- Modify `packages/core/metadata/appliedObjects/configuration/incrementalSyncToXML.test.ts`: assert rewritten same-content files are reported as `changed`.
- Modify `packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts`: remove full sync changed-file assertions, add `changedXmlFiles` absent assertion on successful full sync with migrations.
- Delete `packages/core/metadata/operations/xmlChanges.ts`: remove old full tree snapshot/diff implementation.
- Modify `packages/core/metadata/operations/index.ts`: remove `xmlChanges` export if present.
- Modify `packages/cli/src/commands/sync.test.ts`: keep incremental print test and add full sync no-print test.

### Task 1: Full Sync Stops Reporting XML Diffs

**Files:**
- Modify: `packages/core/metadata/appliedObjects/configuration/syncToXML.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts`

**Interfaces:**
- Consumes: existing `syncConfigurationToXML(params): Promise<ConfigurationSyncResult>`
- Produces: successful full sync result with `changedXmlFiles === undefined`

- [ ] **Step 1: Write the failing test**

In `packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts`, in the existing migration test that currently asserts `Catalogs/Номенклатура.xml` is added, replace that assertion with:

```ts
expect(syncResult.changedXmlFiles).toBeUndefined()
```

Keep the existing assertions for `failed`, `migrationsApplied`, `.nakidka-migrations.yaml`, generated XML, and `ConfigDumpInfo.xml`.

- [ ] **Step 2: Run the focused test to verify it fails**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/configuration/syncToXML.test.ts -t "применяет миграции"
```

Expected: FAIL because `syncConfigurationToXML` still returns `changedXmlFiles`.

- [ ] **Step 3: Remove full sync snapshot/diff calls**

In `packages/core/metadata/appliedObjects/configuration/syncToXML.ts`, change the operations import from:

```ts
import {
  diffXmlTree,
  prepareMetadataMigrationChain,
  snapshotXmlTree,
  type MigrationChainInvalidResult,
  type MigrationPlanItem,
  type PreparedMetadataMigrationChain,
} from "../../operations"
```

to:

```ts
import {
  prepareMetadataMigrationChain,
  type MigrationChainInvalidResult,
  type MigrationPlanItem,
  type PreparedMetadataMigrationChain,
} from "../../operations"
```

Remove this line:

```ts
const xmlBefore = await snapshotXmlTree(outputDir)
```

Remove this line after pruning/normalization:

```ts
const changedXmlFiles = await diffXmlTree(outputDir, xmlBefore)
```

Return without `changedXmlFiles`:

```ts
return {
  succeeded: batchResult.succeeded,
  failed: [],
  migrationsApplied: migrationChain.migrationsToApply,
}
```

- [ ] **Step 4: Run the focused test to verify it passes**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/configuration/syncToXML.test.ts -t "применяет миграции"
```

Expected: PASS.

- [ ] **Step 5: Run all full sync tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/configuration/syncToXML.test.ts
```

Expected: PASS.

### Task 2: Operation-Based XmlChangeTracker

**Files:**
- Create: `packages/core/metadata/appliedObjects/configuration/xmlChangeTracker.ts`
- Create: `packages/core/metadata/appliedObjects/configuration/xmlChangeTracker.test.ts`

**Interfaces:**
- Produces:

```ts
export interface XmlChangeTracker {
  readonly manifest: XmlWriteManifest
  markWrite(absPath: string): Promise<void>
  markDelete(absPath: string): Promise<void>
  changedFiles(): MetadataOperationChangedXmlFile[]
}

export function createXmlChangeTracker(rootDir: string): XmlChangeTracker
```

- [ ] **Step 1: Write failing unit tests**

Create `packages/core/metadata/appliedObjects/configuration/xmlChangeTracker.test.ts`:

```ts
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { afterEach, describe, expect, it } from "vitest"
import { createXmlChangeTracker } from "./xmlChangeTracker"

describe("XmlChangeTracker", () => {
  const dirs: string[] = []

  afterEach(() => {
    for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
  })

  function tempDir(): string {
    const dir = mkdtempSync(join(tmpdir(), "nkdk-xml-change-tracker-"))
    dirs.push(dir)
    return dir
  }

  it("reports added and changed writes by checking existence before write", async () => {
    const root = tempDir()
    mkdirSync(join(root, "Catalogs"), { recursive: true })
    writeFileSync(join(root, "Catalogs", "Existing.xml"), "<Catalog/>", "utf-8")
    const tracker = createXmlChangeTracker(root)

    await tracker.markWrite(join(root, "Catalogs", "New.xml"))
    writeFileSync(join(root, "Catalogs", "New.xml"), "<Catalog/>", "utf-8")
    await tracker.markWrite(join(root, "Catalogs", "Existing.xml"))
    writeFileSync(join(root, "Catalogs", "Existing.xml"), "<Catalog/>", "utf-8")

    expect(tracker.changedFiles()).toEqual([
      { path: "Catalogs/Existing.xml", change: "changed" },
      { path: "Catalogs/New.xml", change: "added" },
    ])
  })

  it("reports deleted only when file or directory existed before removal", async () => {
    const root = tempDir()
    mkdirSync(join(root, "Catalogs", "Товары"), { recursive: true })
    writeFileSync(join(root, "Catalogs", "Товары.xml"), "<Catalog/>", "utf-8")
    writeFileSync(join(root, "Catalogs", "Товары", "Ext.xml"), "<Ext/>", "utf-8")
    const tracker = createXmlChangeTracker(root)

    await tracker.markDelete(join(root, "Catalogs", "Товары.xml"))
    await tracker.markDelete(join(root, "Catalogs", "Товары"))
    await tracker.markDelete(join(root, "Catalogs", "Missing.xml"))

    expect(tracker.changedFiles()).toEqual([
      { path: "Catalogs/Товары.xml", change: "deleted" },
      { path: "Catalogs/Товары/Ext.xml", change: "deleted" },
    ])
  })

  it("keeps manifest addFile behavior independent from change reporting", async () => {
    const root = tempDir()
    const tracker = createXmlChangeTracker(root)

    tracker.manifest.addFile(join(root, "ConfigDumpInfo.xml"))

    expect(tracker.changedFiles()).toEqual([])
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/configuration/xmlChangeTracker.test.ts
```

Expected: FAIL because `xmlChangeTracker.ts` does not exist.

- [ ] **Step 3: Implement the tracker**

Create `packages/core/metadata/appliedObjects/configuration/xmlChangeTracker.ts`:

```ts
import fs from "fs"
import { join, relative, sep } from "path"
import type { XmlWriteManifest } from "../../orchestration/xmlWriteManifest"
import type { MetadataOperationChangedXmlFile } from "../../operations/types"

export interface XmlChangeTracker {
  readonly manifest: XmlWriteManifest
  markWrite(absPath: string): Promise<void>
  markDelete(absPath: string): Promise<void>
  changedFiles(): MetadataOperationChangedXmlFile[]
}

export function createXmlChangeTracker(rootDir: string): XmlChangeTracker {
  const changes = new Map<string, MetadataOperationChangedXmlFile["change"]>()

  function record(absPath: string, change: MetadataOperationChangedXmlFile["change"]): void {
    changes.set(toRelativePath(rootDir, absPath), change)
  }

  return {
    manifest: {
      addFile(): void {},
    },
    async markWrite(absPath: string): Promise<void> {
      record(absPath, fs.existsSync(absPath) ? "changed" : "added")
    },
    async markDelete(absPath: string): Promise<void> {
      if (!fs.existsSync(absPath)) return
      const stat = await fs.promises.stat(absPath)
      if (stat.isFile()) {
        record(absPath, "deleted")
        return
      }
      if (!stat.isDirectory()) return
      for (const file of await listFiles(absPath)) record(file, "deleted")
    },
    changedFiles(): MetadataOperationChangedXmlFile[] {
      return [...changes.entries()]
        .sort(([left], [right]) => left.localeCompare(right, "ru"))
        .map(([path, change]) => ({ path, change }))
    },
  }
}

async function listFiles(dir: string): Promise<string[]> {
  const files: string[] = []
  for (const entry of await fs.promises.readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) files.push(...(await listFiles(path)))
    else if (entry.isFile()) files.push(path)
  }
  return files
}

function toRelativePath(rootDir: string, absPath: string): string {
  return relative(rootDir, absPath).split(sep).join("/")
}
```

The tracker deliberately does not use manifest entries for `changedFiles`, because `addFile` can be called after writing.

- [ ] **Step 4: Run tracker tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/configuration/xmlChangeTracker.test.ts
```

Expected: PASS.

### Task 3: Incremental Sync Uses XmlChangeTracker

**Files:**
- Modify: `packages/core/metadata/appliedObjects/configuration/incrementalSyncToXML.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/incrementalSyncToXML.test.ts`

**Interfaces:**
- Consumes: `createXmlChangeTracker(rootDir): XmlChangeTracker`
- Produces: `syncConfigurationIncrementallyToXML` returns operation-based `changedXmlFiles`

- [ ] **Step 1: Add a failing same-content rewrite assertion**

In `packages/core/metadata/appliedObjects/configuration/incrementalSyncToXML.test.ts`, add this test before the migration test:

```ts
it("reports rewritten XML file as changed even when contents stay equal", async () => {
  const yamlDir = tempDir()
  const xmlDir = tempDir()
  mkdirSync(join(yamlDir, "Справочник", "Товары"), { recursive: true })
  writeFileSync(join(yamlDir, "Справочник", "Товары", "Свойства.yaml"), "Имя: Товары\n", "utf-8")
  const current = await hashProjectFiles(yamlDir)
  await writeXmlSyncState(xmlDir, {
    version: 1,
    files: {
      ...current,
      "Справочник/Товары/Свойства.yaml": "xxh3-64:0000000000000000",
    },
  })

  await syncConfigurationIncrementallyToXML({
    context: baseContext(),
    inputDir: yamlDir,
    outputDir: xmlDir,
  })
  const rewrittenXml = readFileSync(join(xmlDir, "Catalogs", "Товары.xml"), "utf-8")
  await writeXmlSyncState(xmlDir, {
    version: 1,
    files: {
      ...current,
      "Справочник/Товары/Свойства.yaml": "xxh3-64:0000000000000000",
    },
  })

  const result = await syncConfigurationIncrementallyToXML({
    context: baseContext(),
    inputDir: yamlDir,
    outputDir: xmlDir,
  })

  expect(readFileSync(join(xmlDir, "Catalogs", "Товары.xml"), "utf-8")).toBe(rewrittenXml)
  expect(result.changedXmlFiles).toContainEqual({ path: "Catalogs/Товары.xml", change: "changed" })
})
```

- [ ] **Step 2: Run incremental tests to verify the new test fails**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/configuration/incrementalSyncToXML.test.ts -t "reports rewritten XML file"
```

Expected: FAIL because byte diff reports no change when contents are equal.

- [ ] **Step 3: Import tracker and remove old diff imports**

In `packages/core/metadata/appliedObjects/configuration/incrementalSyncToXML.ts`, replace:

```ts
import type { XmlWriteManifest } from "../../orchestration/xmlWriteManifest"
import { diffXmlTree, snapshotXmlTree, type PreparedMetadataMigrationChain } from "../../operations"
```

with:

```ts
import type { PreparedMetadataMigrationChain } from "../../operations"
import { createXmlChangeTracker } from "./xmlChangeTracker"
```

- [ ] **Step 4: Create one tracker per incremental run**

Replace:

```ts
const dumpInfoNames = new Set<string>()
const xmlBefore = await snapshotXmlTree(params.outputDir)
```

with:

```ts
const dumpInfoNames = new Set<string>()
const tracker = createXmlChangeTracker(params.outputDir)
```

- [ ] **Step 5: Track root Configuration.xml rewrites**

Replace:

```ts
if (plan.rebuildConfigurationXml) {
  await writeConfigurationArea(params)
}
```

with:

```ts
if (plan.rebuildConfigurationXml) {
  await tracker.markWrite(join(params.outputDir, CONFIGURATION_XML_FILE))
  await writeConfigurationArea(params)
}
```

- [ ] **Step 6: Pass the shared tracker manifest to all area writers**

Remove the three local declarations like:

```ts
const tracker = await createXmlChangeTracker(
  params.outputDir,
  join(params.outputDir, rule.xmlDir, planned.area.itemName)
)
```

Keep every existing `xmlManifest: tracker.manifest` argument.

- [ ] **Step 7: Mark writes before each planned area sync**

Before `syncAppliedObjectAreaToXML` for `externalFile`, add:

```ts
await tracker.markWrite(join(params.outputDir, planned.area.xmlPath))
```

Before `writer({ ... })` for `fileItem`, add:

```ts
await tracker.markWrite(join(params.outputDir, planned.area.xmlPath))
```

Before owner sync, add:

```ts
await tracker.markWrite(join(params.outputDir, rule.xmlDir, `${planned.area.itemName}.xml`))
```

If a planned area can write a directory instead of a single `xmlPath`, use the already known item root:

```ts
await tracker.markWrite(join(params.outputDir, rule.xmlDir, planned.area.itemName))
```

Only use paths available on `planned.area`; do not infer object type from names.

- [ ] **Step 8: Track explicit removals before deleting**

For replacement-style deletes that happen immediately before writing the same path, record the write before removing the old file:

```ts
await tracker.markWrite(join(params.outputDir, planned.area.xmlPath))
await fs.promises.rm(join(params.outputDir, planned.area.xmlPath), { force: true })
```

Do not call `markDelete` for that preparatory removal; the user-facing operation is an overwrite.

For real removals with no following write, call `markDelete` before `rm`.

For renamed-object cleanup, change `removeRenamedObjectXmlFiles` signature to accept the tracker:

```ts
async function removeRenamedObjectXmlFiles(params: {
  outputDir: string
  migrations: readonly { from: string; to: string }[]
  tracker: ReturnType<typeof createXmlChangeTracker>
}): Promise<void> {
```

Inside it, replace the two removals with:

```ts
const ownerXmlPath = join(params.outputDir, rule.xmlDir, `${from.localName}.xml`)
const externalDirPath = join(params.outputDir, rule.xmlDir, from.localName)
await params.tracker.markDelete(ownerXmlPath)
await fs.promises.rm(ownerXmlPath, { force: true })
await params.tracker.markDelete(externalDirPath)
await fs.promises.rm(externalDirPath, { recursive: true, force: true })
```

Call it with the current output directory:

```ts
await removeRenamedObjectXmlFiles({
  outputDir: params.outputDir,
  migrations: migrationChain.migrationsToApply,
  tracker,
})
```

- [ ] **Step 9: Return tracker changes**

Replace:

```ts
const changedXmlFiles = await diffXmlTree(params.outputDir, xmlBefore)
```

with:

```ts
const changedXmlFiles = tracker.changedFiles()
```

- [ ] **Step 10: Delete the old local stub**

Remove this function from `incrementalSyncToXML.ts`:

```ts
async function createXmlChangeTracker(
  _outputDir: string,
  _targetPath: string
): Promise<{ manifest: XmlWriteManifest }> {
  return {
    manifest: {
      addFile(): void {},
    },
  }
}
```

- [ ] **Step 11: Run incremental tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/configuration/incrementalSyncToXML.test.ts
```

Expected: PASS.

### Task 4: Remove Old xmlChanges and Verify CLI Output

**Files:**
- Delete: `packages/core/metadata/operations/xmlChanges.ts`
- Modify: `packages/core/metadata/operations/index.ts`
- Modify: `packages/cli/src/commands/sync.test.ts`

**Interfaces:**
- Consumes: `ConfigurationSyncResult.changedXmlFiles?: MetadataOperationChangedXmlFile[]`
- Produces: CLI prints changed-file block only when result contains non-empty `changedXmlFiles`

- [ ] **Step 1: Locate operation exports**

Run:

```bash
sed -n '1,160p' packages/core/metadata/operations/index.ts
```

Expected: find an export for `xmlChanges` if it still exists.

- [ ] **Step 2: Remove the old export and file**

If `packages/core/metadata/operations/index.ts` exports `xmlChanges`, remove that export line.

Delete `packages/core/metadata/operations/xmlChanges.ts`.

- [ ] **Step 3: Verify no old diff imports remain**

Run:

```bash
rg -n "snapshotXmlTree|diffXmlTree|xmlChanges" packages/core packages/cli
```

Expected: no matches.

- [ ] **Step 4: Add full sync CLI no-print test**

In `packages/cli/src/commands/sync.test.ts`, add:

```ts
it("не печатает изменённые XML-файлы при полном sync без changedXmlFiles", async () => {
  const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true)
  vi.spyOn(process.stderr, "write").mockImplementation(() => true)
  mocks.syncConfigurationToXML.mockResolvedValueOnce({ succeeded: 1, failed: [] })

  await syncConfiguration("yaml", "xml")

  expect(stdout).toHaveBeenCalledWith("Готово: 1 успешно, 0 с ошибкой\n")
  expect(stdout).not.toHaveBeenCalledWith("Изменённые XML-файлы:\n")
})
```

- [ ] **Step 5: Run CLI tests**

Run:

```bash
pnpm --filter @nakidka/cli exec vitest run src/commands/sync.test.ts
```

Expected: PASS.

- [ ] **Step 6: Run targeted core tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/configuration/xmlChangeTracker.test.ts metadata/appliedObjects/configuration/incrementalSyncToXML.test.ts metadata/appliedObjects/configuration/syncToXML.test.ts
```

Expected: PASS.

- [ ] **Step 7: Run all tests before completion**

Run:

```bash
pnpm test
```

Expected: all packages pass.

## Self-Review

- Spec coverage: full sync no longer reports `changedXmlFiles` in Task 1; incremental sync reports operation-based changes in Tasks 2 and 3; `snapshotXmlTree`/`diffXmlTree` removal is in Task 4; CLI behavior is covered in Task 4; no hash/content fallback is introduced.
- Placeholder scan: no `TBD`, `TODO`, `implement later`, or unspecified tests remain.
- Type consistency: `createXmlChangeTracker(rootDir)` returns `XmlChangeTracker`; `tracker.manifest`, `tracker.markWrite`, `tracker.markDelete`, and `tracker.changedFiles` are used consistently across tasks.
