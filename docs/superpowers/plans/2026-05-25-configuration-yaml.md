# Configuration YAML Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add root `Конфигурация.yaml` support and rebuild root `Configuration.xml` with computed `ChildObjects`.

**Architecture:** Treat root configuration as a small rule-driven metadata item that lives beside the existing configuration sync orchestration, but is not part of `TopLevelMetadataItemRules`. Root properties use existing property orchestration where possible; custom property types are limited to root-only XML shapes such as application use purposes and mobile functionality flags. `ChildObjects` is a separate pure module that reads YAML folders, preserves reference order, and appends new objects by help-derived type order.

**Tech Stack:** TypeScript, Vitest, existing metadata orchestration rules, `fast-xml-parser` wrappers via `importContentFromXML`/`xmlExport`, `yaml` helpers via `importFromYAML`/`exportToYAML`, `pnpm`.

---

## File Structure

- Create `packages/core/metadata/appliedObjects/configuration/rules.ts`
  Root `MetadataConfigurationRules`; no `xmlDir`; XML root container is `Configuration`.
- Create `packages/core/metadata/appliedObjects/configuration/types.ts`
  Model/YAML types inferred from the rule and helper XML interfaces for root-only property types.
- Create `packages/core/metadata/appliedObjects/configuration/usePurposes.ts`
  Type registration for `<UsePurposes><v8:Value xsi:type="app:ApplicationUsePurpose">...</v8:Value></UsePurposes>`.
- Create `packages/core/metadata/appliedObjects/configuration/mobileFunctionality.ts`
  Type registration for `<UsedMobileApplicationFunctionalities><app:functionality>...</app:functionality></...>`.
- Create `packages/core/metadata/appliedObjects/configuration/rootIO.ts`
  Read/write `Configuration.xml` and `Конфигурация.yaml`.
- Create `packages/core/metadata/appliedObjects/configuration/childObjects.ts`
  Build and order `<ChildObjects>` from YAML project folders.
- Modify `packages/core/metadata/appliedObjects/configuration/convertFromXML.ts`
  Write root `Конфигурация.yaml` before object folders.
- Modify `packages/core/metadata/appliedObjects/configuration/syncToXML.ts`
  Emit root `Configuration.xml` and include it in XML pruning manifest.
- Modify `packages/core/metadata/appliedObjects/configuration/shortRoundTripXML.ts`
  Include root `Configuration.xml` in short XML round-trip.
- Modify `packages/core/metadata/orchestration/metadataItem/registry.ts`
  Register `MetadataConfiguration` and YAML type.
- Modify `packages/core/metadata/orchestration/property/registry.ts`
  Register root-only property types `ConfigurationUsePurposes` and `MobileApplicationFunctionalities`.
- Add tests in `packages/core/metadata/appliedObjects/configuration/rootIO.test.ts`.
- Add tests in `packages/core/metadata/appliedObjects/configuration/childObjects.test.ts`.
- Extend existing sync tests in `convertFromXML.test.ts`, `syncToXML.test.ts`, and `shortRoundTripXML.test.ts`.

## Task 1: Register Root Configuration Rule And Minimal XML Round-Trip

**Files:**
- Create: `packages/core/metadata/appliedObjects/configuration/rules.ts`
- Create: `packages/core/metadata/appliedObjects/configuration/types.ts`
- Modify: `packages/core/metadata/orchestration/metadataItem/registry.ts`
- Test: `packages/core/metadata/appliedObjects/configuration/rootIO.test.ts`

- [ ] **Step 1: Write the failing XML import/export test**

Add `packages/core/metadata/appliedObjects/configuration/rootIO.test.ts`:

```ts
import fs from "fs"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { mockContextFromXML, mockContextToXML } from "~/tests/mockContext"
import { getXMLFixturePath, readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { importMetadataItemFromXML, exportMetadataItemToXML } from "~/metadata/orchestration"
import { importContentFromXML } from "~/xml/import/importer"
import { xmlExport } from "~/xml/export/exporter"
import { MetadataConfigurationRules } from "./rules"

describe("MetadataConfiguration XML", () => {
  it("round-trip minimal Configuration.xml через правила", () => {
    const source = readXMLFileAsString("configuration/minimal.xml")
    const parsed = importContentFromXML<{ MetaDataObject: unknown }>(source)
    const model = importMetadataItemFromXML({
      context: mockContextFromXML(),
      rule: MetadataConfigurationRules,
      xml: parsed.MetaDataObject,
    })
    const reference = importMetadataItemFromXML({
      context: mockContextFromXML({ forReference: true }),
      rule: MetadataConfigurationRules,
      xml: parsed.MetaDataObject,
    })

    const xml = exportMetadataItemToXML({
      context: mockContextToXML(),
      data: model,
      referenceData: reference,
      rule: MetadataConfigurationRules,
    })

    expect(xmlExport(xml)).toBe(source)
  })

  it("round-trip full Configuration.xml через правила без ChildObjects изменений", () => {
    const sourcePath = getXMLFixturePath("configuration/full.xml")
    const source = fs.readFileSync(sourcePath, "utf-8")
    const parsed = importContentFromXML<{ MetaDataObject: unknown }>(source)
    const model = importMetadataItemFromXML({
      context: mockContextFromXML(),
      rule: MetadataConfigurationRules,
      xml: parsed.MetaDataObject,
    })
    const reference = importMetadataItemFromXML({
      context: mockContextFromXML({ forReference: true }),
      rule: MetadataConfigurationRules,
      xml: parsed.MetaDataObject,
    })

    const xml = exportMetadataItemToXML({
      context: mockContextToXML(),
      data: model,
      referenceData: reference,
      rule: MetadataConfigurationRules,
    })

    expect(xmlExport(xml)).toBe(source)
  })
})
```

- [ ] **Step 2: Run the failing test**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/configuration/rootIO.test.ts
```

Expected: FAIL because `./rules` does not exist.

- [ ] **Step 3: Add the minimal rule and types**

Create `packages/core/metadata/appliedObjects/configuration/rules.ts`:

```ts
import { V8_MDCLASSES_ROOT } from "~/metadata/orchestration/appliedObject/presets"
import type { MetadataItemRule } from "~/metadata/orchestration/property/types"

