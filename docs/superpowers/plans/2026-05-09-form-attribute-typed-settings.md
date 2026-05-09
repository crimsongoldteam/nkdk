# FormAttribute Typed Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve `FormAttribute.Settings` for `Chart` and `SpreadsheetDocument` as raw XML fragments in the model and YAML.

**Architecture:** Add two property types, `Chart` and `SpreadsheetDocument`, that keep only the inner XML of `<Settings>` in the model. `FormAttribute` dispatches XML `Settings` by `xsi:type`, because multiple fields share the same XML tag. YAML uses normal rule keys: `Диаграмма` and `ТабличныйДокумент`, each storing an XML fragment string without the outer `Settings` tag.

**Tech Stack:** TypeScript, Vitest, existing `metadata/orchestration` property registry, `fast-xml-parser` via `importContentFromXML` and `xmlExport`.

---

## File Structure

- Create `packages/core/metadata/forms/commonObjects/settingsFragment/types.ts`: shared helpers for raw inner XML fragments.
- Create `packages/core/metadata/forms/commonObjects/chart/types.ts`: registers property type `Chart`.
- Create `packages/core/metadata/forms/commonObjects/spreadsheetDocument/types.ts`: registers property type `SpreadsheetDocument`.
- Modify `packages/core/metadata/forms/commonObjects/index.ts`: import the two new type modules.
- Modify `packages/core/metadata/orchestration/property/registry.ts`: add registry entries for `Chart` and `SpreadsheetDocument`.
- Modify `packages/core/metadata/forms/commonObjects/formAttribute/rules.ts`: add `chart` and `spreadsheetDocument` YAML rules.
- Modify `packages/core/metadata/forms/commonObjects/formAttribute/types.ts`: add XML and YAML typing.
- Create `packages/core/metadata/forms/commonObjects/formAttribute/settings.ts`: dispatch XML `Settings` to typed properties and export typed settings back to XML.
- Modify `packages/core/metadata/forms/commonObjects/formAttribute/fromXML.ts`: merge dispatched typed settings into imported `FormAttribute`.
- Modify `packages/core/metadata/forms/commonObjects/formAttribute/toXML.ts`: export typed settings before the existing `ValueListType` empty-settings logic.
- Create four fixtures:
  - `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/chartSettings.xml`
  - `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/chartSettings.ts`
  - `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/spreadsheetDocumentSettings.xml`
  - `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/spreadsheetDocumentSettings.ts`
- Modify formAttribute XML/YAML tests to cover import and export.

---

### Task 1: Add Raw Settings Fragment Types

**Files:**
- Create: `packages/core/metadata/forms/commonObjects/settingsFragment/types.ts`
- Create: `packages/core/metadata/forms/commonObjects/chart/types.ts`
- Create: `packages/core/metadata/forms/commonObjects/spreadsheetDocument/types.ts`
- Modify: `packages/core/metadata/forms/commonObjects/index.ts`
- Modify: `packages/core/metadata/orchestration/property/registry.ts`

- [ ] **Step 1: Create the shared fragment helper**

Create `packages/core/metadata/forms/commonObjects/settingsFragment/types.ts`:

