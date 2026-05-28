# ConfigDumpInfo XML Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Строить и сохранять `ConfigDumpInfo.xml` при YAML -> XML sync без хранения файла в YAML.

**Architecture:** `ConfigDumpInfo` остаётся отдельным служебным XML-слоем рядом с `configuration/syncToXML`. Экспорт читает reference `ConfigDumpInfo.xml`, строит целевые dumpinfo-имена из текущего YAML structural state, переносит `id/configVersion` через migration remap и записывает корневой `ConfigDumpInfo.xml` после успешного экспорта объектов.

**Tech Stack:** TypeScript, Vitest, `fast-xml-parser` через существующие `importContentFromXML`/`xmlExport`, текущие migration helpers, `uuid`, Node `crypto`.

---

## File Structure

- Modify: `packages/core/metadata/appliedObjects/configDumpInfo/types.ts` - разрешить пустой `ConfigVersions` и optional `configVersion`.
- Modify: `packages/core/metadata/appliedObjects/configDumpInfo/fromXML.ts` - корректно читать `<ConfigVersions/>`.
- Modify: `packages/core/metadata/appliedObjects/configDumpInfo/toXML.ts` - писать `<ConfigVersions/>` при пустой карте.
- Create: `packages/core/metadata/appliedObjects/configDumpInfo/nameMapping.ts` - перевод внутренних migration-путей в имена `ConfigDumpInfo`.
- Create: `packages/core/metadata/appliedObjects/configDumpInfo/build.ts` - построение итоговой `ConfigDumpInfo`-карты из reference и structural state.
- Create: `packages/core/metadata/appliedObjects/configDumpInfo/sync.ts` - чтение/запись `ConfigDumpInfo.xml` и интеграционный вход для `syncConfigurationToXML`.
- Modify: `packages/core/metadata/appliedObjects/configuration/syncToXML.ts` - вызвать служебный sync после успешного экспорта объектов и до prune/migration state write.
- Modify: `packages/core/metadata/appliedObjects/configDumpInfo/fromXML.test.ts`
- Modify: `packages/core/metadata/appliedObjects/configDumpInfo/toXML.test.ts`
- Create: `packages/core/metadata/appliedObjects/configDumpInfo/nameMapping.test.ts`
- Create: `packages/core/metadata/appliedObjects/configDumpInfo/build.test.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts`

## Task 1: XML Shape And Empty ConfigVersions

**Files:**
- Modify: `packages/core/metadata/appliedObjects/configDumpInfo/types.ts`
- Modify: `packages/core/metadata/appliedObjects/configDumpInfo/fromXML.ts`
- Modify: `packages/core/metadata/appliedObjects/configDumpInfo/toXML.ts`
- Modify: `packages/core/metadata/appliedObjects/configDumpInfo/fromXML.test.ts`
- Modify: `packages/core/metadata/appliedObjects/configDumpInfo/toXML.test.ts`

- [ ] **Step 1: Write failing tests for empty ConfigVersions**

Add these tests.

```ts
// packages/core/metadata/appliedObjects/configDumpInfo/fromXML.test.ts
it("читает пустой ConfigVersions как пустую карту", () => {
  const result = importConfigDumpInfoFromXML({
    context: mockContext,
    xml: {
      _xmlns: "http://v8.1c.ru/8.3/xcf/dumpinfo",
      "_xmlns:xen": "http://v8.1c.ru/8.3/xcf/enums",
      "_xmlns:xs": "http://www.w3.org/2001/XMLSchema",
      "_xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
      _format: "Hierarchical",
      _version: "2.20",
      ConfigVersions: {},
    },
  })

  expect(result).toEqual(new Map())
})
```

```ts
// packages/core/metadata/appliedObjects/configDumpInfo/toXML.test.ts
it("пишет пустой ConfigVersions без Metadata", () => {
  const result = exportConfigDumpInfoToXML({
    context: mockContext,
    idMap: new Map(),
  })

  const resultString = xmlExport({ ConfigDumpInfo: result })

  expect(resultString).toContain("<ConfigVersions/>")
  expect(resultString).not.toContain("<Metadata")
})
```

- [ ] **Step 2: Run tests and verify they fail**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/configDumpInfo/fromXML.test.ts metadata/appliedObjects/configDumpInfo/toXML.test.ts
```

Expected: `toXML.test.ts` fails because empty export still produces an object shape with `Metadata` semantics or TypeScript rejects the empty `ConfigVersions` shape.

- [ ] **Step 3: Update ConfigDumpInfo XML types**

Change the types to allow absent `Metadata` and optional `configVersion`.

```ts
// packages/core/metadata/appliedObjects/configDumpInfo/types.ts
export interface ConfigDumpInfoMetadataXML {
  _name: string
  _id: string
  _configVersion?: string
  Metadata?: ConfigDumpInfoMetadataInnerXML | ConfigDumpInfoMetadataInnerXML[]
}

