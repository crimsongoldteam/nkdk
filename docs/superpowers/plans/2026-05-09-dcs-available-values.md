# DCS Available Values Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add XML/TS/YAML support for `dcssch:availableValue` on DCS data set fields and calculated fields, including `xsi:nil` values without using `null`.

**Architecture:** Introduce a focused `availableValues` module under `dataCompositionSystem`. The item-level XML handler owns nil export/import because normal property export skips `undefined`; owner rules use a simple collection property.

**Tech Stack:** TypeScript, Vitest, metadata item/collection rules, DCS metadata value helpers, DCS local string type helpers.

---

## File Structure

- Create `packages/core/metadata/commonObjects/dataCompositionSystem/availableValues/types.ts`
- Create `packages/core/metadata/commonObjects/dataCompositionSystem/availableValues/fromXML.ts`
- Create `packages/core/metadata/commonObjects/dataCompositionSystem/availableValues/toXML.ts`
- Create `packages/core/metadata/commonObjects/dataCompositionSystem/availableValues/fromYAML.ts`
- Create `packages/core/metadata/commonObjects/dataCompositionSystem/availableValues/toYAML.ts`
- Create `packages/core/metadata/commonObjects/dataCompositionSystem/availableValues/fromYAML.test.ts`
- Create `packages/core/metadata/commonObjects/dataCompositionSystem/availableValues/toYAML.test.ts`
- Create `packages/core/metadata/commonObjects/dataCompositionSystem/availableValues/fromXML.test.ts`
- Create `packages/core/metadata/commonObjects/dataCompositionSystem/availableValues/toXML.test.ts`
- Create `packages/core/metadata/commonObjects/dataCompositionSystem/availableValues/__fixtures__/data.ts`
- Create XML fixtures under `availableValues/__fixtures__`.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/index.ts`
- Modify `packages/core/metadata/orchestration/property/registry.ts`
- Modify owner rules:
  - `packages/core/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/rules.ts`
  - `packages/core/metadata/commonObjects/dataCompositionSystem/calculatedField/rules.ts`
- Modify owner fixture data and tests.

## Task 1: AvailableValues Module

**Files:**
- Create: `packages/core/metadata/commonObjects/dataCompositionSystem/availableValues/types.ts`
- Create: `packages/core/metadata/commonObjects/dataCompositionSystem/availableValues/fromXML.ts`
- Create: `packages/core/metadata/commonObjects/dataCompositionSystem/availableValues/toXML.ts`
- Create: `packages/core/metadata/commonObjects/dataCompositionSystem/availableValues/fromYAML.ts`
- Create: `packages/core/metadata/commonObjects/dataCompositionSystem/availableValues/toYAML.ts`
- Create: `packages/core/metadata/commonObjects/dataCompositionSystem/availableValues/__fixtures__/data.ts`
- Create: `packages/core/metadata/commonObjects/dataCompositionSystem/availableValues/__fixtures__/strings.xml`
- Create: `packages/core/metadata/commonObjects/dataCompositionSystem/availableValues/__fixtures__/nilAndBoolean.xml`
- Create tests in the same folder.
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/index.ts`
- Modify: `packages/core/metadata/orchestration/property/registry.ts`

- [ ] **Step 1: Add fixtures**

Create `availableValues/__fixtures__/strings.xml`:

```xml
<root>
	<dcssch:availableValue>
		<dcssch:value xsi:type="xs:string">Выставлен</dcssch:value>
		<dcssch:presentation xsi:type="v8:LocalStringType">
			<v8:item>
				<v8:lang>ru</v8:lang>
				<v8:content>Выставлен</v8:content>
			</v8:item>
		</dcssch:presentation>
	</dcssch:availableValue>
	<dcssch:availableValue>
		<dcssch:value xsi:type="xs:string">Аннулирован</dcssch:value>
		<dcssch:presentation xsi:type="v8:LocalStringType">
			<v8:item>
				<v8:lang>ru</v8:lang>
				<v8:content>Аннулирован</v8:content>
			</v8:item>
		</dcssch:presentation>
	</dcssch:availableValue>
</root>
```

Create `availableValues/__fixtures__/nilAndBoolean.xml`:

```xml
<root>
	<dcssch:availableValue>
		<dcssch:value xsi:nil="true"/>
	</dcssch:availableValue>
	<dcssch:availableValue>
		<dcssch:value xsi:type="xs:boolean">true</dcssch:value>
	</dcssch:availableValue>
</root>
```

