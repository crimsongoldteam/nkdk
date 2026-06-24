# Catalog Form Fixture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add XML/YAML import-export coverage for the catalog form fixture, including missing form rules and a new `MobileDeviceCommandBarContent` common property type.

**Architecture:** Implement `MobileDeviceCommandBarContent` as a focused common property type modeled as `MetadataTypedValue[]`, with XML wrappers handled only at the boundary. Then wire the new type into `ClientApplicationFormRules` and add fixture-based tests that import XML, export XML, import YAML, and export YAML without changing existing XML fixtures.

**Tech Stack:** TypeScript, Vitest, `fast-xml-parser` through existing test helpers, Nakidka metadata orchestration `rules.ts` property registry.

---

## File Structure

- Create `packages/core/metadata/commonObjects/mobileDeviceCommandBarContent/types.ts`
  - Owns TypeScript, XML, and YAML shapes for `MobileDeviceCommandBarContent`.
- Create `packages/core/metadata/commonObjects/mobileDeviceCommandBarContent/fromXML.ts`
  - Imports `<MobileDeviceCommandBarContent><xr:Item><xr:Value .../></xr:Item></...>` into `MetadataTypedValue[]`.
- Create `packages/core/metadata/commonObjects/mobileDeviceCommandBarContent/toXML.ts`
  - Exports `MetadataTypedValue[]` back to `xr:Item` entries, always writing `xr:Presentation` and `xr:CheckState`.
- Create `packages/core/metadata/commonObjects/mobileDeviceCommandBarContent/fromYAML.ts`
  - Imports a YAML array of `MetadataValueYAML` into `MetadataTypedValue[]`.
- Create `packages/core/metadata/commonObjects/mobileDeviceCommandBarContent/toYAML.ts`
  - Exports `MetadataTypedValue[]` into a YAML array.
- Create `packages/core/metadata/commonObjects/mobileDeviceCommandBarContent/toJSONSchema.ts`
  - Reuses `MetadataValueJSONSchema` in an array schema.
- Create `packages/core/metadata/commonObjects/mobileDeviceCommandBarContent/__fixtures__/full.xml`
  - Contains the XML fragment extracted from `catalogFull.xml`.
- Create `packages/core/metadata/commonObjects/mobileDeviceCommandBarContent/__fixtures__/data.ts`
  - Contains internal fixture and YAML fixture for the new type.
- Create `packages/core/metadata/commonObjects/mobileDeviceCommandBarContent/fromXML.test.ts`
- Create `packages/core/metadata/commonObjects/mobileDeviceCommandBarContent/toXML.test.ts`
- Create `packages/core/metadata/commonObjects/mobileDeviceCommandBarContent/fromYAML.test.ts`
- Create `packages/core/metadata/commonObjects/mobileDeviceCommandBarContent/toYAML.test.ts`
- Modify `packages/core/metadata/commonObjects/index.ts`
  - Imports the new type registration modules.
- Modify `packages/core/metadata/orchestration/property/registry.ts`
  - Registers `MobileDeviceCommandBarContent` in `PropertyTypeRegistry` and `PropertyRuleTypeKeys`.
- Modify `packages/core/metadata/forms/clientApplicationForm/rules.ts`
  - Adds missing XML mappings and new fields for the catalog full form fixture.
- Modify `packages/core/metadata/forms/clientApplicationForm/__fixtures__/data.ts`
  - Adds expected internal and YAML fixture data for `catalogFull.xml`.
- Modify `packages/core/metadata/forms/clientApplicationForm/fromXML.test.ts`
  - Adds import assertion for `catalogFull.xml`.
- Modify `packages/core/metadata/forms/clientApplicationForm/toXML.test.ts`
  - Adds XML export assertion for `catalogFull.xml`.
- Modify `packages/core/metadata/forms/clientApplicationForm/fromYAML.test.ts`
  - Adds YAML import assertion for the catalog fixture.
- Modify `packages/core/metadata/forms/clientApplicationForm/toYAML.test.ts`
  - Adds YAML export assertion for the catalog fixture.

## Task 1: XML Type for MobileDeviceCommandBarContent

**Files:**
- Create: `packages/core/metadata/commonObjects/mobileDeviceCommandBarContent/__fixtures__/full.xml`
- Create: `packages/core/metadata/commonObjects/mobileDeviceCommandBarContent/__fixtures__/data.ts`
- Create: `packages/core/metadata/commonObjects/mobileDeviceCommandBarContent/types.ts`
- Create: `packages/core/metadata/commonObjects/mobileDeviceCommandBarContent/fromXML.ts`
- Create: `packages/core/metadata/commonObjects/mobileDeviceCommandBarContent/toXML.ts`
- Create: `packages/core/metadata/commonObjects/mobileDeviceCommandBarContent/fromXML.test.ts`
- Create: `packages/core/metadata/commonObjects/mobileDeviceCommandBarContent/toXML.test.ts`
- Modify: `packages/core/metadata/orchestration/property/registry.ts`
- Modify: `packages/core/metadata/commonObjects/index.ts`

- [ ] **Step 1: Create the XML fixture**

Create `packages/core/metadata/commonObjects/mobileDeviceCommandBarContent/__fixtures__/full.xml`:

```xml
<MobileDeviceCommandBarContent>
	<xr:Item>
		<xr:Presentation/>
		<xr:CheckState>0</xr:CheckState>
		<xr:Value xsi:type="xs:string">ФормаКоманда1</xr:Value>
	</xr:Item>
</MobileDeviceCommandBarContent>
```

- [ ] **Step 2: Create the TS fixture data**