export interface ConfigDumpInfoXML {
  _format: "Hierarchical"
  _version: string
  _xmlns: "http://v8.1c.ru/8.3/xcf/dumpinfo"
  "_xmlns:xen": "http://v8.1c.ru/8.3/xcf/enums"
  "_xmlns:xs": "http://www.w3.org/2001/XMLSchema"
  "_xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance"
  ConfigVersions: {
    Metadata?: ConfigDumpInfoMetadataXML | ConfigDumpInfoMetadataXML[]
  }
}
```

Keep the in-memory `ConfigDumpInfo` value type as `{ children; id; configVersion }`; the builder will generate `configVersion` only for root/verсионируемые записи.

- [ ] **Step 4: Make fromXML tolerate empty ConfigVersions**

Use the existing optional read and do not add special throwing.

```ts
// packages/core/metadata/appliedObjects/configDumpInfo/fromXML.ts
const rootList = toList(xml.ConfigVersions?.Metadata)
```

If TypeScript still complains after the type change, keep the expression above and avoid casts.

- [ ] **Step 5: Export empty ConfigVersions as an empty object**

Change only the `ConfigVersions` return expression.

```ts
// packages/core/metadata/appliedObjects/configDumpInfo/toXML.ts
return {
  ...getRootAttributes(context),
  ConfigVersions: rootMetadata.length > 0 ? { Metadata: rootMetadata } : {},
}
```

Also write `_configVersion` only when the value is not empty.

```ts
rootMetadata.push({
  _name: name,
  _id: id,
  ...(configVersion ? { _configVersion: configVersion } : {}),
  ...(innerMetadata.length > 0 ? { Metadata: innerMetadata } : {}),
})
```

- [ ] **Step 6: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/configDumpInfo/fromXML.test.ts metadata/appliedObjects/configDumpInfo/toXML.test.ts
```

Expected: both files pass.

- [ ] **Step 7: Commit**

```bash
git add packages/core/metadata/appliedObjects/configDumpInfo/types.ts packages/core/metadata/appliedObjects/configDumpInfo/fromXML.ts packages/core/metadata/appliedObjects/configDumpInfo/toXML.ts packages/core/metadata/appliedObjects/configDumpInfo/fromXML.test.ts packages/core/metadata/appliedObjects/configDumpInfo/toXML.test.ts
git commit -m "fix: :bug: поддержать пустой ConfigDumpInfo"
```

## Task 2: Name Mapping From Migration Paths To DumpInfo Names

**Files:**
- Create: `packages/core/metadata/appliedObjects/configDumpInfo/nameMapping.ts`
- Create: `packages/core/metadata/appliedObjects/configDumpInfo/nameMapping.test.ts`

- [ ] **Step 1: Write failing name mapping tests**

```ts
// packages/core/metadata/appliedObjects/configDumpInfo/nameMapping.test.ts
import { describe, expect, it } from "vitest"
import { configDumpInfoNameFromMigrationPath } from "./nameMapping"

describe("configDumpInfoNameFromMigrationPath", () => {
  it("переводит верхний объект", () => {
    expect(configDumpInfoNameFromMigrationPath("Справочник.Номенклатура")).toBe("Catalog.Номенклатура")
  })

  it("переводит реквизит верхнего объекта", () => {
    expect(configDumpInfoNameFromMigrationPath("Справочник.Номенклатура.Реквизит.Артикул")).toBe(
      "Catalog.Номенклатура.Attribute.Артикул",
    )
  })

  it("переводит реквизит табличной части", () => {
    expect(
      configDumpInfoNameFromMigrationPath("Справочник.Номенклатура.ТабличнаяЧасть.Состав.Реквизит.Количество"),
    ).toBe("Catalog.Номенклатура.TabularSection.Состав.Attribute.Количество")
  })

  it("переводит измерение и ресурс регистра", () => {
    expect(configDumpInfoNameFromMigrationPath("РегистрНакопления.Остатки.Измерение.Номенклатура")).toBe(
      "AccumulationRegister.Остатки.Dimension.Номенклатура",
    )
    expect(configDumpInfoNameFromMigrationPath("РегистрНакопления.Остатки.Ресурс.Количество")).toBe(
      "AccumulationRegister.Остатки.Resource.Количество",
    )
  })

  it("падает на неподдержанном сегменте", () => {
    expect(() => configDumpInfoNameFromMigrationPath("Справочник.Номенклатура.Форма.ФормаЭлемента")).toThrow(
      'Неподдерживаемый сегмент ConfigDumpInfo "Форма"',
    )
  })
})
```

- [ ] **Step 2: Run test and verify it fails**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/configDumpInfo/nameMapping.test.ts
```

Expected: FAIL with module not found.

- [ ] **Step 3: Implement name mapping**

```ts
// packages/core/metadata/appliedObjects/configDumpInfo/nameMapping.ts
import type { MetadataItemRule } from "~/metadata/orchestration/property/types"
import { TopLevelMetadataItemRules } from "../configuration/topLevelRules"