Create `availableValues/__fixtures__/data.ts`:

```ts
import type { DcsAvailableValues, DcsAvailableValuesYAML } from "../types"

export const stringAvailableValues = [
  {
    itemType: "DcsAvailableValue",
    value: { type: "string", value: "Выставлен" },
    presentation: { items: { ru: "Выставлен" } },
  },
  {
    itemType: "DcsAvailableValue",
    value: { type: "string", value: "Аннулирован" },
    presentation: { items: { ru: "Аннулирован" } },
  },
] satisfies DcsAvailableValues

export const stringAvailableValuesYAML = [
  { Значение: '"Выставлен"', Представление: "Выставлен" },
  { Значение: '"Аннулирован"', Представление: "Аннулирован" },
] satisfies DcsAvailableValuesYAML

export const nilAndBooleanAvailableValues = [
  { itemType: "DcsAvailableValue" },
  { itemType: "DcsAvailableValue", value: { type: "boolean", value: true } },
] satisfies DcsAvailableValues

export const nilAndBooleanAvailableValuesYAML = [
  {},
  { Значение: "Истина" },
] satisfies DcsAvailableValuesYAML
```

- [ ] **Step 2: Add failing XML tests**

Create `availableValues/fromXML.test.ts`:

```ts
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { describe, expect, it } from "vitest"
import { importPropertyFromXML } from "~/metadata/orchestration"
import { mockContextFromXML } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { nilAndBooleanAvailableValues, stringAvailableValues } from "./__fixtures__/data"

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), "__fixtures__")
const rule = { type: "DcsAvailableValues", xml: "dcssch:availableValue" } as const

describe("import DcsAvailableValues from XML", () => {
  it("imports string values and presentations", () => {
    const xml = readAndParseXMLFile<{ root: { "dcssch:availableValue": unknown } }>("strings.xml", fixturesDir)
    const result = importPropertyFromXML({
      context: mockContextFromXML(),
      rule,
      value: xml.root["dcssch:availableValue"],
    })
    expect(result).toEqual(stringAvailableValues)
  })

  it("imports nil and boolean values without null", () => {
    const xml = readAndParseXMLFile<{ root: { "dcssch:availableValue": unknown } }>("nilAndBoolean.xml", fixturesDir)
    const result = importPropertyFromXML({
      context: mockContextFromXML(),
      rule,
      value: xml.root["dcssch:availableValue"],
    })
    expect(result).toEqual(nilAndBooleanAvailableValues)
  })
})
```

Create `availableValues/toXML.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { exportPropertyToXML } from "~/metadata/orchestration"
import { mockContextToXML } from "~/tests/mockContext"
import { nilAndBooleanAvailableValues, stringAvailableValues } from "./__fixtures__/data"

const rule = { type: "DcsAvailableValues", xml: "dcssch:availableValue" } as const

describe("export DcsAvailableValues to XML", () => {
  it("exports string values and presentations", () => {
    const result = exportPropertyToXML({
      context: mockContextToXML(),
      rule,
      value: stringAvailableValues,
    })

    expect(result).toEqual([
      {
        "dcssch:value": { "_xsi:type": "xs:string", "#text": "Выставлен" },
        "dcssch:presentation": {
          "_xsi:type": "v8:LocalStringType",
          "v8:item": [{ "v8:lang": "ru", "v8:content": "Выставлен" }],
        },
      },
      {
        "dcssch:value": { "_xsi:type": "xs:string", "#text": "Аннулирован" },
        "dcssch:presentation": {
          "_xsi:type": "v8:LocalStringType",
          "v8:item": [{ "v8:lang": "ru", "v8:content": "Аннулирован" }],
        },
      },
    ])
  })

  it("exports absent value as xsi:nil", () => {
    const result = exportPropertyToXML({
      context: mockContextToXML(),
      rule,
      value: nilAndBooleanAvailableValues,
    })

    expect(result).toEqual([
      { "dcssch:value": { "_xsi:nil": true } },
      { "dcssch:value": { "_xsi:type": "xs:boolean", "#text": "true" } },
    ])
  })
})
```

- [ ] **Step 3: Add failing YAML tests**