export const MetadataConfigurationRules = {
  itemType: "MetadataConfiguration",
  properties: {
    xmlRoot: {
      type: "XMLRoot",
      container: "Configuration",
      rootAttributes: V8_MDCLASSES_ROOT,
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
    },
    uuid: {
      type: "uuid",
      xml: "_uuid",
      forReferenceOnly: true,
      xmlParents: [],
    },
    name: {
      yaml: "Имя",
      type: "string",
      xmlParents: ["Properties"],
      required: true,
    },
    synonym: {
      yaml: "Синоним",
      type: "I8nText",
      xmlParents: ["Properties"],
      defaultValueXMLRaw: {},
    },
    comment: {
      yaml: "Комментарий",
      type: "string",
      xmlParents: ["Properties"],
      defaultValueXMLRaw: "",
    },
    childObjects: {
      type: "RawXML",
      xml: "ChildObjects",
      xmlParents: [],
      preserveFromReferenceXML: true,
      forReferenceOnly: true,
      toYAML: false,
      fromYAML: false,
    },
  },
} as const satisfies MetadataItemRule
```

Create `packages/core/metadata/appliedObjects/configuration/types.ts`:

```ts
import type { MetadataItemRuleType, MetadataTypeByRule, YAMLTypeByRule } from "~/metadata/orchestration"
import { registerMetadataItemRule } from "~/metadata/orchestration/metadataItem/ruleFactory"
import { MetadataConfigurationRules } from "./rules"

export type MetadataConfiguration = MetadataTypeByRule<typeof MetadataConfigurationRules>
export type MetadataConfigurationYAML = YAMLTypeByRule<typeof MetadataConfigurationRules>

declare module "~/metadata/orchestration/metadataItem/registry" {
  interface MetadataItemTypeRegistry {
    MetadataConfiguration: {
      metadata: MetadataConfiguration
      yaml: MetadataConfigurationYAML
    }
  }
}

export const MetadataConfigurationRuleRegistration = {
  propertyType: "MetadataConfiguration",
  itemRule: MetadataConfigurationRules,
} as const satisfies MetadataItemRuleType

registerMetadataItemRule(MetadataConfigurationRuleRegistration)
```

Create `packages/core/metadata/appliedObjects/configuration/index.ts` if it does not exist; otherwise append:

```ts
export * from "./rules"
export * from "./types"
```

- [ ] **Step 4: Register registry imports**

In `packages/core/metadata/orchestration/metadataItem/registry.ts`, add an import near the other applied object imports:

```ts
import type {
  MetadataConfiguration,
  MetadataConfigurationYAML,
} from "../../appliedObjects/configuration/types"
```

Add to `MetadataItemTypeRegistry`:

```ts
  MetadataConfiguration: {
    metadata: MetadataConfiguration
    yaml: MetadataConfigurationYAML
  }
```

In `packages/core/metadata/appliedObjects/index.ts`, add:

```ts
import "./configuration"
```

- [ ] **Step 5: Run the test and commit**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/configuration/rootIO.test.ts
```

Expected: PASS for minimal XML; full XML may still FAIL on unhandled property changes. If full fails, keep the failure and continue with Task 2 before committing. If both pass, commit:

```bash
git add packages/core/metadata/appliedObjects/configuration packages/core/metadata/orchestration/metadataItem/registry.ts packages/core/metadata/appliedObjects/index.ts
git commit -m "feat: :sparkles: добавить правило корневой конфигурации"
```

## Task 2: Cover Root Configuration Properties From Fixtures

**Files:**
- Modify: `packages/core/metadata/appliedObjects/configuration/rules.ts`
- Create: `packages/core/metadata/appliedObjects/configuration/usePurposes.ts`
- Create: `packages/core/metadata/appliedObjects/configuration/mobileFunctionality.ts`
- Modify: `packages/core/metadata/orchestration/property/registry.ts`
- Test: `packages/core/metadata/appliedObjects/configuration/rootIO.test.ts`

- [ ] **Step 1: Add property type tests for custom XML shapes**

Extend `rootIO.test.ts`:

```ts
import { exportMetadataItemToYAML, importMetadataItemFromYAML } from "~/metadata/orchestration"

it("imports and exports configuration custom collections", () => {
  const source = readXMLFileAsString("configuration/full.xml")
  const parsed = importContentFromXML<{ MetaDataObject: unknown }>(source)
  const model = importMetadataItemFromXML({
    context: mockContextFromXML(),
    rule: MetadataConfigurationRules,
    xml: parsed.MetaDataObject,
  }) as any

  expect(model.usePurposes).toEqual(["PlatformApplication", "MobilePlatformApplication"])
  expect(model.usedMobileApplicationFunctionalities).toContainEqual({ functionality: "Biometrics", use: true })

  const yaml = exportMetadataItemToYAML({
    context: mockContextFromXML(),
    data: model,
    rule: MetadataConfigurationRules,
  }) as any
  expect(yaml["НазначенияИспользования"]).toEqual(["PlatformApplication", "MobilePlatformApplication"])
  expect(yaml["ИспользуемаяФункциональностьМобильногоПриложения"]["Biometrics"]).toBe("Истина")

  const restored = importMetadataItemFromYAML({
    context: mockContextToXML(),
    yaml,
    rule: MetadataConfigurationRules,
    source: model,
  }) as any
  expect(restored.usePurposes).toEqual(model.usePurposes)
  expect(restored.usedMobileApplicationFunctionalities).toEqual(model.usedMobileApplicationFunctionalities)
})
```

- [ ] **Step 2: Run the failing test**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/configuration/rootIO.test.ts
```

Expected: FAIL because `usePurposes` and `usedMobileApplicationFunctionalities` are not registered.

- [ ] **Step 3: Add root-only property type registrations**

Create `packages/core/metadata/appliedObjects/configuration/usePurposes.ts`:

```ts
import { Type, type Static } from "@sinclair/typebox"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import type { BasePropertyRule } from "~/metadata/orchestration/property/types"