```typescript
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import { importContentFromXML } from "~/xml/import/importer"
import { xmlExport } from "~/xml/export/exporter"

export type SettingsFragment = Record<string, unknown>
export type SettingsFragmentYAML = string
export type SettingsFragmentXML = Record<string, unknown>

type SettingsFragmentTypeOptions = {
  propertyType: "Chart" | "SpreadsheetDocument"
  canonicalAttributes: Record<string, string>
  isMatchingXsiType: (xsiType: string) => boolean
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && value !== undefined && typeof value === "object" && !Array.isArray(value)

const stripSettingsAttributes = (xml: Record<string, unknown>): SettingsFragment => {
  return Object.fromEntries(
    Object.entries(xml).filter(([key]) => key !== "_xsi:type" && !key.startsWith("_xmlns"))
  )
}

const parseFragment = (value: string): SettingsFragment | undefined => {
  const trimmed = value.trim()
  if (trimmed.length === 0) return {}
  const parsed = importContentFromXML<{ SettingsFragment?: SettingsFragment }>(
    `<SettingsFragment>${trimmed}</SettingsFragment>`
  )
  return parsed.SettingsFragment ?? {}
}

const serializeFragment = (value: SettingsFragment | undefined): string | undefined => {
  if (value === undefined) return undefined
  return xmlExport(value, false)
}

export const registerSettingsFragmentType = (options: SettingsFragmentTypeOptions): void => {
  registerTypeRule(
    options.propertyType,
    "importFromXML",
    (_context: ConfigurationContext, _rule: PropertyRule | undefined, xml: unknown) => {
      if (!isRecord(xml)) return undefined
      const xsiType = xml["_xsi:type"]
      if (typeof xsiType !== "string" || !options.isMatchingXsiType(xsiType)) return undefined
      return stripSettingsAttributes(xml)
    }
  )

  registerTypeRule(
    options.propertyType,
    "exportToXML",
    (_context: ConfigurationContext, _rule: PropertyRule | undefined, value: SettingsFragment | undefined) => {
      if (!isRecord(value)) return undefined
      return {
        ...options.canonicalAttributes,
        ...value,
      }
    }
  )

  registerTypeRule(
    options.propertyType,
    "importFromYAML",
    (_context: ConfigurationContext, _rule: PropertyRule | undefined, value: unknown) => {
      if (typeof value !== "string") return undefined
      return parseFragment(value)
    }
  )

  registerTypeRule(
    options.propertyType,
    "exportToYAML",
    (_context: ConfigurationContext, _rule: PropertyRule | undefined, value: SettingsFragment | undefined) => {
      return serializeFragment(value)
    }
  )
}
```

- [ ] **Step 2: Add the `Chart` property type**

Create `packages/core/metadata/forms/commonObjects/chart/types.ts`:

```typescript
import {
  registerSettingsFragmentType,
  SettingsFragment,
  SettingsFragmentXML,
  SettingsFragmentYAML,
} from "../settingsFragment/types"

export type Chart = SettingsFragment
export type ChartXML = SettingsFragmentXML
export type ChartYAML = SettingsFragmentYAML

registerSettingsFragmentType({
  propertyType: "Chart",
  canonicalAttributes: {
    "_xmlns:d4p1": "http://v8.1c.ru/8.2/data/chart",
    "_xsi:type": "d4p1:Chart",
  },
  isMatchingXsiType: (xsiType) => xsiType === "d4p1:Chart" || xsiType.endsWith(":Chart"),
})
```

- [ ] **Step 3: Add the `SpreadsheetDocument` property type**

Create `packages/core/metadata/forms/commonObjects/spreadsheetDocument/types.ts`:

```typescript
import {
  registerSettingsFragmentType,
  SettingsFragment,
  SettingsFragmentXML,
  SettingsFragmentYAML,
} from "../settingsFragment/types"

export type SpreadsheetDocument = SettingsFragment
export type SpreadsheetDocumentXML = SettingsFragmentXML
export type SpreadsheetDocumentYAML = SettingsFragmentYAML

registerSettingsFragmentType({
  propertyType: "SpreadsheetDocument",
  canonicalAttributes: {
    "_xmlns:mxl": "http://v8.1c.ru/8.2/data/spreadsheet",
    "_xsi:type": "mxl:SpreadsheetDocument",
  },
  isMatchingXsiType: (xsiType) => xsiType === "mxl:SpreadsheetDocument" || xsiType.endsWith(":SpreadsheetDocument"),
})
```

- [ ] **Step 4: Register modules in commonObjects index**

Modify `packages/core/metadata/forms/commonObjects/index.ts` and add these imports near the other common object imports:

```typescript
import "./chart/types"
import "./spreadsheetDocument/types"
```

