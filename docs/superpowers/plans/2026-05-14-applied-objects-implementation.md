# Applied Objects Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement all applied metadata objects listed in `docs/superpowers/specs/2026-05-14-applied-objects-agreed-design.md`, leaving only `metadataExternalDataSource` deferred.

**Architecture:** Use declarative `rules.ts` metadata item definitions and the existing orchestration pipeline for XML, YAML, and sync. Add small common property types only where current rules cannot represent the XML shape: `ChildSubsystemNames`, `ExternalPicture`, `XDTOPackages`, web-service operations/parameters, integration-service channels, task addressing attributes, and reusable recalculation support for calculation registers.

**Tech Stack:** TypeScript, Vitest, Langium-generated language files, existing metadata orchestration helpers, XML/YAML import/export helpers, and binary-safe `fs.copyFile` for external payloads.

---

## Source Documents

- Spec: `docs/superpowers/specs/2026-05-14-applied-objects-agreed-design.md`
- Metadata knowledge index: `.agents/knowledge/metadata/INDEX.md`
- Primary XML fixtures: `packages/core/metadata/appliedObjects/*/__fixtures__/*.xml`
- Updated round-trip fixture roots used by this plan:
  - `/Users/nikita/git/roundTripElements/CommonTemplates`
  - `/Users/nikita/git/roundTripElements/CommonPictures`
  - `/Users/nikita/git/roundTripElements/BusinessProcesses`
  - `/Users/nikita/git/roundTripElements/IntegrationServices`
  - `/Users/nikita/git/roundTripElements/WebServices`

## File Structure

Create one focused directory per new applied object:

- `packages/core/metadata/appliedObjects/<object>/rules.ts`: declarative `MetadataItemRule`.
- `packages/core/metadata/appliedObjects/<object>/types.ts`: `MetadataTypeByRule`, `YAMLTypeByRule`, XML interfaces only where tests or child rules need them.
- `packages/core/metadata/appliedObjects/<object>/index.ts`: exports `types` and `rules`.
- `packages/core/metadata/appliedObjects/<object>/{fromXML,toXML,fromYAML,toYAML,convertFromXML,syncToXML}.test.ts`: standard tests.
- `packages/core/metadata/appliedObjects/<object>/__fixtures__/*.ts`: expected model/YAML fixtures.

Create common helper directories for reusable shapes:

- `packages/core/metadata/commonObjects/childSubsystemNames/*`: list of nested subsystem names.
- `packages/core/metadata/commonObjects/externalPicture/*`: descriptor and binary payload folder sync for common pictures.
- `packages/core/metadata/commonObjects/xDTOPackages/*`: checked XDTO package values for web services.
- `packages/core/metadata/commonObjects/metadataWebServiceOperation/*`: web service operation collection and parameter collection.
- `packages/core/metadata/commonObjects/metadataIntegrationServiceChannel/*`: integration service channel collection.
- `packages/core/metadata/commonObjects/metadataTaskAddressingAttribute/*`: task addressing attributes.
- `packages/core/metadata/commonObjects/recalculation/*`: calculation-register recalculation child object moved to common.

Modify shared registries and entrypoints:

- `packages/core/metadata/appliedObjects/index.ts`: import every new top-level object directory.
- `packages/core/metadata/orchestration/metadataItem/registry.ts`: add metadata/yaml registry entries.
- `packages/core/metadata/orchestration/property/registry.ts`: add property type entries and `PropertyRuleTypeKeys`.
- `packages/core/metadata/commonObjects/index.ts`: import common helper registration files.
- `packages/core/metadata/appliedObjects/configuration/topLevelRules.ts`: add all top-level rules.
- `packages/core/metadata/appliedObjects/configuration/migrations/paths.ts`: add Russian top-level prefixes for object paths.

Use these commands before implementation and before final verification:

```bash
pnpm --filter nkdk-language langium:generate
pnpm test
```

Expected final result: both commands exit with code `0`.

---

### Task 1: Registry Scaffolding For New Object Families

**Files:**
- Modify: `packages/core/metadata/appliedObjects/index.ts`
- Modify: `packages/core/metadata/orchestration/metadataItem/registry.ts`
- Modify: `packages/core/metadata/orchestration/property/registry.ts`
- Modify: `packages/core/metadata/commonObjects/index.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/topLevelRules.ts`
- Modify: `packages/core/metadata/appliedObjects/configuration/migrations/paths.ts`

- [ ] **Step 1: Write registry guard test**

Create `packages/core/metadata/appliedObjects/newObjects.registry.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { TopLevelMetadataItemRules } from "~/metadata/appliedObjects/configuration/topLevelRules"

const expectedItemTypes = [
  "MetadataFunctionalOption",
  "MetadataRole",
  "MetadataScheduledJob",
  "MetadataLanguage",
  "MetadataCommonTemplate",
  "MetadataCommonPicture",
  "MetadataStyle",
  "MetadataCommandGroup",
  "MetadataSubsystem",
  "MetadataAccountingRegister",
  "MetadataBusinessProcess",
  "MetadataCalculationRegister",
  "MetadataChartOfAccounts",
  "MetadataChartOfCalculationTypes",
  "MetadataChartOfCharacteristicTypes",
  "MetadataCommonForm",
  "MetadataIntegrationService",
  "MetadataTask",
  "MetadataWebService",
]

describe("new applied object rules are registered as top-level rules", () => {
  it.each(expectedItemTypes)("registers %s", (itemType) => {
    expect(TopLevelMetadataItemRules.some((rule) => rule.itemType === itemType)).toBe(true)
  })
})
```

- [ ] **Step 2: Run the failing registry guard**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/newObjects.registry.test.ts
```

Expected: FAIL because none or only some of the new item types are registered.

- [ ] **Step 3: Add entrypoint imports**

Append to `packages/core/metadata/appliedObjects/index.ts`:

```ts
import "./metadataFunctionalOption"
import "./metadataRole"
import "./metadataScheduledJob"
import "./metadataLanguage"
import "./metadataCommonTemplate"
import "./metadataCommonPicture"
import "./metadataStyle"
import "./metadataCommandGroup"
import "./metadataSubsystem"
import "./metadataAccountingRegister"
import "./metadataBusinessProcess"
import "./metadataCalculationRegister"
import "./metadataChartOfAccounts"
import "./metadataChartOfCalculationTypes"
import "./metadataChartOfCharacteristicTypes"
import "./metadataCommonForm"
import "./metadataIntegrationService"
import "./metadataTask"
import "./metadataWebService"
```

- [ ] **Step 4: Add placeholder directories with index exports**

For each object in Step 3, create `index.ts` with this exact shape, replacing the object folder path:

```ts
export * from "./types"
export * from "./rules"
```

Do not add behavior yet; each later task fills the object-specific `rules.ts` and `types.ts`.

- [ ] **Step 5: Run the registry guard**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/newObjects.registry.test.ts
```

Expected: FAIL with missing `rules.ts` or missing registry entries. This confirms later tasks must add real rules.