export const ConfigurationUsePurposesJSONSchema = Type.Array(Type.String())
export type ConfigurationUsePurposes = string[]
export type ConfigurationUsePurposesYAML = Static<typeof ConfigurationUsePurposesJSONSchema>
export interface ConfigurationUsePurposesXML {
  "v8:Value"?: { "_xsi:type": "app:ApplicationUsePurpose"; "#text"?: string } | Array<{ "_xsi:type": "app:ApplicationUsePurpose"; "#text"?: string }>
}
export interface ConfigurationUsePurposesPropertyRule extends BasePropertyRule {
  type: "ConfigurationUsePurposes"
}

const toArray = <T>(value: T | T[] | undefined): T[] => value === undefined ? [] : Array.isArray(value) ? value : [value]

registerTypeRule("ConfigurationUsePurposes", "importFromXML", (_context, _rule, xml: ConfigurationUsePurposesXML | undefined) => {
  const values = toArray(xml?.["v8:Value"]).map((item) => item["#text"]).filter((item): item is string => typeof item === "string")
  return values.length > 0 ? values : undefined
})

registerTypeRule("ConfigurationUsePurposes", "exportToXML", (_context, _rule, value: ConfigurationUsePurposes | undefined) => {
  if (!value || value.length === 0) return undefined
  return { "v8:Value": value.map((item) => ({ "_xsi:type": "app:ApplicationUsePurpose", "#text": item })) }
})

registerTypeRule("ConfigurationUsePurposes", "exportToYAML", (_context, _rule, value: ConfigurationUsePurposes | undefined) =>
  value && value.length > 0 ? value : undefined
)

registerTypeRule("ConfigurationUsePurposes", "importFromYAML", (_context, _rule, value: ConfigurationUsePurposesYAML | undefined) =>
  value && value.length > 0 ? value : undefined
)

registerTypeRule("ConfigurationUsePurposes", "exportToJSONSchema", () => ConfigurationUsePurposesJSONSchema)
```

Create `packages/core/metadata/appliedObjects/configuration/mobileFunctionality.ts`:

```ts
import { Type, type Static } from "@sinclair/typebox"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import type { BasePropertyRule } from "~/metadata/orchestration/property/types"

export const MobileApplicationFunctionalitiesJSONSchema = Type.Record(
  Type.String(),
  Type.Union([Type.Literal("Истина"), Type.Literal("Ложь")])
)
export type MobileApplicationFunctionalitiesYAML = Static<typeof MobileApplicationFunctionalitiesJSONSchema>
export type MobileApplicationFunctionalities = Array<{ functionality: string; use: boolean }>
export interface MobileApplicationFunctionalitiesXML {
  "app:functionality"?: MobileFunctionalityXML | MobileFunctionalityXML[]
}
export interface MobileFunctionalityXML {
  "app:functionality": string
  "app:use": boolean | "true" | "false"
}
export interface MobileApplicationFunctionalitiesPropertyRule extends BasePropertyRule {
  type: "MobileApplicationFunctionalities"
}

const toArray = <T>(value: T | T[] | undefined): T[] => value === undefined ? [] : Array.isArray(value) ? value : [value]
const toBoolean = (value: boolean | "true" | "false"): boolean => value === true || value === "true"

registerTypeRule("MobileApplicationFunctionalities", "importFromXML", (_context, _rule, xml: MobileApplicationFunctionalitiesXML | undefined) => {
  const values = toArray(xml?.["app:functionality"])
    .map((item) => ({ functionality: item["app:functionality"], use: toBoolean(item["app:use"]) }))
    .filter((item) => typeof item.functionality === "string")
  return values.length > 0 ? values : undefined
})

registerTypeRule("MobileApplicationFunctionalities", "exportToXML", (_context, _rule, value: MobileApplicationFunctionalities | undefined) => {
  if (!value || value.length === 0) return undefined
  return {
    "app:functionality": value.map((item) => ({
      "app:functionality": item.functionality,
      "app:use": item.use,
    })),
  }
})

registerTypeRule("MobileApplicationFunctionalities", "exportToYAML", (_context, _rule, value: MobileApplicationFunctionalities | undefined) => {
  if (!value || value.length === 0) return undefined
  return Object.fromEntries(value.map((item) => [item.functionality, item.use ? "Истина" : "Ложь"]))
})

registerTypeRule("MobileApplicationFunctionalities", "importFromYAML", (_context, _rule, value: MobileApplicationFunctionalitiesYAML | undefined) => {
  if (!value) return undefined
  return Object.entries(value).map(([functionality, use]) => ({ functionality, use: use === "Истина" }))
})

registerTypeRule("MobileApplicationFunctionalities", "exportToJSONSchema", () => MobileApplicationFunctionalitiesJSONSchema)
```

In `configuration/index.ts`, import the registrations:

```ts
import "./usePurposes"
import "./mobileFunctionality"
```

In `property/registry.ts`, import the types and add them to `PropertyTypeRegistry` and `PropertyRuleTypeKeys`:

```ts
import type {
  ConfigurationUsePurposes,
  ConfigurationUsePurposesYAML,
  ConfigurationUsePurposesPropertyRule,
} from "~/metadata/appliedObjects/configuration/usePurposes"
import type {
  MobileApplicationFunctionalities,
  MobileApplicationFunctionalitiesYAML,
  MobileApplicationFunctionalitiesPropertyRule,
} from "~/metadata/appliedObjects/configuration/mobileFunctionality"
```

Add entries:

```ts
  ConfigurationUsePurposes: {
    item: ConfigurationUsePurposes
    yaml: ConfigurationUsePurposesYAML
    rule: ConfigurationUsePurposesPropertyRule
  }
  MobileApplicationFunctionalities: {
    item: MobileApplicationFunctionalities
    yaml: MobileApplicationFunctionalitiesYAML
    rule: MobileApplicationFunctionalitiesPropertyRule
  }
```

And keys:

```ts
  ConfigurationUsePurposes: "ConfigurationUsePurposes",
  MobileApplicationFunctionalities: "MobileApplicationFunctionalities",