Create `availableValues/fromYAML.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { importPropertyFromYAML } from "~/metadata/orchestration"
import { mockContext } from "~/tests/mockContext"
import {
  nilAndBooleanAvailableValues,
  nilAndBooleanAvailableValuesYAML,
  stringAvailableValues,
  stringAvailableValuesYAML,
} from "./__fixtures__/data"

describe("import DcsAvailableValues from YAML", () => {
  it("imports string values", () => {
    const result = importPropertyFromYAML(mockContext, { type: "DcsAvailableValues" }, stringAvailableValuesYAML)
    expect(result).toEqual(stringAvailableValues)
  })

  it("imports absent value as undefined", () => {
    const result = importPropertyFromYAML(mockContext, { type: "DcsAvailableValues" }, nilAndBooleanAvailableValuesYAML)
    expect(result).toEqual(nilAndBooleanAvailableValues)
  })
})
```

Create `availableValues/toYAML.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { exportPropertyToYAML } from "~/metadata/orchestration"
import { mockContext } from "~/tests/mockContext"
import {
  nilAndBooleanAvailableValues,
  nilAndBooleanAvailableValuesYAML,
  stringAvailableValues,
  stringAvailableValuesYAML,
} from "./__fixtures__/data"

const rule = { type: "DcsAvailableValues", yaml: "ДоступныеЗначения" } as const

describe("export DcsAvailableValues to YAML", () => {
  it("exports string values", () => {
    const result = exportPropertyToYAML({
      context: mockContext,
      rule,
      value: stringAvailableValues,
    })
    expect(result).toEqual({ ДоступныеЗначения: stringAvailableValuesYAML })
  })

  it("exports absent value as absent key", () => {
    const result = exportPropertyToYAML({
      context: mockContext,
      rule,
      value: nilAndBooleanAvailableValues,
    })
    expect(result).toEqual({ ДоступныеЗначения: nilAndBooleanAvailableValuesYAML })
  })
})
```

- [ ] **Step 4: Run tests and verify they fail**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/commonObjects/dataCompositionSystem/availableValues
```

Expected: FAIL because the module and registry entries do not exist.

- [ ] **Step 5: Implement types and registration**

Create `availableValues/types.ts`:

```ts
import type { I8nText, I8nTextYAML } from "~/metadata/commonObjects/i8nText/types"
import type {
  MetadataDcsMetadataValue,
  MetadataDcsMetadataValueYAML,
} from "../dcsMetadataValue/types"

export interface DcsAvailableValue {
  itemType: "DcsAvailableValue"
  value?: MetadataDcsMetadataValue
  presentation?: I8nText | string
}

export interface DcsAvailableValueYAML {
  Значение?: MetadataDcsMetadataValueYAML
  Представление?: I8nTextYAML | string
}

export type DcsAvailableValues = DcsAvailableValue[]
export type DcsAvailableValuesYAML = DcsAvailableValueYAML[]
```

Add registry entries to `property/registry.ts`:

```ts
DcsAvailableValue: {
  item: DcsAvailableValue
  yaml: DcsAvailableValueYAML
}
DcsAvailableValues: {
  item: DcsAvailableValues
  yaml: DcsAvailableValuesYAML
}
```

Add matching runtime keys and imports for the new types.

- [ ] **Step 6: Implement XML handlers**

Create `availableValues/fromXML.ts`:

```ts
import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import { importDcsLocalStringTypeFromXML } from "../dcsLocalStringType/fromXML"
import { importDcsMetadataValueFromDcsXML } from "../dcsMetadataValue/fromXML"
import type { DcsAvailableValue, DcsAvailableValues } from "./types"

const valueRule = { type: "MetadataDcsMetadataValue", valueType: "Primitive" } as const

const toArray = <T>(value: T | T[] | undefined): T[] => {
  if (value === undefined) return []
  return Array.isArray(value) ? value : [value]
}

export const importDcsAvailableValuesFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: unknown
): DcsAvailableValues | undefined => {
  const items = toArray(xml as Record<string, unknown> | Record<string, unknown>[] | undefined)
  if (items.length === 0) return undefined

  return items.map((item): DcsAvailableValue => {
    const valueXML = item["dcssch:value"]
    const value =
      valueXML !== undefined &&
      !(typeof valueXML === "object" && valueXML !== null && (valueXML as { "_xsi:nil"?: unknown })["_xsi:nil"] === true)
        ? importDcsMetadataValueFromDcsXML(context, valueRule, { "dcscor:value": valueXML } as never)
        : undefined
    const presentation = importDcsLocalStringTypeFromXML(
      context,
      { type: "DcsLocalStringType" } as never,
      item["dcssch:presentation"] as never
    )
    return {
      itemType: "DcsAvailableValue",
      ...(value !== undefined ? { value } : {}),
      ...(presentation !== undefined ? { presentation } : {}),
    }
  })
}