- [ ] **Step 5: Add property registry entries**

Modify `packages/core/metadata/orchestration/property/registry.ts`.

Add imports near the existing form common object imports:

```typescript
import { Chart, ChartYAML } from "~/metadata/forms/commonObjects/chart/types"
import {
  SpreadsheetDocument,
  SpreadsheetDocumentYAML,
} from "~/metadata/forms/commonObjects/spreadsheetDocument/types"
```

Add entries near `DynamicList`:

```typescript
  Chart: {
    item: Chart
    yaml: ChartYAML
  }

  SpreadsheetDocument: {
    item: SpreadsheetDocument
    yaml: SpreadsheetDocumentYAML
  }
```

### Task 2: Wire Typed Settings Into FormAttribute

**Files:**
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/rules.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/types.ts`
- Create: `packages/core/metadata/forms/commonObjects/formAttribute/settings.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/fromXML.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/toXML.ts`

- [ ] **Step 1: Add rules for YAML and model fields**

Modify `packages/core/metadata/forms/commonObjects/formAttribute/rules.ts` inside `FormAttributeRules.properties`, after `dynamicList`:

```typescript
    chart: {
      type: "Chart",
      xml: "Settings",
      yaml: "Диаграмма",
      fromXML: false,
      toXML: false,
    },
    spreadsheetDocument: {
      type: "SpreadsheetDocument",
      xml: "Settings",
      yaml: "ТабличныйДокумент",
      fromXML: false,
      toXML: false,
    },
```

The explicit `fromXML: false` and `toXML: false` avoid the generic duplicate-`Settings` collision. XML import/export for these fields is handled by `formAttribute/settings.ts`; YAML still uses these rules.

- [ ] **Step 2: Add FormAttribute types**

Modify `packages/core/metadata/forms/commonObjects/formAttribute/types.ts`.

Add imports:

```typescript
import { ChartXML, ChartYAML } from "~/metadata/forms/commonObjects/chart/types"
import {
  SpreadsheetDocumentXML,
  SpreadsheetDocumentYAML,
} from "~/metadata/forms/commonObjects/spreadsheetDocument/types"
```

Change `FormAttributeXML.Settings`:

```typescript
  Settings?: SettingsTypeDescriptionXML | DynamicListXML | ChartXML | SpreadsheetDocumentXML
```

Add YAML keys:

```typescript
  Диаграмма?: ChartYAML
  ТабличныйДокумент?: SpreadsheetDocumentYAML
