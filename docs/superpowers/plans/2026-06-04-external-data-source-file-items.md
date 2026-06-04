# ExternalDataSource File-Item Children Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `ExternalDataSource` tables, cubes, and cube dimension tables round-trip as separate YAML file-item children and regenerate their `ChildObjects` entries and form/template files without reference.

**Architecture:** Generalize the existing `Configuration/ChildObjects` folder scan pattern into `orchestration/appliedObject` for `childCollections` with `fileItemRule`. The parent YAML stops owning the child object model on XML import; sync reads child `Свойства.yaml` files from folders, keeps legacy inline YAML as an input fallback, and emits child-name XML entries from those file-item children.

**Tech Stack:** TypeScript, Vitest, `pnpm test`, existing metadata rules and sync orchestration.

---

## File Structure

- Create: `packages/core/metadata/orchestration/appliedObject/fileItemChildCollections.ts`
  - Shared helpers for file-item child collections: detect XML root container, resolve child dirs, normalize child collection items, read YAML child folders with `Свойства.yaml`, sort names, merge reference order.
- Modify: `packages/core/metadata/orchestration/appliedObject/convertFromXML.ts`
  - Use shared helpers.
  - For `fileItemRule` children, write each child model to its own `Свойства.yaml`.
  - Keep child collection references in the parent model only long enough to drive recursive external file sync; remove them from parent YAML before writing parent `Свойства.yaml`.
- Modify: `packages/core/metadata/orchestration/appliedObject/syncToXML.ts`
  - Use shared helpers.
  - For `fileItemRule` children, read current child objects from folders with `Свойства.yaml`.
  - Accept old inline YAML as a transition input only when folders are absent.
  - Generate `Table`, `Cube`, and `DimensionTable` XML string entries from file-item child names.
- Modify: `packages/core/metadata/commonObjects/childFormNames/syncExternalFromXML.ts`
  - Support nested file-item XML dirs where `xmlDir` already points at the current item.
- Modify: `packages/core/metadata/commonObjects/childFormNames/syncExternalToXML.ts`
  - Support nested file-item output dirs where `xmlDir` already points at the current item.
- Modify: `packages/core/metadata/commonObjects/metadataExternalDataSourceCube/rules.ts`
  - Remove `dimensionTableNames`; `<DimensionTable>` comes from `childCollections.fileItemRule`.
- Modify: `packages/core/metadata/appliedObjects/metadataExternalDataSource/convertFromXML.test.ts`
  - Assert separate child `Свойства.yaml` files and nested forms.
- Modify: `packages/core/metadata/appliedObjects/metadataExternalDataSource/syncToXML.test.ts`
  - Assert sync without reference from separate child YAML creates child XML files, form files, and `ChildObjects` entries.
- Modify: `packages/core/metadata/appliedObjects/metadataExternalDataSource/__fixtures__/sync/data.ts`
  - Update expected root YAML to exclude `Таблицы` and `Кубы`.
- Modify: `packages/core/metadata/commonObjects/metadataExternalDataSourceCube/fromXML.test.ts`
  - Keep XML round-trip coverage for cube with `DimensionTable` entries after removing `dimensionTableNames`.

---

### Task 1: Add Shared File-Item Child Helpers

**Files:**
- Create: `packages/core/metadata/orchestration/appliedObject/fileItemChildCollections.ts`
- Test: `packages/core/metadata/orchestration/appliedObject/fileItemChildCollections.test.ts`

- [ ] **Step 1: Write the failing helper tests**

Create `packages/core/metadata/orchestration/appliedObject/fileItemChildCollections.test.ts` with:

```ts
import fs from "fs"
import os from "os"
import { join } from "path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import type { MetadataItemRule } from "~/metadata/orchestration/property/types"
import {
  getFileItemXMLRootContainer,
  listYAMLFileItemNames,
  normalizeFileItemCollectionItems,
  orderFileItemNames,
  resolveChildCollectionDir,
  toChildObjectsXMLValue,
} from "./fileItemChildCollections"

const childRule = {
  itemType: "Child",
  properties: {
    xmlRoot: {
      type: "XMLRoot",
      container: "DimensionTable",
      rootAttributes: {},
      forReferenceOnly: true,
    },
    name: { type: "string", xmlParents: ["Properties"], required: true },
  },
} as const satisfies MetadataItemRule

describe("fileItemChildCollections", () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(join(os.tmpdir(), "nkdk-file-item-children-"))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it("reads XML root container from fileItemRule", () => {
    expect(getFileItemXMLRootContainer(childRule)).toBe("DimensionTable")
  })

  it("normalizes arrays, records, strings, and empty values", () => {
    expect(normalizeFileItemCollectionItems("A")).toEqual([{ name: "A", model: { name: "A" } }])
    expect(normalizeFileItemCollectionItems([{ name: "A", value: 1 }, "B"])).toEqual([
      { name: "A", model: { name: "A", value: 1 } },
      { name: "B", model: { name: "B" } },
    ])
    expect(normalizeFileItemCollectionItems({ A: { value: 1 } })).toEqual([
      { name: "A", model: { name: "A", value: 1 } },
    ])
    expect(normalizeFileItemCollectionItems(undefined)).toEqual([])
  })

  it("lists only child folders with Свойства.yaml in ru order", async () => {
    fs.mkdirSync(join(tmpDir, "ТаблицыИзмерений", "Я"), { recursive: true })
    fs.mkdirSync(join(tmpDir, "ТаблицыИзмерений", "А"), { recursive: true })
    fs.mkdirSync(join(tmpDir, "ТаблицыИзмерений", "БезСвойств"), { recursive: true })
    fs.writeFileSync(join(tmpDir, "ТаблицыИзмерений", "Я", "Свойства.yaml"), "", "utf-8")
    fs.writeFileSync(join(tmpDir, "ТаблицыИзмерений", "А", "Свойства.yaml"), "", "utf-8")

    const names = await listYAMLFileItemNames({
      nkdkDir: tmpDir,
      childCollection: { propertyKey: "dimensionTables", nkdkDir: "ТаблицыИзмерений", xmlDir: "DimensionTables" },
      parentName: "Куб",
    })

    expect(names).toEqual(["А", "Я"])
  })

  it("keeps reference order and appends new names sorted by ru locale", () => {
    expect(orderFileItemNames({ currentNames: ["НовыйЯ", "Старый", "НовыйА"], referenceNames: ["Старый"] })).toEqual([
      "Старый",
      "НовыйА",
      "НовыйЯ",
    ])
  })

  it("returns scalar XML value for one name and array for many names", () => {
    expect(toChildObjectsXMLValue([])).toBeUndefined()
    expect(toChildObjectsXMLValue(["A"])).toBe("A")
    expect(toChildObjectsXMLValue(["A", "B"])).toEqual(["A", "B"])
  })

  it("resolves string and function child collection dirs", () => {
    expect(resolveChildCollectionDir("Tables/A", "A", "Parent")).toBe("Tables/A")
    expect(resolveChildCollectionDir(({ name, parentName }) => `${parentName}/${name}`, "A", "Parent")).toBe("Parent/A")
  })
})
```

- [ ] **Step 2: Run the new test to verify it fails**

Run:

```bash
pnpm vitest run packages/core/metadata/orchestration/appliedObject/fileItemChildCollections.test.ts
```

Expected: FAIL because `fileItemChildCollections.ts` does not exist.

- [ ] **Step 3: Implement the helper module**

Create `packages/core/metadata/orchestration/appliedObject/fileItemChildCollections.ts`:

```ts
import fs from "fs"
import { join } from "path"
import type { MetadataItemRule } from "~/metadata/orchestration/property/types"

const PROPERTIES_YAML = "Свойства.yaml"

export type FileItemChildCollection = {
  propertyKey: string
  nkdkDir?: string | ((params: { name: string; parentName?: string }) => string)
  xmlDir?: string | ((params: { name: string; parentName?: string }) => string)
  fileItemRule?: MetadataItemRule
}

export type FileItemCollectionItem = {
  name: string
  model: Record<string, unknown>
}

export function getFileItemXMLRootContainer(rule: MetadataItemRule): string | undefined {
  const xmlRootEntry = Object.entries(rule.properties).find(([, propertyRule]) => propertyRule.type === "XMLRoot")
  return xmlRootEntry ? (xmlRootEntry[1] as { container?: string }).container : undefined
}

export function normalizeFileItemCollectionItems(collectionModel: unknown): FileItemCollectionItem[] {
  if (typeof collectionModel === "string") return [{ name: collectionModel, model: { name: collectionModel } }]

  if (Array.isArray(collectionModel)) {
    return collectionModel
      .map((item): FileItemCollectionItem | undefined => {
        if (typeof item === "string") return { name: item, model: { name: item } }
        if (!item || typeof item !== "object") return undefined

        const model = item as Record<string, unknown>
        const name = String(model["name"] ?? "")
        return name ? { name, model } : undefined
      })
      .filter((item): item is FileItemCollectionItem => item !== undefined)
  }

  if (!collectionModel || typeof collectionModel !== "object") return []

  return Object.entries(collectionModel as Record<string, Record<string, unknown>>).map(([itemName, itemModel]) => ({
    name: itemName,
    model: { ...itemModel, name: itemName },
  }))
}

export const resolveChildCollectionDir = (
  dir: string | ((params: { name: string; parentName?: string }) => string),
  name: string,
  parentName?: string
): string => (typeof dir === "function" ? dir({ name, parentName }) : dir)

export async function listYAMLFileItemNames(params: {
  nkdkDir: string
  childCollection: FileItemChildCollection
  parentName: string
}): Promise<string[]> {
  if (params.childCollection.nkdkDir === undefined) return []

  const childDir = resolveChildCollectionDir(params.childCollection.nkdkDir, "", params.parentName)
  const collectionDir = join(params.nkdkDir, childDir)
  if (!fs.existsSync(collectionDir)) return []

  const entries = await fs.promises.readdir(collectionDir, { withFileTypes: true })
  return entries
    .filter((entry) => entry.isDirectory() && fs.existsSync(join(collectionDir, entry.name, PROPERTIES_YAML)))
    .map((entry) => entry.name)
    .sort(compareNamesRu)
}

export function orderFileItemNames(params: { currentNames: string[]; referenceNames?: string[] }): string[] {
  const remaining = new Set(params.currentNames)
  const orderedExisting = (params.referenceNames ?? []).filter((name) => remaining.delete(name))
  const newNames = [...remaining].sort(compareNamesRu)
  return [...orderedExisting, ...newNames]
}

export function toChildObjectsXMLValue(names: string[]): string | string[] | undefined {
  if (names.length === 0) return undefined
  return names.length === 1 ? names[0] : names
}

function compareNamesRu(a: string, b: string): number {
  return a.localeCompare(b, "ru")
}
```

