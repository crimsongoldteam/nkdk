# ConfigDumpInfo UUID Store Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make YAML -> XML sync write the same UUIDs to object XML files and `ConfigDumpInfo.xml` for new metadata objects, child items, forms, and derived external files.

**Architecture:** Keep `orchestration` generic: rules describe neutral external metadata placement, export code emits neutral records, and `appliedObjects/configDumpInfo` adapts those records to the existing `ConfigDumpInfo` Map. `buildConfigDumpInfo` stops generating IDs for new UUID-bearing metadata entries and uses collected UUIDs instead, while still preserving reference entries and allocating numeric suffixes for derived entries.

**Tech Stack:** TypeScript, Vitest, XML/YAML sync in `packages/core/metadata`, existing `rules.ts` metadata item rules.

---

## File Structure

- Create `packages/core/metadata/orchestration/externalMetadata/types.ts`: neutral rule and collector types used by orchestration and configDumpInfo adapter.
- Create `packages/core/metadata/orchestration/externalMetadata/record.ts`: tiny orchestration helper that records the current item UUID or a derived external file entry through the neutral collector.
- Create `packages/core/metadata/appliedObjects/configDumpInfo/externalMetadataCollector.ts`: adapter from neutral records to the existing `ConfigDumpInfo` Map.
- Create `packages/core/metadata/appliedObjects/configDumpInfo/externalMetadataCollector.test.ts`: focused adapter tests for root, child, owned, and derived entries.
- Modify `packages/core/metadata/context/types.ts`: add `externalMetadata` to `ContextElementToXML` and optional collector to `ToXMLConfigurationContext`.
- Modify `packages/core/metadata/context/helpers.ts`: carry neutral external metadata in `itemsTree`.
- Modify `packages/core/metadata/orchestration/property/types.ts`: add `externalMetadata` to `MetadataItemRule` and `BasePropertyRule`.
- Modify `packages/core/metadata/orchestration/metadataItem/toXML.ts`: push `rule.externalMetadata` into `itemsTree`.
- Modify `packages/core/metadata/commonObjects/uuid/toXML.ts`: after choosing the final UUID, record it through the neutral helper.
- Modify `packages/core/metadata/appliedObjects/configuration/topLevelRules.ts`: wrap top-level rules with root external metadata based on their `XMLRoot.container`.
- Modify child item rules that already represent ConfigDumpInfo children: `metadataAttribute`, `metadataTabularSection`, `metadataRegisterField`, `metadataCommand`, and `metadataEnumeration`.
- Modify external file handlers: `commonObjects/module/toXML.ts`, `commonObjects/help/toXML.ts`, `commonObjects/childFormNames/syncExternalToXML.ts`, and `forms/clientApplicationForm/syncToXML.ts`.
- Modify `packages/core/metadata/appliedObjects/configDumpInfo/types.ts`: allow transient `derivedFrom` on collected entries.
- Modify `packages/core/metadata/appliedObjects/configDumpInfo/build.ts`: consume collected UUIDs and derived records.
- Modify `packages/core/metadata/appliedObjects/configDumpInfo/build.test.ts`: add regression tests for collected UUIDs, missing collected UUIDs, and derived suffix allocation.
- Modify `packages/core/metadata/appliedObjects/configDumpInfo/sync.ts`: pass collected UUIDs into `buildConfigDumpInfo`.
- Modify `packages/core/metadata/appliedObjects/configuration/syncToXML.ts`: install the configDumpInfo collector before exporting objects.
- Modify `packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts`: add integration coverage for a new catalog with a new attribute and for derived external entries.
- Modify `packages/core/tests/mockContext.ts` only if a test needs a ready collector outside `syncConfigurationToXML`; keep default collector optional.

### Task 1: Add Failing Build Tests For Collected UUIDs

**Files:**

- Modify: `packages/core/metadata/appliedObjects/configDumpInfo/build.test.ts`

- [ ] **Step 1: Add the collected UUID test**

Append this test inside `describe("buildConfigDumpInfo", () => { })`, after `создаёт новые id/configVersion только для новых записей`:

```ts
it("берёт id новых объектов и дочерних элементов из накопленного хранилища", () => {
  const collected: ConfigDumpInfo = new Map([
    [
      "Catalog.Номенклатура",
      {
        id: "catalog-uuid-from-xml",
        configVersion: "",
        children: new Map([["Catalog.Номенклатура.Attribute.Артикул", "attribute-uuid-from-xml"]]),
      },
    ],
  ])

  const result = buildConfigDumpInfo({
    reference: new Map(),
    collected,
    yamlState: state(["Справочник.Номенклатура", "Справочник.Номенклатура.Реквизит.Артикул"]),
    migrationState: { nodes: new Map() },
    referencePathByCurrentPath: new Map(),
    generators: {
      id: () => {
        throw new Error("id generator must not be used for collected UUID entries")
      },
      configVersion: () => "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    },
  })

  expect(result.get("Catalog.Номенклатура")).toEqual({
    id: "catalog-uuid-from-xml",
    configVersion: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    children: new Map([["Catalog.Номенклатура.Attribute.Артикул", "attribute-uuid-from-xml"]]),
  })
})
```

- [ ] **Step 2: Add the missing UUID error test**

Append this test after the previous one:

```ts
it("падает для нового управляемого узла без UUID в накопленном хранилище", () => {
  expect(() =>
    buildConfigDumpInfo({
      reference: new Map(),
      collected: new Map(),
      yamlState: state(["Справочник.Номенклатура", "Справочник.Номенклатура.Реквизит.Артикул"]),
      migrationState: { nodes: new Map() },
      referencePathByCurrentPath: new Map(),
      generators: {
        id: () => {
          throw new Error("id generator must not be used")
        },
        configVersion: () => "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      },
    })
  ).toThrow('Не найден UUID ConfigDumpInfo для "Catalog.Номенклатура"')
})
```

- [ ] **Step 3: Add the derived suffix allocation test**

Append this test after the missing UUID test:

```ts
it("назначает производной записи минимальный свободный постфикс с учётом reference", () => {
  const reference: ConfigDumpInfo = new Map([
    [
      "Catalog.Номенклатура",
      {
        id: "catalog-uuid",
        configVersion: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        children: new Map(),
      },
    ],
    [
      "Catalog.Номенклатура.ObjectModule",
      {
        id: "catalog-uuid.0",
        configVersion: "cccccccccccccccccccccccccccccccccccccccc",
        children: new Map(),
      },
    ],
  ])
  const collected: ConfigDumpInfo = new Map([
    [
      "Catalog.Номенклатура.Help",
      {
        id: "",
        configVersion: "",
        derivedFrom: "Catalog.Номенклатура",
        children: new Map(),
      },
    ],
  ])

  const result = buildConfigDumpInfo({
    reference,
    collected,
    yamlState: state(["Справочник.Номенклатура"]),
    migrationState: state(["Справочник.Номенклатура"]),
    referencePathByCurrentPath: new Map(),
    generators: {
      id: () => {
        throw new Error("direct id generator must not be used")
      },
      configVersion: () => "dddddddddddddddddddddddddddddddddddddddd",
    },
  })

  expect(result.get("Catalog.Номенклатура.Help")).toEqual({
    id: "catalog-uuid.1",
    configVersion: "dddddddddddddddddddddddddddddddddddddddd",
    derivedFrom: "Catalog.Номенклатура",
    children: new Map(),
  })
})
```