registerTypeRule("DcsAvailableValues", "importFromXML", importDcsAvailableValuesFromXML)
```

Create `availableValues/toXML.ts` with direct export of absent `value` to `dcssch:value xsi:nil`:

```ts
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import { exportDcsLocalStringTypeToXML } from "../dcsLocalStringType/toXML"
import { exportDcsMetadataValueToDcsXML } from "../dcsMetadataValue/toXML"
import type { DcsAvailableValues } from "./types"

const valueRule = { type: "MetadataDcsMetadataValue", valueType: "Primitive" } as const

export const exportDcsAvailableValuesToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  values: DcsAvailableValues | undefined
): unknown[] | undefined => {
  if (!values || values.length === 0) return undefined

  return values.map((item) => {
    const valueXML =
      item.value === undefined
        ? { "_xsi:nil": true }
        : exportDcsMetadataValueToDcsXML({ context, rule: valueRule, data: item.value })["dcscor:value"]
    const presentationXML = exportDcsLocalStringTypeToXML(
      context,
      { type: "DcsLocalStringType" } as never,
      item.presentation
    )
    return {
      "dcssch:value": valueXML,
      ...(presentationXML !== undefined ? { "dcssch:presentation": presentationXML } : {}),
    }
  })
}

registerTypeRule("DcsAvailableValues", "exportToXML", exportDcsAvailableValuesToXML)
```

- [ ] **Step 7: Implement YAML handlers**

Create `availableValues/fromYAML.ts`:

```ts
import { ConfigurationContext } from "~/metadata/context/types"
import { importPropertyFromYAML, PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import { importDcsMetadataValueFromYAML } from "../dcsMetadataValue/fromYAML"
import type { DcsAvailableValue, DcsAvailableValues, DcsAvailableValuesYAML } from "./types"

const valueRule = { type: "MetadataDcsMetadataValue", valueType: "Primitive" } as const
const presentationRule = { type: "DcsLocalStringType" } as const

export const importDcsAvailableValuesFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  yaml: DcsAvailableValuesYAML | undefined
): DcsAvailableValues | undefined => {
  if (yaml === undefined) return undefined

  return yaml.map((item): DcsAvailableValue => {
    const value = importDcsMetadataValueFromYAML(context, valueRule, item.Значение)
    const presentation = importPropertyFromYAML({
      context,
      rule: presentationRule,
      value: item.Представление,
    })
    return {
      itemType: "DcsAvailableValue",
      ...(value !== undefined && value !== null ? { value } : {}),
      ...(presentation !== undefined ? { presentation } : {}),
    }
  })
}

registerTypeRule("DcsAvailableValues", "importFromYAML", importDcsAvailableValuesFromYAML)
```

Create `availableValues/toYAML.ts`:

```ts
import { ConfigurationContext } from "~/metadata/context/types"
import { exportPropertyToYAML, PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import { exportDcsMetadataValueToYAML } from "../dcsMetadataValue/toYAML"
import type { DcsAvailableValues, DcsAvailableValuesYAML } from "./types"

const valueRule = { type: "MetadataDcsMetadataValue", valueType: "Primitive" } as const
const presentationRule = { type: "DcsLocalStringType", yaml: "Представление" } as const

export const exportDcsAvailableValuesToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  values: DcsAvailableValues | undefined
): DcsAvailableValuesYAML | undefined => {
  if (values === undefined) return undefined

  return values.map((item) => {
    const value = exportDcsMetadataValueToYAML(context, valueRule, item.value)
    const presentation =
      item.presentation === undefined
        ? undefined
        : exportPropertyToYAML({ context, rule: presentationRule, value: item.presentation })?.Представление
    return {
      ...(value !== undefined ? { Значение: value } : {}),
      ...(presentation !== undefined ? { Представление: presentation } : {}),
    }
  })
}

registerTypeRule("DcsAvailableValues", "exportToYAML", exportDcsAvailableValuesToYAML)
```

- [ ] **Step 8: Import module in DCS index**

In `packages/core/metadata/commonObjects/dataCompositionSystem/index.ts`, add:

```ts
import "./availableValues/fromXML"
import "./availableValues/fromYAML"
import "./availableValues/toXML"
import "./availableValues/toYAML"
import "./availableValues/types"
```

- [ ] **Step 9: Run availableValues tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/commonObjects/dataCompositionSystem/availableValues
```