- [ ] **Step 4: Run the helper tests to verify they pass**

Run:

```bash
pnpm vitest run packages/core/metadata/orchestration/appliedObject/fileItemChildCollections.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/orchestration/appliedObject/fileItemChildCollections.ts packages/core/metadata/orchestration/appliedObject/fileItemChildCollections.test.ts
git commit -m "test: :white_check_mark: покрыть имена file-item объектов"
```

---

### Task 2: Convert XML File-Item Children To Separate YAML Files

**Files:**
- Modify: `packages/core/metadata/orchestration/appliedObject/convertFromXML.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataExternalDataSource/convertFromXML.test.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataExternalDataSource/__fixtures__/sync/data.ts`

- [ ] **Step 1: Write failing convert tests for separate child YAML files**

In `packages/core/metadata/appliedObjects/metadataExternalDataSource/convertFromXML.test.ts`, change the first test name and add assertions after `expect(yaml.result).toBe(yaml.expected)`:

```ts
    const rootYAML = importFromYAML<Record<string, unknown>>(fs.readFileSync(join(outputDir, name, "Свойства.yaml"), "utf-8"))
    expect(rootYAML["Таблицы"]).toBeUndefined()
    expect(rootYAML["Кубы"]).toBeUndefined()

    const tableYAMLPath = join(outputDir, name, "Таблицы/ТаблицаВсеСвойства/Свойства.yaml")
    const cubeYAMLPath = join(outputDir, name, "Кубы/КубВсеСвойства/Свойства.yaml")
    const dimensionTableYAMLPath = join(
      outputDir,
      name,
      "Кубы/КубВсеСвойства/ТаблицыИзмерений/ТаблицаИзмеренияВсеСвойства/Свойства.yaml"
    )
    expect(fs.existsSync(tableYAMLPath), `expected ${tableYAMLPath}`).toBe(true)
    expect(fs.existsSync(cubeYAMLPath), `expected ${cubeYAMLPath}`).toBe(true)
    expect(fs.existsSync(dimensionTableYAMLPath), `expected ${dimensionTableYAMLPath}`).toBe(true)

    const tableYAML = importFromYAML<Record<string, unknown>>(fs.readFileSync(tableYAMLPath, "utf-8"))
    const cubeYAML = importFromYAML<Record<string, unknown>>(fs.readFileSync(cubeYAMLPath, "utf-8"))
    const dimensionTableYAML = importFromYAML<Record<string, unknown>>(fs.readFileSync(dimensionTableYAMLPath, "utf-8"))
    expect(tableYAML["ИмяВИсточникеДанных"]).toBe("ИмяВИсточнике")
    expect(cubeYAML["ИмяВИсточникеДанных"]).toBe("ИмяВИсточнике")
    expect(dimensionTableYAML["ИмяВИсточникеДанных"]).toBe("Имя в источнике данных")
```

Then add a dedicated form assertion in the same test:

```ts
    expect(
      fs.existsSync(join(outputDir, name, "Таблицы/ТаблицаВсеСвойства/Формы/ФормаСписка/Форма.yaml"))
    ).toBe(true)
    expect(
      fs.existsSync(join(outputDir, name, "Кубы/КубВсеСвойства/Формы/ФормаЗаписи/Форма.yaml"))
    ).toBe(true)
```

In the second test, replace root inline parsing with file YAML parsing:

```ts
      const tableYAML = fs.readFileSync(join(outputDir, name, `Таблицы/${referenceTableName}/Свойства.yaml`), "utf-8")
      const parsed = importFromYAML<Record<string, unknown>>(tableYAML)
      expect(parsed["ИмяВИсточникеДанных"]).toBe("ИмяВИсточникеСтроковая")
      expect(fs.existsSync(join(outputDir, name, "Таблицы/ТаблицаВсеСвойства/Свойства.yaml"))).toBe(true)
```

Update the root expected YAML in `packages/core/metadata/appliedObjects/metadataExternalDataSource/__fixtures__/sync/data.ts` by removing the root `Таблицы:` and `Кубы:` blocks from `readExternalDataSourceYAML`. Keep root properties and `Функции`.