- [ ] **Step 4: Run the focused tests and confirm they fail**

Run:

```bash
pnpm --filter @nakidka/core test -- configDumpInfo/build.test.ts
```

Expected: FAIL. The current `buildConfigDumpInfo` ignores `collected`, still calls the `id` generator for new direct entries, and does not understand `derivedFrom`.

- [ ] **Step 5: Commit the failing tests**

```bash
git add packages/core/metadata/appliedObjects/configDumpInfo/build.test.ts
git commit -m "test: :white_check_mark: описать UUID из накопителя ConfigDumpInfo"
```

### Task 2: Add Failing Integration Test For New Object UUID Equality

**Files:**

- Modify: `packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts`

- [ ] **Step 1: Add parser helper imports if absent**

The file already imports `importContentFromXML`, `importConfigDumpInfoFromXML`, and `ConfigDumpInfoXML`. Keep those imports. If `ConfigDumpInfoXML` is unused before this task, this test will use it.

- [ ] **Step 2: Add the integration test**

Append this test near `без referenceDir не читает reference из outputDir и создаёт ConfigDumpInfo.xml`:

```ts
it("для нового справочника и реквизита пишет одинаковые UUID в XML и ConfigDumpInfo", async () => {
  const tmp = fs.mkdtempSync(join(os.tmpdir(), "nkdk-configdumpinfo-new-uuid-"))
  const yamlDir = join(tmp, "yaml")
  const outDir = join(tmp, "xml")

  try {
    fs.mkdirSync(join(yamlDir, "Справочник", "Номенклатура"), { recursive: true })
    fs.writeFileSync(join(yamlDir, CONFIGURATION_YAML_FILE), "Имя: Конфигурация\n", "utf-8")
    fs.writeFileSync(
      join(yamlDir, "Справочник", "Номенклатура", "Свойства.yaml"),
      ["Имя: Номенклатура", "Реквизиты:", "  Артикул: {}", ""].join("\n"),
      "utf-8"
    )

    const result = await syncConfigurationToXML({
      context: mockContextToXML(),
      inputDir: yamlDir,
      outputDir: outDir,
    })

    expect(result.failed).toEqual([])

    const catalogXml = importContentFromXML<{
      MetaDataObject: {
        Catalog: {
          _uuid: string
          ChildObjects: { Attribute: { _uuid: string } }
        }
      }
    }>(fs.readFileSync(join(outDir, "Catalogs", "Номенклатура.xml"), "utf-8"))
    const configDumpInfoXml = importContentFromXML<{ ConfigDumpInfo: ConfigDumpInfoXML }>(
      fs.readFileSync(join(outDir, "ConfigDumpInfo.xml"), "utf-8")
    )
    const idMap = importConfigDumpInfoFromXML({ context: mockContextFromXML(), xml: configDumpInfoXml.ConfigDumpInfo })

    const catalogUuid = catalogXml.MetaDataObject.Catalog._uuid
    const attributeUuid = catalogXml.MetaDataObject.Catalog.ChildObjects.Attribute._uuid

    expect(idMap.get("Catalog.Номенклатура")?.id).toBe(catalogUuid)
    expect(idMap.get("Catalog.Номенклатура")?.children.get("Catalog.Номенклатура.Attribute.Артикул")).toBe(
      attributeUuid
    )
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
})
```

- [ ] **Step 3: Run the focused integration test and confirm it fails**

Run:

```bash
pnpm --filter @nakidka/core test -- configuration/syncToXML.test.ts -t "для нового справочника"
```

Expected: FAIL. Current XML object UUIDs and `ConfigDumpInfo.xml` IDs are generated by separate mechanisms.

- [ ] **Step 4: Commit the failing integration test**

```bash
git add packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts
git commit -m "test: :white_check_mark: описать UUID ConfigDumpInfo при sync"
```

### Task 3: Add Neutral External Metadata Contract

**Files:**

- Create: `packages/core/metadata/orchestration/externalMetadata/types.ts`
- Create: `packages/core/metadata/orchestration/externalMetadata/record.ts`
- Modify: `packages/core/metadata/context/types.ts`
- Modify: `packages/core/metadata/context/helpers.ts`
- Modify: `packages/core/metadata/orchestration/property/types.ts`

- [ ] **Step 1: Create neutral types**

Create `packages/core/metadata/orchestration/externalMetadata/types.ts`:

```ts
import type { MetadataItemType } from "../metadataItem/registry"

export type ExternalMetadataItemPlacement = "rootEntry" | "ownerChild" | "ownedEntry"
export type ExternalMetadataPropertyPlacement = "derivedEntry"

export interface ExternalMetadataItemRule {
  segment: string
  placement: ExternalMetadataItemPlacement
}

export interface ExternalMetadataPropertyRule {
  segment: string
  placement: ExternalMetadataPropertyPlacement
}

export interface ExternalMetadataContextItem {
  itemType: MetadataItemType
  name: string
  path: string
  externalMetadata?: ExternalMetadataItemRule
}

export interface ExternalMetadataCollector {
  recordUuid(params: { itemsTree: readonly ExternalMetadataContextItem[]; uuid: string }): void
  recordDerived(params: { itemsTree: readonly ExternalMetadataContextItem[]; segment: string; name?: string }): void
}
```

- [ ] **Step 2: Add orchestration recording helpers**

Create `packages/core/metadata/orchestration/externalMetadata/record.ts`:

```ts
import type { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import type { PropertyRule } from "../property/types"

export function recordCurrentExternalMetadataUuid(params: {
  context: ConfigurationContextWithExportToXML
  uuid: string
}): void {
  const collector = params.context.exportToXML.externalMetadataCollector
  if (!collector) return
  collector.recordUuid({
    itemsTree: params.context.exportToXML.itemsTree,
    uuid: params.uuid,
  })
}

export function recordDerivedExternalMetadata(params: {
  context: ConfigurationContextWithExportToXML
  rule: PropertyRule
  name?: string
}): void {
  const externalMetadata = params.rule.externalMetadata
  if (!externalMetadata || externalMetadata.placement !== "derivedEntry") return

  const collector = params.context.exportToXML.externalMetadataCollector
  if (!collector) return
  collector.recordDerived({
    itemsTree: params.context.exportToXML.itemsTree,
    segment: externalMetadata.segment,
    name: params.name,
  })
}
```

- [ ] **Step 3: Extend context types**

In `packages/core/metadata/context/types.ts`, add the type import:

```ts
import type { ExternalMetadataCollector, ExternalMetadataItemRule } from "../orchestration/externalMetadata/types"
```

Change `ContextElementToXML` to:

```ts
export type ContextElementToXML = {
  name: string
  itemType: MetadataItemType
  path: string
  externalMetadata?: ExternalMetadataItemRule
}
```

Add the collector to `ToXMLConfigurationContext`:

```ts
export type ToXMLConfigurationContext = {
  readonly configDumpInfo: ConfigDumpInfo
  readonly externalMetadataCollector?: ExternalMetadataCollector
  readonly version: string
  readonly itemsTree: ContextElementToXML[]
  context?: {
```

- [ ] **Step 4: Extend `getChildContextToXML`**

In `packages/core/metadata/context/helpers.ts`, import the item rule type:

```ts
import type { ExternalMetadataItemRule } from "../orchestration/externalMetadata/types"
```

Add `externalMetadata?: ExternalMetadataItemRule` to params and to the pushed element:

```ts
export const getChildContextToXML = (params: {
  context: ConfigurationContextWithExportToXML
  itemType: MetadataItemType
  path: string
  name: string
  externalMetadata?: ExternalMetadataItemRule
}): ConfigurationContextWithExportToXML => {
  const { context, itemType, path, name, externalMetadata } = params
  const elements = context.exportToXML.itemsTree

  return {
    ...params.context,
    exportToXML: {
      ...params.context.exportToXML,
      itemsTree: [
        ...elements,
        {
          name,
          itemType,
          path,
          ...(externalMetadata ? { externalMetadata } : {}),
        },
      ],
    },
  }
}
```

- [ ] **Step 5: Extend rule types**

In `packages/core/metadata/orchestration/property/types.ts`, add:

```ts
import type { ExternalMetadataItemRule, ExternalMetadataPropertyRule } from "../externalMetadata/types"
```

Add to `BasePropertyRule`:

```ts
  /** Нейтральное описание внешней metadata-записи, которую создаёт внешний файл свойства. */
  externalMetadata?: ExternalMetadataPropertyRule
```

Add to `MetadataItemRule`:

```ts
  /**
   * Нейтральное описание внешней metadata-записи. Orchestration не знает,
   * какой внешний реестр использует это описание.
   */
  externalMetadata?: ExternalMetadataItemRule
```

- [ ] **Step 6: Run type-focused tests**

Run:

```bash
pnpm --filter @nakidka/core exec tsc --noEmit
```

Expected: PASS after all imports are correct. If this fails because later tasks have not yet wired `externalMetadata` consumers, finish Task 4 and rerun this exact command there before committing.

- [ ] **Step 7: Commit the neutral contract**

```bash
git add packages/core/metadata/orchestration/externalMetadata packages/core/metadata/context/types.ts packages/core/metadata/context/helpers.ts packages/core/metadata/orchestration/property/types.ts
git commit -m "feat: :sparkles: добавить нейтральный договор externalMetadata"
```

### Task 4: Add ConfigDumpInfo Collector Adapter

**Files:**

- Create: `packages/core/metadata/appliedObjects/configDumpInfo/externalMetadataCollector.ts`
- Create: `packages/core/metadata/appliedObjects/configDumpInfo/externalMetadataCollector.test.ts`
- Modify: `packages/core/metadata/appliedObjects/configDumpInfo/types.ts`

- [ ] **Step 1: Extend ConfigDumpInfo entry type**

Replace `ConfigDumpInfo` in `packages/core/metadata/appliedObjects/configDumpInfo/types.ts` with named entry types:

```ts
export interface ConfigDumpInfoEntry {
  children: Map<string, string>
  id: string
  configVersion: string
  /** Transient marker used before buildConfigDumpInfo allocates baseUuid.N for derived external files. */
  derivedFrom?: string
}

export type ConfigDumpInfo = Map<string, ConfigDumpInfoEntry>
```

- [ ] **Step 2: Implement the adapter**

Create `packages/core/metadata/appliedObjects/configDumpInfo/externalMetadataCollector.ts`:

```ts
import type {
  ExternalMetadataCollector,
  ExternalMetadataContextItem,
} from "~/metadata/orchestration/externalMetadata/types"
import type { ConfigDumpInfo } from "./types"

export function createConfigDumpInfoExternalMetadataCollector(target: ConfigDumpInfo): ExternalMetadataCollector {
  return {
    recordUuid({ itemsTree, uuid }) {
      const current = itemsTree[itemsTree.length - 1]
      if (!current?.externalMetadata) return

      const externalName = buildExternalName(itemsTree)
      if (!externalName) {
        throw new Error(`Не удалось определить внешнее имя для "${current.path}"`)
      }

      if (current.externalMetadata.placement === "ownerChild") {
        const ownerName = findOwnerEntryName(itemsTree.slice(0, -1))
        if (!ownerName) {
          throw new Error(`Не найден владелец внешней metadata-записи "${externalName}"`)
        }
        const owner = ensureEntry(target, ownerName, "")
        owner.children.set(externalName, uuid)
        return
      }

      const entry = ensureEntry(target, externalName, uuid)
      entry.id = uuid
    },

    recordDerived({ itemsTree, segment, name }) {
      const baseName = findOwnerEntryName(itemsTree)
      if (!baseName) {
        throw new Error(`Не найден владелец производной внешней metadata-записи "${segment}"`)
      }

      const externalName = [baseName, segment, name].filter((part): part is string => Boolean(part)).join(".")
      const entry = ensureEntry(target, externalName, "")
      entry.derivedFrom = baseName
    },
  }
}

function buildExternalName(itemsTree: readonly ExternalMetadataContextItem[]): string | undefined {
  const parts: string[] = []
  for (const item of itemsTree) {
    if (!item.externalMetadata) continue
    parts.push(item.externalMetadata.segment, item.name)
  }
  return parts.length > 0 ? parts.join(".") : undefined
}

function findOwnerEntryName(itemsTree: readonly ExternalMetadataContextItem[]): string | undefined {
  for (let i = itemsTree.length - 1; i >= 0; i--) {
    const ownerName = buildExternalName(itemsTree.slice(0, i + 1))
    const placement = itemsTree[i]?.externalMetadata?.placement
    if (ownerName && (placement === "rootEntry" || placement === "ownedEntry")) return ownerName
  }
  return undefined
}

function ensureEntry(target: ConfigDumpInfo, name: string, id: string) {
  const existing = target.get(name)
  if (existing) return existing

  const entry = { id, configVersion: "", children: new Map<string, string>() }
  target.set(name, entry)
  return entry
}
```

- [ ] **Step 3: Add adapter tests**

