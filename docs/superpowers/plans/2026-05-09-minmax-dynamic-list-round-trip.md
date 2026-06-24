# MinMax And DynamicList Round-Trip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve `MinValue`/`MaxValue` XML `xsi:type` from reference XML and add full XML/YAML/TS support for DynamicList `KeyType` and `KeyField`.

**Architecture:** Add one reusable `MinMaxValue` property type that keeps public model values as `number` while carrying reference XML type in non-enumerable reference metadata. Then update all min/max rules to use it. DynamicList key support stays declarative in `DynamicListRules`.

**Tech Stack:** TypeScript, Vitest, metadata property registry, metadata item rules, XML/YAML fixture tests.

---

## File Structure

- Create `packages/core/metadata/commonObjects/minMaxValue/fromXML.ts`
  - Imports `xs:string` and `xs:decimal` numeric values as numbers and attaches reference XML type for `forReference`.
- Create `packages/core/metadata/commonObjects/minMaxValue/toXML.ts`
  - Exports numbers as `xs:decimal` by default and preserves reference `xs:string` / `xs:decimal` when present.
- Create `packages/core/metadata/commonObjects/minMaxValue/toJSONSchema.ts`
  - Exposes `MinMaxValue` as a number in YAML schema.
- Create `packages/core/metadata/commonObjects/minMaxValue/types.ts`
  - Defines internal carrier helpers and public type aliases.
- Create `packages/core/metadata/commonObjects/minMaxValue/fromXML.test.ts`
- Create `packages/core/metadata/commonObjects/minMaxValue/toXML.test.ts`
- Create `packages/core/metadata/commonObjects/minMaxValue/toJSONSchema.test.ts`
- Modify `packages/core/metadata/commonObjects/index.ts`
  - Import the new type rules.
- Modify `packages/core/metadata/orchestration/property/registry.ts`
  - Register `MinMaxValue`.
- Modify min/max rules:
  - `packages/core/metadata/commonObjects/metadataAttribute/rules.ts`
  - `packages/core/metadata/commonObjects/standardAttributeDescription/rules.ts`
  - `packages/core/metadata/forms/elements/inputField/rules.ts`
- Modify metadata attribute and standard attribute XML tests to assert `xs:string` / `xs:decimal` preservation through real rules.
- Modify input field fixtures/tests with a focused `MinValue xsi:type="xs:string"` case.
- Modify `packages/core/metadata/forms/commonObjects/dynamicList/rules.ts`
  - Enable `keyFields` XML/YAML and add `keyType`.
- Modify `packages/core/metadata/forms/commonObjects/dynamicList/__fixtures__/data.ts`
- Create `packages/core/metadata/forms/commonObjects/dynamicList/__fixtures__/keyField.xml`
- Modify DynamicList XML/YAML tests.

## Task 1: MinMaxValue Property Type

**Files:**
- Create: `packages/core/metadata/commonObjects/minMaxValue/types.ts`
- Create: `packages/core/metadata/commonObjects/minMaxValue/fromXML.ts`
- Create: `packages/core/metadata/commonObjects/minMaxValue/toXML.ts`
- Create: `packages/core/metadata/commonObjects/minMaxValue/toJSONSchema.ts`
- Create: `packages/core/metadata/commonObjects/minMaxValue/fromXML.test.ts`
- Create: `packages/core/metadata/commonObjects/minMaxValue/toXML.test.ts`
- Create: `packages/core/metadata/commonObjects/minMaxValue/toJSONSchema.test.ts`
- Modify: `packages/core/metadata/commonObjects/index.ts`
- Modify: `packages/core/metadata/orchestration/property/registry.ts`

- [ ] **Step 1: Write failing tests**

Create `packages/core/metadata/commonObjects/minMaxValue/fromXML.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { importPropertyFromXML } from "~/metadata/orchestration"
import { mockContextFromXML } from "~/tests/mockContext"

const rule = { type: "MinMaxValue" } as const

describe("import MinMaxValue from XML", () => {
  it("imports xs:string as a number for the public model", () => {
    const result = importPropertyFromXML({
      context: mockContextFromXML(),
      rule,
      value: { "_xsi:type": "xs:string", "#text": "1" },
    })

    expect(result).toBe(1)
  })

  it("imports xs:string reference as a non-enumerable carrier", () => {
    const result = importPropertyFromXML({
      context: mockContextFromXML({ forReference: true }),
      rule,
      value: { "_xsi:type": "xs:string", "#text": "1" },
    })

    expect(Number(result)).toBe(1)
    expect(Object.keys(Object(result))).toEqual([])
  })
})
```