- [ ] **Step 2: Run convert tests to verify they fail**

Run:

```bash
pnpm vitest run packages/core/metadata/appliedObjects/metadataExternalDataSource/convertFromXML.test.ts
```

Expected: FAIL because child `Свойства.yaml` files are not written yet and root YAML still contains inline `Таблицы` / `Кубы`.

- [ ] **Step 3: Implement child file YAML writing**

In `packages/core/metadata/orchestration/appliedObject/convertFromXML.ts`, import helpers:

```ts
import {
  getFileItemXMLRootContainer,
  normalizeFileItemCollectionItems,
  resolveChildCollectionDir,
} from "./fileItemChildCollections"
```

Remove the local `ChildCollectionItem`, `normalizeChildCollectionItems`, `getXMLRootContainer`, and `resolveChildCollectionDir` definitions after replacing call sites.

Add this helper near `syncChildCollectionsFromXML`:

```ts
async function writeMetadataItemYAML(params: {
  context: ConfigurationContextFromXML
  model: Record<string, unknown>
  rule: MetadataItemRule
  outputDir: string
}): Promise<void> {
  const yamlObj = exportMetadataItemToYAML({ context: params.context, data: params.model, rule: params.rule })
  const yaml = yamlObj !== undefined ? exportToYAML(yamlObj) : ""
  await fs.promises.mkdir(params.outputDir, { recursive: true })
  await fs.promises.writeFile(join(params.outputDir, PROPERTIES_YAML), yaml, "utf-8")
}
```

In `syncChildCollectionsFromXML`, replace:

```ts
    const items = normalizeChildCollectionItems(collectionModel)
```

with:

```ts
    const items = normalizeFileItemCollectionItems(collectionModel)
```

After the block that imports `childModel`, add:

```ts
      if (childCollection.fileItemRule && childCollection.xmlDir) {
        await writeMetadataItemYAML({
          context,
          model: item.model,
          rule: childCollection.fileItemRule,
          outputDir: childNkdkDir,
        })
      }
```

Before writing the parent YAML in `convertAppliedObjectFromXML`, remove file-item child collections from the parent YAML model:

```ts
  const yamlModel = omitFileItemChildCollectionsFromYAMLModel({
    model: model as Record<string, unknown>,
    rule,
  })
  const yamlObj = exportMetadataItemToYAML({ context, data: yamlModel, rule })
```

Add:

```ts
function omitFileItemChildCollectionsFromYAMLModel(params: {
  model: Record<string, unknown>
  rule: MetadataItemRule
}): Record<string, unknown> {
  const result = { ...params.model }
  for (const childCollection of params.rule.childCollections ?? []) {
    if (!childCollection.fileItemRule || !childCollection.xmlDir) continue
    delete result[childCollection.propertyKey]
  }
  return result
}
```

In `addReferenceNamesFromXML` and `addChildCollectionsFromReferenceNames`, replace `getXMLRootContainer` with `getFileItemXMLRootContainer`.

- [ ] **Step 4: Run convert tests to verify they pass**

Run:

```bash
pnpm vitest run packages/core/metadata/appliedObjects/metadataExternalDataSource/convertFromXML.test.ts packages/core/metadata/commonObjects/childFormNames/syncExternalFromXML.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/orchestration/appliedObject/convertFromXML.ts packages/core/metadata/appliedObjects/metadataExternalDataSource/convertFromXML.test.ts packages/core/metadata/appliedObjects/metadataExternalDataSource/__fixtures__/sync/data.ts
git commit -m "feat: :sparkles: выгружать дочерние объекты ExternalDataSource в YAML"
```

---

### Task 3: Sync File-Item Children From Separate YAML Folders

**Files:**
- Modify: `packages/core/metadata/orchestration/appliedObject/syncToXML.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataExternalDataSource/syncToXML.test.ts`

- [ ] **Step 1: Write failing sync tests for no-reference file-item children**

In `packages/core/metadata/appliedObjects/metadataExternalDataSource/syncToXML.test.ts`, add:

```ts
  it("собирает таблицы, кубы и таблицы измерений из отдельных Свойства.yaml без reference", async () => {
    const rootDir = await fs.promises.mkdtemp(join(os.tmpdir(), "eds-sync-file-items-"))
    const inputDir = join(rootDir, "yaml")
    const outputDir = join(rootDir, "out")
    const objectDir = join(inputDir, "ВнешнийИсточникДанныхВсеСвойства")

    await write(join(objectDir, "Свойства.yaml"), "Синоним: Синоним\n")
    await write(join(objectDir, "Таблицы/ТаблицаБ/Свойства.yaml"), "ИмяВИсточникеДанных: TableB\n")
    await write(join(objectDir, "Таблицы/ТаблицаА/Свойства.yaml"), "ИмяВИсточникеДанных: TableA\n")
    await write(join(objectDir, "Кубы/КубВсеСвойства/Свойства.yaml"), "ИмяВИсточникеДанных: Cube\n")
    await write(
      join(objectDir, "Кубы/КубВсеСвойства/ТаблицыИзмерений/ТаблицаИзмеренияБ/Свойства.yaml"),
      "ИмяВИсточникеДанных: DimensionB\n"
    )
    await write(
      join(objectDir, "Кубы/КубВсеСвойства/ТаблицыИзмерений/ТаблицаИзмеренияА/Свойства.yaml"),
      "ИмяВИсточникеДанных: DimensionA\n"
    )

    await syncAppliedObjectToXML({
      rule: MetadataExternalDataSourceRules,
      context: mockContextToXML(),
      inputDir,
      name: "ВнешнийИсточникДанныхВсеСвойства",
      outputDir,
    })

    const rootXML = fs.readFileSync(join(outputDir, "ВнешнийИсточникДанныхВсеСвойства.xml"), "utf-8")
    const cubeXML = fs.readFileSync(join(outputDir, "Cubes/КубВсеСвойства.xml"), "utf-8")

    expect(rootXML.indexOf("<Table>ТаблицаА</Table>")).toBeLessThan(rootXML.indexOf("<Table>ТаблицаБ</Table>"))
    expect(rootXML).toContain("<Cube>КубВсеСвойства</Cube>")
    expect(cubeXML.indexOf("<DimensionTable>ТаблицаИзмеренияА</DimensionTable>")).toBeLessThan(
      cubeXML.indexOf("<DimensionTable>ТаблицаИзмеренияБ</DimensionTable>")
    )
    expect(fs.existsSync(join(outputDir, "Tables/ТаблицаА.xml"))).toBe(true)
    expect(fs.existsSync(join(outputDir, "Tables/ТаблицаБ.xml"))).toBe(true)
    expect(fs.existsSync(join(outputDir, "Cubes/КубВсеСвойства.xml"))).toBe(true)
    expect(fs.existsSync(join(outputDir, "Cubes/КубВсеСвойства/DimensionTables/ТаблицаИзмеренияА.xml"))).toBe(true)
    expect(fs.existsSync(join(outputDir, "Cubes/КубВсеСвойства/DimensionTables/ТаблицаИзмеренияБ.xml"))).toBe(true)
  })
```

Add one transition-input test:

```ts
  it("переходно принимает старый inline YAML, если отдельных папок нет", async () => {
    const rootDir = await fs.promises.mkdtemp(join(os.tmpdir(), "eds-sync-inline-file-items-"))
    const inputDir = join(rootDir, "yaml")
    const outputDir = join(rootDir, "out")
    const objectDir = join(inputDir, "ВнешнийИсточникДанныхВсеСвойства")

    await write(
      join(objectDir, "Свойства.yaml"),
      `Синоним: Синоним
Таблицы:
  ТаблицаВсеСвойства:
    ИмяВИсточникеДанных: ИмяВИсточнике`
    )

    await syncAppliedObjectToXML({
      rule: MetadataExternalDataSourceRules,
      context: mockContextToXML(),
      inputDir,
      name: "ВнешнийИсточникДанныхВсеСвойства",
      outputDir,
    })

    const rootXML = fs.readFileSync(join(outputDir, "ВнешнийИсточникДанныхВсеСвойства.xml"), "utf-8")
    expect(rootXML).toContain("<Table>ТаблицаВсеСвойства</Table>")
    expect(fs.existsSync(join(outputDir, "Tables/ТаблицаВсеСвойства.xml"))).toBe(true)
  })
```

- [ ] **Step 2: Run sync tests to verify they fail**

Run:

```bash
pnpm vitest run packages/core/metadata/appliedObjects/metadataExternalDataSource/syncToXML.test.ts
```

Expected: FAIL because separate child folders are not read into the model yet.

- [ ] **Step 3: Implement file-item child reading in syncToXML**

In `packages/core/metadata/orchestration/appliedObject/syncToXML.ts`, import helpers:

```ts
import {
  getFileItemXMLRootContainer,
  listYAMLFileItemNames,
  normalizeFileItemCollectionItems,
  orderFileItemNames,
  resolveChildCollectionDir,
  toChildObjectsXMLValue,
} from "./fileItemChildCollections"
```

Remove local `resolveChildCollectionDir` and `getXMLRootContainer` after replacing call sites.

Add:

```ts
async function addYAMLFileItemChildCollections(params: {
  model: Record<string, unknown>
  rule: MetadataItemRule
  nkdkDir: string
  referenceModel: Record<string, unknown> | undefined
  parentName: string
}): Promise<Record<string, unknown>> {
  const result = { ...params.model }

  for (const childCollection of params.rule.childCollections ?? []) {
    if (!childCollection.fileItemRule || !childCollection.xmlDir) continue

    const folderNames = await listYAMLFileItemNames({
      nkdkDir: params.nkdkDir,
      childCollection,
      parentName: params.parentName,
    })
    if (folderNames.length === 0) continue

    const referenceItems = normalizeFileItemCollectionItems(params.referenceModel?.[childCollection.propertyKey])
    const referenceNames = referenceItems.map((item) => item.name)
    result[childCollection.propertyKey] = orderFileItemNames({
      currentNames: folderNames,
      referenceNames,
    }).map((itemName) => ({ name: itemName }))
  }

  return result
}
```