const CHILD_SEGMENT_TO_DUMP = new Map<string, string>([
  ["Реквизит", "Attribute"],
  ["РеквизитАдресации", "AddressingAttribute"],
  ["ТабличнаяЧасть", "TabularSection"],
  ["Измерение", "Dimension"],
  ["Ресурс", "Resource"],
])

const rootSegmentToDump = new Map(
  TopLevelMetadataItemRules
    .filter((rule): rule is MetadataItemRule & { itemTypePrefix: string } => rule.itemTypePrefix !== undefined)
    .map((rule) => [rule.itemTypePrefix, getXMLRootContainer(rule)] as const)
    .filter((entry): entry is readonly [string, string] => entry[1] !== undefined),
)

export function configDumpInfoNameFromMigrationPath(path: string): string {
  const parts = path.split(".")
  const [rootSegment, rootName, ...tail] = parts
  const rootDump = rootSegment ? rootSegmentToDump.get(rootSegment) : undefined
  if (!rootSegment || !rootName || !rootDump) {
    throw new Error(`Неподдерживаемый корневой путь ConfigDumpInfo "${path}"`)
  }
  if (tail.length % 2 !== 0) {
    throw new Error(`Некорректный путь ConfigDumpInfo "${path}"`)
  }

  const dumpParts = [rootDump, rootName]
  for (let i = 0; i < tail.length; i += 2) {
    const segment = tail[i]!
    const name = tail[i + 1]!
    const dumpSegment = CHILD_SEGMENT_TO_DUMP.get(segment)
    if (!dumpSegment) throw new Error(`Неподдерживаемый сегмент ConfigDumpInfo "${segment}"`)
    dumpParts.push(dumpSegment, name)
  }
  return dumpParts.join(".")
}

function getXMLRootContainer(rule: MetadataItemRule): string | undefined {
  const xmlRootEntry = Object.entries(rule.properties).find(([, propertyRule]) => propertyRule.type === "XMLRoot")
  return xmlRootEntry ? ((xmlRootEntry[1] as { container?: string }).container) : undefined
}
```

- [ ] **Step 4: Run focused mapping test**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/configDumpInfo/nameMapping.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/appliedObjects/configDumpInfo/nameMapping.ts packages/core/metadata/appliedObjects/configDumpInfo/nameMapping.test.ts
git commit -m "feat: :sparkles: добавить имена ConfigDumpInfo"
```

## Task 3: Build ConfigDumpInfo From Structural State

**Files:**
- Create: `packages/core/metadata/appliedObjects/configDumpInfo/build.ts`
- Create: `packages/core/metadata/appliedObjects/configDumpInfo/build.test.ts`

- [ ] **Step 1: Write failing builder tests**