Create `packages/core/metadata/commonObjects/minMaxValue/toXML.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { exportPropertyToXML, importPropertyFromXML } from "~/metadata/orchestration"
import { mockContextFromXML, mockContextToXML } from "~/tests/mockContext"

const rule = { type: "MinMaxValue" } as const

describe("export MinMaxValue to XML", () => {
  it("exports without reference as xs:decimal", () => {
    const result = exportPropertyToXML({
      context: mockContextToXML(),
      rule,
      value: 1,
    })

    expect(result).toEqual({ "_xsi:type": "xs:decimal", "#text": "1" })
  })

  it("preserves xs:string from reference metadata", () => {
    const reference = importPropertyFromXML({
      context: mockContextFromXML({ forReference: true }),
      rule,
      value: { "_xsi:type": "xs:string", "#text": "1" },
    })

    const result = exportPropertyToXML({
      context: mockContextToXML(),
      rule,
      value: 1,
      referenceMetadata: reference,
    })

    expect(result).toEqual({ "_xsi:type": "xs:string", "#text": "1" })
  })
})
```

Create `packages/core/metadata/commonObjects/minMaxValue/toJSONSchema.test.ts`:

```ts
import { Type } from "@sinclair/typebox"
import { describe, expect, it } from "vitest"
import { exportPropertyToJSONSchema } from "~/metadata/orchestration"
import { mockContext } from "~/tests/mockContext"

describe("MinMaxValue JSON schema", () => {
  it("exports number schema", () => {
    const result = exportPropertyToJSONSchema({
      context: mockContext,
      rule: { type: "MinMaxValue", yaml: "МинимальноеЗначение" },
      value: undefined,
    })

    expect(result).toEqual(Type.Number())
  })
})
```

- [ ] **Step 2: Run tests and verify they fail**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/commonObjects/minMaxValue
```

Expected: FAIL because the module and `MinMaxValue` registry entry do not exist.

- [ ] **Step 3: Implement type helpers**

Create `packages/core/metadata/commonObjects/minMaxValue/types.ts`:

```ts
const MIN_MAX_VALUE_XSI_TYPE = Symbol("minMaxValueXsiType")

export type MinMaxValueXsiType = "xs:string" | "xs:decimal"

export type MinMaxValueReference = Number & {
  [MIN_MAX_VALUE_XSI_TYPE]?: MinMaxValueXsiType
}

export const attachMinMaxValueXsiType = (value: number, xsiType: MinMaxValueXsiType): MinMaxValueReference => {
  const boxed = new Number(value) as MinMaxValueReference
  Object.defineProperty(boxed, MIN_MAX_VALUE_XSI_TYPE, {
    value: xsiType,
    enumerable: false,
    configurable: true,
  })
  return boxed
}

export const getMinMaxValueXsiType = (value: unknown): MinMaxValueXsiType | undefined => {
  if (value === undefined || value === null || typeof value !== "object") return undefined
  return (value as MinMaxValueReference)[MIN_MAX_VALUE_XSI_TYPE]
}
```

- [ ] **Step 4: Implement XML import/export**

Create `packages/core/metadata/commonObjects/minMaxValue/fromXML.ts`:

```ts
import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { attachMinMaxValueXsiType, MinMaxValueXsiType } from "./types"

type MinMaxValueXML = number | string | { "#text"?: number | string; "_xsi:type"?: string } | undefined

const SUPPORTED_XSI_TYPES = new Set<MinMaxValueXsiType>(["xs:string", "xs:decimal"])

export const importMinMaxValueFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  value: MinMaxValueXML
): number | Number | undefined => {
  if (value === undefined) return undefined

  const rawValue = typeof value === "object" && value !== null && "#text" in value ? value["#text"] : value
  if (rawValue === undefined || rawValue === "") return undefined
  const numericValue = typeof rawValue === "number" ? rawValue : Number(rawValue)

  if (context.fromXML.forReference && typeof value === "object" && value !== null) {
    const xsiType = value["_xsi:type"]
    if (SUPPORTED_XSI_TYPES.has(xsiType as MinMaxValueXsiType)) {
      return attachMinMaxValueXsiType(numericValue, xsiType as MinMaxValueXsiType)
    }
  }

  return numericValue
}