```

- [ ] **Step 4: Fill root rules for all properties present in current fixtures**

Extend `MetadataConfigurationRules.properties` with fields from `packages/core/tests/fixtures/configuration/full.xml`. Use this block as the starting point and keep the order from XML/help:

```ts
    namePrefix: { yaml: "ПрефиксИмен", type: "string", xmlParents: ["Properties"], defaultValueXMLRaw: "" },
    configurationExtensionCompatibilityMode: { yaml: "РежимСовместимостиРасширенияКонфигурации", type: "SystemEnumeration", typeSE: "CompatibilityMode", xmlParents: ["Properties"] },
    defaultRunMode: { yaml: "ОсновнойРежимЗапуска", type: "SystemEnumeration", typeSE: "DefaultRunMode", xmlParents: ["Properties"] },
    usePurposes: { yaml: "НазначенияИспользования", type: "ConfigurationUsePurposes", xmlParents: ["Properties"] },
    scriptVariant: { yaml: "ВариантВстроенногоЯзыка", type: "SystemEnumeration", typeSE: "ScriptVariant", xmlParents: ["Properties"] },
    defaultRoles: { yaml: "ОсновныеРоли", type: "MetadataValueCollection", xmlParents: ["Properties"], defaultValueXMLRaw: {} },
    vendor: { yaml: "Поставщик", type: "string", xmlParents: ["Properties"], defaultValueXMLRaw: "" },
    version: { yaml: "Версия", type: "string", xmlParents: ["Properties"], defaultValueXMLRaw: "" },
    updateCatalogAddress: { yaml: "АдресКаталогаОбновлений", type: "string", xmlParents: ["Properties"], defaultValueXMLRaw: "" },
    includeHelpInContents: { yaml: "ВключатьСправкуВСодержание", type: "boolean", xmlParents: ["Properties"] },
    useManagedFormInOrdinaryApplication: { yaml: "ИспользоватьУправляемыеФормыВОбычномПриложении", type: "boolean", xmlParents: ["Properties"] },
    useOrdinaryFormInManagedApplication: { yaml: "ИспользоватьОбычныеФормыВУправляемомПриложении", type: "boolean", xmlParents: ["Properties"] },
    additionalFullTextSearchDictionaries: { yaml: "ДополнительныеСловариПолнотекстовогоПоиска", type: "MetadataValueCollection", xmlParents: ["Properties"], defaultValueXMLRaw: {} },
    commonSettingsStorage: { yaml: "ХранилищеОбщихНастроек", type: "string", xmlParents: ["Properties"], defaultValueXMLRaw: "" },
    reportsUserSettingsStorage: { yaml: "ХранилищеПользовательскихНастроекОтчетов", type: "string", xmlParents: ["Properties"], defaultValueXMLRaw: "" },
    reportsVariantsStorage: { yaml: "ХранилищеВариантовОтчетов", type: "string", xmlParents: ["Properties"], defaultValueXMLRaw: "" },
    formDataSettingsStorage: { yaml: "ХранилищеНастроекДанныхФорм", type: "string", xmlParents: ["Properties"], defaultValueXMLRaw: "" },
    dynamicListsUserSettingsStorage: { yaml: "ХранилищеПользовательскихНастроекДинамическихСписков", type: "string", xmlParents: ["Properties"], defaultValueXMLRaw: "" },
    urlExternalDataStorage: { yaml: "ХранилищеВнешнихДанныхНавигационныхСсылок", type: "string", xml: "URLExternalDataStorage", xmlParents: ["Properties"], defaultValueXMLRaw: "" },
    content: { type: "RawXML", xml: "Content", xmlParents: ["Properties"], preserveFromReferenceXML: true, forReferenceOnly: true, toYAML: false, fromYAML: false },
    defaultReportForm: { yaml: "ОсновнаяФормаОтчета", type: "string", xmlParents: ["Properties"], defaultValueXMLRaw: "" },
    defaultReportVariantForm: { yaml: "ОсновнаяФормаВариантаОтчета", type: "string", xmlParents: ["Properties"], defaultValueXMLRaw: "" },
    defaultReportSettingsForm: { yaml: "ОсновнаяФормаНастроекОтчета", type: "string", xmlParents: ["Properties"], defaultValueXMLRaw: "" },
    defaultReportAppearanceTemplate: { yaml: "ОсновнойМакетОформленияОтчета", type: "string", xmlParents: ["Properties"], defaultValueXMLRaw: "" },
    defaultDynamicListSettingsForm: { yaml: "ОсновнаяФормаНастроекДинамическогоСписка", type: "string", xmlParents: ["Properties"], defaultValueXMLRaw: "" },
    defaultSearchForm: { yaml: "ОсновнаяФормаПоиска", type: "string", xmlParents: ["Properties"], defaultValueXMLRaw: "" },
    defaultDataHistoryChangeHistoryForm: { yaml: "ОсновнаяФормаИсторииИзмененийИсторииДанных", type: "string", xmlParents: ["Properties"], defaultValueXMLRaw: "" },
    defaultDataHistoryVersionDataForm: { yaml: "ОсновнаяФормаДанныхВерсииИсторииДанных", type: "string", xmlParents: ["Properties"], defaultValueXMLRaw: "" },
    defaultDataHistoryVersionDifferencesForm: { yaml: "ОсновнаяФормаРазличийВерсийИсторииДанных", type: "string", xmlParents: ["Properties"], defaultValueXMLRaw: "" },
    defaultCollaborationSystemUsersChoiceForm: { yaml: "ОсновнаяФормаВыбораПользователейСистемыВзаимодействия", type: "string", xmlParents: ["Properties"], defaultValueXMLRaw: "" },
    requiredMobileApplicationPermissions: { type: "RawXML", xml: "RequiredMobileApplicationPermissions", xmlParents: ["Properties"], preserveFromReferenceXML: true, forReferenceOnly: true, toYAML: false, fromYAML: false },
    usedMobileApplicationFunctionalities: { yaml: "ИспользуемаяФункциональностьМобильногоПриложения", type: "MobileApplicationFunctionalities", xmlParents: ["Properties"] },
    standaloneConfigurationRestrictionRoles: { yaml: "РолиОграниченияАвтономнойКонфигурации", type: "MetadataValueCollection", xmlParents: ["Properties"], defaultValueXMLRaw: {} },
    mobileApplicationURLs: { type: "RawXML", xml: "MobileApplicationURLs", xmlParents: ["Properties"], preserveFromReferenceXML: true, forReferenceOnly: true, toYAML: false, fromYAML: false },
    allowedIncomingShareRequestTypes: { type: "RawXML", xml: "AllowedIncomingShareRequestTypes", xmlParents: ["Properties"], preserveFromReferenceXML: true, forReferenceOnly: true, toYAML: false, fromYAML: false },
    mainClientApplicationWindowMode: { yaml: "РежимОсновногоОкнаКлиентскогоПриложения", type: "SystemEnumeration", typeSE: "MainClientApplicationWindowMode", xmlParents: ["Properties"] },
    defaultInterface: { yaml: "ОсновнойИнтерфейс", type: "string", xmlParents: ["Properties"], defaultValueXMLRaw: "" },
    defaultStyle: { yaml: "ОсновнойСтиль", type: "string", xmlParents: ["Properties"], defaultValueXMLRaw: "" },
    defaultLanguage: { yaml: "ОсновнойЯзык", type: "string", xmlParents: ["Properties"], defaultValueXMLRaw: "" },
    briefInformation: { yaml: "КраткаяИнформация", type: "I8nText", xmlParents: ["Properties"], defaultValueXMLRaw: {} },
    detailedInformation: { yaml: "ПодробнаяИнформация", type: "I8nText", xmlParents: ["Properties"], defaultValueXMLRaw: {} },
    copyright: { yaml: "АвторскиеПрава", type: "I8nText", xmlParents: ["Properties"], defaultValueXMLRaw: {} },
    vendorInformationAddress: { yaml: "АдресИнформацииОПоставщике", type: "I8nText", xmlParents: ["Properties"], defaultValueXMLRaw: {} },
    configurationInformationAddress: { yaml: "АдресИнформацииОКонфигурации", type: "I8nText", xmlParents: ["Properties"], defaultValueXMLRaw: {} },
    dataLockControlMode: { yaml: "РежимУправленияБлокировкойДанных", type: "SystemEnumeration", typeSE: "DataLockControlMode", xmlParents: ["Properties"] },
    objectAutonumerationMode: { yaml: "РежимАвтонумерацииОбъектов", type: "SystemEnumeration", typeSE: "ObjectAutonumerationMode", xmlParents: ["Properties"] },
    modalityUseMode: { yaml: "РежимИспользованияМодальности", type: "SystemEnumeration", typeSE: "ModalityUseMode", xmlParents: ["Properties"] },
    synchronousPlatformExtensionAndAddInCallUseMode: { yaml: "РежимИспользованияСинхронныхВызововРасширенийПлатформыИВнешнихКомпонент", type: "SystemEnumeration", typeSE: "SynchronousPlatformExtensionAndAddInCallUseMode", xmlParents: ["Properties"] },
    interfaceCompatibilityMode: { yaml: "РежимСовместимостиИнтерфейса", type: "SystemEnumeration", typeSE: "InterfaceCompatibilityMode", xmlParents: ["Properties"] },
    databaseTablespacesUseMode: { yaml: "РежимИспользованияТабличныхПространствБазыДанных", type: "SystemEnumeration", typeSE: "DatabaseTablespacesUseMode", xmlParents: ["Properties"] },
    compatibilityMode: { yaml: "РежимСовместимости", type: "SystemEnumeration", typeSE: "CompatibilityMode", xmlParents: ["Properties"] },
    defaultConstantsForm: { yaml: "ОсновнаяФормаКонстант", type: "string", xmlParents: ["Properties"], defaultValueXMLRaw: "" },