Create `packages/core/metadata/commonObjects/mobileDeviceCommandBarContent/__fixtures__/data.ts`:

```ts
import { MobileDeviceCommandBarContent, MobileDeviceCommandBarContentYAML } from "../types"

export const fullMobileDeviceCommandBarContent: MobileDeviceCommandBarContent = [
  {
    type: "string",
    value: "ФормаКоманда1",
  },
]

export const fullMobileDeviceCommandBarContentYAML: MobileDeviceCommandBarContentYAML = ["ФормаКоманда1"]
```

- [ ] **Step 3: Create the type definitions**

Create `packages/core/metadata/commonObjects/mobileDeviceCommandBarContent/types.ts`:

```ts
import { Type } from "@sinclair/typebox"
import {
  MetadataTypedValue,
  MetadataValueJSONSchema,
  MetadataValueXML,
  MetadataValueYAML,
} from "../metadataValue/types"

export type MobileDeviceCommandBarContent = MetadataTypedValue[]

export interface MobileDeviceCommandBarContentItemXML {
  "xr:Presentation"?: ""
  "xr:CheckState": 0
  "xr:Value": MetadataValueXML
}

export interface MobileDeviceCommandBarContentXML {
  "xr:Item"?: MobileDeviceCommandBarContentItemXML | MobileDeviceCommandBarContentItemXML[]
}

export const MobileDeviceCommandBarContentJSONSchema = Type.Array(MetadataValueJSONSchema)
export type MobileDeviceCommandBarContentYAML = MetadataValueYAML[]
```

- [ ] **Step 4: Write the failing fromXML test**

Create `packages/core/metadata/commonObjects/mobileDeviceCommandBarContent/fromXML.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { readAndParseXMLFixture } from "~/tests/readFixtureXML"
import { mockContextFromXML, mockRule } from "~/tests/mockContext"
import { fullMobileDeviceCommandBarContent } from "./__fixtures__/data"
import { importMobileDeviceCommandBarContentFromXML } from "./fromXML"
import { MobileDeviceCommandBarContentXML } from "./types"

describe("importMobileDeviceCommandBarContentFromXML", () => {
  it("returns undefined for undefined input", () => {
    const result = importMobileDeviceCommandBarContentFromXML(mockContextFromXML(), mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("returns undefined for empty input", () => {
    const result = importMobileDeviceCommandBarContentFromXML(mockContextFromXML(), mockRule, {})
    expect(result).toBeUndefined()
  })

  it("imports full XML", () => {
    const xml = readAndParseXMLFixture<{ MobileDeviceCommandBarContent: MobileDeviceCommandBarContentXML }>(
      import.meta.url,
      "full.xml"
    )

    const result = importMobileDeviceCommandBarContentFromXML(
      mockContextFromXML(),
      mockRule,
      xml.MobileDeviceCommandBarContent
    )

    expect(result).toEqual(fullMobileDeviceCommandBarContent)
  })
})
```

- [ ] **Step 5: Run the fromXML test and verify it fails**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/mobileDeviceCommandBarContent/fromXML.test.ts
```

Expected: FAIL because `fromXML.ts` does not exist or `importMobileDeviceCommandBarContentFromXML` is not defined.

- [ ] **Step 6: Implement fromXML**

Create `packages/core/metadata/commonObjects/mobileDeviceCommandBarContent/fromXML.ts`:

```ts
import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import { importMetadataValueFromXML } from "../metadataValue/fromXML"
import { MobileDeviceCommandBarContent, MobileDeviceCommandBarContentXML } from "./types"

export const importMobileDeviceCommandBarContentFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: MobileDeviceCommandBarContentXML | undefined
): MobileDeviceCommandBarContent | undefined => {
  if (!xml || !xml["xr:Item"]) return undefined

  const rawItems = Array.isArray(xml["xr:Item"]) ? xml["xr:Item"] : [xml["xr:Item"]]
  const items = rawItems
    .map((item) => importMetadataValueFromXML({ context, rule: { type: "MetadataValue" }, value: item["xr:Value"] }))
    .filter((item): item is MobileDeviceCommandBarContent[number] => item !== undefined)

  return items.length === 0 ? undefined : items
}

registerTypeRule("MobileDeviceCommandBarContent", "importFromXML", importMobileDeviceCommandBarContentFromXML)
```

- [ ] **Step 7: Register the property type**

Modify `packages/core/metadata/orchestration/property/registry.ts`.

Add import near other common object imports:

```ts
import {
  MobileDeviceCommandBarContent,
  MobileDeviceCommandBarContentYAML,
} from "~/metadata/commonObjects/mobileDeviceCommandBarContent/types"
```

Add to `PropertyTypeRegistry` near `ChoiceList`:

```ts
  MobileDeviceCommandBarContent: {
    item: MobileDeviceCommandBarContent
    yaml: MobileDeviceCommandBarContentYAML
  }
```

Add to `PropertyRuleTypeKeys` near `ChoiceList`:

```ts
  MobileDeviceCommandBarContent: "MobileDeviceCommandBarContent",
```

- [ ] **Step 8: Register common object imports**

Modify `packages/core/metadata/commonObjects/index.ts` near the `choiceList` imports:

```ts
import "./mobileDeviceCommandBarContent/fromXML"
import "./mobileDeviceCommandBarContent/toJSONSchema"
import "./mobileDeviceCommandBarContent/toXML"
```

Do not add YAML imports in this task. YAML is added after the XML cycle.

- [ ] **Step 9: Run the fromXML test and verify it passes**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/mobileDeviceCommandBarContent/fromXML.test.ts
```

Expected: PASS with 3 tests passing.