- [ ] **Step 6: Commit scaffolding**

```bash
git add packages/core/metadata/appliedObjects/index.ts packages/core/metadata/appliedObjects/*/index.ts packages/core/metadata/appliedObjects/newObjects.registry.test.ts
git commit -m "test: :white_check_mark: зафиксировать регистрацию новых объектов"
```

### Task 2: ExternalPicture Common Property

**Files:**
- Create: `packages/core/metadata/commonObjects/externalPicture/types.ts`
- Create: `packages/core/metadata/commonObjects/externalPicture/fromXML.ts`
- Create: `packages/core/metadata/commonObjects/externalPicture/toXML.ts`
- Create: `packages/core/metadata/commonObjects/externalPicture/syncExternal.test.ts`
- Modify: `packages/core/metadata/commonObjects/index.ts`
- Modify: `packages/core/metadata/orchestration/property/registry.ts`

- [ ] **Step 1: Write failing binary sync tests**

Create `packages/core/metadata/commonObjects/externalPicture/syncExternal.test.ts`:

```ts
import fs from "fs"
import { join } from "path"
import { describe, expect, it } from "vitest"
import { syncExternalPictureFromXML } from "./fromXML"
import { syncExternalPictureToXML } from "./toXML"

const tmpRoot = join(process.cwd(), "tmp", "external-picture-test")
const rule = {
  type: "ExternalPicture",
  nkdkDir: "Картинка",
  xmlPath: "Ext/Picture.xml",
  payloadXmlDir: "Ext/Picture",
} as const

describe("ExternalPicture sync", () => {
  it("copies Picture.xml and binary payload from XML to nkdk", async () => {
    fs.rmSync(tmpRoot, { recursive: true, force: true })
    const xmlDir = join(tmpRoot, "xml", "CommonPictures")
    const nkdkDir = join(tmpRoot, "nkdk", "ОбщаяКартинкаВсеСвойства")
    fs.mkdirSync(join(xmlDir, "ОбщаяКартинкаВсеСвойства", "Ext", "Picture"), { recursive: true })
    fs.writeFileSync(join(xmlDir, "ОбщаяКартинкаВсеСвойства", "Ext", "Picture.xml"), "<ExtPicture/>")
    fs.writeFileSync(join(xmlDir, "ОбщаяКартинкаВсеСвойства", "Ext", "Picture", "Picture.zip"), Buffer.from([0, 1, 2, 255]))

    await syncExternalPictureFromXML({ rule, xmlDir, nkdkDir, name: "ОбщаяКартинкаВсеСвойства" })

    expect(fs.readFileSync(join(nkdkDir, "Картинка", "Picture.xml"), "utf-8")).toBe("<ExtPicture/>")
    expect([...fs.readFileSync(join(nkdkDir, "Картинка", "Picture.zip"))]).toEqual([0, 1, 2, 255])
  })

  it("copies Picture.xml and binary payload from nkdk to XML", async () => {
    fs.rmSync(tmpRoot, { recursive: true, force: true })
    const xmlDir = join(tmpRoot, "xml", "CommonPictures")
    const nkdkDir = join(tmpRoot, "nkdk", "ОбщаяКартинкаВсеСвойства")
    fs.mkdirSync(join(nkdkDir, "Картинка"), { recursive: true })
    fs.writeFileSync(join(nkdkDir, "Картинка", "Picture.xml"), "<ExtPicture/>")
    fs.writeFileSync(join(nkdkDir, "Картинка", "Picture.png"), Buffer.from([137, 80, 78, 71]))

    await syncExternalPictureToXML({ rule, nkdkDir, xmlDir, name: "ОбщаяКартинкаВсеСвойства" })

    expect(fs.readFileSync(join(xmlDir, "ОбщаяКартинкаВсеСвойства", "Ext", "Picture.xml"), "utf-8")).toBe("<ExtPicture/>")
    expect([...fs.readFileSync(join(xmlDir, "ОбщаяКартинкаВсеСвойства", "Ext", "Picture", "Picture.png"))]).toEqual([
      137,
      80,
      78,
      71,
    ])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/commonObjects/externalPicture/syncExternal.test.ts
```

Expected: FAIL with missing module `./fromXML`.

- [ ] **Step 3: Implement types and XML sync**

Create `packages/core/metadata/commonObjects/externalPicture/types.ts`:

```ts
export type ExternalPicture = true
export type ExternalPictureYAML = true

export interface ExternalPicturePropertyRule {
  type: "ExternalPicture"
  nkdkDir: string
  xmlPath: string
  payloadXmlDir: string
  toXML?: false
  fromXML?: false
}
```

Create `fromXML.ts`:

```ts
import fs from "fs"
import { basename, dirname, join } from "path"
import { registerTypeRule } from "~/metadata/orchestration"
import type { PropertyRule } from "~/metadata/orchestration/property/types"
import type { ExternalPicturePropertyRule } from "./types"

const resolveObjectPath = (xmlDir: string, objectName: string | undefined, relPath: string): string => {
  const direct = join(xmlDir, relPath)
  if (fs.existsSync(direct)) return direct
  return objectName ? join(xmlDir, objectName, relPath) : direct
}

export const syncExternalPictureFromXML = async (params: {
  rule: PropertyRule
  xmlDir: string
  nkdkDir: string
  name?: string
}): Promise<void> => {
  const rule = params.rule as ExternalPicturePropertyRule
  const descriptorSrc = resolveObjectPath(params.xmlDir, params.name, rule.xmlPath)
  if (!fs.existsSync(descriptorSrc)) return

  const pictureDir = join(params.nkdkDir, rule.nkdkDir)
  await fs.promises.mkdir(pictureDir, { recursive: true })
  await fs.promises.copyFile(descriptorSrc, join(pictureDir, basename(rule.xmlPath)))

  const payloadSrcDir = resolveObjectPath(params.xmlDir, params.name, rule.payloadXmlDir)
  if (!fs.existsSync(payloadSrcDir)) return
  const entries = await fs.promises.readdir(payloadSrcDir, { withFileTypes: true })
  for (const entry of entries) {
    if (!entry.isFile()) continue
    await fs.promises.copyFile(join(payloadSrcDir, entry.name), join(pictureDir, entry.name))
  }
}

registerTypeRule("ExternalPicture", "syncExternalFromXML", syncExternalPictureFromXML)
```

Create `toXML.ts`:

```ts
import fs from "fs"
import { basename, dirname, join } from "path"
import { registerTypeRule } from "~/metadata/orchestration"
import type { PropertyRule } from "~/metadata/orchestration/property/types"
import type { ExternalPicturePropertyRule } from "./types"

export const syncExternalPictureToXML = async (params: {
  rule: PropertyRule
  nkdkDir: string
  xmlDir: string
  name?: string
  xmlManifest?: import("~/metadata/appliedObjects/configuration/migrations/xmlManifest").XmlSyncManifest
}): Promise<void> => {
  const rule = params.rule as ExternalPicturePropertyRule
  const pictureDir = join(params.nkdkDir, rule.nkdkDir)
  const descriptorSrc = join(pictureDir, basename(rule.xmlPath))
  if (!fs.existsSync(descriptorSrc)) return

  const objectXmlDir = params.name ? join(params.xmlDir, params.name) : params.xmlDir
  const descriptorDst = join(objectXmlDir, rule.xmlPath)
  await fs.promises.mkdir(dirname(descriptorDst), { recursive: true })
  await fs.promises.copyFile(descriptorSrc, descriptorDst)
  params.xmlManifest?.addFile(descriptorDst)

  const payloadDstDir = join(objectXmlDir, rule.payloadXmlDir)
  await fs.promises.mkdir(payloadDstDir, { recursive: true })
  const entries = await fs.promises.readdir(pictureDir, { withFileTypes: true })
  for (const entry of entries) {
    if (!entry.isFile() || entry.name === basename(rule.xmlPath)) continue
    const dst = join(payloadDstDir, entry.name)
    await fs.promises.copyFile(join(pictureDir, entry.name), dst)
    params.xmlManifest?.addFile(dst)
  }
}

registerTypeRule("ExternalPicture", "syncExternalToXML", syncExternalPictureToXML)
```

- [ ] **Step 4: Register the common type**

Add to `packages/core/metadata/commonObjects/index.ts`:

```ts
import "./externalPicture/fromXML"
import "./externalPicture/toXML"
```

Add imports and registry entry to `packages/core/metadata/orchestration/property/registry.ts`:

```ts
import type { ExternalPicture, ExternalPictureYAML } from "~/metadata/commonObjects/externalPicture/types"
```

Add to `PropertyTypeRegistry`:

```ts
ExternalPicture: {
  item: ExternalPicture
  yaml: ExternalPictureYAML
}
```

Add to `PropertyRuleTypeKeys`:

```ts
ExternalPicture: "ExternalPicture",
```

- [ ] **Step 5: Run tests**

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/commonObjects/externalPicture/syncExternal.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/commonObjects/externalPicture packages/core/metadata/commonObjects/index.ts packages/core/metadata/orchestration/property/registry.ts
git commit -m "feat: :sparkles: добавить внешний тип общей картинки"
```

### Task 3: Small Standalone Objects

**Objects:** `metadataFunctionalOption`, `metadataLanguage`, `metadataCommandGroup`, `metadataCommonTemplate`, `metadataCommonPicture`, `metadataStyle`, `metadataRole`, `metadataScheduledJob`.

**Files:**
- Create or modify each object directory under `packages/core/metadata/appliedObjects/<object>/`
- Modify shared registries listed in Task 1

- [ ] **Step 1: Write the standard tests for one object, then copy the pattern**

For `metadataLanguage`, create `fromXML.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { testExportAppliedObjectToXML, testImportAppliedObjectFromXML } from "~/tests/appliedObject"
import { ru } from "./__fixtures__/ru"
import { en } from "./__fixtures__/en"
import { MetadataLanguageRules } from "./rules"
import type { MetadataLanguage } from "./types"

describe("import MetadataLanguage from XML", () => {
  it.each([
    { fixture: "ru.xml", expected: ru },
    { fixture: "en.xml", expected: en },
  ])("imports $fixture", ({ fixture, expected }) => {
    expect(
      testImportAppliedObjectFromXML<MetadataLanguage>({
        rule: MetadataLanguageRules,
        importMetaUrl: import.meta.url,
        fixture,
      })
    ).toEqual(expected)
  })

  it.each(["ru.xml", "en.xml"])("round-trips %s", (fixture) => {
    const data = testImportAppliedObjectFromXML<MetadataLanguage>({
      rule: MetadataLanguageRules,
      importMetaUrl: import.meta.url,
      fixture,
    })
    const { result, expected } = testExportAppliedObjectToXML({
      rule: MetadataLanguageRules,
      importMetaUrl: import.meta.url,
      fixture,
      data: data!,
    })
    expect(result).toEqual(expected)
  })
})
```

Use the same test shape for the other small objects, changing imports and fixture names:

```ts
const fixtureNames = ["minimal.xml", "full.xml"]
```

For objects with sync external files, add `syncToXML.test.ts` using `expectedFiles`:

```ts
expectedFiles: ["<name>.xml", "<name>/Ext/<ExternalFileName>"]
```

- [ ] **Step 2: Run the tests and verify they fail**

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/metadataLanguage/fromXML.test.ts
```

Expected: FAIL with missing `./rules` or missing fixture model.

- [ ] **Step 3: Implement `MetadataLanguageRules`**

Create `packages/core/metadata/appliedObjects/metadataLanguage/rules.ts`:

```ts
import { V8_MDCLASSES_ROOT } from "~/metadata/orchestration/appliedObject/presets"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"

const properties = ["Properties"]

export const MetadataLanguageRules = {
  itemType: "MetadataLanguage",
  itemTypePrefix: "Язык",
  xmlDir: "Languages",
  properties: {
    xmlRoot: { type: "XMLRoot", container: "Language", rootAttributes: V8_MDCLASSES_ROOT, forReferenceOnly: true, toYAML: false, fromYAML: false },
    uuid: { type: "uuid", xml: "_uuid", forReferenceOnly: true, xmlParents: [] },
    name: { type: "string", xmlParents: properties, required: true, defaultValue: ({ name }: { name?: string }) => name },
    synonym: { yaml: "Синоним", type: "I8nText", xmlParents: properties, defaultValueXMLRaw: "" },
    comment: { yaml: "Комментарий", type: "string", xmlParents: properties, defaultValueXMLRaw: "" },
    languageCode: { yaml: "КодЯзыка", xml: "LanguageCode", type: "string", xmlParents: properties },
    objectBelonging: { yaml: "ПринадлежностьОбъекта", xml: "ObjectBelonging", type: "SystemEnumeration", typeSE: "ObjectBelonging", xmlParents: properties, toYAML: false, fromYAML: false, implicitValueYAML: "Native" },
    extendedConfigurationObject: { xml: "ExtendedConfigurationObject", type: "string", xmlParents: properties, runtimeOnly: true },
  },
} as const satisfies MetadataItemRule
```

Create `types.ts`:

```ts
import { registerMetadataItemRule } from "~/metadata/orchestration"
import { MetadataTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { MetadataLanguageRules } from "./rules"

export type MetadataLanguage = MetadataTypeByRule<typeof MetadataLanguageRules>
export type MetadataLanguageYAML = YAMLTypeByRule<typeof MetadataLanguageRules>

registerMetadataItemRule({
  propertyType: "MetadataLanguage",
  itemRule: MetadataLanguageRules,
})
```

- [ ] **Step 4: Implement the remaining small object rules**

Use the same `xmlRoot`, `uuid`, `name`, `synonym`, `comment`, `objectBelonging`, and `extendedConfigurationObject` fields. Add these object-specific fields:

```ts
// MetadataFunctionalOption
location: { yaml: "Размещение", xml: "Location", type: "string", xmlParents: properties },
privilegedGetMode: { yaml: "ПривилегированныйРежимПриПолучении", xml: "PrivilegedGetMode", type: "boolean", xmlParents: properties, defaultValueXML: true, implicitValueYAML: true },
content: { yaml: "СоставФункциональнойОпции", xml: "Content", type: "MetadataItemLinks", xmlParents: properties, defaultValueXMLRaw: {} },

// MetadataCommonTemplate
templateType: { yaml: "ВидМакета", xml: "TemplateType", type: "SystemEnumeration", typeSE: "TemplateType", xmlParents: properties, defaultValueXML: "SpreadsheetDocument", implicitValueYAML: "SpreadsheetDocument" },
template: { type: "Template", nkdkPath: "Template.xml", xmlPath: "Ext/Template.xml", toXML: false, fromXML: false },

// MetadataCommonPicture
availabilityForChoice: { yaml: "ДоступностьДляВыбора", xml: "AvailabilityForChoice", type: "boolean", xmlParents: properties, defaultValueXML: false, implicitValueYAML: false },
availabilityForAppearance: { yaml: "ДоступностьДляОформления", xml: "AvailabilityForAppearance", type: "boolean", xmlParents: properties, defaultValueXML: false, implicitValueYAML: false },
picture: { type: "ExternalPicture", nkdkDir: "Картинка", xmlPath: "Ext/Picture.xml", payloadXmlDir: "Ext/Picture", toXML: false, fromXML: false },

// MetadataStyle
style: { type: "Template", nkdkPath: "Style.xml", xmlPath: "Ext/Style.xml", toXML: false, fromXML: false },

// MetadataRole
rights: { type: "Template", nkdkPath: "Rights.xml", xmlPath: "Ext/Rights.xml", toXML: false, fromXML: false },

// MetadataScheduledJob
methodName: { yaml: "ИмяМетода", xml: "MethodName", type: "string", xmlParents: properties },
description: { yaml: "Описание", xml: "Description", type: "string", xmlParents: properties, defaultValueXMLRaw: "" },
key: { yaml: "Ключ", xml: "Key", type: "string", xmlParents: properties, defaultValueXMLRaw: "" },
use: { yaml: "Использование", xml: "Use", type: "boolean", xmlParents: properties, defaultValueXML: true, implicitValueYAML: true },
predefined: { yaml: "Предопределенное", xml: "Predefined", type: "boolean", xmlParents: properties, defaultValueXML: false, implicitValueYAML: false },
restartCountOnFailure: { yaml: "КоличествоПовторовПриАварийномЗавершении", xml: "RestartCountOnFailure", type: "number", xmlParents: properties, defaultValueXML: 3, implicitValueYAML: 3 },
restartIntervalOnFailure: { yaml: "ИнтервалПовтораПриАварийномЗавершении", xml: "RestartIntervalOnFailure", type: "number", xmlParents: properties, defaultValueXML: 10, implicitValueYAML: 10 },
schedule: { type: "Template", nkdkPath: "Schedule.xml", xmlPath: "Ext/Schedule.xml", toXML: false, fromXML: false },

// MetadataCommandGroup
representation: { yaml: "Представление", xml: "Representation", type: "SystemEnumeration", typeSE: "ButtonRepresentation", xmlParents: properties, defaultValueXML: "Auto", implicitValueYAML: "Auto" },
toolTip: { yaml: "Подсказка", xml: "ToolTip", type: "I8nText", xmlParents: properties, defaultValueXMLRaw: "" },
picture: { yaml: "Картинка", xml: "Picture", type: "Picture", xmlParents: properties, defaultValueXMLRaw: "" },
category: { yaml: "Категория", xml: "Category", type: "SystemEnumeration", typeSE: "CommandGroupCategory", xmlParents: properties, defaultValueXML: "NavigationPanel", implicitValueYAML: "NavigationPanel" },
```

- [ ] **Step 5: Run small object test files**

```bash
pnpm --filter @nakidka/core exec vitest run \
  packages/core/metadata/appliedObjects/metadataFunctionalOption \
  packages/core/metadata/appliedObjects/metadataLanguage \
  packages/core/metadata/appliedObjects/metadataCommandGroup \
  packages/core/metadata/appliedObjects/metadataCommonTemplate \
  packages/core/metadata/appliedObjects/metadataCommonPicture \
  packages/core/metadata/appliedObjects/metadataStyle \
  packages/core/metadata/appliedObjects/metadataRole \
  packages/core/metadata/appliedObjects/metadataScheduledJob
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/appliedObjects/metadataFunctionalOption packages/core/metadata/appliedObjects/metadataLanguage packages/core/metadata/appliedObjects/metadataCommandGroup packages/core/metadata/appliedObjects/metadataCommonTemplate packages/core/metadata/appliedObjects/metadataCommonPicture packages/core/metadata/appliedObjects/metadataStyle packages/core/metadata/appliedObjects/metadataRole packages/core/metadata/appliedObjects/metadataScheduledJob packages/core/metadata/orchestration packages/core/metadata/appliedObjects/index.ts
git commit -m "feat: :sparkles: добавить простые прикладные объекты"
```

### Task 4: Subsystem And ChildSubsystemNames

**Files:**
- Create: `packages/core/metadata/commonObjects/childSubsystemNames/*`
- Create/modify: `packages/core/metadata/appliedObjects/metadataSubsystem/*`
- Modify registries from Task 1

- [ ] **Step 1: Write `ChildSubsystemNames` tests**

Create `packages/core/metadata/commonObjects/childSubsystemNames/fromXML.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { importChildSubsystemNamesFromXML } from "./fromXML"

describe("ChildSubsystemNames XML import", () => {
  it("imports undefined as undefined", () => {
    expect(importChildSubsystemNamesFromXML(undefined)).toBeUndefined()
  })

  it("imports single subsystem name", () => {
    expect(importChildSubsystemNamesFromXML("ПодчиненнаяПодсистема")).toEqual(["ПодчиненнаяПодсистема"])
  })

  it("imports several subsystem names", () => {
    expect(importChildSubsystemNamesFromXML(["А", "Б"])).toEqual(["А", "Б"])
  })
})
```

- [ ] **Step 2: Implement `ChildSubsystemNames`**

Create `types.ts`, `fromXML.ts`, `toXML.ts`, `fromYAML.ts`, `toYAML.ts`:

```ts
export type ChildSubsystemNames = string[]
export type ChildSubsystemNamesXML = string | string[]
export type ChildSubsystemNamesYAML = string[]
```

```ts
import { registerTypeRule } from "~/metadata/orchestration"
import type { ChildSubsystemNames, ChildSubsystemNamesXML } from "./types"

export const importChildSubsystemNamesFromXML = (
  value: ChildSubsystemNamesXML | undefined
): ChildSubsystemNames | undefined => {
  if (value === undefined) return undefined
  return Array.isArray(value) ? value : [value]
}

registerTypeRule("ChildSubsystemNames", "importFromXML", (_context, _rule, value) =>
  importChildSubsystemNamesFromXML(value as ChildSubsystemNamesXML | undefined)
)
```