registerTypeRule("MinMaxValue", "importFromXML", importMinMaxValueFromXML)
```

Create `packages/core/metadata/commonObjects/minMaxValue/toXML.ts`:

```ts
import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { getMinMaxValueXsiType } from "./types"

export const exportMinMaxValueToXML = (
  _context: ConfigurationContextWithExportToXML,
  _rule: PropertyRule | undefined,
  value: number | undefined,
  referenceValue?: unknown
): { "_xsi:type": "xs:string" | "xs:decimal"; "#text": string } | undefined => {
  if (value === undefined) return undefined
  const xsiType = getMinMaxValueXsiType(referenceValue) ?? "xs:decimal"
  return { "_xsi:type": xsiType, "#text": String(value) }
}

registerTypeRule("MinMaxValue", "exportToXML", exportMinMaxValueToXML)
```

Create `packages/core/metadata/commonObjects/minMaxValue/toJSONSchema.ts`:

```ts
import { Type } from "@sinclair/typebox"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"

registerTypeRule("MinMaxValue", "exportToJSONSchema", () => Type.Number())
```

- [ ] **Step 5: Register the property type**

In `packages/core/metadata/orchestration/property/registry.ts`, add `MinMaxValue` to `PropertyRuleType`:

```ts
MinMaxValue: {
  item: number
  enterprise: number
  yaml: number
}
```

Add `"MinMaxValue": "MinMaxValue"` to the runtime registry object near other primitive types.

In `packages/core/metadata/commonObjects/index.ts`, add:

```ts
import "./minMaxValue/fromXML"
import "./minMaxValue/toXML"
import "./minMaxValue/toJSONSchema"
```

- [ ] **Step 6: Run tests and verify they pass**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/commonObjects/minMaxValue
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```bash
git add packages/core/metadata/commonObjects/minMaxValue packages/core/metadata/commonObjects/index.ts packages/core/metadata/orchestration/property/registry.ts
git commit -m "feat: :sparkles: добавить MinMaxValue"
```

## Task 2: Apply MinMaxValue Rules

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataAttribute/rules.ts`
- Modify: `packages/core/metadata/commonObjects/standardAttributeDescription/rules.ts`
- Modify: `packages/core/metadata/forms/elements/inputField/rules.ts`
- Modify: `packages/core/metadata/commonObjects/metadataAttribute/toXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/standardAttributeDescription/toXML.test.ts`
- Modify: `packages/core/metadata/forms/elements/inputField/__fixtures__/data.ts`
- Create: `packages/core/metadata/forms/elements/inputField/__fixtures__/minMaxStringType.xml`
- Modify: `packages/core/metadata/forms/elements/__tests__/fixtures.ts`

- [ ] **Step 1: Update metadata attribute rules**

In `packages/core/metadata/commonObjects/metadataAttribute/rules.ts`, change `minValue` and `maxValue` from `type: "number"` to:

```ts
type: "MinMaxValue",
```

Keep existing `xml`, `xmlParents`, `order`, and `defaultValueXMLRaw`.

- [ ] **Step 2: Update standard attribute description rules**

In `packages/core/metadata/commonObjects/standardAttributeDescription/rules.ts`, change `minValue` and `maxValue` from `type: "number"` to:

```ts
type: "MinMaxValue",
```

Keep `xr:MinValue`, `xr:MaxValue`, ordering, and nil defaults unchanged.

- [ ] **Step 3: Update input field rules**

In `packages/core/metadata/forms/elements/inputField/rules.ts`, replace both `InputFieldRules` and `TableInputFieldRules` min/max definitions with:

```ts
minValue: { yaml: "МинимальноеЗначение", type: "MinMaxValue", xml: "MinValue" },
maxValue: { yaml: "МаксимальноеЗначение", type: "MinMaxValue", xml: "MaxValue" },
```

- [ ] **Step 4: Add real-rule XML preservation tests**

In `packages/core/metadata/commonObjects/metadataAttribute/toXML.test.ts`, import `exportPropertyToXML`, `importPropertyFromXML`, `MetadataAttributeRules`, `mockContextFromXML`, and `mockContextToXML`, then add:

```ts
it("preserves MetadataAttribute MinValue xsi:type from reference", () => {
  const propRule = MetadataAttributeRules.properties.minValue
  const reference = importPropertyFromXML({
    context: mockContextFromXML({ forReference: true }),
    rule: propRule,
    value: { "_xsi:type": "xs:string", "#text": "1" },
  })

  const result = exportPropertyToXML({
    context: mockContextToXML(),
    rule: propRule,
    value: 1,
    referenceMetadata: reference,
  })

  expect(result).toEqual({ "_xsi:type": "xs:string", "#text": "1" })
})
```

In `packages/core/metadata/commonObjects/standardAttributeDescription/toXML.test.ts`, import `exportPropertyToXML`, `importPropertyFromXML`, `StandardAttributeDescriptionRules`, `mockContextFromXML`, and `mockContextToXML`, then add:

```ts
it("preserves StandardAttributeDescription MaxValue xsi:type from reference", () => {
  const propRule = StandardAttributeDescriptionRules.properties.maxValue
  const reference = importPropertyFromXML({
    context: mockContextFromXML({ forReference: true }),
    rule: propRule,
    value: { "_xsi:type": "xs:decimal", "#text": "99.99" },
  })

  const result = exportPropertyToXML({
    context: mockContextToXML(),
    rule: propRule,
    value: 99.99,
    referenceMetadata: reference,
  })

  expect(result).toEqual({ "_xsi:type": "xs:decimal", "#text": "99.99" })
})
```

- [ ] **Step 5: Run focused tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/commonObjects/metadataAttribute metadata/commonObjects/standardAttributeDescription metadata/forms/elements/__tests__ -t "preserves .*Value|InputField"
```

Expected: PASS.

- [ ] **Step 6: Add a focused input field fixture**

Add a fixture to `packages/core/metadata/forms/elements/inputField/__fixtures__/minMaxStringType.xml`:

```xml
<InputField name="ПолеВвода" id="1">
	<DataPath>Объект.Количество</DataPath>
	<MinValue xsi:type="xs:string">1</MinValue>
	<MaxValue xsi:type="xs:decimal">99.99</MaxValue>
	<ContextMenu name="ПолеВводаКонтекстноеМеню" id="2"/>
	<ExtendedTooltip name="ПолеВводаРасширеннаяПодсказка" id="3"/>
</InputField>
```

Add matching model in `inputField/__fixtures__/data.ts`:

```ts
export const minMaxStringTypeInputField = {
  itemType: "InputField",
  name: "ПолеВвода",
  dataPath: "Объект.Количество",
  minValue: 1,
  maxValue: 99.99,
  contextMenu: { itemType: "ContextMenu", childItems: [] },
  extendedTooltip: { itemType: "ExtendedTooltip" },
} satisfies InputField
```

Register it in `forms/elements/__tests__/fixtures.ts` as an `InputField` XML-only case.

- [ ] **Step 7: Run focused tests again**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/commonObjects/metadataAttribute metadata/commonObjects/standardAttributeDescription metadata/forms/elements/__tests__ -t "minMaxStringType|InputField"
```

Expected: PASS.

- [ ] **Step 8: Commit**

Run:

```bash
git add packages/core/metadata/commonObjects/metadataAttribute packages/core/metadata/commonObjects/standardAttributeDescription packages/core/metadata/forms/elements/inputField packages/core/metadata/forms/elements/__tests__/fixtures.ts
git commit -m "fix: :bug: сохранить тип MinValue и MaxValue"
```

## Task 3: DynamicList KeyType And KeyField

**Files:**
- Modify: `packages/core/metadata/forms/commonObjects/dynamicList/rules.ts`
- Modify: `packages/core/metadata/forms/commonObjects/dynamicList/__fixtures__/data.ts`
- Create: `packages/core/metadata/forms/commonObjects/dynamicList/__fixtures__/keyField.xml`
- Modify:
  - `packages/core/metadata/forms/commonObjects/dynamicList/fromXML.test.ts`
  - `packages/core/metadata/forms/commonObjects/dynamicList/toXML.test.ts`
  - `packages/core/metadata/forms/commonObjects/dynamicList/fromYAML.test.ts`
  - `packages/core/metadata/forms/commonObjects/dynamicList/toYAML.test.ts`

- [ ] **Step 1: Add fixture data**

In `dynamicList/__fixtures__/data.ts`, add:

```ts
export const keyFieldDynamicList = {
  itemType: "DynamicList",
  customQuery: true,
  dynamicDataRead: true,
  queryText: "ВЫБРАТЬ\n\tСсылка\nИЗ\n\tДокумент.ЗаявлениеОВвозеТоваров КАК Документ",
  keyType: "FieldValue",
  keyFields: "Ссылка",
} satisfies DynamicList

export const keyFieldDynamicListYAML = {
  ПроизвольныйЗапрос: "Истина",
  ДинамическоеСчитываниеДанных: "Истина",
  ВидКлюча: "ЗначениеПоля",
  ПоляКлюча: "Ссылка",
} satisfies DynamicListYAML
```

- [ ] **Step 2: Add XML fixture**

Create `packages/core/metadata/forms/commonObjects/dynamicList/__fixtures__/keyField.xml`:

```xml
<Settings xsi:type="DynamicList">
	<ManualQuery>true</ManualQuery>
	<DynamicDataRead>true</DynamicDataRead>
	<QueryText>ВЫБРАТЬ
	Ссылка
ИЗ
	Документ.ЗаявлениеОВвозеТоваров КАК Документ</QueryText>
	<KeyType>FieldValue</KeyType>
	<KeyField>Ссылка</KeyField>
	<ListSettings/>
</Settings>
```

- [ ] **Step 3: Add XML tests**

In `fromXML.test.ts`, import `keyFieldDynamicList` and add:

```ts
it("imports KeyType and KeyField", () => {
  const result = testImportPropertyFromXML({
    rule,
    path: "keyField.xml",
    xmlRootTag: "Settings",
    importMetaUrl: import.meta.url,
  })

  expect(result).toEqual(keyFieldDynamicList)
})
```

In `toXML.test.ts`, import `keyFieldDynamicList` and add:

```ts
it("exports KeyType and KeyField", () => {
  const { expectedResult, result } = testExportPropertyToXML({
    rule,
    value: keyFieldDynamicList,
    xmlRootTag: "Settings",
    path: "keyField.xml",
    importMetaUrl: import.meta.url,
  })

  expect(result).toEqual(expectedResult)
})
```

- [ ] **Step 4: Add YAML tests**

In `fromYAML.test.ts`, import `keyFieldDynamicList` and `keyFieldDynamicListYAML`, then add:

```ts
it("imports KeyType and KeyField from YAML", () => {
  const result = importPropertyFromYAML(mockContext, { type: "DynamicList" }, keyFieldDynamicListYAML)

  expect(result).toEqual({
    ...keyFieldDynamicList,
    queryText: undefined,
  })
})
```

In `toYAML.test.ts`, add:

```ts
it("exports KeyType and KeyField to YAML", () => {
  const result = exportPropertyToYAML(mockContext, { type: "DynamicList", yaml: "Список" }, keyFieldDynamicList)

  expect(result).toEqual({ Список: keyFieldDynamicListYAML })
})
```

- [ ] **Step 5: Run focused tests and verify they fail**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/commonObjects/dynamicList -t "KeyType|KeyField"
```

Expected: FAIL because `keyFields` is XML-disabled and `keyType` is not present.

- [ ] **Step 6: Update DynamicList rules**

In `packages/core/metadata/forms/commonObjects/dynamicList/rules.ts`, replace `keyFields` and uncomment/add `keyType`:

```ts
keyType: {
  type: "SystemEnumeration",
  typeSE: "DynamicListKeyType",
  xml: "KeyType",
  yaml: "ВидКлюча",
  implicitValueYAML: "Auto",
},
keyFields: {
  type: "string",
  xml: "KeyField",
  yaml: "ПоляКлюча",
},
```

- [ ] **Step 7: Run focused tests and verify they pass**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/commonObjects/dynamicList -t "KeyType|KeyField"
```

Expected: PASS.

- [ ] **Step 8: Commit**

Run:

```bash
git add packages/core/metadata/forms/commonObjects/dynamicList
git commit -m "fix: :bug: добавить ключи DynamicList"
```

## Task 4: Final Verification

**Files:**
- No new files.

- [ ] **Step 1: Generate Langium files in a fresh worktree**

Run:

```bash
pnpm --filter nkdk-language langium:generate
```

Expected: command exits with code 0.

- [ ] **Step 2: Run focused tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/commonObjects/minMaxValue metadata/commonObjects/metadataAttribute metadata/commonObjects/standardAttributeDescription metadata/forms/elements/__tests__ metadata/forms/commonObjects/dynamicList
```

Expected: PASS.

- [ ] **Step 3: Run full test suite**

Run:

```bash
pnpm test
```

Expected: PASS across all packages.