Create `packages/core/metadata/appliedObjects/configDumpInfo/externalMetadataCollector.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { createConfigDumpInfoExternalMetadataCollector } from "./externalMetadataCollector"
import type { ConfigDumpInfo } from "./types"

describe("createConfigDumpInfoExternalMetadataCollector", () => {
  it("records root and owner child UUIDs into one ConfigDumpInfo map", () => {
    const target: ConfigDumpInfo = new Map()
    const collector = createConfigDumpInfoExternalMetadataCollector(target)
    const root = {
      itemType: "MetadataCatalog" as const,
      name: "Номенклатура",
      path: "MetadataCatalog.Номенклатура",
      externalMetadata: { segment: "Catalog", placement: "rootEntry" as const },
    }

    collector.recordUuid({ itemsTree: [root], uuid: "catalog-uuid" })
    collector.recordUuid({
      itemsTree: [
        root,
        {
          itemType: "MetadataAttribute" as const,
          name: "Артикул",
          path: "MetadataAttribute.Артикул",
          externalMetadata: { segment: "Attribute", placement: "ownerChild" as const },
        },
      ],
      uuid: "attribute-uuid",
    })

    expect(target).toEqual(
      new Map([
        [
          "Catalog.Номенклатура",
          {
            id: "catalog-uuid",
            configVersion: "",
            children: new Map([["Catalog.Номенклатура.Attribute.Артикул", "attribute-uuid"]]),
          },
        ],
      ])
    )
  })

  it("records owned entries and derived entries", () => {
    const target: ConfigDumpInfo = new Map()
    const collector = createConfigDumpInfoExternalMetadataCollector(target)
    const root = {
      itemType: "MetadataCatalog" as const,
      name: "Номенклатура",
      path: "MetadataCatalog.Номенклатура",
      externalMetadata: { segment: "Catalog", placement: "rootEntry" as const },
    }
    const form = {
      itemType: "ClientApplicationForm" as never,
      name: "ФормаЭлемента",
      path: "ClientApplicationForm.ФормаЭлемента",
      externalMetadata: { segment: "Form", placement: "ownedEntry" as const },
    }

    collector.recordUuid({ itemsTree: [root], uuid: "catalog-uuid" })
    collector.recordUuid({ itemsTree: [root, form], uuid: "form-uuid" })
    collector.recordDerived({ itemsTree: [root, form], segment: "Form" })
    collector.recordDerived({ itemsTree: [root, form], segment: "Help" })

    expect(target.get("Catalog.Номенклатура.Form.ФормаЭлемента")).toEqual({
      id: "form-uuid",
      configVersion: "",
      children: new Map(),
    })
    expect(target.get("Catalog.Номенклатура.Form.ФормаЭлемента.Form")).toEqual({
      id: "",
      configVersion: "",
      derivedFrom: "Catalog.Номенклатура.Form.ФормаЭлемента",
      children: new Map(),
    })
    expect(target.get("Catalog.Номенклатура.Form.ФормаЭлемента.Help")).toEqual({
      id: "",
      configVersion: "",
      derivedFrom: "Catalog.Номенклатура.Form.ФормаЭлемента",
      children: new Map(),
    })
  })
})
```

- [ ] **Step 4: Run adapter tests**

Run:

```bash
pnpm --filter @nakidka/core test -- configDumpInfo/externalMetadataCollector.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit the adapter**

```bash
git add packages/core/metadata/appliedObjects/configDumpInfo/types.ts packages/core/metadata/appliedObjects/configDumpInfo/externalMetadataCollector.ts packages/core/metadata/appliedObjects/configDumpInfo/externalMetadataCollector.test.ts
git commit -m "feat: :sparkles: добавить накопитель ConfigDumpInfo"
```

### Task 5: Wire Direct UUID Recording From Metadata Item Export

**Files:**

- Modify: `packages/core/metadata/orchestration/metadataItem/toXML.ts`
- Modify: `packages/core/metadata/commonObjects/uuid/toXML.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/topLevelRules.ts`
- Modify: `packages/core/metadata/commonObjects/metadataAttribute/rules.ts`
- Modify: `packages/core/metadata/commonObjects/metadataTabularSection/rules.ts`
- Modify: `packages/core/metadata/commonObjects/metadataRegisterField/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataCommand/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataEnumeration/rules.ts`

- [ ] **Step 1: Push item external metadata into context**

In `packages/core/metadata/orchestration/metadataItem/toXML.ts`, update the `getChildContextToXML` call:

```ts
const effectiveContext: ConfigurationContextWithExportToXML = itemName
  ? getChildContextToXML({
      context,
      itemType: rule.itemType,
      path: `${rule.itemType}.${itemName}`,
      name: itemName,
      externalMetadata: rule.externalMetadata,
    })
  : context
```

- [ ] **Step 2: Record UUID from the uuid property exporter**

In `packages/core/metadata/commonObjects/uuid/toXML.ts`, import and call the helper:

```ts
import { recordCurrentExternalMetadataUuid } from "~/metadata/orchestration/externalMetadata/record"
import { ExportToXMLFunctionNew, registerTypeRule } from "~/metadata/orchestration"
import { getUUID } from "../../helpers/uuid"

export const exportUUIDToXML: ExportToXMLFunctionNew = (params): string => {
  const { context, value, referenceMetadata } = params
  const uuid = (value as string | undefined) ?? (referenceMetadata as string | undefined) ?? getUUID(context)
  recordCurrentExternalMetadataUuid({ context, uuid })
  return uuid
}

registerTypeRule("uuid", "exportToXML", exportUUIDToXML)
```

- [ ] **Step 3: Wrap top-level rules with root external metadata**

In `packages/core/metadata/appliedObjects/configuration/topLevelRules.ts`, keep the existing raw imports and replace the exported array with a wrapped array:

```ts
const RawTopLevelMetadataItemRules: readonly MetadataItemRule[] = [
  MetadataCatalogRules,
  MetadataDocumentRules,
  MetadataDataProcessorRules,
  MetadataReportRules,
  MetadataDocumentJournalRules,
  MetadataHTTPServiceRules,
  MetadataInformationRegisterRules,
  MetadataAccumulationRegisterRules,
  MetadataExchangePlanRules,
  MetadataDocumentNumeratorRules,
  MetadataEnumerationRules,
  MetadataSequenceRules,
  MetadataDefinedTypeRules,
  MetadataSessionParameterRules,
  MetadataEventSubscriptionRules,
  MetadataFilterCriterionRules,
  MetadataFunctionalOptionRules,
  MetadataFunctionalOptionsParameterRules,
  MetadataRoleRules,
  MetadataScheduledJobRules,
  MetadataLanguageRules,
  MetadataCommonTemplateRules,
  MetadataCommonModuleRules,
  MetadataXDTOPackageRules,
  MetadataWebSocketClientRules,
  MetadataExternalDataSourceRules,
  MetadataCommonFormRules,
  MetadataCommonPictureRules,
  MetadataStyleRules,
  MetadataCommonCommandRules,
  MetadataCommandGroupRules,
  MetadataConstantRules,
  MetadataSubsystemRules,
  MetadataAccountingRegisterRules,
  MetadataSettingsStorageRules,
  MetadataStyleItemRules,
  MetadataCommonAttributeRules,
  MetadataBusinessProcessRules,
  MetadataCalculationRegisterRules,
  MetadataChartOfAccountsRules,
  MetadataChartOfCalculationTypesRules,
  MetadataChartOfCharacteristicTypesRules,
  MetadataBotRules,
  MetadataIntegrationServiceRules,
  MetadataTaskRules,
  MetadataWebServiceRules,
  MetadataWSReferenceRules,
]