```ts
import { registerTypeRule } from "~/metadata/orchestration"
import type { ChildSubsystemNames, ChildSubsystemNamesXML } from "./types"

export const exportChildSubsystemNamesToXML = (value: ChildSubsystemNames | undefined): ChildSubsystemNamesXML | undefined => {
  if (!value || value.length === 0) return undefined
  return value.length === 1 ? value[0] : value
}

registerTypeRule("ChildSubsystemNames", "exportToXML", (_context, _rule, value) =>
  exportChildSubsystemNamesToXML(value as ChildSubsystemNames | undefined)
)
```

```ts
import { registerTypeRule } from "~/metadata/orchestration"

registerTypeRule("ChildSubsystemNames", "importFromYAML", (_context, _rule, value) => value)
registerTypeRule("ChildSubsystemNames", "exportToYAML", (_context, _rule, value) => value)
```

- [ ] **Step 3: Implement `MetadataSubsystemRules`**

Create `packages/core/metadata/appliedObjects/metadataSubsystem/rules.ts` with properties from the spec:

```ts
import { V8_MDCLASSES_ROOT } from "~/metadata/orchestration/appliedObject/presets"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"

const properties = ["Properties"]
const childObjects = ["ChildObjects"]

export const MetadataSubsystemRules = {
  itemType: "MetadataSubsystem",
  itemTypePrefix: "Подсистема",
  xmlDir: "Subsystems",
  properties: {
    xmlRoot: { type: "XMLRoot", container: "Subsystem", rootAttributes: V8_MDCLASSES_ROOT, forReferenceOnly: true, toYAML: false, fromYAML: false },
    uuid: { type: "uuid", xml: "_uuid", forReferenceOnly: true, xmlParents: [] },
    name: { type: "string", xmlParents: properties, required: true, defaultValue: ({ name }: { name?: string }) => name },
    synonym: { yaml: "Синоним", type: "I8nText", xmlParents: properties, defaultValueXMLRaw: "" },
    comment: { yaml: "Комментарий", type: "string", xmlParents: properties, defaultValueXMLRaw: "" },
    includeHelpInContents: { yaml: "ВключатьСправкуВСодержание", xml: "IncludeHelpInContents", type: "boolean", xmlParents: properties, defaultValueXML: true, implicitValueYAML: true },
    includeInCommandInterface: { yaml: "ВключатьВКомандныйИнтерфейс", xml: "IncludeInCommandInterface", type: "boolean", xmlParents: properties, defaultValueXML: true, implicitValueYAML: true },
    useOneCommand: { yaml: "ИспользоватьОднуКоманду", xml: "UseOneCommand", type: "boolean", xmlParents: properties, defaultValueXML: false, implicitValueYAML: false },
    explanation: { yaml: "Пояснение", xml: "Explanation", type: "I8nText", xmlParents: properties, defaultValueXMLRaw: "" },
    picture: { yaml: "Картинка", xml: "Picture", type: "Picture", xmlParents: properties, defaultValueXMLRaw: "" },
    content: { yaml: "Состав", xml: "Content", type: "MetadataItemLinks", xmlParents: properties, defaultValueXMLRaw: {} },
    subsystems: { yaml: "Подсистемы", xml: "Subsystem", type: "ChildSubsystemNames", xmlParents: childObjects },
    objectBelonging: { yaml: "ПринадлежностьОбъекта", xml: "ObjectBelonging", type: "SystemEnumeration", typeSE: "ObjectBelonging", xmlParents: properties, toYAML: false, fromYAML: false, implicitValueYAML: "Native" },
    extendedConfigurationObject: { xml: "ExtendedConfigurationObject", type: "string", xmlParents: properties, runtimeOnly: true },
    commandInterface: { type: "Template", nkdkPath: "CommandInterface.xml", xmlPath: "Ext/CommandInterface.xml", toXML: false, fromXML: false },
    help: { type: "Help", filePath: "Ext/Help.xml", xmlPath: "Ext/Help.xml", nkdkDir: "Справка", toXML: false, fromXML: false },
  },
  requiredXMLParents: [["ChildObjects"]],
} as const satisfies MetadataItemRule
```

- [ ] **Step 4: Add standard tests and run them**

```bash
pnpm --filter @nakidka/core exec vitest run \
  packages/core/metadata/commonObjects/childSubsystemNames \
  packages/core/metadata/appliedObjects/metadataSubsystem
```