```

- [ ] **Step 3: Create XML settings dispatcher**

Create `packages/core/metadata/forms/commonObjects/formAttribute/settings.ts`:

```typescript
import { ConfigurationContextFromXML, ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { exportPropertyToXML, importPropertyFromXML } from "~/metadata/orchestration"
import { FormAttribute, FormAttributeXML } from "./types"

const chartRule = { type: "Chart", xml: "Settings", yaml: "Диаграмма" } as const
const spreadsheetDocumentRule = {
  type: "SpreadsheetDocument",
  xml: "Settings",
  yaml: "ТабличныйДокумент",
} as const

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && value !== undefined && typeof value === "object" && !Array.isArray(value)

const getXsiType = (settings: unknown): string | undefined => {
  if (!isRecord(settings)) return undefined
  const xsiType = settings["_xsi:type"]
  return typeof xsiType === "string" ? xsiType : undefined
}

export const importTypedFormAttributeSettingsFromXML = (
  context: ConfigurationContextFromXML,
  settings: FormAttributeXML["Settings"]
): Pick<FormAttribute, "chart" | "spreadsheetDocument"> => {
  const xsiType = getXsiType(settings)
  if (xsiType === undefined) return {}

  if (xsiType === "d4p1:Chart" || xsiType.endsWith(":Chart")) {
    const chart = importPropertyFromXML({ context, rule: chartRule, value: settings, name: "chart" })
    return chart === undefined ? {} : { chart }
  }

  if (xsiType === "mxl:SpreadsheetDocument" || xsiType.endsWith(":SpreadsheetDocument")) {
    const spreadsheetDocument = importPropertyFromXML({
      context,
      rule: spreadsheetDocumentRule,
      value: settings,
      name: "spreadsheetDocument",
    })
    return spreadsheetDocument === undefined ? {} : { spreadsheetDocument }
  }

  return {}
}

export const exportTypedFormAttributeSettingsToXML = (
  context: ConfigurationContextWithExportToXML,
  data: FormAttribute
): FormAttributeXML["Settings"] | undefined => {
  if (data.chart !== undefined) {
    return exportPropertyToXML({
      context,
      rule: chartRule,
      value: data.chart,
      metadataItem: data,
    })
  }

  if (data.spreadsheetDocument !== undefined) {
    return exportPropertyToXML({
      context,
      rule: spreadsheetDocumentRule,
      value: data.spreadsheetDocument,
      metadataItem: data,
    })
  }

  return undefined
}
```

- [ ] **Step 4: Merge typed settings during XML import**

Modify `packages/core/metadata/forms/commonObjects/formAttribute/fromXML.ts`.

Add import:

```typescript
import { importTypedFormAttributeSettingsFromXML } from "./settings"
```

Inside `importFormAttributeFromXML`, after `properties` is created and before `result` is returned, compute:

```typescript
  const typedSettings = importTypedFormAttributeSettingsFromXML(context, xml.Settings)
```

In the `forReference` branch, before returning:

```typescript
    Object.assign(result, typedSettings)
```

In the normal branch, add typed settings to the result:

```typescript
  const result: FormAttributeWithAdditionalColumns = {
    ...properties,
    ...typedSettings,
    itemType: FormAttributeRules.itemType,
    name: xml._name,
    title: properties.title!,
    columns,
  }
```

- [ ] **Step 5: Export typed settings during XML export**

Modify `packages/core/metadata/forms/commonObjects/formAttribute/toXML.ts`.

Add import:

```typescript
import { exportTypedFormAttributeSettingsToXML } from "./settings"
```

In `exportFormAttributeToXML`, after `assignPropertiesWithColumns(result, properties, columnsXML, referenceData)`, insert:

```typescript
  const typedSettings = exportTypedFormAttributeSettingsToXML(context, data)
  if (typedSettings !== undefined) {
    result.Settings = typedSettings
  }
```

Then change the existing `ValueListType` guard to avoid wrapping typed settings:

```typescript
  if (typedSettings === undefined && (data.type?.type.includes("ValueListType") || result.Settings !== undefined)) {
    result.Settings = {
      "_xsi:type": "v8:TypeDescription",
      ...result.Settings,
    }
  }
```

- [ ] **Step 6: Run focused type check**

Run:

```bash
pnpm --filter '@nakidka/core' exec tsc --noEmit
```

Expected: PASS.

---

### Task 3: Add XML Round-Trip Fixtures and Tests

**Files:**
- Create: `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/chartSettings.xml`
- Create: `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/chartSettings.ts`
- Create: `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/spreadsheetDocumentSettings.xml`
- Create: `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/spreadsheetDocumentSettings.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/fromXML.test.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/toXML.test.ts`

- [ ] **Step 1: Add `chartSettings.xml`**

Create `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/chartSettings.xml`:

```xml
<Attribute name="Диаграмма" id="1">
	<Type>
		<v8:Type xmlns:d5p1="http://v8.1c.ru/8.2/data/chart">d5p1:Chart</v8:Type>
	</Type>
	<Settings xmlns:d4p1="http://v8.1c.ru/8.2/data/chart" xsi:type="d4p1:Chart">
		<d4p1:seriesCurId>1</d4p1:seriesCurId>
		<d4p1:pointsCurId>0</d4p1:pointsCurId>
		<d4p1:realExSeriesData>
			<d4p1:id>1</d4p1:id>
			<d4p1:color>auto</d4p1:color>
			<d4p1:line width="2" gap="false">
				<v8ui:style xsi:type="v8ui:ChartLineType">Solid</v8ui:style>
			</d4p1:line>
			<d4p1:text/>
		</d4p1:realExSeriesData>
		<d4p1:valuesAxis/>
		<d4p1:pointsAxis/>
	</Settings>
</Attribute>
```

- [ ] **Step 2: Add `chartSettings.ts`**

Create `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/chartSettings.ts`:

```typescript
import type { FormAttributes } from "../types"

export const chartSettings = [
  {
    itemType: "FormAttribute",
    name: "Диаграмма",
    type: { type: ["Chart"] },
    title: { items: { ru: "" } },
    columns: [],
    chart: {
      "d4p1:seriesCurId": "1",
      "d4p1:pointsCurId": "0",
      "d4p1:realExSeriesData": {
        "d4p1:id": "1",
        "d4p1:color": "auto",
        "d4p1:line": {
          _width: "2",
          _gap: "false",
          "v8ui:style": {
            "_xsi:type": "v8ui:ChartLineType",
            "#text": "Solid",
          },
        },
        "d4p1:text": undefined,
      },
      "d4p1:valuesAxis": undefined,
      "d4p1:pointsAxis": undefined,
    },
  },
] satisfies FormAttributes
```

- [ ] **Step 3: Add `spreadsheetDocumentSettings.xml`**

Create `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/spreadsheetDocumentSettings.xml`:

```xml
<Attribute name="Макет" id="1">
	<Type>
		<v8:Type xmlns:mxl="http://v8.1c.ru/8.2/data/spreadsheet">mxl:SpreadsheetDocument</v8:Type>
	</Type>
	<Settings xmlns:mxl="http://v8.1c.ru/8.2/data/spreadsheet" xsi:type="mxl:SpreadsheetDocument">
		<mxl:languageSettings>
			<mxl:currentLanguage/>
			<mxl:defaultLanguage/>
		</mxl:languageSettings>
		<mxl:columns>
			<mxl:size>3</mxl:size>
		</mxl:columns>
		<mxl:rowsItem>
			<mxl:index>0</mxl:index>
			<mxl:row>
				<mxl:empty>true</mxl:empty>
			</mxl:row>
		</mxl:rowsItem>
		<mxl:format>
			<mxl:width>72</mxl:width>
		</mxl:format>
	</Settings>
</Attribute>
```

- [ ] **Step 4: Add `spreadsheetDocumentSettings.ts`**

Create `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/spreadsheetDocumentSettings.ts`:

```typescript
import type { FormAttributes } from "../types"

export const spreadsheetDocumentSettings = [
  {
    itemType: "FormAttribute",
    name: "Макет",
    type: { type: ["SpreadsheetDocument"] },
    title: { items: { ru: "" } },
    columns: [],
    spreadsheetDocument: {
      "mxl:languageSettings": {
        "mxl:currentLanguage": undefined,
        "mxl:defaultLanguage": undefined,
      },
      "mxl:columns": {
        "mxl:size": "3",
      },
      "mxl:rowsItem": {
        "mxl:index": "0",
        "mxl:row": {
          "mxl:empty": "true",
        },
      },
      "mxl:format": {
        "mxl:width": "72",
      },
    },
  },
] satisfies FormAttributes
```

- [ ] **Step 5: Add imports in XML tests**

Modify `packages/core/metadata/forms/commonObjects/formAttribute/fromXML.test.ts` and `toXML.test.ts`:

```typescript
import { chartSettings } from "./__fixtures__/chartSettings"
import { spreadsheetDocumentSettings } from "./__fixtures__/spreadsheetDocumentSettings"
```

- [ ] **Step 6: Add failing XML import tests**

In `fromXML.test.ts`, add:

```typescript
  it("import chartSettings", () => {
    const result = testImportPropertyFromXML({
      rule: formAttributesRule,
      path: "chartSettings.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(chartSettings)
  })

  it("import spreadsheetDocumentSettings", () => {
    const result = testImportPropertyFromXML({
      rule: formAttributesRule,
      path: "spreadsheetDocumentSettings.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(spreadsheetDocumentSettings)
  })
```

- [ ] **Step 7: Run import tests and verify failure before implementation**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/forms/commonObjects/formAttribute/fromXML.test.ts -t "import chartSettings|import spreadsheetDocumentSettings"
```

Expected before Task 2 implementation: FAIL because `chart` and `spreadsheetDocument` are missing.

- [ ] **Step 8: Add XML export tests**

In `toXML.test.ts`, add:

```typescript
  it("export chartSettings", () => {
    const { result, expectedResult } = testExportPropertyToXML({
      rule: formAttributesRule,
      value: chartSettings,
      xmlRootTag: "Attribute",
      exportXmlDataAsRoot: true,
      path: "chartSettings.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("export spreadsheetDocumentSettings", () => {
    const { result, expectedResult } = testExportPropertyToXML({
      rule: formAttributesRule,
      value: spreadsheetDocumentSettings,
      xmlRootTag: "Attribute",
      exportXmlDataAsRoot: true,
      path: "spreadsheetDocumentSettings.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })
```

- [ ] **Step 9: Run XML tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/forms/commonObjects/formAttribute/fromXML.test.ts packages/core/metadata/forms/commonObjects/formAttribute/toXML.test.ts -t "chartSettings|spreadsheetDocumentSettings"
```

Expected after Task 2 implementation: PASS.

---

### Task 4: Add YAML Fragment Tests

**Files:**
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/fromYAML.test.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/toYAML.test.ts`

- [ ] **Step 1: Import the fixtures**

In both YAML test files, add:

```typescript
import { chartSettings } from "./__fixtures__/chartSettings"
import { spreadsheetDocumentSettings } from "./__fixtures__/spreadsheetDocumentSettings"
```

- [ ] **Step 2: Add YAML fixture objects inside tests**

Use these constants in both YAML test files:

```typescript
const chartSettingsYAML = {
  Диаграмма: {
    Тип: "Chart",
    Диаграмма: `<d4p1:seriesCurId>1</d4p1:seriesCurId>
<d4p1:pointsCurId>0</d4p1:pointsCurId>
<d4p1:realExSeriesData>
\t<d4p1:id>1</d4p1:id>
\t<d4p1:color>auto</d4p1:color>
\t<d4p1:line width="2" gap="false">
\t\t<v8ui:style xsi:type="v8ui:ChartLineType">Solid</v8ui:style>
\t</d4p1:line>
\t<d4p1:text/>
</d4p1:realExSeriesData>
<d4p1:valuesAxis/>
<d4p1:pointsAxis/>`,
  },
}

const spreadsheetDocumentSettingsYAML = {
  Макет: {
    Тип: "SpreadsheetDocument",
    ТабличныйДокумент: `<mxl:languageSettings>
\t<mxl:currentLanguage/>
\t<mxl:defaultLanguage/>
</mxl:languageSettings>
<mxl:columns>
\t<mxl:size>3</mxl:size>
</mxl:columns>
<mxl:rowsItem>
\t<mxl:index>0</mxl:index>
\t<mxl:row>
\t\t<mxl:empty>true</mxl:empty>
\t</mxl:row>
</mxl:rowsItem>
<mxl:format>
\t<mxl:width>72</mxl:width>
</mxl:format>`,
  },
}
```

- [ ] **Step 3: Add YAML import tests**

In `fromYAML.test.ts`, add:

```typescript
  it("imports chartSettings YAML fragment", () => {
    const result = importFormAttributesFromYAML(mockContext, mockRule, chartSettingsYAML)

    expect(result).toEqual(chartSettings)
  })

  it("imports spreadsheetDocumentSettings YAML fragment", () => {
    const result = importFormAttributesFromYAML(mockContext, mockRule, spreadsheetDocumentSettingsYAML)

    expect(result).toEqual(spreadsheetDocumentSettings)
  })
```

- [ ] **Step 4: Add YAML export tests**

In `toYAML.test.ts`, add:

```typescript
  it("exports chartSettings YAML fragment", () => {
    const result = exportFormAttributesToYAML(mockContext, mockRule, chartSettings)

    expect(result).toEqual(chartSettingsYAML)
  })

  it("exports spreadsheetDocumentSettings YAML fragment", () => {
    const result = exportFormAttributesToYAML(mockContext, mockRule, spreadsheetDocumentSettings)

    expect(result).toEqual(spreadsheetDocumentSettingsYAML)
  })
```

- [ ] **Step 5: Run YAML tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/forms/commonObjects/formAttribute/fromYAML.test.ts packages/core/metadata/forms/commonObjects/formAttribute/toYAML.test.ts -t "chartSettings|spreadsheetDocumentSettings"
```

Expected after implementation: PASS.

---

### Task 5: Verify Existing Settings Behavior

**Files:**
- Modify only if a regression appears: `packages/core/metadata/forms/commonObjects/formAttribute/toXML.ts`

- [ ] **Step 1: Run existing FormAttribute tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/forms/commonObjects/formAttribute
```

Expected: PASS.

- [ ] **Step 2: Run DynamicList tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/forms/commonObjects/dynamicList
```

Expected: PASS.

- [ ] **Step 3: Run targeted core type check**

Run:

```bash
pnpm --filter '@nakidka/core' exec tsc --noEmit
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/core/metadata/forms/commonObjects/settingsFragment/types.ts \
  packages/core/metadata/forms/commonObjects/chart/types.ts \
  packages/core/metadata/forms/commonObjects/spreadsheetDocument/types.ts \
  packages/core/metadata/forms/commonObjects/index.ts \
  packages/core/metadata/orchestration/property/registry.ts \
  packages/core/metadata/forms/commonObjects/formAttribute/rules.ts \
  packages/core/metadata/forms/commonObjects/formAttribute/types.ts \
  packages/core/metadata/forms/commonObjects/formAttribute/settings.ts \
  packages/core/metadata/forms/commonObjects/formAttribute/fromXML.ts \
  packages/core/metadata/forms/commonObjects/formAttribute/toXML.ts \
  packages/core/metadata/forms/commonObjects/formAttribute/fromXML.test.ts \
  packages/core/metadata/forms/commonObjects/formAttribute/toXML.test.ts \
  packages/core/metadata/forms/commonObjects/formAttribute/fromYAML.test.ts \
  packages/core/metadata/forms/commonObjects/formAttribute/toYAML.test.ts \
  packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/chartSettings.xml \
  packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/chartSettings.ts \
  packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/spreadsheetDocumentSettings.xml \
  packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/spreadsheetDocumentSettings.ts
git commit -m "feat: preserve form attribute typed settings"
```

---

## Self-Review

Spec coverage:

- `Chart` type with YAML key `Диаграмма`: Task 1 and Task 2.
- YAML stores only inner XML, without outer `Settings`: Task 1 and Task 4.
- XML export uses canonical chart wrapper: Task 1.
- `SpreadsheetDocument` type with YAML key `ТабличныйДокумент`: Task 1 and Task 2.
- XML export uses canonical spreadsheet wrapper: Task 1.
- Existing `valueType` and `dynamicList` semantics stay unchanged: Task 2 and Task 5.

Placeholder scan:

- The plan contains concrete file paths, code, commands, and expected outcomes.
- No unresolved placeholder sections are left.

Type consistency:

- Property names are `chart` and `spreadsheetDocument`.
- Property types are `Chart` and `SpreadsheetDocument`.
- YAML keys are `Диаграмма` and `ТабличныйДокумент`.