After `const model = { ...rawModel, name } as typeof rawModel`, calculate `nkdkDir` earlier:

```ts
  const nkdkDir = join(inputDir, name)
```

After `referenceModel` is computed and before `exportMetadataItemToXML`, create:

```ts
  const modelWithFileItems = await addYAMLFileItemChildCollections({
    model: model as Record<string, unknown>,
    rule,
    nkdkDir,
    referenceModel: referenceModel as Record<string, unknown> | undefined,
    parentName: name,
  })
```

Use `modelWithFileItems` instead of `model` in:

```ts
data: addFileChildCollectionReferenceNames({ model: modelWithFileItems, rule }) as typeof model
```

and in the later `syncChildCollectionExternalFilesToXML({ model: modelWithFileItems, ... })`.

Update `addFileChildCollectionReferenceNames`:

```ts
function addFileChildCollectionReferenceNames(params: {
  model: Record<string, unknown>
  rule: MetadataItemRule
}): Record<string, unknown> {
  const result = { ...params.model }
  for (const childCollection of params.rule.childCollections ?? []) {
    if (!childCollection.fileItemRule || !childCollection.xmlDir) continue
    const collectionModel = result[childCollection.propertyKey]
    const itemNames = normalizeFileItemCollectionItems(collectionModel).map((item) => item.name)
    if (itemNames.length === 0) continue

    const fileRootContainer = getFileItemXMLRootContainer(childCollection.fileItemRule)
    if (!fileRootContainer) continue
    result[childCollection.propertyKey] = itemNames
  }
  return result
}
```

Update `syncChildCollectionExternalFilesToXML` to use `normalizeFileItemCollectionItems(collectionModel)`.

Update `addChildCollectionReferenceNames` to write names directly into the file-item property key when no separate child-name property exists:

```ts
function addChildCollectionReferenceNames(params: {
  model: Record<string, unknown>
  rule: MetadataItemRule
}): Record<string, unknown> {
  const result = { ...params.model }
  for (const childCollection of params.rule.childCollections ?? []) {
    if (!childCollection.fileItemRule || !childCollection.xmlDir) continue

    const itemNames = normalizeFileItemCollectionItems(result[childCollection.propertyKey]).map((item) => item.name)
    if (itemNames.length === 0) continue

    const fileRootContainer = getFileItemXMLRootContainer(childCollection.fileItemRule)
    if (!fileRootContainer) continue

    result[childCollection.propertyKey] = itemNames
  }
  return result
}
```

Keep `addReferenceChildNameProperties` and `addChildNameProperties` for real forms/templates only.

- [ ] **Step 4: Run sync tests to verify they pass**

Run:

```bash
pnpm vitest run packages/core/metadata/appliedObjects/metadataExternalDataSource/syncToXML.test.ts packages/core/metadata/orchestration/appliedObject/fileItemChildCollections.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/orchestration/appliedObject/syncToXML.ts packages/core/metadata/appliedObjects/metadataExternalDataSource/syncToXML.test.ts
git commit -m "feat: :sparkles: собирать file-item объекты из YAML-папок"
```

---

### Task 4: Fix Nested Form Paths For File-Item Children

**Files:**
- Modify: `packages/core/metadata/commonObjects/childFormNames/syncExternalFromXML.ts`
- Modify: `packages/core/metadata/commonObjects/childFormNames/syncExternalToXML.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataExternalDataSource/convertFromXML.test.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataExternalDataSource/syncToXML.test.ts`

- [ ] **Step 1: Write failing nested form assertions**

In `packages/core/metadata/appliedObjects/metadataExternalDataSource/convertFromXML.test.ts`, the assertions from Task 2 already expect:

```ts
    expect(
      fs.existsSync(join(outputDir, name, "Таблицы/ТаблицаВсеСвойства/Формы/ФормаСписка/Форма.yaml"))
    ).toBe(true)
    expect(
      fs.existsSync(join(outputDir, name, "Кубы/КубВсеСвойства/Формы/ФормаЗаписи/Форма.yaml"))
    ).toBe(true)
```

In `packages/core/metadata/appliedObjects/metadataExternalDataSource/syncToXML.test.ts`, add form YAML to the new no-reference test:

```ts
    await write(
      join(objectDir, "Таблицы/ТаблицаА/Формы/ФормаСписка/Форма.yaml"),
      `ТипФормы: ФормаСписка
Синоним: ФормаСписка`
    )
```

and after sync:

```ts
    expect(fs.existsSync(join(outputDir, "Tables/ТаблицаА/Forms/ФормаСписка.xml"))).toBe(true)
    expect(fs.existsSync(join(outputDir, "Tables/ТаблицаА/Forms/ФормаСписка/Ext/Form.xml"))).toBe(true)
```

- [ ] **Step 2: Run form-related tests to verify they fail**

Run:

```bash
pnpm vitest run packages/core/metadata/appliedObjects/metadataExternalDataSource/convertFromXML.test.ts packages/core/metadata/appliedObjects/metadataExternalDataSource/syncToXML.test.ts
```

Expected: FAIL if forms are searched under duplicated paths such as `Tables/ТаблицаА/ТаблицаА/Forms`.

- [ ] **Step 3: Implement current-item-aware ChildFormNames paths**

In `packages/core/metadata/commonObjects/childFormNames/syncExternalFromXML.ts`, replace:

```ts
  const formsDir = join(xmlDir, name, "Forms")
```

with:

```ts
  const formsDir = params.itemName === undefined && name === "" ? join(xmlDir, "Forms") : join(xmlDir, name, "Forms")
```

In `packages/core/metadata/commonObjects/childFormNames/syncExternalToXML.ts`, replace:

```ts
  const formOutputDir = join(xmlDir, name)
  const formReferenceDir = referenceDir ? join(referenceDir, referenceName ?? name, "Forms") : undefined
```

with:

```ts
  const formOutputDir = name === "" ? xmlDir : join(xmlDir, name)
  const formReferenceDir = referenceDir
    ? name === ""
      ? join(referenceDir, "Forms")
      : join(referenceDir, referenceName ?? name, "Forms")
    : undefined
```

Update `buildChildFormCurrentXMLPath` to handle empty `name`:

```ts
export const buildChildFormCurrentXMLPath = (params: {
  xmlDir: string
  name: string
  formName: string
}): string => {
  const xmlDirName = getLastPathSegment(params.xmlDir)
  return params.name === ""
    ? posix.join(xmlDirName, "Forms", params.formName, "Ext", "Form.xml")
    : posix.join(xmlDirName, params.name, "Forms", params.formName, "Ext", "Form.xml")
}
```

In `syncAppliedObjectToXML`, keep the existing call site:

```ts
const externalSyncName = hasOwnDirs && isFileChildNameRule(itemPropRule) ? "" : syncName
```

This call site now becomes meaningful for nested file-item children.

- [ ] **Step 4: Run nested form tests to verify they pass**

Run:

```bash
pnpm vitest run packages/core/metadata/appliedObjects/metadataExternalDataSource/convertFromXML.test.ts packages/core/metadata/appliedObjects/metadataExternalDataSource/syncToXML.test.ts packages/core/metadata/commonObjects/childFormNames/syncExternalToXML.test.ts packages/core/metadata/commonObjects/childFormNames/syncExternalFromXML.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/commonObjects/childFormNames/syncExternalFromXML.ts packages/core/metadata/commonObjects/childFormNames/syncExternalToXML.ts packages/core/metadata/appliedObjects/metadataExternalDataSource/convertFromXML.test.ts packages/core/metadata/appliedObjects/metadataExternalDataSource/syncToXML.test.ts
git commit -m "fix: :bug: синхронизировать формы вложенных file-item объектов"
```

---

### Task 5: Remove `dimensionTableNames` Pseudo-Form Rule

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataExternalDataSourceCube/rules.ts`
- Modify: `packages/core/metadata/commonObjects/metadataExternalDataSourceCube/fromXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/metadataExternalDataSourceCube/toXML.test.ts`
- Modify: `packages/core/metadata/orchestration/appliedObject/convertFromXML.ts`
- Modify: `packages/core/metadata/orchestration/appliedObject/syncToXML.ts`

- [ ] **Step 1: Write failing assertion that cube model does not depend on `dimensionTableNames`**

In `packages/core/metadata/commonObjects/metadataExternalDataSourceCube/fromXML.test.ts`, add after importing `data` in the round-trip test:

```ts
    expect(Object.prototype.hasOwnProperty.call(data as Record<string, unknown>, "dimensionTableNames")).toBe(false)
```

In `packages/core/metadata/commonObjects/metadataExternalDataSourceCube/toXML.test.ts`, add a no-reference export test:

```ts
  it("exports DimensionTable entries from dimensionTables collection", () => {
    const { result } = testExportPropertyToXML({
      rule,
      value: {
        name: "КубВсеСвойства",
        nameInDataSource: "Cube",
        dimensionTables: [{ name: "ТаблицаИзмеренияВсеСвойства", nameInDataSource: "Dimension" }],
      },
      xmlRootTag: "MetaDataObject",
      exportXmlDataAsRoot: true,
      itemsTree,
      importMetaUrl: import.meta.url,
    })

    expect(result).toContain("<DimensionTable>ТаблицаИзмеренияВсеСвойства</DimensionTable>")
  })