Expected: PASS with XML round-trip and sync copying `CommandInterface.xml` and help.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/commonObjects/childSubsystemNames packages/core/metadata/appliedObjects/metadataSubsystem packages/core/metadata/commonObjects/index.ts packages/core/metadata/orchestration
git commit -m "feat: :sparkles: добавить подсистемы metadata"
```

### Task 5: Service Objects With Child Collections

**Objects:** `metadataIntegrationService`, `metadataWebService`.

**Files:**
- Create: `packages/core/metadata/commonObjects/metadataIntegrationServiceChannel/*`
- Create: `packages/core/metadata/commonObjects/xDTOPackages/*`
- Create: `packages/core/metadata/commonObjects/metadataWebServiceOperation/*`
- Create/modify object directories and registries

- [ ] **Step 1: Write web-service parameter fixture assertion**

Create `packages/core/metadata/appliedObjects/metadataWebService/fromXML.test.ts` using this assertion:

```ts
it("imports operation parameters from updated fixture", () => {
  const result = testImportAppliedObjectFromXML<MetadataWebService>({
    rule: MetadataWebServiceRules,
    importMetaUrl: import.meta.url,
    fixture: "full.xml",
  })
  expect(result?.operations?.[0]?.parameters).toEqual([
    {
      itemType: "MetadataWebServiceParameter",
      name: "ПараметрВсеСвойства",
      synonym: { items: { ru: "Синоним" } },
      comment: "Комментарий",
      xdtoValueType: "xs:time",
      nillable: true,
      transferDirection: "InOut",
    },
    {
      itemType: "MetadataWebServiceParameter",
      name: "ПараметрПоУмолчанию",
      synonym: { items: { ru: "Параметр по умолчанию" } },
      comment: "",
      xdtoValueType: "xs:string",
      nillable: false,
      transferDirection: "In",
    },
  ])
})
```

- [ ] **Step 2: Implement channel and operation rules**

Use `MetadataHTTPServiceURLTemplateRules` as the exact child-collection pattern. Required child rules:

```ts
export const MetadataIntegrationServiceChannelRules = {
  itemType: "MetadataIntegrationServiceChannel",
  properties: {
    uuid: uuidPropertyRule,
    name: { xml: "Name", type: "string", required: true, xmlParents: ["Properties"] },
    synonym: { yaml: "Синоним", xml: "Synonym", type: "I8nText", xmlParents: ["Properties"], defaultValueXMLRaw: "" },
    comment: { yaml: "Комментарий", xml: "Comment", type: "string", xmlParents: ["Properties"], defaultValueXMLRaw: "" },
    externalIntegrationServiceChannelName: { yaml: "ИмяКаналаВнешнегоСервисаИнтеграции", xml: "ExternalIntegrationServiceChannelName", type: "string", xmlParents: ["Properties"], defaultValueXMLRaw: "" },
    messageDirection: { yaml: "НаправлениеСообщения", xml: "MessageDirection", type: "SystemEnumeration", typeSE: "IntegrationServiceChannelMessageDirection", xmlParents: ["Properties"] },
    receiveMessageProcessing: { yaml: "ОбработкаПолученияСообщения", xml: "ReceiveMessageProcessing", type: "string", xmlParents: ["Properties"], defaultValueXMLRaw: "" },
    transactioned: { yaml: "Транзакционный", xml: "Transactioned", type: "boolean", xmlParents: ["Properties"] },
    objectBelonging: { yaml: "ПринадлежностьОбъекта", xml: "ObjectBelonging", type: "SystemEnumeration", typeSE: "ObjectBelonging", xmlParents: ["Properties"], toYAML: false, fromYAML: false, implicitValueYAML: "Native" },
    extendedConfigurationObject: { xml: "ExtendedConfigurationObject", type: "string", xmlParents: ["Properties"], runtimeOnly: true },
  },
} as const
```

```ts
export const MetadataWebServiceParameterRules = {
  itemType: "MetadataWebServiceParameter",
  properties: {
    uuid: uuidPropertyRule,
    name: { xml: "Name", type: "string", required: true, xmlParents: ["Properties"] },
    synonym: { yaml: "Синоним", xml: "Synonym", type: "I8nText", xmlParents: ["Properties"], defaultValueXMLRaw: "" },
    comment: { yaml: "Комментарий", xml: "Comment", type: "string", xmlParents: ["Properties"], defaultValueXMLRaw: "" },
    xdtoValueType: { yaml: "ТипЗначенияXDTO", xml: "XDTOValueType", type: "string", xmlParents: ["Properties"] },
    nillable: { yaml: "МожетБытьНеопределено", xml: "Nillable", type: "boolean", xmlParents: ["Properties"], defaultValueXML: false, implicitValueYAML: false },
    transferDirection: { yaml: "НаправлениеПередачи", xml: "TransferDirection", type: "SystemEnumeration", typeSE: "TransferDirection", xmlParents: ["Properties"], defaultValueXML: "In", implicitValueYAML: "In" },
    objectBelonging: { yaml: "ПринадлежностьОбъекта", xml: "ObjectBelonging", type: "SystemEnumeration", typeSE: "ObjectBelonging", xmlParents: ["Properties"], toYAML: false, fromYAML: false, implicitValueYAML: "Native" },
    extendedConfigurationObject: { xml: "ExtendedConfigurationObject", type: "string", xmlParents: ["Properties"], runtimeOnly: true },
  },
} as const
```

- [ ] **Step 3: Implement parent rules**

For `MetadataIntegrationServiceRules`, use `xmlDir: "IntegrationServices"`, `container: "IntegrationService"`, and:

```ts
externalIntegrationServiceAddress: { yaml: "АдресВнешнегоСервисаИнтеграции", xml: "ExternalIntegrationServiceAddress", type: "string", xmlParents: properties, defaultValueXMLRaw: "" },
channels: { yaml: "Каналы", xml: "IntegrationServiceChannel", type: "MetadataIntegrationServiceChannels", xmlParents: childObjects, defaultValue: [], defaultValueXMLRaw: {} },
module: { type: "Module", nkdkPath: "Модуль.bsl", xmlPath: "Ext/Module.bsl", toXML: false, fromXML: false },
```

For `MetadataWebServiceRules`, use `xmlDir: "WebServices"`, `container: "WebService"`, and:

```ts
namespace: { yaml: "ПространствоИмен", xml: "Namespace", type: "string", xmlParents: properties },
xdtoPackages: { yaml: "ПакетыXDTO", xml: "XDTOPackages", type: "XDTOPackages", xmlParents: properties, defaultValueXMLRaw: {} },
descriptorFileName: { yaml: "ИмяФайлаДескриптора", xml: "DescriptorFileName", type: "string", xmlParents: properties },
reuseSessions: { yaml: "ПовторноеИспользованиеСеансов", xml: "ReuseSessions", type: "SystemEnumeration", typeSE: "SessionReuseMode", xmlParents: properties, defaultValueXML: "AutoUse", implicitValueYAML: "AutoUse" },
sessionMaxAge: { yaml: "ВремяЖизниСеанса", xml: "SessionMaxAge", type: "number", xmlParents: properties, defaultValueXML: 20, implicitValueYAML: 20 },
operations: { yaml: "Операции", xml: "Operation", type: "MetadataWebServiceOperations", xmlParents: childObjects, defaultValue: [], defaultValueXMLRaw: {} },
module: { type: "Module", nkdkPath: "Модуль.bsl", xmlPath: "Ext/Module.bsl", toXML: false, fromXML: false },
```

- [ ] **Step 4: Run service object tests**

```bash
pnpm --filter @nakidka/core exec vitest run \
  packages/core/metadata/appliedObjects/metadataIntegrationService \
  packages/core/metadata/appliedObjects/metadataWebService \
  packages/core/metadata/commonObjects/metadataIntegrationServiceChannel \
  packages/core/metadata/commonObjects/metadataWebServiceOperation \
  packages/core/metadata/commonObjects/xDTOPackages
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/appliedObjects/metadataIntegrationService packages/core/metadata/appliedObjects/metadataWebService packages/core/metadata/commonObjects/metadataIntegrationServiceChannel packages/core/metadata/commonObjects/metadataWebServiceOperation packages/core/metadata/commonObjects/xDTOPackages packages/core/metadata/orchestration packages/core/metadata/commonObjects/index.ts
git commit -m "feat: :sparkles: добавить сервисы интеграции и web-сервисы"
```

### Task 6: Common Form

**Files:**
- Create/modify: `packages/core/metadata/appliedObjects/metadataCommonForm/*`
- Modify form external sync only if current `ClientApplicationForm` helpers cannot handle top-level common form paths.

- [ ] **Step 1: Write form sync test**

Create `packages/core/metadata/appliedObjects/metadataCommonForm/syncToXML.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { testSyncAppliedObjectToXML } from "~/tests/appliedObject"
import { MetadataCommonFormRules } from "./rules"

const normalizeLineEndings = (value: string) => value.replace(/\r\n/g, "\n")

describe("syncAppliedObjectToXML — MetadataCommonForm", () => {
  it("writes CommonForm XML and external form XML", async () => {
    const { comparisons } = await testSyncAppliedObjectToXML({
      rule: MetadataCommonFormRules,
      name: "КонстантаВсеСвойства",
      importMetaUrl: import.meta.url,
      externalObjectDir: true,
      expectedFiles: ["КонстантаВсеСвойства.xml", "КонстантаВсеСвойства/Ext/Form.xml"],
    })
    for (const { path, result, expected } of comparisons) {
      expect(normalizeLineEndings(result), path).toBe(normalizeLineEndings(expected))
    }
  })
})
```

- [ ] **Step 2: Implement `MetadataCommonFormRules`**

Use `ClientApplicationFormRules` fields for metadata-level defaults and add external form file:

```ts
form: { yaml: "Форма", type: "ClientApplicationForm", filePath: "Ext/Form.xml" },
formType: { yaml: "ТипФормы", xml: "FormType", type: "SystemEnumeration", typeSE: "FormType", xmlParents: properties, defaultValueXML: "Managed", implicitValueYAML: "Managed" },
includeHelpInContents: { yaml: "ВключатьСправкуВСодержание", xml: "IncludeHelpInContents", type: "boolean", xmlParents: properties, defaultValueXML: false, implicitValueYAML: false },
help: { type: "Help", filePath: "Ext/Help.xml", xmlPath: "Ext/Help.xml", nkdkDir: "Справка", toXML: false, fromXML: false },
usePurposes: { yaml: "НазначенияИспользования", xml: "UsePurposes", type: "UsePurposes", xmlParents: properties },
useStandardCommands: { yaml: "ИспользоватьСтандартныеКоманды", xml: "UseStandardCommands", type: "boolean", xmlParents: properties, defaultValueXML: true, implicitValueYAML: true },
extendedPresentation: { yaml: "РасширенноеПредставление", xml: "ExtendedPresentation", type: "I8nText", xmlParents: properties, defaultValueXMLRaw: "" },
explanation: { yaml: "Пояснение", xml: "Explanation", type: "I8nText", xmlParents: properties, defaultValueXMLRaw: "" },
```

- [ ] **Step 3: Run common form tests**

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/metadataCommonForm
```

Expected: PASS for XML round-trip and sync of `Ext/Form.xml`.

- [ ] **Step 4: Commit**

```bash
git add packages/core/metadata/appliedObjects/metadataCommonForm packages/core/metadata/orchestration packages/core/metadata/appliedObjects/index.ts
git commit -m "feat: :sparkles: добавить общие формы"
```

### Task 7: Register And Chart Family

**Objects:** `metadataAccountingRegister`, `metadataCalculationRegister`, `metadataChartOfAccounts`, `metadataChartOfCalculationTypes`, `metadataChartOfCharacteristicTypes`.

**Files:**
- Create/modify each object directory
- Create: `packages/core/metadata/commonObjects/recalculation/*`
- Reuse existing register field, tabular-section, command, form, template, predefined, help, and additional-index helpers

- [ ] **Step 1: Move recalculation into common**

Create `packages/core/metadata/commonObjects/recalculation/rules.ts`:

```ts
import { uuidPropertyRule } from "~/metadata/commonObjects/uuid/rule"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"

const properties = ["Properties"]
const childObjects = ["ChildObjects"]

export const RecalculationRules = {
  itemType: "Recalculation",
  properties: {
    uuid: uuidPropertyRule,
    name: { xml: "Name", type: "string", required: true, xmlParents: properties },
    synonym: { yaml: "Синоним", xml: "Synonym", type: "I8nText", xmlParents: properties, defaultValueXMLRaw: "" },
    comment: { yaml: "Комментарий", xml: "Comment", type: "string", xmlParents: properties, defaultValueXMLRaw: "" },
    use: { yaml: "Использование", xml: "Use", type: "boolean", xmlParents: properties, defaultValueXML: true, implicitValueYAML: true },
    dimensions: { yaml: "Измерения", xml: "Dimension", type: "MetadataRegisterDimensions", xmlParents: childObjects, defaultValue: [], defaultValueXMLRaw: {} },
    objectBelonging: { yaml: "ПринадлежностьОбъекта", xml: "ObjectBelonging", type: "SystemEnumeration", typeSE: "ObjectBelonging", xmlParents: properties, toYAML: false, fromYAML: false, implicitValueYAML: "Native" },
    extendedConfigurationObject: { xml: "ExtendedConfigurationObject", type: "string", xmlParents: properties, runtimeOnly: true },
  },
} as const satisfies MetadataItemRule
```

- [ ] **Step 2: Implement one register at a time**

Order:

```text
1. MetadataAccountingRegister
2. MetadataCalculationRegister
3. MetadataChartOfAccounts
4. MetadataChartOfCalculationTypes
5. MetadataChartOfCharacteristicTypes
```

For each object, create `rules.ts` with `InternalInfo` categories exactly from the spec and reuse existing property types:

```ts
attributes: { yaml: "Реквизиты", xml: "Attribute", type: "MetadataAttributes", xmlParents: childObjects },
tabularSections: { yaml: "ТабличныеЧасти", xml: "TabularSection", type: "MetadataTabularSections", xmlParents: childObjects },
forms: { yaml: "Формы", xml: "Form", type: "ChildFormNames", xmlParents: childObjects, folderName: "Формы" },
templates: { yaml: "Макеты", xml: "Template", type: "ChildTemplateNames", xmlParents: childObjects, folderName: "Макеты" },
commands: { yaml: "Команды", xml: "Command", type: "MetadataCommands", xmlParents: childObjects },
objectModule: { type: "Module", nkdkPath: "МодульОбъекта.bsl", xmlPath: "Ext/ObjectModule.bsl", toXML: false, fromXML: false },
managerModule: { type: "Module", nkdkPath: "МодульМенеджера.bsl", xmlPath: "Ext/ManagerModule.bsl", toXML: false, fromXML: false },
predefined: { type: "Template", nkdkPath: "Predefined.xml", xmlPath: "Ext/Predefined.xml", toXML: false, fromXML: false },
additionalIndexes: { yaml: "ДополнительныеИндексы", type: "AdditionalIndex", filePath: "Ext/AdditionalIndexes.xml" },
help: { type: "Help", filePath: "Ext/Help.xml", xmlPath: "Ext/Help.xml", nkdkDir: "Справка", toXML: false, fromXML: false },
```

Add `childCollections: [{ propertyKey: "commands", itemRule: <ObjectCommandRules> }]` whenever command modules exist.

- [ ] **Step 3: Run tests after each object**

Run after each object:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/<object>
```

Expected: PASS before moving to the next object.

- [ ] **Step 4: Run family tests**

```bash
pnpm --filter @nakidka/core exec vitest run \
  packages/core/metadata/appliedObjects/metadataAccountingRegister \
  packages/core/metadata/appliedObjects/metadataCalculationRegister \
  packages/core/metadata/appliedObjects/metadataChartOfAccounts \
  packages/core/metadata/appliedObjects/metadataChartOfCalculationTypes \
  packages/core/metadata/appliedObjects/metadataChartOfCharacteristicTypes \
  packages/core/metadata/commonObjects/recalculation
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/appliedObjects/metadataAccountingRegister packages/core/metadata/appliedObjects/metadataCalculationRegister packages/core/metadata/appliedObjects/metadataChartOfAccounts packages/core/metadata/appliedObjects/metadataChartOfCalculationTypes packages/core/metadata/appliedObjects/metadataChartOfCharacteristicTypes packages/core/metadata/commonObjects/recalculation packages/core/metadata/orchestration packages/core/metadata/commonObjects/index.ts
git commit -m "feat: :sparkles: добавить регистры и планы видов"
```

### Task 8: BusinessProcess And Task

**Files:**
- Create/modify: `packages/core/metadata/appliedObjects/metadataBusinessProcess/*`
- Create/modify: `packages/core/metadata/appliedObjects/metadataTask/*`
- Create: `packages/core/metadata/commonObjects/metadataTaskAddressingAttribute/*`

- [ ] **Step 1: Implement task addressing attribute**

Create rules by extending `MetadataAttributeRules` fields and adding:

```ts
addressingDimension: {
  yaml: "ИзмерениеАдресации",
  xml: "AddressingDimension",
  type: "string",
  xmlParents: ["Properties"],
  defaultValueXMLRaw: "",
}
```

Register collection type `MetadataTaskAddressingAttributes` and use XML tag `AddressingAttribute`.

- [ ] **Step 2: Implement `MetadataTaskRules`**

Use Task defaults from the spec and these child/external properties:

```ts
attributes: { yaml: "Реквизиты", xml: "Attribute", type: "MetadataAttributes", xmlParents: childObjects },
tabularSections: { yaml: "ТабличныеЧасти", xml: "TabularSection", type: "MetadataTabularSections", xmlParents: childObjects },
forms: { yaml: "Формы", xml: "Form", type: "ChildFormNames", xmlParents: childObjects, folderName: "Формы" },
templates: { yaml: "Макеты", xml: "Template", type: "ChildTemplateNames", xmlParents: childObjects, folderName: "Макеты" },
addressingAttributes: { yaml: "РеквизитыАдресации", xml: "AddressingAttribute", type: "MetadataTaskAddressingAttributes", xmlParents: childObjects },
commands: { yaml: "Команды", xml: "Command", type: "MetadataCommands", xmlParents: childObjects },
additionalIndexes: { yaml: "ДополнительныеИндексы", type: "AdditionalIndex", filePath: "Ext/AdditionalIndexes.xml" },
help: { type: "Help", filePath: "Ext/Help.xml", xmlPath: "Ext/Help.xml", nkdkDir: "Справка", toXML: false, fromXML: false },
```

- [ ] **Step 3: Implement `MetadataBusinessProcessRules`**

Use the same document-like fields already proven in `metadataTask`, plus:

```ts
task: { yaml: "Задача", xml: "Task", type: "string", xmlParents: properties, referenceScope: { target: "topLevel", allowedTypes: ["Задача"] } },
flowchart: { type: "Template", nkdkPath: "Flowchart.xml", xmlPath: "Ext/Flowchart.xml", toXML: false, fromXML: false },
objectModule: { type: "Module", nkdkPath: "МодульОбъекта.bsl", xmlPath: "Ext/ObjectModule.bsl", toXML: false, fromXML: false },
managerModule: { type: "Module", nkdkPath: "МодульМенеджера.bsl", xmlPath: "Ext/ManagerModule.bsl", toXML: false, fromXML: false },
```

Ensure sync tests include `Ext/ObjectModule.bsl`, `Ext/ManagerModule.bsl`, and `Ext/Flowchart.xml`.

- [ ] **Step 4: Run tests**

```bash
pnpm --filter @nakidka/core exec vitest run \
  packages/core/metadata/appliedObjects/metadataTask \
  packages/core/metadata/appliedObjects/metadataBusinessProcess \
  packages/core/metadata/commonObjects/metadataTaskAddressingAttribute
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/appliedObjects/metadataTask packages/core/metadata/appliedObjects/metadataBusinessProcess packages/core/metadata/commonObjects/metadataTaskAddressingAttribute packages/core/metadata/orchestration packages/core/metadata/commonObjects/index.ts
git commit -m "feat: :sparkles: добавить задачи и бизнес-процессы"
```

### Task 9: Final Registry, Configuration Sync, And Full Verification

**Files:**
- Modify: all registry files touched in previous tasks
- Modify: `packages/core/metadata/appliedObjects/configuration/*`
- Modify: migration path files

- [ ] **Step 1: Run registry guard**

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/appliedObjects/newObjects.registry.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run all new object tests**

```bash
pnpm --filter @nakidka/core exec vitest run \
  packages/core/metadata/appliedObjects/metadataFunctionalOption \
  packages/core/metadata/appliedObjects/metadataRole \
  packages/core/metadata/appliedObjects/metadataScheduledJob \
  packages/core/metadata/appliedObjects/metadataLanguage \
  packages/core/metadata/appliedObjects/metadataCommonTemplate \
  packages/core/metadata/appliedObjects/metadataCommonPicture \
  packages/core/metadata/appliedObjects/metadataStyle \
  packages/core/metadata/appliedObjects/metadataCommandGroup \
  packages/core/metadata/appliedObjects/metadataSubsystem \
  packages/core/metadata/appliedObjects/metadataAccountingRegister \
  packages/core/metadata/appliedObjects/metadataBusinessProcess \
  packages/core/metadata/appliedObjects/metadataCalculationRegister \
  packages/core/metadata/appliedObjects/metadataChartOfAccounts \
  packages/core/metadata/appliedObjects/metadataChartOfCalculationTypes \
  packages/core/metadata/appliedObjects/metadataChartOfCharacteristicTypes \
  packages/core/metadata/appliedObjects/metadataCommonForm \
  packages/core/metadata/appliedObjects/metadataIntegrationService \
  packages/core/metadata/appliedObjects/metadataTask \
  packages/core/metadata/appliedObjects/metadataWebService
```

Expected: PASS.

- [ ] **Step 3: Generate Langium files**

```bash
pnpm --filter nkdk-language langium:generate
```

Expected: exit code `0`.

- [ ] **Step 4: Run full test suite**

```bash
pnpm test
```

Expected: exit code `0`.

- [ ] **Step 5: Commit final integration fixes**

```bash
git add packages/core/metadata docs/superpowers/specs docs/superpowers/plans
git commit -m "test: :white_check_mark: проверить новые прикладные объекты"
```

## Self-Review

- Spec coverage: covered all included objects from `2026-05-14-applied-objects-agreed-design.md`: small standalone objects, subsystem, common picture, common form, integration service, web service, register/chart family, business process, and task. `metadataExternalDataSource` remains deferred by spec.
- Placeholder scan: no task uses forbidden placeholder markers or an unspecified test-writing step. Each task names files, commands, and expected outcomes.
- Type consistency: shared type names are consistent across tasks: `ExternalPicture`, `ChildSubsystemNames`, `XDTOPackages`, `MetadataIntegrationServiceChannel`, `MetadataWebServiceOperation`, `MetadataWebServiceParameter`, `MetadataTaskAddressingAttribute`, and `Recalculation`.