```

If TypeScript reports a missing system enumeration name, inspect `packages/core/metadata/systemEnumerations/types.ts` and use the exact exported key.

- [ ] **Step 5: Run XML tests and commit**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/configuration/rootIO.test.ts
```

Expected: PASS. Commit:

```bash
git add packages/core/metadata/appliedObjects/configuration packages/core/metadata/orchestration/property/registry.ts
git commit -m "feat: :sparkles: описать свойства Configuration"
```

## Task 3: Root YAML IO Helpers

**Files:**
- Create: `packages/core/metadata/appliedObjects/configuration/rootIO.ts`
- Test: `packages/core/metadata/appliedObjects/configuration/rootIO.test.ts`

- [ ] **Step 1: Add failing root IO tests**

Append:

```ts
import { tmpdir } from "os"
import { readConfigurationFromXML, writeConfigurationToXML, CONFIGURATION_YAML } from "./rootIO"

it("writes root Конфигурация.yaml from Configuration.xml", async () => {
  const inputDir = getXMLFixturePath("configuration")
  const outputDir = fs.mkdtempSync(join(tmpdir(), "configuration-yaml-"))

  await readConfigurationFromXML({ context: mockContextFromXML(), inputDir, outputDir })

  const yaml = fs.readFileSync(join(outputDir, CONFIGURATION_YAML), "utf-8")
  expect(yaml).toContain("Имя: Конфигурация")
  expect(yaml).toContain("Синоним: СинонимКонфигурации")
  expect(yaml).not.toContain("ChildObjects")
})

it("writes root Configuration.xml from Конфигурация.yaml and reference", async () => {
  const referenceDir = getXMLFixturePath("configuration")
  const yamlDir = fs.mkdtempSync(join(tmpdir(), "configuration-yaml-in-"))
  const outputDir = fs.mkdtempSync(join(tmpdir(), "configuration-xml-out-"))

  await readConfigurationFromXML({ context: mockContextFromXML(), inputDir: referenceDir, outputDir: yamlDir })
  await writeConfigurationToXML({
    context: mockContextToXML(),
    inputDir: yamlDir,
    outputDir,
    referenceDir,
  })

  const expected = readXMLFileAsString("configuration/full.xml")
  const result = fs.readFileSync(join(outputDir, "Configuration.xml"), "utf-8")
  expect(result).toBe(expected)
})
```