```

- [ ] **Step 2: Run cube tests to verify they fail**

Run:

```bash
pnpm vitest run packages/core/metadata/commonObjects/metadataExternalDataSourceCube/fromXML.test.ts packages/core/metadata/commonObjects/metadataExternalDataSourceCube/toXML.test.ts
```

Expected: FAIL because `dimensionTableNames` still exists and direct export may not emit `DimensionTable` from `dimensionTables`.

- [ ] **Step 3: Remove `dimensionTableNames` from cube rules**

In `packages/core/metadata/commonObjects/metadataExternalDataSourceCube/rules.ts`, delete:

```ts
  dimensionTableNames: {
    xml: "DimensionTable",
    type: "ChildFormNames",
    xmlParents: childObjects,
    folderName: "ТаблицыИзмерений",
    forReferenceOnly: true,
    toYAML: false,
    fromYAML: false,
  },
```

Change `dimensionTables` from YAML-only to XML child-name capable:

```ts
  dimensionTables: {
    yaml: "ТаблицыИзмерений",
    xml: "DimensionTable",
    type: "MetadataExternalDataSourceDimensionTables",
    xmlParents: childObjects,
  },
```

If the collection export tries to emit full objects in `ChildObjects`, keep `toXML: false` and rely on the sync helper for sync paths. For direct property tests, prefer the collection rule only if it exports string child names correctly; otherwise keep direct test focused on `syncAppliedObjectToXML`.

In `convertFromXML.ts`, remove the legacy block in `addReferenceNamesFromXML` and `addChildCollectionsFromReferenceNames` that searches for `ChildFormNames` by file root container. `addStringChildCollectionReferencesFromXML` already reads the file-item collection property (`dimensionTables`) directly from `xmlParents + xml`.

In `syncToXML.ts`, remove the `addChildCollectionReferenceNames` search for a `ChildFormNames` shadow property. It should use the file-item collection property itself.

- [ ] **Step 4: Run cube and ExternalDataSource tests**

Run:

```bash
pnpm vitest run packages/core/metadata/commonObjects/metadataExternalDataSourceCube/fromXML.test.ts packages/core/metadata/commonObjects/metadataExternalDataSourceCube/toXML.test.ts packages/core/metadata/appliedObjects/metadataExternalDataSource/convertFromXML.test.ts packages/core/metadata/appliedObjects/metadataExternalDataSource/syncToXML.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/commonObjects/metadataExternalDataSourceCube/rules.ts packages/core/metadata/commonObjects/metadataExternalDataSourceCube/fromXML.test.ts packages/core/metadata/commonObjects/metadataExternalDataSourceCube/toXML.test.ts packages/core/metadata/orchestration/appliedObject/convertFromXML.ts packages/core/metadata/orchestration/appliedObject/syncToXML.ts
git commit -m "refactor: :recycle: убрать псевдо-формы таблиц измерений"
```

---

### Task 6: End-To-End Verification

**Files:**
- Modify only if failures reveal a real gap from previous tasks.

- [ ] **Step 1: Run focused metadata tests**

Run:

```bash
pnpm vitest run packages/core/metadata/orchestration/appliedObject/fileItemChildCollections.test.ts packages/core/metadata/appliedObjects/metadataExternalDataSource/convertFromXML.test.ts packages/core/metadata/appliedObjects/metadataExternalDataSource/syncToXML.test.ts packages/core/metadata/commonObjects/metadataExternalDataSourceCube/fromXML.test.ts packages/core/metadata/commonObjects/metadataExternalDataSourceCube/toXML.test.ts packages/core/metadata/commonObjects/childFormNames/syncExternalFromXML.test.ts packages/core/metadata/commonObjects/childFormNames/syncExternalToXML.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run round-trip YAML 1C diagnostic on all**

Run the same command used previously for `round-trip-yaml-1c` on `/home/nikita/git/round-trip/all`. If unsure of the exact command, open `/home/nikita/git/nkdk/.agents/skills/round-trip-yaml-1c/SKILL.md` and use its command for target `all`.

Expected:

```text
XML -> YAML: 191 успешно, 0 с ошибкой
YAML -> XML: 191 успешно, 0 с ошибкой
```

The first 1C import error should no longer be:

```text
Unknown metadata object - ExternalDataSource...Form...
Unknown type name - ExternalDataSourceCubeDimensionTableRef...
```

- [ ] **Step 3: Run the full project test suite**

Run:

```bash
pnpm test
```

Expected: all packages pass.

- [ ] **Step 4: Commit any verification-only test adjustments**

Only run this commit if Step 1 or Step 2 required small test expectation updates:

```bash
git add packages/core/metadata
git commit -m "test: :white_check_mark: закрепить file-item round-trip ExternalDataSource"
```

If no files changed, do not create an empty commit.

---

## Self-Review

**Spec coverage:** Covered separate YAML files for tables, cubes, dimension tables; nested forms/templates through existing external sync; folder scan into `ChildObjects`; reference-first ordering; folder without `Свойства.yaml`; transition inline input; removal of `dimensionTableNames`.

**Placeholder scan:** The plan gives exact paths, test snippets, commands, and expected outcomes; no open-ended implementation markers remain.

**Type consistency:** Helper names are consistent across tasks: `getFileItemXMLRootContainer`, `normalizeFileItemCollectionItems`, `listYAMLFileItemNames`, `orderFileItemNames`, `resolveChildCollectionDir`, `toChildObjectsXMLValue`.