```ts
// packages/core/metadata/appliedObjects/configDumpInfo/build.test.ts
import { describe, expect, it } from "vitest"
import type { StructuralState } from "../configuration/migrations/types"
import type { ConfigDumpInfo } from "./types"
import { buildConfigDumpInfo } from "./build"

const state = (paths: string[]): StructuralState => ({
  nodes: new Map(paths.map((path) => [path, {
    path,
    kind: path.split(".").length === 2 ? "object" : "attribute",
    name: path.split(".").at(-1)!,
    referencePath: path,
  }])),
})

describe("buildConfigDumpInfo", () => {
  it("сохраняет id/configVersion существующего объекта и id дочернего элемента", () => {
    const reference: ConfigDumpInfo = new Map([
      ["Catalog.Товары", {
        id: "catalog-id",
        configVersion: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        children: new Map([["Catalog.Товары.Attribute.Артикул", "attribute-id"]]),
      }],
    ])

    const result = buildConfigDumpInfo({
      reference,
      yamlState: state(["Справочник.Товары", "Справочник.Товары.Реквизит.Артикул"]),
      migrationState: state(["Справочник.Товары", "Справочник.Товары.Реквизит.Артикул"]),
      referencePathByCurrentPath: new Map(),
      generators: { id: () => "new-id", configVersion: () => "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" },
    })

    expect(result.get("Catalog.Товары")).toEqual({
      id: "catalog-id",
      configVersion: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      children: new Map([["Catalog.Товары.Attribute.Артикул", "attribute-id"]]),
    })
  })

  it("переносит id/configVersion при переименовании объекта и id при переименовании реквизита", () => {
    const reference: ConfigDumpInfo = new Map([
      ["Catalog.Товары", {
        id: "catalog-id",
        configVersion: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        children: new Map([["Catalog.Товары.Attribute.Артикул", "attribute-id"]]),
      }],
    ])

    const result = buildConfigDumpInfo({
      reference,
      yamlState: state(["Справочник.Номенклатура", "Справочник.Номенклатура.Реквизит.КодАртикула"]),
      migrationState: state(["Справочник.Номенклатура", "Справочник.Номенклатура.Реквизит.КодАртикула"]),
      referencePathByCurrentPath: new Map([
        ["Справочник.Номенклатура", "Справочник.Товары"],
        ["Справочник.Номенклатура.Реквизит.КодАртикула", "Справочник.Товары.Реквизит.Артикул"],
      ]),
      generators: { id: () => "new-id", configVersion: () => "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" },
    })

    expect(result.has("Catalog.Товары")).toBe(false)
    expect(result.get("Catalog.Номенклатура")).toEqual({
      id: "catalog-id",
      configVersion: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      children: new Map([["Catalog.Номенклатура.Attribute.КодАртикула", "attribute-id"]]),
    })
  })

  it("создаёт новые id/configVersion только для новых записей", () => {
    const result = buildConfigDumpInfo({
      reference: new Map(),
      yamlState: state(["Справочник.Номенклатура", "Справочник.Номенклатура.Реквизит.Артикул"]),
      migrationState: { nodes: new Map() },
      referencePathByCurrentPath: new Map(),
      generators: { id: () => "generated-id", configVersion: () => "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" },
    })

    expect(result.get("Catalog.Номенклатура")).toEqual({
      id: "generated-id",
      configVersion: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      children: new Map([["Catalog.Номенклатура.Attribute.Артикул", "generated-id"]]),
    })
  })

  it("сохраняет внешнюю запись живого переименованного владельца", () => {
    const reference: ConfigDumpInfo = new Map([
      ["Catalog.Товары", {
        id: "catalog-id",
        configVersion: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        children: new Map(),
      }],
      ["Catalog.Товары.Form.ФормаЭлемента", {
        id: "form-id",
        configVersion: "cccccccccccccccccccccccccccccccccccccccc",
        children: new Map(),
      }],
    ])

    const result = buildConfigDumpInfo({
      reference,
      yamlState: state(["Справочник.Номенклатура"]),
      migrationState: state(["Справочник.Номенклатура"]),
      referencePathByCurrentPath: new Map([["Справочник.Номенклатура", "Справочник.Товары"]]),
      generators: { id: () => "new-id", configVersion: () => "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" },
    })

    expect(result.get("Catalog.Номенклатура.Form.ФормаЭлемента")).toEqual({
      id: "form-id",
      configVersion: "cccccccccccccccccccccccccccccccccccccccc",
      children: new Map(),
    })
  })
})
```

- [ ] **Step 2: Run tests and verify they fail**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/configDumpInfo/build.test.ts
```

Expected: FAIL with module not found.

- [ ] **Step 3: Implement the builder**

```ts
// packages/core/metadata/appliedObjects/configDumpInfo/build.ts
import { randomBytes } from "crypto"
import { v4 } from "uuid"
import type { StructuralState } from "../configuration/migrations/types"
import { configDumpInfoNameFromMigrationPath } from "./nameMapping"
import type { ConfigDumpInfo } from "./types"

export type ConfigDumpInfoGenerators = {
  id: () => string
  configVersion: () => string
}

const defaultGenerators: ConfigDumpInfoGenerators = {
  id: () => v4(),
  configVersion: () => randomBytes(20).toString("hex"),
}

export function buildConfigDumpInfo(params: {
  reference: ConfigDumpInfo
  yamlState: StructuralState
  migrationState: StructuralState
  referencePathByCurrentPath: Map<string, string>
  generators?: Partial<ConfigDumpInfoGenerators>
}): ConfigDumpInfo {
  const generators = { ...defaultGenerators, ...params.generators }
  const result: ConfigDumpInfo = new Map()
  const objectMappings = collectObjectMappings(params)

  for (const mapping of objectMappings) {
    const referenceEntry = mapping.referenceDumpName ? params.reference.get(mapping.referenceDumpName) : undefined
    result.set(mapping.currentDumpName, {
      id: referenceEntry?.id ?? generators.id(),
      configVersion: referenceEntry?.configVersion ?? generators.configVersion(),
      children: new Map(),
    })
  }

  for (const [path] of params.yamlState.nodes) {
    if (isObjectPath(path)) continue
    const ownerPath = path.split(".").slice(0, 2).join(".")
    const ownerMapping = objectMappings.find((mapping) => mapping.currentPath === ownerPath)
    if (!ownerMapping) continue
    const currentDumpName = configDumpInfoNameFromMigrationPath(path)
    const referencePath = resolveReferencePath(params, path)
    const referenceDumpName = referencePath ? configDumpInfoNameFromMigrationPath(referencePath) : undefined
    const referenceChildId = ownerMapping.referenceDumpName && referenceDumpName
      ? params.reference.get(ownerMapping.referenceDumpName)?.children.get(referenceDumpName)
      : undefined
    result.get(ownerMapping.currentDumpName)?.children.set(currentDumpName, referenceChildId ?? generators.id())
  }

  preserveExternalReferenceEntries({ ...params, result, objectMappings })

  return result
}