Expected: PASS.

- [ ] **Step 10: Commit module**

Run:

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem/availableValues packages/core/metadata/commonObjects/dataCompositionSystem/index.ts packages/core/metadata/orchestration/property/registry.ts
git commit -m "feat: :sparkles: добавить DCS availableValue"
```

## Task 2: Wire Owners

**Files:**
- Modify: `dataCompositionSchemaDataSetField/rules.ts`
- Modify: `calculatedField/rules.ts`
- Modify owner fixture data/tests/XML files.

- [ ] **Step 1: Add owner rule properties**

In `dataCompositionSchemaDataSetField/rules.ts`, add after `title`:

```ts
availableValues: {
  type: "DcsAvailableValues",
  xml: "dcssch:availableValue",
  yaml: "ДоступныеЗначения",
  toXML: isField,
  order: 4,
},
```

Increment later orders only if current tests require a deterministic no-reference order. Prefer reference order when existing fixtures provide it.

In `calculatedField/rules.ts`, add after `useRestriction` or `title` according to fixture XML:

```ts
availableValues: {
  type: "DcsAvailableValues",
  xml: "dcssch:availableValue",
  yaml: "ДоступныеЗначения",
  order: 6,
},
```

- [ ] **Step 2: Add DataSetField fixture**

Add XML fixture `dataCompositionSchemaDataSetField/__fixtures__/availableValues.xml` with `Field xsi:type="dcssch:DataSetFieldField"` and two string available values from Task 1.

Add matching TS/YAML exports in `dataCompositionSchemaDataSetField/__fixtures__/data.ts`:

```ts
export const availableValuesDataCompositionSchemaDataSetField = {
  itemType: "DataCompositionSchemaDataSetField",
  dataPath: "Состояние",
  field: "Состояние",
  title: { items: { ru: "Состояние" } },
  availableValues: stringAvailableValues,
} satisfies DataCompositionSchemaDataSetField

export const availableValuesDataCompositionSchemaDataSetFieldYAML = {
  ПутьКДанным: "Состояние",
  Поле: "Состояние",
  Заголовок: "Состояние",
  ДоступныеЗначения: stringAvailableValuesYAML,
} satisfies DataCompositionSchemaDataSetFieldYAML
```

- [ ] **Step 3: Add CalculatedField fixture**

Add XML fixture `calculatedField/__fixtures__/availableValues.xml` with nil and boolean available values from Task 1.

Add matching TS/YAML exports:

```ts
export const availableValuesCalculatedField = {
  itemType: "CalculatedField",
  dataPath: "ЭтоЗаказ",
  expression: "Истина",
  availableValues: nilAndBooleanAvailableValues,
} satisfies CalculatedField

export const availableValuesCalculatedFieldYAML = {
  ПутьКДанным: "ЭтоЗаказ",
  Выражение: "Истина",
  ДоступныеЗначения: nilAndBooleanAvailableValuesYAML,
} satisfies CalculatedFieldYAML
```

- [ ] **Step 4: Add owner tests**

Add import/export XML/YAML tests in both owner modules using the existing test style and new fixture names:

```ts
it("imports available values", () => {
  const result = testImportPropertyFromXML({
    rule,
    path: "availableValues.xml",
    xmlRootTag: "Field",
    importMetaUrl: import.meta.url,
  })

  expect(result).toEqual(availableValuesDataCompositionSchemaDataSetField)
})
```

Use `xmlRootTag: "CalculatedField"` in calculated field tests.

- [ ] **Step 5: Run owner tests and verify they pass**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField metadata/commonObjects/dataCompositionSystem/calculatedField
```

Expected: PASS.

- [ ] **Step 6: Commit owners**

Run:

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField packages/core/metadata/commonObjects/dataCompositionSystem/calculatedField
git commit -m "fix: :bug: сохранить availableValue СКД"
```

## Task 3: Final Verification

**Files:**
- No new files.

- [ ] **Step 1: Generate Langium files in a fresh worktree**

Run:

```bash
pnpm --filter nkdk-language langium:generate
```

Expected: command exits with code 0.

- [ ] **Step 2: Run DCS tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/commonObjects/dataCompositionSystem
```

Expected: PASS.

- [ ] **Step 3: Run full test suite**

Run:

```bash
pnpm test
```

Expected: PASS across all packages.