export const TopLevelMetadataItemRules: readonly MetadataItemRule[] = RawTopLevelMetadataItemRules.map((rule) => ({
  ...rule,
  externalMetadata: rule.externalMetadata ?? { segment: getXMLRootContainer(rule), placement: "rootEntry" },
}))

function getXMLRootContainer(rule: MetadataItemRule): string {
  const xmlRootEntry = Object.values(rule.properties).find((propertyRule) => propertyRule.type === "XMLRoot")
  const container = xmlRootEntry && "container" in xmlRootEntry ? xmlRootEntry.container : undefined
  if (typeof container !== "string" || container.length === 0) {
    throw new Error(`Для top-level правила ${rule.itemType} не найден XMLRoot.container`)
  }
  return container
}
```

- [ ] **Step 4: Mark attribute rules**

In `packages/core/metadata/commonObjects/metadataAttribute/rules.ts`, add:

```ts
const attributeExternalMetadata = { segment: "Attribute", placement: "ownerChild" } as const
```

Then add this field to each exported attribute rule object:

```ts
  externalMetadata: attributeExternalMetadata,
```

The exported rule headers should include it like this:

```ts
export const MetadataAttributeRules = {
  itemType: "MetadataAttribute",
  externalMetadata: attributeExternalMetadata,
  properties: {
```

```ts
export const MetadataCatalogAttributeRules = {
  itemType: "MetadataAttribute",
  externalMetadata: attributeExternalMetadata,
  properties: {
```

```ts
export const MetadataDocumentAttributeRules = {
  itemType: "MetadataAttribute",
  externalMetadata: attributeExternalMetadata,
  properties: {
```

```ts
export const MetadataTabularSectionAttributeRules = {
  itemType: "MetadataAttribute",
  externalMetadata: attributeExternalMetadata,
  properties: {
```

- [ ] **Step 5: Mark tabular section rules**

In `packages/core/metadata/commonObjects/metadataTabularSection/rules.ts`, add:

```ts
const tabularSectionExternalMetadata = { segment: "TabularSection", placement: "ownerChild" } as const
```

Add this field to every exported `Metadata*TabularSectionRules` object:

```ts
  externalMetadata: tabularSectionExternalMetadata,
```

The first rule should start like this:

```ts
export const MetadataTabularSectionRules = {
  itemType: "MetadataTabularSection",
  externalMetadata: tabularSectionExternalMetadata,
  properties: {
```

- [ ] **Step 6: Mark register dimension and resource rules**

In `packages/core/metadata/commonObjects/metadataRegisterField/rules.ts`, add these constants near `registerParentItemTypes`:

```ts
const dimensionExternalMetadata = { segment: "Dimension", placement: "ownerChild" } as const
const resourceExternalMetadata = { segment: "Resource", placement: "ownerChild" } as const
```

Find exported dimension and resource rules in the same file and add the matching field:

```ts
  externalMetadata: dimensionExternalMetadata,
```

for dimension rules, and:

```ts
  externalMetadata: resourceExternalMetadata,
```

for resource rules.

- [ ] **Step 7: Mark command rules**

In `packages/core/metadata/appliedObjects/metadataCommand/rules.ts`, add the item marker and the derived marker on `commandModule`:

```ts
export const MetadataCommandRules = {
  itemType: "MetadataCommand",
  externalMetadata: { segment: "Command", placement: "ownerChild" },
  properties: {
```

and:

```ts
    commandModule: {
      type: "Module",
      externalMetadata: { segment: "CommandModule", placement: "derivedEntry" },
      nkdkPath: ({ name }: { name: string }) => "Команды/" + name + ".bsl",
      xmlPath: ({ name }: { name: string }) => "Commands/" + name + "/Ext/CommandModule.bsl",
      toXML: false,
      fromXML: false,
    },
```

- [ ] **Step 8: Mark enum value rules**

In `packages/core/metadata/appliedObjects/metadataEnumeration/rules.ts`, add:

```ts
export const MetadataEnumerationValueRules = {
  itemType: "MetadataEnumerationValue",
  externalMetadata: { segment: "EnumValue", placement: "ownerChild" },
  properties: {
```

- [ ] **Step 9: Run type check**

Run:

```bash
pnpm --filter @nakidka/core exec tsc --noEmit
```

Expected: PASS. If TypeScript rejects literal placement types, keep the `as const` constants shown above and do not use string variables without literal narrowing.

- [ ] **Step 10: Commit direct UUID wiring**

```bash
git add packages/core/metadata/orchestration/metadataItem/toXML.ts packages/core/metadata/commonObjects/uuid/toXML.ts packages/core/metadata/appliedObjects/configuration/topLevelRules.ts packages/core/metadata/commonObjects/metadataAttribute/rules.ts packages/core/metadata/commonObjects/metadataTabularSection/rules.ts packages/core/metadata/commonObjects/metadataRegisterField/rules.ts packages/core/metadata/appliedObjects/metadataCommand/rules.ts packages/core/metadata/appliedObjects/metadataEnumeration/rules.ts
git commit -m "feat: :sparkles: собирать UUID metadata item при XML export"
```

### Task 6: Install Collector During Configuration Sync

**Files:**

- Modify: `packages/core/metadata/appliedObjects/configuration/syncToXML.ts`
- Modify: `packages/core/metadata/appliedObjects/configDumpInfo/sync.ts`

- [ ] **Step 1: Install the collector at sync start**

In `packages/core/metadata/appliedObjects/configuration/syncToXML.ts`, import:

```ts
import { createConfigDumpInfoExternalMetadataCollector } from "../configDumpInfo/externalMetadataCollector"
```

After `const referenceDir = params.referenceDir`, add:

```ts
const exportContext = context.exportToXML
if (!exportContext.externalMetadataCollector) {
  ;(
    exportContext as typeof exportContext & {
      externalMetadataCollector: NonNullable<typeof exportContext.externalMetadataCollector>
    }
  ).externalMetadataCollector = createConfigDumpInfoExternalMetadataCollector(exportContext.configDumpInfo)
}
```

The cast stays local because `ToXMLConfigurationContext` marks the property readonly.

- [ ] **Step 2: Pass collected IDs to ConfigDumpInfo builder**

In `packages/core/metadata/appliedObjects/configDumpInfo/sync.ts`, update the `buildConfigDumpInfo` call:

```ts
const idMap = buildConfigDumpInfo({
  reference: reference.idMap,
  collected: params.context.exportToXML?.configDumpInfo ?? new Map(),
  yamlState: params.yamlState,
  migrationState: params.migrationState,
  referencePathByCurrentPath: params.referencePathByCurrentPath,
})
```

- [ ] **Step 3: Run the direct UUID tests and confirm build tests still fail**

Run:

```bash
pnpm --filter @nakidka/core test -- configDumpInfo/build.test.ts configuration/syncToXML.test.ts -t "ConfigDumpInfo|нового справочника"
```

Expected: build tests still fail until Task 7 changes `buildConfigDumpInfo`; the integration test may still fail because collected IDs are not consumed yet.

- [ ] **Step 4: Commit collector installation**

```bash
git add packages/core/metadata/appliedObjects/configuration/syncToXML.ts packages/core/metadata/appliedObjects/configDumpInfo/sync.ts
git commit -m "feat: :sparkles: подключить накопитель ConfigDumpInfo к sync"
```

### Task 7: Make buildConfigDumpInfo Consume Collected UUIDs

**Files:**

- Modify: `packages/core/metadata/appliedObjects/configDumpInfo/build.ts`

- [ ] **Step 1: Extend build params**

Change the function signature:

```ts
export function buildConfigDumpInfo(params: {
  reference: ConfigDumpInfo
  collected?: ConfigDumpInfo
  yamlState: StructuralState
  migrationState: StructuralState
  referencePathByCurrentPath: Map<string, string>
  generators?: Partial<ConfigDumpInfoGenerators>
}): ConfigDumpInfo {
```

- [ ] **Step 2: Add direct ID resolver**

Add this helper near `hasReferenceEntry`:

```ts
function resolveDirectId(params: { referenceId?: string; collectedId?: string; dumpName: string }): string {
  if (params.referenceId) return params.referenceId
  if (params.collectedId) return params.collectedId
  throw new Error(`Не найден UUID ConfigDumpInfo для "${params.dumpName}"`)
}
```

- [ ] **Step 3: Use collected IDs for object mappings**

Replace object entry creation:

```ts
entries.set(mapping.currentDumpName, {
  id: referenceEntry?.id ?? generators.id(),
  configVersion: referenceEntry?.configVersion ?? generators.configVersion(),
  children: new Map(),
})
```

with:

```ts
const collectedEntry = params.collected?.get(mapping.currentDumpName)
entries.set(mapping.currentDumpName, {
  id: resolveDirectId({
    referenceId: referenceEntry?.id,
    collectedId: collectedEntry?.derivedFrom ? undefined : collectedEntry?.id,
    dumpName: mapping.currentDumpName,
  }),
  configVersion: referenceEntry?.configVersion ?? collectedEntry?.configVersion ?? generators.configVersion(),
  children: new Map(),
})
```

- [ ] **Step 4: Use collected IDs for owner children**

Before setting a child ID, compute collected child ID:

```ts
const collectedChildId = params.collected?.get(ownerMapping.currentDumpName)?.children.get(currentDumpName)
entries.get(ownerMapping.currentDumpName)?.children.set(
  currentDumpName,
  resolveDirectId({
    referenceId: referenceChildId,
    collectedId: collectedChildId,
    dumpName: currentDumpName,
  })
)
```

This replaces:

```ts
entries.get(ownerMapping.currentDumpName)?.children.set(currentDumpName, referenceChildId ?? generators.id())
```

- [ ] **Step 5: Add collected top-level entries**

Add this helper before `orderEntries`:

```ts
function addCollectedTopLevelEntries(params: {
  entries: ConfigDumpInfo
  reference: ConfigDumpInfo
  collected: ConfigDumpInfo | undefined
  generators: ConfigDumpInfoGenerators
}): void {
  if (!params.collected) return

  for (const [name, collectedEntry] of params.collected) {
    if (collectedEntry.derivedFrom) continue
    if (params.entries.has(name)) continue

    const referenceEntry = params.reference.get(name)
    params.entries.set(name, {
      id: referenceEntry?.id ?? collectedEntry.id,
      configVersion: referenceEntry?.configVersion ?? collectedEntry.configVersion ?? params.generators.configVersion(),
      children: new Map(collectedEntry.children),
    })
  }
}
```

Call it after `preserveExternalReferenceEntries({ ...params, entries, objectMappings })`:

```ts
addCollectedTopLevelEntries({ entries, reference: params.reference, collected: params.collected, generators })
```

- [ ] **Step 6: Add derived entry allocation**

Add these helpers before `orderEntries`:

```ts
function addCollectedDerivedEntries(params: {
  entries: ConfigDumpInfo
  reference: ConfigDumpInfo
  collected: ConfigDumpInfo | undefined
  generators: ConfigDumpInfoGenerators
}): void {
  if (!params.collected) return

  const occupiedByBaseId = collectOccupiedDerivedSuffixes(params.reference)
  collectOccupiedDerivedSuffixes(params.entries, occupiedByBaseId)

  for (const [name, collectedEntry] of params.collected) {
    if (!collectedEntry.derivedFrom) continue
    if (params.entries.has(name)) continue

    const referenceEntry = params.reference.get(name)
    if (referenceEntry) {
      params.entries.set(name, referenceEntry)
      continue
    }

    const baseEntry = params.entries.get(collectedEntry.derivedFrom) ?? params.reference.get(collectedEntry.derivedFrom)
    if (!baseEntry?.id) {
      throw new Error(`Не найден базовый UUID ConfigDumpInfo для "${name}"`)
    }

    const occupied = occupiedByBaseId.get(baseEntry.id) ?? new Set<number>()
    const suffix = nextFreeSuffix(occupied)
    occupied.add(suffix)
    occupiedByBaseId.set(baseEntry.id, occupied)

    params.entries.set(name, {
      id: `${baseEntry.id}.${suffix}`,
      configVersion: collectedEntry.configVersion || params.generators.configVersion(),
      derivedFrom: collectedEntry.derivedFrom,
      children: new Map(),
    })
  }
}

function collectOccupiedDerivedSuffixes(
  entries: ConfigDumpInfo,
  target = new Map<string, Set<number>>()
): Map<string, Set<number>> {
  for (const entry of entries.values()) {
    const match = entry.id.match(/^(.+)\.(\d+)$/)
    if (!match) continue
    const [, baseId, suffixText] = match
    const suffix = Number(suffixText)
    if (!Number.isInteger(suffix)) continue
    const occupied = target.get(baseId) ?? new Set<number>()
    occupied.add(suffix)
    target.set(baseId, occupied)
  }
  return target
}

function nextFreeSuffix(occupied: Set<number>): number {
  let suffix = 0
  while (occupied.has(suffix)) suffix++
  return suffix
}
```

Call after `addCollectedTopLevelEntries`:

```ts
addCollectedDerivedEntries({ entries, reference: params.reference, collected: params.collected, generators })
```

- [ ] **Step 7: Run focused build tests**

Run:

```bash
pnpm --filter @nakidka/core test -- configDumpInfo/build.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit build changes**

```bash
git add packages/core/metadata/appliedObjects/configDumpInfo/build.ts
git commit -m "fix: :bug: брать UUID ConfigDumpInfo из накопителя"
```

### Task 8: Record Derived External Files And Form Entries

**Files:**

- Modify: `packages/core/metadata/commonObjects/module/toXML.ts`
- Modify: `packages/core/metadata/commonObjects/help/toXML.ts`
- Modify: `packages/core/metadata/commonObjects/childFormNames/syncExternalToXML.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/syncToXML.ts`
- Modify: applied-object rule files that define object-level modules and help.

- [ ] **Step 1: Record derived module entries when a module file is written**

In `packages/core/metadata/commonObjects/module/toXML.ts`, import:

```ts
import { recordDerivedExternalMetadata } from "~/metadata/orchestration/externalMetadata/record"
```

After `params.xmlManifest?.addFile(dstPath)`, add:

```ts
recordDerivedExternalMetadata({ context: params.context, rule, name: undefined })
```

To make this compile, add `context` to `syncModuleToXML` params:

```ts
context: ConfigurationContextWithExportToXML
```

and import `ConfigurationContextWithExportToXML` from `~/metadata/context/types`.

- [ ] **Step 2: Record derived help entries when Help.xml is written**

In `packages/core/metadata/commonObjects/help/toXML.ts`, import:

```ts
import { recordDerivedExternalMetadata } from "~/metadata/orchestration/externalMetadata/record"
```

After `params.xmlManifest?.addFile(helpXmlPath)`, add:

```ts
recordDerivedExternalMetadata({ context: params.context, rule, name: undefined })
```

To make this compile, add `context: ConfigurationContextWithExportToXML` to the `syncHelpToXML` params and import the type from `~/metadata/context/types`.

- [ ] **Step 3: Give object-level module properties derived segments**

For object-level module rules, add neutral derived metadata to the existing property definitions:

```ts
objectModule: {
  type: "Module",
  externalMetadata: { segment: "ObjectModule", placement: "derivedEntry" },
  nkdkPath: "МодульОбъекта.bsl",
  xmlPath: "Ext/ObjectModule.bsl",
  toXML: false,
  fromXML: false,
},
```

```ts
managerModule: {
  type: "Module",
  externalMetadata: { segment: "ManagerModule", placement: "derivedEntry" },
  nkdkPath: "МодульМенеджера.bsl",
  xmlPath: "Ext/ManagerModule.bsl",
  toXML: false,
  fromXML: false,
},
```

For object-level help rules, add:

```ts
help: {
  type: "Help",
  externalMetadata: { segment: "Help", placement: "derivedEntry" },
  filePath: "Ext/Help.xml",
  xmlPath: "Ext/Help.xml",
  nkdkDir: "Справка",
  toXML: false,
  fromXML: false,
},
```

Apply these additions to `metadataCatalog/rules.ts`, `metadataDocument/rules.ts`, `metadataDataProcessor/rules.ts`, `metadataReport/rules.ts`, and `metadataEnumeration/rules.ts` first. Then use this search to find every remaining object-level module or help rule and add the same field before committing:

```bash
rg -n "objectModule:|managerModule:|type: \"Help\"" packages/core/metadata/appliedObjects packages/core/metadata/commonObjects
```

Expected after this step: each reported `objectModule` has `externalMetadata: { segment: "ObjectModule", placement: "derivedEntry" }`, each reported `managerModule` has `externalMetadata: { segment: "ManagerModule", placement: "derivedEntry" }`, and each object-level `Help` property has `externalMetadata: { segment: "Help", placement: "derivedEntry" }`.

- [ ] **Step 4: Pass owner context to object-level external sync handlers**

In `packages/core/metadata/orchestration/appliedObject/syncToXML.ts`, in the first loop over `rule.properties`, change:

```ts
      context: contextWithForms,
```

to:

```ts
      context: contextWithOwner,
```

This gives object-level `Module` and `Help` handlers the current object as the base external metadata item.

- [ ] **Step 5: Pass child item context to child collection external sync handlers**

Inside `syncChildCollectionExternalFilesToXML`, before the loop over `childRule.properties`, create:

```ts
const childItemContext = getChildContextToXML({
  context: childContext,
  itemType: childRule.itemType,
  path: `${childRule.itemType}.${item.name}`,
  name: item.name,
  externalMetadata: childRule.externalMetadata,
})
```

Then change the `syncFn` call from:

```ts
          context,
```

to:

```ts
          context: childItemContext,
```

- [ ] **Step 6: Record form metadata UUID and form body derived entry**

In `packages/core/metadata/forms/clientApplicationForm/syncToXML.ts`, import:

```ts
import type { ExternalMetadataContextItem } from "~/metadata/orchestration/externalMetadata/types"
```

Add this helper below `createFormScopedContext`:

```ts
function createFormExternalMetadataContext(params: {
  context: ConfigurationContextWithExportToXML
  formName: string
}): ConfigurationContextWithExportToXML {
  const formItem: ExternalMetadataContextItem = {
    itemType: "ClientApplicationForm" as never,
    name: params.formName,
    path: `ClientApplicationForm.${params.formName}`,
    externalMetadata: { segment: "Form", placement: "ownedEntry" },
  }

  return {
    ...params.context,
    exportToXML: {
      ...params.context.exportToXML,
      itemsTree: [...params.context.exportToXML.itemsTree, formItem],
    },
  }
}
```

In `syncFormToXML`, after the `contextWithFormDir` assignment, add:

```ts
const contextWithFormExternalMetadata = createFormExternalMetadataContext({
  context: contextWithFormDir,
  formName,
})
```

Use `contextWithFormExternalMetadata` instead of `contextWithFormDir` when calling `exportClientApplicationFormToXML`, `exportFormMetadataToXML`, and `writeFormToXML`.

- [ ] **Step 7: Register form metadata UUID**

In `packages/core/metadata/forms/clientApplicationForm/toXML.ts`, import:

```ts
import { recordCurrentExternalMetadataUuid } from "~/metadata/orchestration/externalMetadata/record"
```

After `const uuid = referenceForm?.uuid ?? getUUID(context)`, add:

```ts
recordCurrentExternalMetadataUuid({ context, uuid })
```

- [ ] **Step 8: Register form body and form help derived entries**

In `packages/core/metadata/forms/clientApplicationForm/syncToXML.ts`, after the `writeFormToXML` call, add:

```ts
if (formXML !== undefined) {
  contextWithFormExternalMetadata.exportToXML.externalMetadataCollector?.recordDerived({
    itemsTree: contextWithFormExternalMetadata.exportToXML.itemsTree,
    segment: "Form",
  })
}
```

In `copyFormHelpFilesToXML`, after copying help files does not write `Help.xml`; the actual form help `Help.xml` is written by `copyFormHelpToXML` in `childFormNames/syncExternalToXML.ts`. In that file, import:

```ts
import type { ExternalMetadataContextItem } from "~/metadata/orchestration/externalMetadata/types"
```

In `copyFormHelpToXML`, after `xmlManifest?.addFile(helpXmlPath)`, add:

```ts
const formItem: ExternalMetadataContextItem = {
  itemType: "ClientApplicationForm" as never,
  name: formName,
  path: `ClientApplicationForm.${formName}`,
  externalMetadata: { segment: "Form", placement: "ownedEntry" },
}
const itemsTree = [...params.context.exportToXML.itemsTree, formItem]
params.context.exportToXML.externalMetadataCollector?.recordDerived({ itemsTree, segment: "Help" })
```

To support that code, add `context: ConfigurationContextWithExportToXML` to `copyFormHelpToXML` params and pass `context` from `syncChildFormNamesToXML`.

- [ ] **Step 9: Run derived-entry focused tests**

Run:

```bash
pnpm --filter @nakidka/core test -- configDumpInfo/build.test.ts configuration/syncToXML.test.ts -t "производной|нового справочника"
```

Expected: PASS for the build derived suffix test and the new catalog integration test.

- [ ] **Step 10: Commit derived recording**

```bash
git add packages/core/metadata/commonObjects/module/toXML.ts packages/core/metadata/commonObjects/help/toXML.ts packages/core/metadata/commonObjects/childFormNames/syncExternalToXML.ts packages/core/metadata/forms/clientApplicationForm/syncToXML.ts packages/core/metadata/forms/clientApplicationForm/toXML.ts packages/core/metadata/appliedObjects packages/core/metadata/commonObjects
git commit -m "feat: :sparkles: регистрировать производные записи ConfigDumpInfo"
```

### Task 9: Verify Reference Preservation And Missing UUID Errors

**Files:**

- Modify: `packages/core/metadata/appliedObjects/configDumpInfo/build.test.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts`

- [ ] **Step 1: Add explicit existing derived preservation test**

Append to `build.test.ts`:

```ts
it("не перенумеровывает существующую производную запись из reference", () => {
  const reference: ConfigDumpInfo = new Map([
    [
      "Catalog.Номенклатура",
      {
        id: "catalog-uuid",
        configVersion: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        children: new Map(),
      },
    ],
    [
      "Catalog.Номенклатура.Help",
      {
        id: "catalog-uuid.7",
        configVersion: "cccccccccccccccccccccccccccccccccccccccc",
        children: new Map(),
      },
    ],
  ])
  const collected: ConfigDumpInfo = new Map([
    [
      "Catalog.Номенклатура.Help",
      {
        id: "",
        configVersion: "",
        derivedFrom: "Catalog.Номенклатура",
        children: new Map(),
      },
    ],
  ])

  const result = buildConfigDumpInfo({
    reference,
    collected,
    yamlState: state(["Справочник.Номенклатура"]),
    migrationState: state(["Справочник.Номенклатура"]),
    referencePathByCurrentPath: new Map(),
    generators: {
      id: () => {
        throw new Error("direct id generator must not be used")
      },
      configVersion: () => "dddddddddddddddddddddddddddddddddddddddd",
    },
  })

  expect(result.get("Catalog.Номенклатура.Help")).toEqual({
    id: "catalog-uuid.7",
    configVersion: "cccccccccccccccccccccccccccccccccccccccc",
    children: new Map(),
  })
})
```

- [ ] **Step 2: Add sync error test for missing collected UUID**

Append to `syncToXML.test.ts`:

```ts
it("возвращает ошибку configDumpInfo если новый UUID не попал в накопитель", async () => {
  const tmp = fs.mkdtempSync(join(os.tmpdir(), "nkdk-configdumpinfo-missing-uuid-"))
  const yamlDir = join(tmp, "yaml")
  const outDir = join(tmp, "xml")
  const context = mockContextToXML()
  context.exportToXML.externalMetadataCollector = {
    recordUuid: () => undefined,
    recordDerived: () => undefined,
  }

  try {
    fs.mkdirSync(join(yamlDir, "Справочник", "Номенклатура"), { recursive: true })
    fs.writeFileSync(join(yamlDir, CONFIGURATION_YAML_FILE), "Имя: Конфигурация\n", "utf-8")
    fs.writeFileSync(join(yamlDir, "Справочник", "Номенклатура", "Свойства.yaml"), "Имя: Номенклатура\n", "utf-8")

    const result = await syncConfigurationToXML({
      context,
      inputDir: yamlDir,
      outputDir: outDir,
    })

    expect(result.failed).toHaveLength(1)
    expect(result.failed[0]?.kind).toBe("configDumpInfo")
    expect(result.failed[0]?.error.message).toContain('Не найден UUID ConfigDumpInfo для "Catalog.Номенклатура"')
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
})
```

- [ ] **Step 3: Run regression tests**

Run:

```bash
pnpm --filter @nakidka/core test -- configDumpInfo/build.test.ts configuration/syncToXML.test.ts -t "производную|ошибку configDumpInfo|нового справочника"
```

Expected: PASS.

- [ ] **Step 4: Commit regression coverage**

```bash
git add packages/core/metadata/appliedObjects/configDumpInfo/build.test.ts packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts
git commit -m "test: :white_check_mark: покрыть ошибки UUID ConfigDumpInfo"
```

### Task 10: Run Metadata Boundary Checks And Focused Test Suite

**Files:**

- No file changes unless checks expose a compile error.

- [ ] **Step 1: Run metadata import boundary test**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/importBoundaries.test.ts
```

Expected: PASS. This confirms `orchestration` still does not import `appliedObjects/configDumpInfo`.

- [ ] **Step 2: Run focused ConfigDumpInfo and sync tests**

Run:

```bash
pnpm --filter @nakidka/core test -- configDumpInfo configuration/syncToXML.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run package type check**

Run:

```bash
pnpm --filter @nakidka/core exec tsc --noEmit
```

Expected: PASS.

- [ ] **Step 4: Commit fixes if any were needed**

If Step 1, 2, or 3 required code changes, commit only those changes:

```bash
git add packages/core
git commit -m "fix: :bug: стабилизировать сбор UUID ConfigDumpInfo"
```

If no code changes were needed, do not create an empty commit.

### Task 11: Run Full Project Verification

**Files:**

- No file changes.

- [ ] **Step 1: Run full tests from repository root**

Run:

```bash
pnpm test
```

Expected: all package tests pass. This command is required before closing the issue by project `AGENTS.md`.

- [ ] **Step 2: Inspect final status**

Run:

```bash
git status --short
```

Expected output is empty. If there are unstaged implementation changes, inspect them and either commit the intended files or fix the previous task that left them dirty.

- [ ] **Step 3: Inspect implementation commit series**

Run:

```bash
git log --oneline -12
```

Expected: recent commits include failing tests first, then neutral contract, collector adapter, sync wiring, builder fix, derived registration, regression coverage, and verification fixes only if needed.

## Self-Review

- Spec coverage: Tasks 1, 2, 7, and 9 cover direct UUID equality, missing UUID errors, reference preservation, and generated suffixes. Tasks 3, 4, 5, 6, and 8 cover the neutral architecture where orchestration sees only `externalMetadata` and a collector interface. Task 10 covers boundary checks; Task 11 covers full project verification.
- No placeholders: the plan names every file, includes concrete code snippets for new helpers, tests, and key replacements, and gives exact commands with expected outcomes.
- Type consistency: `externalMetadata`, `ExternalMetadataCollector`, `recordCurrentExternalMetadataUuid`, `recordDerivedExternalMetadata`, `derivedFrom`, and `collected` use the same names across tasks.
- Scope check: the plan stays inside metadata sync and documentation-approved architecture. It does not store UUIDs in YAML, does not edit XML fixtures, and does not introduce a second persistent UUID store.