function collectObjectMappings(params: {
  reference: ConfigDumpInfo
  yamlState: StructuralState
  migrationState: StructuralState
  referencePathByCurrentPath: Map<string, string>
}): Array<{ currentPath: string; currentDumpName: string; referenceDumpName?: string }> {
  return [...params.yamlState.nodes.keys()]
    .filter(isObjectPath)
    .map((currentPath) => {
      const currentDumpName = configDumpInfoNameFromMigrationPath(currentPath)
      const referencePath = resolveReferencePath(params, currentPath)
      const referenceDumpName = referencePath ? configDumpInfoNameFromMigrationPath(referencePath) : undefined
      return { currentPath, currentDumpName, referenceDumpName }
    })
}

function resolveReferencePath(params: {
  reference: ConfigDumpInfo
  migrationState: StructuralState
  referencePathByCurrentPath: Map<string, string>
}, currentPath: string): string | undefined {
  const migratedNode = params.migrationState.nodes.get(currentPath)
  if (migratedNode && migratedNode.referencePath === undefined) return undefined
  const remapped = params.referencePathByCurrentPath.get(currentPath)
  if (remapped) return remapped
  const currentDumpName = configDumpInfoNameFromMigrationPath(currentPath)
  return hasReferenceEntry(params.reference, currentDumpName) ? currentPath : undefined
}

function hasReferenceEntry(reference: ConfigDumpInfo, dumpName: string): boolean {
  if (reference.has(dumpName)) return true
  for (const value of reference.values()) {
    if (value.children.has(dumpName)) return true
  }
  return false
}

function preserveExternalReferenceEntries(params: {
  reference: ConfigDumpInfo
  result: ConfigDumpInfo
  objectMappings: Array<{ currentDumpName: string; referenceDumpName?: string }>
}): void {
  for (const [referenceName, entry] of params.reference) {
    for (const mapping of params.objectMappings) {
      if (!mapping.referenceDumpName) continue
      if (!referenceName.startsWith(`${mapping.referenceDumpName}.`)) continue
      const currentName = `${mapping.currentDumpName}${referenceName.slice(mapping.referenceDumpName.length)}`
      if (params.result.has(currentName)) continue
      params.result.set(currentName, {
        id: entry.id,
        configVersion: entry.configVersion,
        children: new Map(entry.children),
      })
    }
  }
}

function isObjectPath(path: string): boolean {
  return path.split(".").length === 2
}
```

- [ ] **Step 4: Run builder and mapping tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/configDumpInfo/nameMapping.test.ts metadata/appliedObjects/configDumpInfo/build.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/appliedObjects/configDumpInfo/build.ts packages/core/metadata/appliedObjects/configDumpInfo/build.test.ts
git commit -m "feat: :sparkles: строить ConfigDumpInfo из состояния"
```

## Task 4: File IO And syncConfigurationToXML Integration

**Files:**
- Create: `packages/core/metadata/appliedObjects/configDumpInfo/sync.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/syncToXML.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts`

- [ ] **Step 1: Write failing integration tests**

Add the import:

```ts
// packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts
import { importContentFromXML } from "~/xml/import/importer"
```

Add tests near the migration tests.

```ts
it("пишет ConfigDumpInfo.xml и добавляет новый объект", async () => {
  const tmp = getXMLFixturePath("sync/syncConfiguration/_tmp_config_dump_info_new")
  const yamlDir = join(tmp, "yaml")
  const xmlDir = join(tmp, "xml")
  const outDir = join(tmp, "out")
  if (fs.existsSync(tmp)) fs.rmSync(tmp, { recursive: true })
  fs.mkdirSync(join(yamlDir, "Справочник", "Номенклатура"), { recursive: true })
  fs.mkdirSync(xmlDir, { recursive: true })
  fs.writeFileSync(join(yamlDir, "Справочник", "Номенклатура", "Свойства.yaml"), [
    "Реквизиты:",
    "  Артикул:",
    "    Тип: string",
    "",
  ].join("\n"))
  fs.writeFileSync(join(xmlDir, "ConfigDumpInfo.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<ConfigDumpInfo xmlns="http://v8.1c.ru/8.3/xcf/dumpinfo" xmlns:xen="http://v8.1c.ru/8.3/xcf/enums" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" format="Hierarchical" version="2.20">
	<ConfigVersions/>
</ConfigDumpInfo>`, "utf-8")

  try {
    const result = await syncConfigurationToXML({
      context: mockContextToXML(),
      inputDir: yamlDir,
      outputDir: outDir,
      referenceDir: xmlDir,
    })

    expect(result.failed).toEqual([])
    const xml = fs.readFileSync(join(outDir, "ConfigDumpInfo.xml"), "utf-8")
    expect(xml).toContain('name="Catalog.Номенклатура"')
    expect(xml).toContain('name="Catalog.Номенклатура.Attribute.Артикул"')
    expect(xml).toMatch(/configVersion="[0-9a-f]{40}"/)
  } finally {
    if (fs.existsSync(tmp)) fs.rmSync(tmp, { recursive: true })
  }
})