- [ ] **Step 10: Write the failing toXML test**

Create `packages/core/metadata/commonObjects/mobileDeviceCommandBarContent/toXML.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { mockContext, mockRule } from "~/tests/mockContext"
import { readXMLFixtureAsString } from "~/tests/readFixtureXML"
import { xmlExport } from "~/xml/export/exporter"
import { fullMobileDeviceCommandBarContent } from "./__fixtures__/data"
import { exportMobileDeviceCommandBarContentToXML } from "./toXML"

describe("exportMobileDeviceCommandBarContentToXML", () => {
  it("returns undefined for undefined input", () => {
    const result = exportMobileDeviceCommandBarContentToXML(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("returns undefined for empty input", () => {
    const result = exportMobileDeviceCommandBarContentToXML(mockContext, mockRule, [])
    expect(result).toBeUndefined()
  })

  it("exports full XML", () => {
    const expected = readXMLFixtureAsString(import.meta.url, "full.xml")
    const xml = exportMobileDeviceCommandBarContentToXML(mockContext, mockRule, fullMobileDeviceCommandBarContent)
    const result = xmlExport({ MobileDeviceCommandBarContent: xml }, false)

    expect(result).toEqual(expected)
  })
})
```

- [ ] **Step 11: Run the toXML test and verify it fails**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/mobileDeviceCommandBarContent/toXML.test.ts
```

Expected: FAIL because `toXML.ts` does not exist or `exportMobileDeviceCommandBarContentToXML` is not defined.

- [ ] **Step 12: Implement toXML**

Create `packages/core/metadata/commonObjects/mobileDeviceCommandBarContent/toXML.ts`:

```ts
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import { exportMetadataValueToXML } from "../metadataValue/toXML"
import {
  MobileDeviceCommandBarContent,
  MobileDeviceCommandBarContentItemXML,
  MobileDeviceCommandBarContentXML,
} from "./types"

export const exportMobileDeviceCommandBarContentToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MobileDeviceCommandBarContent | undefined
): MobileDeviceCommandBarContentXML | undefined => {
  if (!data || data.length === 0) return undefined

  const items: MobileDeviceCommandBarContentItemXML[] = data.map((value) => ({
    "xr:Presentation": "",
    "xr:CheckState": 0,
    "xr:Value": exportMetadataValueToXML({
      context,
      rule: { type: "MetadataValue" },
      value,
    }),
  }))

  return {
    "xr:Item": items,
  }
}

registerTypeRule("MobileDeviceCommandBarContent", "exportToXML", exportMobileDeviceCommandBarContentToXML)
```

- [ ] **Step 13: Add JSON schema registration**

Create `packages/core/metadata/commonObjects/mobileDeviceCommandBarContent/toJSONSchema.ts`:

```ts
import { TSchema } from "@sinclair/typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/orchestration"
import { MobileDeviceCommandBarContentJSONSchema } from "./types"

export const exportMobileDeviceCommandBarContentToJSONSchema: ExportToJSONSchemaFn = (): TSchema => {
  return MobileDeviceCommandBarContentJSONSchema
}

registerTypeRule("MobileDeviceCommandBarContent", "exportToJSONSchema", exportMobileDeviceCommandBarContentToJSONSchema)
```

- [ ] **Step 14: Run XML type tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/mobileDeviceCommandBarContent/fromXML.test.ts metadata/commonObjects/mobileDeviceCommandBarContent/toXML.test.ts
```

Expected: PASS with 6 tests passing.

- [ ] **Step 15: Commit the XML type**

Run:

```bash
git add packages/core/metadata/commonObjects/mobileDeviceCommandBarContent packages/core/metadata/commonObjects/index.ts packages/core/metadata/orchestration/property/registry.ts
git commit -m "feat: add mobile device command bar content XML type"
```

## Task 2: ClientApplicationForm XML Coverage

**Files:**
- Modify: `packages/core/metadata/forms/clientApplicationForm/rules.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/__fixtures__/data.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/fromXML.test.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/toXML.test.ts`

- [ ] **Step 1: Write the failing fromXML test**

Modify `packages/core/metadata/forms/clientApplicationForm/fromXML.test.ts`.

Add `catalogFullClientApplicationForm` to the fixture import:

```ts
import {
  catalogFullClientApplicationForm,
  conditionalAppearanceWithoutAttributesClientApplicationForm,
  fullClientApplicationForm,
  minimalClientApplicationForm,
} from "./__fixtures__/data"
```

Add this test before the conditional appearance test:

```ts
  it("imports catalog full form from XML", () => {
    const xmlData = readAndParseXMLFixture<{ Form: ClientApplicationFormXML }>(import.meta.url, "catalogFull.xml")
    const xmlMetadata = readAndParseXMLFixture<{ MetaDataObject: FormMetadataXML }>(
      import.meta.url,
      "minimalMetadata.xml"
    )
    const result = importClientApplicationFormFromXML({
      context: mockContextFromXML(),
      xml: xmlData.Form,
      xmlMetadata: xmlMetadata.MetaDataObject,
    })

    expect(result).toEqual(catalogFullClientApplicationForm)
  })
```

- [ ] **Step 2: Add the expected internal fixture**

Modify `packages/core/metadata/forms/clientApplicationForm/__fixtures__/data.ts`.

Add this export after `fullClientApplicationForm`:

```ts
export const catalogFullClientApplicationForm: ClientApplicationForm = {
  ...minimalClientApplicationForm,
  title: { items: { ru: "Заголовок" } },
  width: 5,
  height: 10,
  formWindowOpeningMode: "LockWholeInterface",
  enterKeyBehavior: "DefaultButton",
  autoSaveDataInSettings: "Use",
  saveDataInSettings: "UseList",
  saveWindowSettings: false,
  settingsStorage: "SettingsStorage.ХранилищеНастроек",
  autoTitle: false,
  autoURL: false,
  group: "AlwaysHorizontal",
  itemsAndTitlesAlign: "ItemsLeftTitlesLeft",
  horizontalSpacing: "Single",
  verticalSpacing: "Double",
  childItemsHorizontalAlign: "Center",
  childItemsVerticalAlign: "Bottom",
  autoFillCheck: false,
  customizable: false,
  enabled: false,
  commandBarLocation: "Top",
  verticalScroll: "useIfNecessary",
  scalingMode: "Compact",
  scale: 90,
  conversationsRepresentation: "Show",
  mobileDeviceCommandBarContent: [{ type: "string", value: "ФормаКоманда1" }],
  commandSet: ["Write"],
  showTitle: false,
  showCloseButton: false,
  collapseItemsByImportance: "DontUse",
  useForFoldersAndItems: "Folders",
  autoCommandBar: {
    itemType: "AutoCommandBar",
    name: "ФормаКоманднаяПанель",
    childItems: [
      {
        itemType: "Button",
        name: "ФормаКоманда2",
        type: "CommandBarButton",
        commandName: "Form.Command.Команда1",
        extendedTooltip: {
          itemType: "ExtendedTooltip",
          name: "ФормаКоманда2РасширеннаяПодсказка",
        },
      },
    ],
  },
  childItems: [
    {
      itemType: "Button",
      name: "ФормаКоманда1",
      type: "UsualButton",
      commandName: "Form.Command.Команда1",
      extendedTooltip: {
        itemType: "ExtendedTooltip",
        name: "ФормаКоманда1РасширеннаяПодсказка",
      },
    },
  ],
  attributes: [
    {
      itemType: "FormAttribute",
      name: "Объект",
      type: { type: ["CatalogObject.СправочникФормаВсеСвойства"] },
      mainAttribute: true,
      savedData: true,
      columns: [],
    },
    {
      itemType: "FormAttribute",
      name: "Реквизит1",
      type: {
        type: ["string"],
        stringQualifiers: {
          length: 0,
          allowedLength: "Variable",
        },
      },
      columns: [],
    },
  ],
  attributesConditionalAppearance: {
    items: [
      {
        selection: [],
        filter: {
          items: [
            {
              itemType: "FilterItemComparison",
              left: { type: "field", value: "Объект.Наименование" },
              comparisonType: "Contains",
              right: { type: "string", value: "вба" },
            },
          ],
        },
        appearance: [
          {
            parameter: "Текст",
            value: {
              type: "string",
              value: "абв",
            },
          },
        ],
      },
    ],
  },
  commands: [
    {
      itemType: "FormCommand",
      name: "Команда1",
    },
  ],
  events: {
    ...fullClientApplicationForm.events,
    afterWrite: "ПослеЗаписи",
    beforeReopenFromOtherServer: "ПередПереоткрытиемСДругогоСервера",
    valueChoice: "ВыборЗначения",
    onReopenFromOtherServer: "ПриПереоткрытииСДругогоСервера",
    onSaveDataInSettingsAtServer: "ПриСохраненииДанныхВНастройкахНаСервере",
    onClientApplicationSuspend: "ПриЗасыпанииКлиентскогоПриложения",
    onClientApplicationResume: "ПриПробужденииКлиентскогоПриложения",
  },
}
```

If TypeScript reveals that any nested fixture property name differs from the snippet, use the importer output as the source of truth after the XML round-trip is green. Do not change `catalogFull.xml`.

- [ ] **Step 3: Run the new fromXML test and verify it fails**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms/clientApplicationForm/fromXML.test.ts -t "imports catalog full form from XML"
```

Expected: FAIL. The failure should mention missing fields such as `settingsStorage`, `mobileDeviceCommandBarContent`, `scalingMode`, XML alias mismatches, or missing event keys.

- [ ] **Step 4: Add the missing rules**

Modify `packages/core/metadata/forms/clientApplicationForm/rules.ts`.

Change `childItemsHorizontalAlign`:

```ts
    childItemsHorizontalAlign: {
      yaml: "ГоризонтальноеПоложениеПодчиненных",
      xml: "HorizontalAlign",
      type: "SystemEnumeration",
      typeSE: "ItemHorizontalLocation",
      tag: FormRulesTags.Form,
      implicitValueYAML: "Auto",
    },
```

Change `childItemsVerticalAlign`:

```ts
    childItemsVerticalAlign: {
      yaml: "ВертикальноеПоложениеПодчиненных",
      xml: "VerticalAlign",
      type: "SystemEnumeration",
      typeSE: "ItemVerticalAlign",
      tag: FormRulesTags.Form,
      implicitValueYAML: "Auto",
    },
```

Change `collapseItemsByImportance`:

```ts
    collapseItemsByImportance: {
      yaml: "СворачиваниеЭлементовПоВажности",
      xml: "CollapseItemsByImportanceVariant",
      type: "SystemEnumeration",
      typeSE: "CollapseFormItemsByImportance",
      tag: FormRulesTags.Form,
      implicitValueYAML: "Auto",
    },
```

Change `itemsAndTitlesAlign`:

```ts
    itemsAndTitlesAlign: {
      yaml: "ВыравниваниеЭлементовИЗаголовков",
      xml: "ChildrenAlign",
      type: "SystemEnumeration",
      typeSE: "ItemsAndTitlesAlignVariant",
      tag: FormRulesTags.Form,
      implicitValueYAML: "Auto",
    },