- [ ] **Step 2: Run failing tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/configuration/rootIO.test.ts
```

Expected: FAIL because `rootIO.ts` does not exist.

- [ ] **Step 3: Implement root IO**

Create `rootIO.ts`:

```ts
import fs from "fs"
import { join } from "path"
import type { ConfigurationContextFromXML, ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import {
  exportMetadataItemToXML,
  exportMetadataItemToYAML,
  importMetadataItemFromXML,
  importMetadataItemFromYAML,
} from "~/metadata/orchestration"
import { xmlExport } from "~/xml/export/exporter"
import { importContentFromXML } from "~/xml/import/importer"
import { exportToYAML } from "~/yaml/export"
import { importFromYAML } from "~/yaml/import"
import { buildConfigurationChildObjectsXML } from "./childObjects"
import { MetadataConfigurationRules } from "./rules"

export const CONFIGURATION_XML = "Configuration.xml"
export const CONFIGURATION_YAML = "Конфигурация.yaml"

export async function readConfigurationFromXML(params: {
  context: ConfigurationContextFromXML
  inputDir: string
  outputDir: string
}): Promise<void> {
  const inputPath = join(params.inputDir, CONFIGURATION_XML)
  if (!fs.existsSync(inputPath)) return
  const content = await fs.promises.readFile(inputPath, "utf-8")
  const parsed = importContentFromXML<{ MetaDataObject: unknown }>(content)
  const model = importMetadataItemFromXML({
    context: params.context,
    rule: MetadataConfigurationRules,
    xml: parsed.MetaDataObject,
  })
  const yamlObj = exportMetadataItemToYAML({ context: params.context, rule: MetadataConfigurationRules, data: model })
  await fs.promises.mkdir(params.outputDir, { recursive: true })
  await fs.promises.writeFile(join(params.outputDir, CONFIGURATION_YAML), yamlObj ? exportToYAML(yamlObj) : "", "utf-8")
}

export async function writeConfigurationToXML(params: {
  context: ConfigurationContextWithExportToXML
  inputDir: string
  outputDir: string
  referenceDir?: string
}): Promise<void> {
  const referenceDir = params.referenceDir ?? params.outputDir
  const yamlPath = join(params.inputDir, CONFIGURATION_YAML)
  const referencePath = join(referenceDir, CONFIGURATION_XML)
  if (!fs.existsSync(yamlPath) && !fs.existsSync(referencePath)) return

  const reference = fs.existsSync(referencePath)
    ? importMetadataItemFromXML({
        context: {
          fromXML: { forReference: true },
          defaultLanguage: params.context.defaultLanguage,
          version: params.context.version,
        },
        rule: MetadataConfigurationRules,
        xml: importContentFromXML<{ MetaDataObject: unknown }>(fs.readFileSync(referencePath, "utf-8")).MetaDataObject,
      })
    : undefined
  const yaml = fs.existsSync(yamlPath) ? importFromYAML(fs.readFileSync(yamlPath, "utf-8")) : undefined
  const model = importMetadataItemFromYAML({
    context: params.context,
    rule: MetadataConfigurationRules,
    yaml,
    source: reference,
    name: "Конфигурация",
  })
  const xml = exportMetadataItemToXML({
    context: params.context,
    rule: MetadataConfigurationRules,
    data: model,
    referenceData: reference,
  }) as { MetaDataObject: { Configuration: Record<string, unknown> } } | undefined
  if (!xml) return

  xml.MetaDataObject.Configuration.ChildObjects = await buildConfigurationChildObjectsXML({
    yamlDir: params.inputDir,
    referenceDir,
  })

  await fs.promises.mkdir(params.outputDir, { recursive: true })
  await fs.promises.writeFile(join(params.outputDir, CONFIGURATION_XML), xmlExport(xml), "utf-8")
}
```

This will not compile until Task 4 creates `childObjects.ts`.

- [ ] **Step 4: Temporarily stub child builder to unblock root IO**

Create a temporary `childObjects.ts`:

```ts
export async function buildConfigurationChildObjectsXML(): Promise<Record<string, never>> {
  return {}
}
```

- [ ] **Step 5: Run tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/configuration/rootIO.test.ts
```

Expected: first YAML test PASS; XML test may FAIL because `ChildObjects` is empty. Keep this failure for Task 4.

## Task 4: Computed ChildObjects

**Files:**
- Replace: `packages/core/metadata/appliedObjects/configuration/childObjects.ts`
- Test: `packages/core/metadata/appliedObjects/configuration/childObjects.test.ts`
- Test: `packages/core/metadata/appliedObjects/configuration/rootIO.test.ts`

- [ ] **Step 1: Add failing child ordering tests**

Create `childObjects.test.ts`:

```ts
import fs from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { buildConfigurationChildObjectsXML } from "./childObjects"

const writeYamlObject = (root: string, typeDir: string, name: string): void => {
  const dir = join(root, typeDir, name)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(join(dir, "Свойства.yaml"), "Имя: " + name + "\n", "utf-8")
}

describe("Configuration ChildObjects", () => {
  it("keeps reference order and omits missing YAML objects", async () => {
    const yamlDir = fs.mkdtempSync(join(tmpdir(), "configuration-child-yaml-"))
    const referenceDir = fs.mkdtempSync(join(tmpdir(), "configuration-child-ref-"))
    fs.writeFileSync(join(referenceDir, "Configuration.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject><Configuration><Properties><Name>Конфигурация</Name></Properties><ChildObjects>
<Language>Русский</Language><Catalog>Б</Catalog><Catalog>А</Catalog><Document>Док1</Document>
</ChildObjects></Configuration></MetaDataObject>`, "utf-8")
    writeYamlObject(yamlDir, "Справочник", "А")
    writeYamlObject(yamlDir, "Справочник", "Б")

    const result = await buildConfigurationChildObjectsXML({ yamlDir, referenceDir })
    expect(result).toEqual({ Language: "Русский", Catalog: ["Б", "А"] })
  })

  it("appends new objects inside type group sorted by name", async () => {
    const yamlDir = fs.mkdtempSync(join(tmpdir(), "configuration-child-new-yaml-"))
    const referenceDir = fs.mkdtempSync(join(tmpdir(), "configuration-child-new-ref-"))
    fs.writeFileSync(join(referenceDir, "Configuration.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject><Configuration><Properties><Name>Конфигурация</Name></Properties><ChildObjects>
<Catalog>Б</Catalog><Document>Док1</Document>
</ChildObjects></Configuration></MetaDataObject>`, "utf-8")
    writeYamlObject(yamlDir, "Справочник", "А")
    writeYamlObject(yamlDir, "Справочник", "Б")
    writeYamlObject(yamlDir, "Справочник", "В")

    const result = await buildConfigurationChildObjectsXML({ yamlDir, referenceDir })
    expect(result).toEqual({ Catalog: ["Б", "А", "В"] })
  })
})
```

- [ ] **Step 2: Run failing tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/configuration/childObjects.test.ts
```

Expected: FAIL because the stub returns `{}`.

- [ ] **Step 3: Implement the builder**

Replace `childObjects.ts`:

```ts
import fs from "fs"
import { basename, join } from "path"
import { importContentFromXML } from "~/xml/import/importer"
import { TopLevelMetadataItemRules } from "./topLevelRules"

type ChildObjectsXML = Record<string, string | string[]>
type ChildEntry = { xml: string; name: string }

const HELP_COLLECTION_ORDER = [
  "HTTPService",
  "WebSocketClient",
  "WebService",
  "WSReference",
  "BusinessProcess",
  "Bot",
  "ExternalDataSource",
  "CommandGroup",
  "Document",
  "DocumentJournal",
  "Task",
  "Constant",
  "FilterCriterion",
  "DocumentNumerator",
  "DataProcessor",
  "CommonPicture",
  "CommonCommand",
  "CommonTemplate",
  "CommonModule",
  "CommonAttribute",
  "CommonForm",
  "DefinedType",
  "Report",
  "XDTOPackage",
  "SessionParameter",
  "FunctionalOptionsParameter",
  "Enum",
  "ChartOfCalculationTypes",
  "ChartOfCharacteristicTypes",
  "ExchangePlan",
  "ChartOfAccounts",
  "EventSubscription",
  "Subsystem",
  "Sequence",
  "AccountingRegister",
  "AccumulationRegister",
  "CalculationRegister",
  "InformationRegister",
  "ScheduledJob",
  "Role",
  "IntegrationService",
  "Catalog",
  "Style",
  "FunctionalOption",
  "SettingsStorage",
  "StyleItem",
  "Language",
] as const

const XML_TAG_BY_YAML_DIR = new Map(
  TopLevelMetadataItemRules
    .filter((rule) => rule.itemTypePrefix && rule.properties.xmlRoot && "container" in rule.properties.xmlRoot)
    .map((rule) => [rule.itemTypePrefix!, (rule.properties.xmlRoot as { container: string }).container])
)

const TYPE_ORDER = new Map<string, number>(HELP_COLLECTION_ORDER.map((xml, index) => [xml, index]))

export async function buildConfigurationChildObjectsXML(params: {
  yamlDir: string
  referenceDir?: string
}): Promise<ChildObjectsXML> {
  const current = await collectYamlChildEntries(params.yamlDir)
  const currentKeys = new Set(current.map(keyOf))
  const reference = readReferenceChildEntries(params.referenceDir)
  const ordered: ChildEntry[] = []
  const emitted = new Set<string>()

  for (const entry of reference) {
    const key = keyOf(entry)
    if (!currentKeys.has(key)) continue
    ordered.push(entry)
    emitted.add(key)
  }

  const remaining = current
    .filter((entry) => !emitted.has(keyOf(entry)))
    .sort(compareChildEntries)
  ordered.push(...remaining)

  return entriesToXML(ordered)
}

async function collectYamlChildEntries(yamlDir: string): Promise<ChildEntry[]> {
  if (!fs.existsSync(yamlDir)) return []
  const result: ChildEntry[] = []
  for (const [yamlTypeDir, xml] of XML_TAG_BY_YAML_DIR) {
    const typeDir = join(yamlDir, yamlTypeDir)
    if (!fs.existsSync(typeDir)) continue
    const entries = await fs.promises.readdir(typeDir, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      if (!fs.existsSync(join(typeDir, entry.name, "Свойства.yaml"))) continue
      result.push({ xml, name: entry.name })
    }
  }
  return result
}

function readReferenceChildEntries(referenceDir: string | undefined): ChildEntry[] {
  if (!referenceDir) return []
  const referencePath = join(referenceDir, "Configuration.xml")
  if (!fs.existsSync(referencePath)) return []
  const parsed = importContentFromXML<{ MetaDataObject?: { Configuration?: { ChildObjects?: Record<string, unknown> } } }>(
    fs.readFileSync(referencePath, "utf-8")
  )
  const childObjects = parsed.MetaDataObject?.Configuration?.ChildObjects
  if (!childObjects || typeof childObjects !== "object") return []
  const result: ChildEntry[] = []
  for (const [xml, value] of Object.entries(childObjects)) {
    const values = Array.isArray(value) ? value : [value]
    for (const name of values) {
      if (typeof name === "string") result.push({ xml, name })
    }
  }
  return result
}

function entriesToXML(entries: ChildEntry[]): ChildObjectsXML {
  const result: ChildObjectsXML = {}
  for (const entry of entries) {
    const previous = result[entry.xml]
    if (previous === undefined) {
      result[entry.xml] = entry.name
    } else if (Array.isArray(previous)) {
      previous.push(entry.name)
    } else {
      result[entry.xml] = [previous, entry.name]
    }
  }
  return result
}

function compareChildEntries(a: ChildEntry, b: ChildEntry): number {
  const typeDiff = (TYPE_ORDER.get(a.xml) ?? Number.MAX_SAFE_INTEGER) - (TYPE_ORDER.get(b.xml) ?? Number.MAX_SAFE_INTEGER)
  if (typeDiff !== 0) return typeDiff
  return a.name.localeCompare(b.name, "ru")
}

const keyOf = (entry: ChildEntry): string => `${entry.xml}\u0000${entry.name}`
```

- [ ] **Step 4: Run child and root IO tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/configuration/childObjects.test.ts packages/core/metadata/appliedObjects/configuration/rootIO.test.ts
```

Expected: PASS. If root full round-trip differs only because `ChildObjects` object key order differs, adjust `HELP_COLLECTION_ORDER` to match `ConfigurationMetadataObject/properties/__categories__` exactly for supported XML tags.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/appliedObjects/configuration
git commit -m "feat: :sparkles: строить ChildObjects из YAML"
```

## Task 5: Integrate Root Configuration Into Sync Flows

**Files:**
- Modify: `packages/core/metadata/appliedObjects/configuration/convertFromXML.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/syncToXML.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/shortRoundTripXML.ts`
- Test: existing tests in same directory

- [ ] **Step 1: Extend existing sync tests**

In `convertFromXML.test.ts`, add assertions after `syncConfigurationFromXML`:

```ts
const resultConfigurationYaml = fs.readFileSync(join(outputDir, "Конфигурация.yaml"), "utf-8")
expect(resultConfigurationYaml).toContain("Имя: Конфигурация")
expect(resultConfigurationYaml).not.toContain("ChildObjects")
```

In `syncToXML.test.ts`, add:

```ts
const expectedConfigurationXML = readXMLFileAsString("sync/syncConfiguration/xml/Configuration.xml")
const resultConfigurationXML = readXMLFileAsString("sync/syncConfiguration/out-to-xml/Configuration.xml")
expect(resultConfigurationXML).toBe(expectedConfigurationXML)
```

In `shortRoundTripXML.test.ts`, add:

```ts
const expectedConfigurationXML = readXMLFileAsString("sync/syncConfiguration/xml/Configuration.xml")
const resultConfigurationXML = fs.readFileSync(join(outputDir, "Configuration.xml"), "utf-8")
expect(resultConfigurationXML).toBe(expectedConfigurationXML)
```

- [ ] **Step 2: Run failing tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/configuration/convertFromXML.test.ts packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts packages/core/metadata/appliedObjects/configuration/shortRoundTripXML.test.ts
```

Expected: FAIL because sync flows do not call root IO.

- [ ] **Step 3: Integrate import flow**

In `convertFromXML.ts`, import:

```ts
import { readConfigurationFromXML } from "./rootIO"
```

At the start of `syncConfigurationFromXML`, after the `inputDir` existence check:

```ts
  await readConfigurationFromXML({ context, inputDir, outputDir })
```

- [ ] **Step 4: Integrate export flow**

In `syncToXML.ts`, import:

```ts
import { CONFIGURATION_XML, writeConfigurationToXML } from "./rootIO"
```

Before `const batchResult = await runBatch(...)`, add:

```ts
  await writeConfigurationToXML({ context, inputDir, outputDir, referenceDir })
  xmlManifest.addFile(join(outputDir, CONFIGURATION_XML))
```

This must happen after `yamlState` and migration checks so conflict validation still runs before writing XML.

- [ ] **Step 5: Integrate short round-trip**

In `shortRoundTripXML.ts`, import `MetadataConfigurationRules` and add a root round-trip before iterating top-level rules:

```ts
const roundTripRootConfigurationXML = (params: { inputDir: string; outputDir: string }) => {
  const source = join(params.inputDir, "Configuration.xml")
  if (!fs.existsSync(source)) return
  const xmlContent = fs.readFileSync(source, "utf-8")
  const parsed = importContentFromXML<{ MetaDataObject: unknown }>(xmlContent)
  const item = importMetadataItemFromXML({
    context: makeContextFromXML(false),
    xml: parsed.MetaDataObject,
    rule: MetadataConfigurationRules,
  })
  const referenceItem = importMetadataItemFromXML({
    context: makeContextFromXML(true),
    xml: parsed.MetaDataObject,
    rule: MetadataConfigurationRules,
  })
  const xmlObj = exportMetadataItemToXML({
    context: makeContextToXML("Конфигурация"),
    data: item,
    referenceData: referenceItem,
    rule: MetadataConfigurationRules,
  })
  if (!xmlObj) return
  fs.mkdirSync(params.outputDir, { recursive: true })
  fs.writeFileSync(join(params.outputDir, "Configuration.xml"), xmlExport(xmlObj), "utf-8")
}
```

Call it near the start of `shortRoundTripXML`:

```ts
  roundTripRootConfigurationXML({ inputDir, outputDir })
```

- [ ] **Step 6: Run tests and commit**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/configuration/convertFromXML.test.ts packages/core/metadata/appliedObjects/configuration/syncToXML.test.ts packages/core/metadata/appliedObjects/configuration/shortRoundTripXML.test.ts
```

Expected: PASS. Commit:

```bash
git add packages/core/metadata/appliedObjects/configuration
git commit -m "feat: :sparkles: включить Configuration в sync"
```

## Task 6: Final Verification And Documentation Check

**Files:**
- Modify only if tests expose needed corrections.

- [ ] **Step 1: Run targeted configuration tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/configuration
```

Expected: PASS.

- [ ] **Step 2: Run package type/test verification**

Run:

```bash
pnpm --filter @nakidka/core test
```

Expected: PASS.

- [ ] **Step 3: Run project verification**

The repository instruction mentions `pnpm --filter nkdk-language langium:generate`, but this workspace currently has no package matching `nkdk-language`. Confirm that with:

```bash
pnpm --filter nkdk-language langium:generate
```

Expected: `No projects matched the filters`.

Then run:

```bash
pnpm test
```

Expected: PASS. If it fails outside configuration-related tests, report the failing package/test and do not hide it.

- [ ] **Step 4: Commit any final fixes**

If Step 1-3 required changes:

```bash
git add packages/core/metadata/appliedObjects/configuration packages/core/metadata/orchestration
git commit -m "fix: :bug: стабилизировать Configuration round-trip"
```

If no changes were required, do not create an empty commit.

---

## Self-Review

Spec coverage:

- Root `Конфигурация.yaml`: Task 3 and Task 5.
- `ChildObjects` computed from YAML folders: Task 4.
- Preserve reference order and append new objects inside type by name: Task 4 tests.
- Use help/res-derived property and type order: Task 2 rules and Task 4 `HELP_COLLECTION_ORDER`.
- Integrate `syncConfigurationFromXML`, `syncConfigurationToXML`, and `shortRoundTripXML`: Task 5.
- Unsupported types tracked separately: already recorded in `todo.md` by the committed spec change; Task 4 filters unsupported types through current `TopLevelMetadataItemRules`.

No placeholders remain. Custom property type names are introduced before use. XML barrier is kept before YAML default tuning.