it("переносит ConfigDumpInfo при переименовании и удаляет старое имя", async () => {
  const tmp = getXMLFixturePath("sync/syncConfiguration/_tmp_config_dump_info_rename")
  const yamlDir = join(tmp, "yaml")
  const xmlDir = join(tmp, "xml")
  const outDir = join(tmp, "out")
  if (fs.existsSync(tmp)) fs.rmSync(tmp, { recursive: true })
  fs.mkdirSync(join(yamlDir, "Справочник", "Номенклатура"), { recursive: true })
  fs.mkdirSync(join(yamlDir, "Миграции"), { recursive: true })
  fs.mkdirSync(join(xmlDir, "Catalogs"), { recursive: true })
  fs.writeFileSync(join(yamlDir, "Справочник", "Номенклатура", "Свойства.yaml"), [
    "Реквизиты:",
    "  КодАртикула:",
    "    Тип: string",
    "",
  ].join("\n"))
  fs.writeFileSync(join(yamlDir, "Миграции", "2026-05-05-143000.yaml"), [
    '"Справочник.Товары": "Номенклатура"',
    '"Справочник.Номенклатура.Реквизит.Артикул": "КодАртикула"',
    "",
  ].join("\n"))
  fs.writeFileSync(join(xmlDir, "Catalogs", "Товары.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" version="2.20">
	<Catalog uuid="00000000-0000-0000-0000-000000000001">
		<Properties><Name>Товары</Name><Synonym/><Comment/></Properties>
		<ChildObjects>
			<Attribute uuid="00000000-0000-0000-0000-000000000101">
				<Properties><Name>Артикул</Name><Synonym/><Comment/></Properties>
			</Attribute>
		</ChildObjects>
	</Catalog>
</MetaDataObject>`, "utf-8")
  fs.writeFileSync(join(xmlDir, "ConfigDumpInfo.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<ConfigDumpInfo xmlns="http://v8.1c.ru/8.3/xcf/dumpinfo" xmlns:xen="http://v8.1c.ru/8.3/xcf/enums" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" format="Hierarchical" version="2.20">
	<ConfigVersions>
		<Metadata name="Catalog.Товары" id="catalog-id" configVersion="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa">
			<Metadata name="Catalog.Товары.Attribute.Артикул" id="attribute-id"/>
		</Metadata>
		<Metadata name="Catalog.Товары.Form.ФормаЭлемента" id="form-id" configVersion="cccccccccccccccccccccccccccccccccccccccc"/>
	</ConfigVersions>
</ConfigDumpInfo>`, "utf-8")

  try {
    const result = await syncConfigurationToXML({
      context: mockContextToXML(),
      inputDir: yamlDir,
      outputDir: outDir,
      referenceDir: xmlDir,
    })

    expect(result.failed).toEqual([])
    const parsed = importContentFromXML<{ ConfigDumpInfo: { ConfigVersions: { Metadata: unknown[] } } }>(
      fs.readFileSync(join(outDir, "ConfigDumpInfo.xml"), "utf-8"),
    )
    const metadata = parsed.ConfigDumpInfo.ConfigVersions.Metadata
    expect(JSON.stringify(metadata)).not.toContain("Catalog.Товары")
    expect(JSON.stringify(metadata)).toContain("Catalog.Номенклатура")
    expect(JSON.stringify(metadata)).toContain("catalog-id")
    expect(JSON.stringify(metadata)).toContain("attribute-id")
    expect(JSON.stringify(metadata)).toContain("Catalog.Номенклатура.Form.ФормаЭлемента")
  } finally {
    if (fs.existsSync(tmp)) fs.rmSync(tmp, { recursive: true })
  }
})
```

- [ ] **Step 2: Run integration tests and verify they fail**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/configuration/syncToXML.test.ts
```

Expected: FAIL because `ConfigDumpInfo.xml` is not written.

- [ ] **Step 3: Implement ConfigDumpInfo file sync**

```ts
// packages/core/metadata/appliedObjects/configDumpInfo/sync.ts
import fs from "fs"
import { join } from "path"
import type { ConfigurationContext } from "~/metadata/context/types"
import type { StructuralState } from "../configuration/migrations/types"
import type { XmlSyncManifest } from "../configuration/migrations/xmlManifest"
import { importContentFromXML } from "~/xml/import/importer"
import { xmlExport } from "~/xml/export/exporter"
import { buildConfigDumpInfo } from "./build"
import { importConfigDumpInfoFromXML } from "./fromXML"
import { exportConfigDumpInfoToXML } from "./toXML"
import type { ConfigDumpInfo, ConfigDumpInfoXML } from "./types"

const CONFIG_DUMP_INFO_FILE = "ConfigDumpInfo.xml"

export async function syncConfigDumpInfoToXML(params: {
  context: ConfigurationContext
  outputDir: string
  referenceDir: string
  yamlState: StructuralState
  migrationState: StructuralState
  referencePathByCurrentPath: Map<string, string>
  xmlManifest?: XmlSyncManifest
}): Promise<void> {
  const reference = await readReferenceConfigDumpInfo(params)
  const idMap = buildConfigDumpInfo({
    reference,
    yamlState: params.yamlState,
    migrationState: params.migrationState,
    referencePathByCurrentPath: params.referencePathByCurrentPath,
  })
  const xml = exportConfigDumpInfoToXML({ context: params.context, idMap })
  const outputPath = join(params.outputDir, CONFIG_DUMP_INFO_FILE)
  await fs.promises.mkdir(params.outputDir, { recursive: true })
  await fs.promises.writeFile(outputPath, xmlExport({ ConfigDumpInfo: xml }), "utf-8")
  params.xmlManifest?.addFile(outputPath)
}

async function readReferenceConfigDumpInfo(params: { context: ConfigurationContext; referenceDir: string }): Promise<ConfigDumpInfo> {
  const path = join(params.referenceDir, CONFIG_DUMP_INFO_FILE)
  if (!fs.existsSync(path)) return new Map()
  const source = await fs.promises.readFile(path, "utf-8")
  const parsed = importContentFromXML<{ ConfigDumpInfo: ConfigDumpInfoXML }>(source)
  return importConfigDumpInfoFromXML({ context: params.context, xml: parsed.ConfigDumpInfo })
}
```

- [ ] **Step 4: Integrate into syncConfigurationToXML**

Add imports.

```ts
// packages/core/metadata/appliedObjects/configuration/syncToXML.ts
import { syncConfigDumpInfoToXML } from "../configDumpInfo/sync"
```

Add a local error helper near constants.

```ts
const toError = (error: unknown): Error => error instanceof Error ? error : new Error(String(error))
```

Before `pruneXmlByManifest`, call the helper and return a failed result if it throws. Keep migration state write after this block.

```ts
if (batchResult.failed.length === 0) {
  try {
    await syncConfigDumpInfoToXML({
      context,
      outputDir,
      referenceDir,
      yamlState,
      migrationState: migrationResult.state,
      referencePathByCurrentPath: migrationResult.referencePathByCurrentPath,
      xmlManifest,
    })
  } catch (error) {
    return {
      succeeded: batchResult.succeeded,
      failed: [{ kind: "configDumpInfo", name: "ConfigDumpInfo.xml", error: toError(error) }],
    }
  }

  await pruneXmlByManifest({
    xmlRoot: outputDir,
    xmlDirs: TopLevelMetadataItemRules.flatMap((rule) => rule.xmlDir ? [rule.xmlDir] : []),
    expectedFiles: xmlManifest.expectedFiles(),
  })
  // existing Configuration.xml removal and migration state write stay here
}
```

- [ ] **Step 5: Run integration tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/configuration/syncToXML.test.ts metadata/appliedObjects/configDumpInfo/build.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/appliedObjects/configDumpInfo/sync.ts packages/core/metadata/appliedObjects/configuration/syncToXML.ts packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts
git commit -m "feat: :sparkles: сохранять ConfigDumpInfo при sync"
```

## Task 5: Deletion, Recreate, And Error Handling Coverage

**Files:**
- Modify: `packages/core/metadata/appliedObjects/configDumpInfo/build.test.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts`

- [ ] **Step 1: Add unit tests for deletion and delete+add recreation**

```ts
// packages/core/metadata/appliedObjects/configDumpInfo/build.test.ts
it("не переносит id при Удалить + Добавить того же пути", () => {
  const reference: ConfigDumpInfo = new Map([
    ["Catalog.Товары", {
      id: "old-id",
      configVersion: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      children: new Map(),
    }],
  ])

  const result = buildConfigDumpInfo({
    reference,
    yamlState: state(["Справочник.Товары"]),
    migrationState: { nodes: new Map([["Справочник.Товары", {
      path: "Справочник.Товары",
      kind: "object",
      name: "Товары",
    }]]) },
    referencePathByCurrentPath: new Map(),
    generators: { id: () => "new-id", configVersion: () => "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" },
  })

  expect(result.get("Catalog.Товары")?.id).toBe("new-id")
  expect(result.get("Catalog.Товары")?.configVersion).toBe("bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb")
})

it("удаляет внешние записи удалённого владельца", () => {
  const reference: ConfigDumpInfo = new Map([
    ["Catalog.Товары", {
      id: "old-id",
      configVersion: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      children: new Map(),
    }],
    ["Catalog.Товары.Form.ФормаЭлемента", {
      id: "form-id",
      configVersion: "cccccccccccccccccccccccccccccccccccccccc",
      children: new Map(),
    }],
  ])

  const result = buildConfigDumpInfo({
    reference,
    yamlState: { nodes: new Map() },
    migrationState: { nodes: new Map() },
    referencePathByCurrentPath: new Map(),
    generators: { id: () => "new-id", configVersion: () => "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" },
  })

  expect(result.size).toBe(0)
})
```

- [ ] **Step 2: Add integration test for invalid reference ConfigDumpInfo**

```ts
// packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts
it("возвращает ошибку при битом reference ConfigDumpInfo.xml", async () => {
  const tmp = getXMLFixturePath("sync/syncConfiguration/_tmp_config_dump_info_broken")
  const yamlDir = join(tmp, "yaml")
  const xmlDir = join(tmp, "xml")
  const outDir = join(tmp, "out")
  if (fs.existsSync(tmp)) fs.rmSync(tmp, { recursive: true })
  fs.mkdirSync(join(yamlDir, "Справочник", "Товары"), { recursive: true })
  fs.mkdirSync(xmlDir, { recursive: true })
  fs.writeFileSync(join(yamlDir, "Справочник", "Товары", "Свойства.yaml"), "")
  fs.writeFileSync(join(xmlDir, "ConfigDumpInfo.xml"), "<ConfigDumpInfo><ConfigVersions>", "utf-8")

  try {
    const result = await syncConfigurationToXML({
      context: mockContextToXML(),
      inputDir: yamlDir,
      outputDir: outDir,
      referenceDir: xmlDir,
    })

    expect(result.failed).toHaveLength(1)
    expect(result.failed[0]?.kind).toBe("configDumpInfo")
    expect(result.failed[0]?.name).toBe("ConfigDumpInfo.xml")
  } finally {
    if (fs.existsSync(tmp)) fs.rmSync(tmp, { recursive: true })
  }
})
```

- [ ] **Step 3: Run focused tests and verify failure if implementation misses cases**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/configDumpInfo/build.test.ts metadata/appliedObjects/configuration/syncToXML.test.ts
```

Expected: PASS after Tasks 3-4 are complete. If this fails, fix only the missing branch named by the failing assertion.

- [ ] **Step 4: Commit**

```bash
git add packages/core/metadata/appliedObjects/configDumpInfo/build.test.ts packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts
git commit -m "test: :white_check_mark: покрыть миграции ConfigDumpInfo"
```

## Task 6: Verification And Round-Trip Check

**Files:**
- Verify: all modified files
- Verify: `docs/superpowers/specs/2026-05-28-config-dump-info-design.md`

- [ ] **Step 1: Run all focused ConfigDumpInfo tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/configDumpInfo/fromXML.test.ts metadata/appliedObjects/configDumpInfo/toXML.test.ts metadata/appliedObjects/configDumpInfo/nameMapping.test.ts metadata/appliedObjects/configDumpInfo/build.test.ts metadata/appliedObjects/configuration/syncToXML.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run round-trip-yaml triage for the current diff area**

Run:

```bash
env NKDK_XML_REPO=/Users/nikita/git/round-trip-source ./.agents/skills/round-trip-yaml/round-trip.sh --triage --batch-size 10 --start-index 1
```

Expected: import and sync stages complete. `ConfigDumpInfo.xml` should no longer be reported as the first remaining diff caused by deletion or missing new entries. If another independent diff appears first, record the first path and do not broaden this task.

- [ ] **Step 3: Run full repository tests**

Run:

```bash
pnpm test
```

Expected: all package tests pass.

- [ ] **Step 4: Check git status**

Run:

```bash
git status --short
```

Expected: only intentional source/test changes are present.

- [ ] **Step 5: Commit final verification notes if docs changed**

If implementation updated the spec or this plan with factual verification results, commit those doc changes.

```bash
git add docs/superpowers/specs/2026-05-28-config-dump-info-design.md docs/superpowers/plans/2026-05-28-config-dump-info.md
git commit -m "docs: :memo: обновить проверку ConfigDumpInfo"
```

If no docs changed, skip this commit.

## Self-Review

- Spec coverage: Task 1 covers empty `<ConfigVersions/>` and optional `configVersion`; Task 2 covers Russian migration-path to dumpinfo-name transition without writing Russian segments to XML; Task 3 covers new IDs, rename, delete, external reference preservation; Task 4 integrates writing `ConfigDumpInfo.xml`; Task 5 covers recreate and parse errors; Task 6 covers `round-trip-yaml` and `pnpm test`.
- Placeholder scan: no unresolved markers; each task has concrete files, commands, and expected results.
- Type consistency: `buildConfigDumpInfo`, `syncConfigDumpInfoToXML`, `ConfigDumpInfo`, `StructuralState`, and `referencePathByCurrentPath` are named consistently across tasks.