```

Add after `saveWindowSettings`:

```ts
    settingsStorage: {
      yaml: "ХранилищеНастроек",
      type: "MetadataItemLink",
      tag: FormRulesTags.Form,
    },
```

Add after `scale`:

```ts
    scalingMode: {
      yaml: "ВариантМасштаба",
      xml: "ScalingMode",
      type: "SystemEnumeration",
      typeSE: "ClientApplicationFormScaleVariant",
      tag: FormRulesTags.Form,
      implicitValueYAML: "Auto",
    },
```

Add after `commandSet`:

```ts
    mobileDeviceCommandBarContent: {
      yaml: "СоставКоманднойПанелиНаМобильномУстройстве",
      type: "MobileDeviceCommandBarContent",
      tag: FormRulesTags.Form,
    },
```

Add to `events.items`:

```ts
        onClientApplicationSuspend: "ПриЗасыпанииКлиентскогоПриложения",
        onClientApplicationResume: "ПриПробужденииКлиентскогоПриложения",
```

- [ ] **Step 5: Run the fromXML test and fix fixture shape only if needed**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms/clientApplicationForm/fromXML.test.ts -t "imports catalog full form from XML"
```

Expected: PASS. If it fails only because `catalogFullClientApplicationForm` has different nested object details, update `catalogFullClientApplicationForm` to match the imported model. If it fails because XML data is missing from the model, fix `rules.ts` or the new type.

- [ ] **Step 6: Write the failing toXML test**

Modify `packages/core/metadata/forms/clientApplicationForm/toXML.test.ts`.

Add `catalogFullClientApplicationForm` to the fixture import.

Add this test in `describe("exportClientApplicationFormToXML")`:

```ts
    it("exports catalog full form to XML", () => {
      const expectedResult = readXMLFixtureAsString(import.meta.url, "catalogFull.xml")
      const referenceFormXML = readAndParseXMLFixture<{ Form: ClientApplicationFormXML }>(
        import.meta.url,
        "catalogFull.xml"
      )
      const referenceMetadataXML = readAndParseXMLFixture<{ MetaDataObject: FormMetadataXML }>(
        import.meta.url,
        "minimalMetadata.xml"
      )
      const referenceForm = importClientApplicationFormFromXML({
        context: mockContextFromXML({ forReference: true }),
        xml: referenceFormXML.Form,
        xmlMetadata: referenceMetadataXML.MetaDataObject,
      })
      const xmlData = exportClientApplicationFormToXML({
        context: mockContextToXML(),
        form: catalogFullClientApplicationForm,
        referenceForm,
      })

      const result = xmlExport({ Form: xmlData })

      expect(result).toEqual(expectedResult)
    })
```

- [ ] **Step 7: Run the toXML catalog test and fix XML order/defaults**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms/clientApplicationForm/toXML.test.ts -t "exports catalog full form to XML"
```

Expected: PASS. If ordering differs, add `order` only to the specific new rule that cannot be ordered from the reference. Do not add broad `order` values.

- [ ] **Step 8: Run client form XML tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms/clientApplicationForm/fromXML.test.ts metadata/forms/clientApplicationForm/toXML.test.ts
```

Expected: PASS for the full client application form XML suite.

- [ ] **Step 9: Commit the form XML coverage**

Run:

```bash
git add packages/core/metadata/forms/clientApplicationForm/rules.ts packages/core/metadata/forms/clientApplicationForm/__fixtures__/data.ts packages/core/metadata/forms/clientApplicationForm/fromXML.test.ts packages/core/metadata/forms/clientApplicationForm/toXML.test.ts
git commit -m "test: cover catalog form XML fixture"
```

## Task 3: YAML Support for MobileDeviceCommandBarContent

**Files:**
- Create: `packages/core/metadata/commonObjects/mobileDeviceCommandBarContent/fromYAML.ts`
- Create: `packages/core/metadata/commonObjects/mobileDeviceCommandBarContent/toYAML.ts`
- Create: `packages/core/metadata/commonObjects/mobileDeviceCommandBarContent/fromYAML.test.ts`
- Create: `packages/core/metadata/commonObjects/mobileDeviceCommandBarContent/toYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/index.ts`

- [ ] **Step 1: Write the failing fromYAML test**

Create `packages/core/metadata/commonObjects/mobileDeviceCommandBarContent/fromYAML.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { mockContext, mockRule } from "~/tests/mockContext"
import { fullMobileDeviceCommandBarContent, fullMobileDeviceCommandBarContentYAML } from "./__fixtures__/data"
import { importMobileDeviceCommandBarContentFromYAML } from "./fromYAML"

describe("importMobileDeviceCommandBarContentFromYAML", () => {
  it("returns undefined for undefined input", () => {
    const result = importMobileDeviceCommandBarContentFromYAML(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("returns undefined for empty input", () => {
    const result = importMobileDeviceCommandBarContentFromYAML(mockContext, mockRule, [])
    expect(result).toBeUndefined()
  })

  it("imports full YAML", () => {
    const result = importMobileDeviceCommandBarContentFromYAML(
      mockContext,
      mockRule,
      fullMobileDeviceCommandBarContentYAML
    )

    expect(result).toEqual(fullMobileDeviceCommandBarContent)
  })
})
```

- [ ] **Step 2: Run the fromYAML test and verify it fails**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/mobileDeviceCommandBarContent/fromYAML.test.ts
```

Expected: FAIL because `fromYAML.ts` does not exist or `importMobileDeviceCommandBarContentFromYAML` is not defined.

- [ ] **Step 3: Implement fromYAML**

Create `packages/core/metadata/commonObjects/mobileDeviceCommandBarContent/fromYAML.ts`:

```ts
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import { importMetadataValueFromYAML } from "../metadataValue/fromYAML"
import { MobileDeviceCommandBarContent, MobileDeviceCommandBarContentYAML } from "./types"

export const importMobileDeviceCommandBarContentFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  yaml: MobileDeviceCommandBarContentYAML | undefined
): MobileDeviceCommandBarContent | undefined => {
  if (!yaml || yaml.length === 0) return undefined

  return yaml.map((item) => importMetadataValueFromYAML(context, { type: "MetadataValue" }, item))
}

registerTypeRule("MobileDeviceCommandBarContent", "importFromYAML", importMobileDeviceCommandBarContentFromYAML)
```

- [ ] **Step 4: Write the failing toYAML test**

Create `packages/core/metadata/commonObjects/mobileDeviceCommandBarContent/toYAML.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { mockContext, mockRule } from "~/tests/mockContext"
import { fullMobileDeviceCommandBarContent, fullMobileDeviceCommandBarContentYAML } from "./__fixtures__/data"
import { exportMobileDeviceCommandBarContentToYAML } from "./toYAML"

describe("exportMobileDeviceCommandBarContentToYAML", () => {
  it("returns undefined for undefined input", () => {
    const result = exportMobileDeviceCommandBarContentToYAML(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("returns undefined for empty input", () => {
    const result = exportMobileDeviceCommandBarContentToYAML(mockContext, mockRule, [])
    expect(result).toBeUndefined()
  })

  it("exports full YAML", () => {
    const result = exportMobileDeviceCommandBarContentToYAML(mockContext, mockRule, fullMobileDeviceCommandBarContent)

    expect(result).toEqual(fullMobileDeviceCommandBarContentYAML)
  })
})
```

- [ ] **Step 5: Run the toYAML test and verify it fails**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/mobileDeviceCommandBarContent/toYAML.test.ts
```

Expected: FAIL because `toYAML.ts` does not exist or `exportMobileDeviceCommandBarContentToYAML` is not defined.

- [ ] **Step 6: Implement toYAML**

Create `packages/core/metadata/commonObjects/mobileDeviceCommandBarContent/toYAML.ts`:

```ts
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import { exportMetadataValueToYAML } from "../metadataValue/toYAML"
import { MobileDeviceCommandBarContent, MobileDeviceCommandBarContentYAML } from "./types"

export const exportMobileDeviceCommandBarContentToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MobileDeviceCommandBarContent | undefined
): MobileDeviceCommandBarContentYAML | undefined => {
  if (!data || data.length === 0) return undefined

  return data.map((item) => exportMetadataValueToYAML(context, { type: "MetadataValue" }, item))
}

registerTypeRule("MobileDeviceCommandBarContent", "exportToYAML", exportMobileDeviceCommandBarContentToYAML)
```

- [ ] **Step 7: Register YAML common object imports**

Modify `packages/core/metadata/commonObjects/index.ts` near the XML imports added in Task 1:

```ts
import "./mobileDeviceCommandBarContent/fromYAML"
import "./mobileDeviceCommandBarContent/toYAML"
```

- [ ] **Step 8: Run YAML type tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/mobileDeviceCommandBarContent/fromYAML.test.ts metadata/commonObjects/mobileDeviceCommandBarContent/toYAML.test.ts
```

Expected: PASS with 6 tests passing.

- [ ] **Step 9: Run all new type tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/mobileDeviceCommandBarContent
```

Expected: PASS for `fromXML.test.ts`, `toXML.test.ts`, `fromYAML.test.ts`, and `toYAML.test.ts`.

- [ ] **Step 10: Commit the YAML type**

Run:

```bash
git add packages/core/metadata/commonObjects/mobileDeviceCommandBarContent packages/core/metadata/commonObjects/index.ts
git commit -m "feat: add mobile device command bar content YAML"
```

## Task 4: ClientApplicationForm YAML Coverage

**Files:**
- Modify: `packages/core/metadata/forms/clientApplicationForm/__fixtures__/data.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/fromYAML.test.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/toYAML.test.ts`

- [ ] **Step 1: Add the catalog YAML fixture**

Modify `packages/core/metadata/forms/clientApplicationForm/__fixtures__/data.ts`.

Add this export after `fullClientApplicationFormYAML`:

```ts
export const catalogFullClientApplicationFormYAML: ClientApplicationFormYAML = {
  Заголовок: "Заголовок",
  Ширина: 5,
  Высота: 10,
  РежимОткрытияОкнаФормы: "БлокироватьВесьИнтерфейс",
  ПоведениеКлавишиEnter: "КнопкаПоУмолчанию",
  АвтоматическоеСохранениеДанныхВНастройках: "Использовать",
  СохранениеДанныхВНастройках: "ИспользоватьСписок",
  СохранятьНастройкиОкна: "Ложь",
  ХранилищеНастроек: "SettingsStorage.ХранилищеНастроек",
  АвтоЗаголовок: "Ложь",
  АвтоНавигационнаяСсылка: "Ложь",
  Группировка: "ВсегдаГоризонтальная",
  ВыравниваниеЭлементовИЗаголовков: "ЭлементыЛевоЗаголовкиЛево",
  ГоризонтальныйИнтервал: "Одинарный",
  ВертикальныйИнтервал: "Двойной",
  ГоризонтальноеПоложениеПодчиненных: "Центр",
  ВертикальноеПоложениеПодчиненных: "Низ",
  ПроверятьЗаполнениеАвтоматически: "Ложь",
  РазрешитьИзменятьФорму: "Ложь",
  Доступность: "Ложь",
  ПоложениеКоманднойПанели: "Верх",
  ВертикальнаяПрокрутка: "ИспользоватьПриНеобходимости",
  ВариантМасштаба: "Компактный",
  Масштаб: 90,
  ОтображениеОбсуждений: "Показывать",
  СоставКоманднойПанелиНаМобильномУстройстве: ["ФормаКоманда1"],
  СоставКоманд: ["Записать"],
  ОтображатьЗаголовок: "Ложь",
  ОтображатьКнопкуЗакрытия: "Ложь",
  СворачиваниеЭлементовПоВажности: "НеИспользовать",
  ИспользованиеДляГруппИЭлементов: "Группы",
  КоманднаяПанель: {
    Имя: "ФормаКоманднаяПанель",
    Элементы: [
      {
        Кнопка: {
          Имя: "ФормаКоманда2",
          Вид: "КнопкаКоманднойПанели",
          ИмяКоманды: "Form.Command.Команда1",
          РасширеннаяПодсказка: {
            Имя: "ФормаКоманда2РасширеннаяПодсказка",
          },
        },
      },
    ],
  },
  Элементы: [
    {
      Кнопка: {
        Имя: "ФормаКоманда1",
        Вид: "ОбычнаяКнопка",
        ИмяКоманды: "Form.Command.Команда1",
        РасширеннаяПодсказка: {
          Имя: "ФормаКоманда1РасширеннаяПодсказка",
        },
      },
    },
  ],
  Реквизиты: [
    {
      Имя: "Объект",
      Тип: "CatalogObject.СправочникФормаВсеСвойства",
      ОсновнойРеквизит: "Истина",
      СохраняемыеДанные: "Истина",
    },
    {
      Имя: "Реквизит1",
      Тип: "Строка",
    },
  ],
  УсловноеОформлениеРеквизитов: catalogFullClientApplicationForm.attributesConditionalAppearance,
  Команды: [
    {
      Имя: "Команда1",
    },
  ],
  События: {
    ПослеЗаписи: "ПослеЗаписи",
    ПередПереоткрытиемСДругогоСервера: "ПередПереоткрытиемСДругогоСервера",
    ВыборЗначения: "ВыборЗначения",
    ПриПереоткрытииСДругогоСервера: "ПриПереоткрытииСДругогоСервера",
    ПриСохраненииДанныхВНастройкахНаСервере: "ПриСохраненииДанныхВНастройкахНаСервере",
    ПриЗасыпанииКлиентскогоПриложения: "ПриЗасыпанииКлиентскогоПриложения",
    ПриПробужденииКлиентскогоПриложения: "ПриПробужденииКлиентскогоПриложения",
    ОбработкаВыбора: "ОбработкаВыбора",
    ПослеЗаписиНаСервере: "ПослеЗаписиНаСервере",
    ПриВставкеИзБуфераОбмена: "ПриВставкеИзБуфераОбмена",
    ОбработкаОповещения: "ОбработкаОповещения",
    ПриЧтенииНаСервере: "ПриЧтенииНаСервере",
    ОбработкаЗаписиНового: "ОбработкаЗаписиНового",
    ПриОткрытии: "ПриОткрытии",
    ОбработкаПолученияСпискаНавигационныхСсылок: "ОбработкаПолученияСпискаНавигационныхСсылок",
    ПередЗакрытием: "ПередЗакрытием",
    ВнешнееСобытие: "ВнешнееСобытие",
    АвтоПодборПользователейСистемыВзаимодействия: "АвтоПодборПользователейСистемыВзаимодействия",
    ОбработкаПолученияНавигационнойСсылки: "ОбработкаПолученияНавигационнойСсылки",
    ПриПовторномОткрытии: "ПриПовторномОткрытии",
    ПриЗагрузкеДанныхИзНастроекНаСервере: "ПриЗагрузкеДанныхИзНастроекНаСервере",
    ОбработкаПерехода: "ОбработкаПерехода",
    ПередЗаписью: "ПередЗаписью",
    ПриСозданииНаСервере: "ПриСозданииНаСервере",
    ОбработкаПолученияФормыВыбораПользователейСистемыВзаимодействия:
      "ОбработкаПолученияФормыВыбораПользователейСистемыВзаимодействия",
    ОбработкаАктивизации: "ОбработкаАктивизации",
    ПриИзмененииПараметровЭкрана: "ПриИзмененииПараметровЭкрана",
    ПередЗаписьюНаСервере: "ПередЗаписьюНаСервере",
    ПриЗаписиНаСервере: "ПриЗаписиНаСервере",
    ПриЗакрытии: "ПриЗакрытии",
    ПриИзмененииДоступностиОсновногоСервера: "ПриИзмененииДоступностиОсновногоСервера",
    ОбработкаНавигационнойСсылки: "ОбработкаНавигационнойСсылки",
    ОбработкаПроверкиЗаполненияНаСервере: "ОбработкаПроверкиЗаполненияНаСервере",
    ПередЗагрузкойДанныхИзНастроекНаСервере: "ПередЗагрузкойДанныхИзНастроекНаСервере",
    ОтключениеВнешнейКомпонентыПриОшибке: "ОтключениеВнешнейКомпонентыПриОшибке",
  },
}
```

If existing YAML exporters produce a different nested shape for `КоманднаяПанель`, `Элементы`, `Реквизиты`, or `УсловноеОформлениеРеквизитов`, adjust this fixture to the existing exporter shape. Keep the agreed top-level YAML names exactly: `ХранилищеНастроек`, `ВариантМасштаба`, and `СоставКоманднойПанелиНаМобильномУстройстве`.

- [ ] **Step 2: Write the failing fromYAML test**

Modify `packages/core/metadata/forms/clientApplicationForm/fromYAML.test.ts`.

Add imports:

```ts
import {
  catalogFullClientApplicationForm,
  catalogFullClientApplicationFormYAML,
  fullClientApplicationForm,
  fullClientApplicationFormYAML,
  minimalClientApplicationForm,
  minimalClientApplicationFormYAML,
} from "./__fixtures__/data"
```

Add test:

```ts
  it("imports catalog full YAML", () => {
    const result = importClientApplicationFormFromYAML(mockContextFromYAML, catalogFullClientApplicationFormYAML)

    expect(result).toEqual(catalogFullClientApplicationForm)
  })
```

- [ ] **Step 3: Run the fromYAML test and fix fixture shape only if needed**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms/clientApplicationForm/fromYAML.test.ts -t "imports catalog full YAML"
```

Expected: PASS. If it fails because nested YAML shape differs from the snippet, update `catalogFullClientApplicationFormYAML` to match existing YAML import rules.

- [ ] **Step 4: Write the failing toYAML test**

Modify `packages/core/metadata/forms/clientApplicationForm/toYAML.test.ts`.

Add `catalogFullClientApplicationForm` and `catalogFullClientApplicationFormYAML` to the fixture import.

Add test:

```ts
  it("exports catalog full YAML", () => {
    const { yaml } = exportClientApplicationFormToYAML(mockContextToYAML, catalogFullClientApplicationForm)

    expect(yaml).toEqual(catalogFullClientApplicationFormYAML)
  })
```

- [ ] **Step 5: Run the toYAML test and fix YAML defaults only if needed**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms/clientApplicationForm/toYAML.test.ts -t "exports catalog full YAML"
```

Expected: PASS. If expected data includes values that are intentionally omitted by `implicitValueYAML`, update the YAML fixture. Do not remove the agreed keys from the fixture unless exporter omits them because the value equals a documented default.

- [ ] **Step 6: Run client form YAML tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms/clientApplicationForm/fromYAML.test.ts metadata/forms/clientApplicationForm/toYAML.test.ts
```

Expected: PASS for the full client application form YAML suite.

- [ ] **Step 7: Commit YAML coverage**

Run:

```bash
git add packages/core/metadata/forms/clientApplicationForm/__fixtures__/data.ts packages/core/metadata/forms/clientApplicationForm/fromYAML.test.ts packages/core/metadata/forms/clientApplicationForm/toYAML.test.ts
git commit -m "test: cover catalog form YAML fixture"
```

## Task 5: Final Verification and Coverage Report

**Files:**
- Read: `packages/core/metadata/forms/clientApplicationForm/rules.ts`
- Read: `packages/core/metadata/forms/clientApplicationForm/__fixtures__/catalogFull.xml`
- Read: `packages/core/metadata/commonObjects/mobileDeviceCommandBarContent/types.ts`

- [ ] **Step 1: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/mobileDeviceCommandBarContent metadata/forms/clientApplicationForm/fromXML.test.ts metadata/forms/clientApplicationForm/toXML.test.ts metadata/forms/clientApplicationForm/fromYAML.test.ts metadata/forms/clientApplicationForm/toYAML.test.ts
```

Expected: PASS.

- [ ] **Step 2: Generate Langium files before full test**

Run:

```bash
pnpm --filter nkdk-language langium:generate
```

Expected: `Langium generator finished successfully`.

- [ ] **Step 3: Run the full project test suite**

Run from repository root:

```bash
pnpm test
```

Expected: PASS for all packages.

- [ ] **Step 4: Check git status**

Run:

```bash
git status --short
```

Expected: only intended files are modified or the working tree is clean after commits.

- [ ] **Step 5: Prepare the coverage report**

Report these fixture coverage facts in the final message:

```text
MobileDeviceCommandBarContent properties covered by XML fixture: xr:Item/xr:Value.
MobileDeviceCommandBarContent empty input behavior covered: undefined and empty array -> undefined.
ClientApplicationForm catalog fixture covers: SettingsStorage, ChildrenAlign, HorizontalAlign, VerticalAlign, ScalingMode, MobileDeviceCommandBarContent, CollapseItemsByImportanceVariant, OnClientApplicationSuspend, OnClientApplicationResume.
Known intentionally uncovered variants: MobileDeviceCommandBarContent with non-string MetadataValue types and multiple items.
```

- [ ] **Step 6: Commit final fixes if the verification task changed files**

If any verification fix changed files, run:

```bash
git add packages/core/metadata/commonObjects/mobileDeviceCommandBarContent packages/core/metadata/forms/clientApplicationForm packages/core/metadata/commonObjects/index.ts packages/core/metadata/orchestration/property/registry.ts
git commit -m "fix: stabilize catalog form fixture coverage"
```

Expected: commit succeeds, or skip this step if no files changed after the previous commits.

## Self-Review

- Spec coverage: the plan covers the new common type, XML import/export, YAML import/export, client form rules, catalog XML fixture tests, catalog YAML fixture tests, and final full-suite verification.
- Placeholder scan: no unfinished markers or unspecified implementation steps remain. Where fixture shape may differ for existing nested form objects, the plan names the exact source of truth: existing import/export rules and the importer output after XML round-trip.
- Type consistency: `MobileDeviceCommandBarContent` is consistently modeled as `MetadataTypedValue[]`, XML as `MobileDeviceCommandBarContentXML`, YAML as `MetadataValueYAML[]`, and the property key is consistently `mobileDeviceCommandBarContent`.
