# Round-Trip XML Next 5 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Исправить четыре согласованные причины round-trip XML расхождений и разблокировать следующий triage-прогон.

**Architecture:** Все изменения остаются в metadata-слое и используют существующие `rules.ts`/type-rule механизмы. XML-цикл имеет приоритет: сначала точечные XML-тесты, затем минимальная реализация, затем YAML-поведение только для явной формы `dcscor:Field`.

**Tech Stack:** TypeScript, Vitest, `pnpm`, `fast-xml-parser`, существующая orchestration property-система.

---

## Source Spec

- `docs/superpowers/specs/2026-05-14-round-trip-xml-next-5-design.md`

## File Structure

- Modify `packages/core/metadata/commonObjects/metadataAttribute/rules.ts`
  - Add `defaultValueXMLRaw: ""` to `commonAttributeProperties.type`.
- Modify `packages/core/metadata/commonObjects/metadataAttribute/toXML.test.ts`
  - Add an inline XML test proving an empty `Type` property exports as `<Type/>`.
- Modify `packages/core/metadata/commonObjects/typeDescription/types.ts`
  - Add a property-rule extension for local type namespace declaration.
  - Add the `dcsset` namespace to known `dcsset` type rules so export code has a source of truth.
- Modify `packages/core/metadata/commonObjects/typeDescription/toXML.ts`
  - Use the new property-rule flag to add `_xmlns:<prefix>` only when a property asks for it.
- Modify `packages/core/metadata/commonObjects/typeDescription/toXML.test.ts`
  - Add paired tests: one with local namespace requested, one without.
- Modify `packages/core/metadata/appliedObjects/metadataDataProcessor/rules.ts`
  - Override DataProcessor attribute type rules so `TypeDescription` locally declares the type namespace.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/types.ts`
  - Extend YAML schema/types for explicit DCS text values.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromXML.ts`
  - Import `dcscor:Field` as `{ type: "Field", value }` when it appears under `DesignTimeValue`.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromYAML.ts`
  - Parse explicit YAML form `{ Тип: Поле, Значение: ... }` into `{ type: "Field", value }`.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toYAML.ts`
  - Export explicit field values to the explicit YAML form for `DesignTimeValue`.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/__fixtures__/data.ts`
  - Add inline fixture entries for XML/YAML typed field behavior.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromXML.test.ts`
  - Covered via fixture table.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toXML.test.ts`
  - Covered via fixture table.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromYAML.test.ts`
  - Covered via fixture table.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toYAML.test.ts`
  - Covered via fixture table.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/types.ts`
  - Allow `undefined` as XML import/export result and allow reference-only `v8:Type`.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromXML.ts`
  - Import valid `v8:Type *:Undefined` as `undefined`, but preserve the raw object during reference import.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/toXML.ts`
  - Restore valid reference `v8:Type *:Undefined` when model value is empty.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromXML.test.ts`
  - Add tests for normal import and reference import.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/toXML.test.ts`
  - Add tests for restoration and invalid reference rejection.

## Task 1: Preserve Empty MetadataAttribute Type

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataAttribute/rules.ts`
- Modify: `packages/core/metadata/commonObjects/metadataAttribute/toXML.test.ts`

- [ ] **Step 1: Write the failing test**

Add this test inside `describe("export MetadataAttributes to XML", () => { ... })` in `packages/core/metadata/commonObjects/metadataAttribute/toXML.test.ts`:

```ts
  it("exports empty Type tag when attribute type is missing", () => {
    const { result } = testExportPropertyToXML({
      rule: MetadataAttributeRules.properties.type,
      value: undefined,
      xmlRootTag: "Type",
    })

    expect(result).toBe("<Type/>")
  })
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/metadataAttribute/toXML.test.ts -t "exports empty Type tag when attribute type is missing"
```

Expected result before implementation:

```text
FAIL metadata/commonObjects/metadataAttribute/toXML.test.ts
expected '<Type></Type>' or '<Type>undefined</Type>' or '' to be '<Type/>'
```

The exact XML serialization may differ, but the test must fail because `MetadataAttributeRules.properties.type` has no raw empty XML value yet.

- [ ] **Step 3: Implement the minimal rule change**

In `packages/core/metadata/commonObjects/metadataAttribute/rules.ts`, change `commonAttributeProperties.type` to:

```ts
  type: {
    yaml: "Тип",
    type: "TypeDescription",
    xml: "Type",
    useAsShortValueYAML: true,
    xmlParents: ["Properties"],
    order: 4,
    defaultValueXMLRaw: "",
  },
```

- [ ] **Step 4: Run the focused test and verify it passes**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/metadataAttribute/toXML.test.ts -t "exports empty Type tag when attribute type is missing"
```

Expected:

```text
PASS metadata/commonObjects/metadataAttribute/toXML.test.ts
```

- [ ] **Step 5: Run the metadataAttribute suite**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/metadataAttribute/toXML.test.ts metadata/commonObjects/metadataAttribute/fromXML.test.ts
```

Expected:

```text
PASS metadata/commonObjects/metadataAttribute/toXML.test.ts
PASS metadata/commonObjects/metadataAttribute/fromXML.test.ts
```

- [ ] **Step 6: Commit Task 1**

Run:

```bash
git add packages/core/metadata/commonObjects/metadataAttribute/rules.ts packages/core/metadata/commonObjects/metadataAttribute/toXML.test.ts
git commit -m "fix: :bug: сохранять пустой Type реквизита"
```

## Task 2: Add Contextual TypeDescription Namespace Declaration

**Files:**
- Modify: `packages/core/metadata/commonObjects/typeDescription/types.ts`
- Modify: `packages/core/metadata/commonObjects/typeDescription/toXML.ts`
- Modify: `packages/core/metadata/commonObjects/typeDescription/toXML.test.ts`

- [ ] **Step 1: Write failing TypeDescription tests**

In `packages/core/metadata/commonObjects/typeDescription/toXML.test.ts`, add these tests after the existing generated platform type test:

```ts
  it("exports local type namespace when rule requests it", () => {
    const resultXml = exportTypeDescriptionToXML(
      mockContext,
      { ...mockRule, declareTypeNamespaceXML: true },
      { type: ["SettingsComposer"] }
    )

    const result = xmlExport({ TypeDescription: resultXml }, false)

    expect(result).toEqual(
      '<TypeDescription>\n\t<v8:Type xmlns:dcsset="http://v8.1c.ru/8.1/data-composition-system/settings">dcsset:SettingsComposer</v8:Type>\n</TypeDescription>'
    )
  })

  it("does not export local type namespace by default", () => {
    const resultXml = exportTypeDescriptionToXML(mockContext, mockRule, { type: ["SettingsComposer"] })

    const result = xmlExport({ TypeDescription: resultXml }, false)

    expect(result).toEqual("<TypeDescription>\n\t<v8:Type>dcsset:SettingsComposer</v8:Type>\n</TypeDescription>")
  })
```

- [ ] **Step 2: Run tests and verify the new namespace test fails**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/typeDescription/toXML.test.ts -t "local type namespace"
```

Expected:

```text
FAIL metadata/commonObjects/typeDescription/toXML.test.ts
```

The default test should already pass; the requested namespace test should fail because `declareTypeNamespaceXML` is not implemented.

- [ ] **Step 3: Add the property-rule extension and namespace source**

In `packages/core/metadata/commonObjects/typeDescription/types.ts`, add the import near the top:

```ts
import type { BasePropertyRule } from "~/metadata/orchestration"
```

Add this exported type after `TypeDescriptionRule`:

```ts
export type TypeDescriptionPropertyRule = BasePropertyRule & {
  type: "TypeDescription"
  declareTypeNamespaceXML?: boolean
}
```

Change these three `dcsset` rules so the namespace is available to the exporter:

```ts
  SettingsComposer: {
    enterprise: "КомпоновщикНастроекКомпоновкиДанных",
    prefix: "dcsset",
    namespace: "http://v8.1c.ru/8.1/data-composition-system/settings",
  },
  Filter: {
    enterprise: "Отбор",
    prefix: "dcsset",
    namespace: "http://v8.1c.ru/8.1/data-composition-system/settings",
  },
  DataCompositionComparisonType: {
    enterprise: "DataCompositionComparisonType",
    prefix: "dcsset",
    namespace: "http://v8.1c.ru/8.1/data-composition-system/settings",
  },
```

- [ ] **Step 4: Implement conditional namespace export**

In `packages/core/metadata/commonObjects/typeDescription/toXML.ts`, update imports:

```ts
import { TypeDescription, TypeDescriptionPropertyRule, TypeDescriptionXML, TypeDescriptionXMLType } from "./types"
```

Change the function signature:

```ts
export const exportTypeDescriptionToXML = (
  _context: ConfigurationContext,
  rule: PropertyRule | undefined,
  typeDescription: TypeDescription | undefined
): TypeDescriptionXML | undefined => {
```

Inside the function, replace:

```ts
  const typesXML = getTypesXML(typeDescription)
```

with:

```ts
  const typesXML = getTypesXML(typeDescription, shouldDeclareTypeNamespace(rule))
```

Add this helper before `getTypesXML`:

```ts
const shouldDeclareTypeNamespace = (rule: PropertyRule | undefined): boolean =>
  Boolean((rule as TypeDescriptionPropertyRule | undefined)?.declareTypeNamespaceXML)
```

Change `getTypesXML` signature:

```ts
const getTypesXML = (
  typeDescription: TypeDescription,
  declareTypeNamespace: boolean
): {
```

Inside `getTypesXML`, replace the `item` construction with:

```ts
    const item =
      declareTypeNamespace && rule.namespace
        ? {
            [`_xmlns:${rule.prefix}`]: rule.namespace,
            "#text": typeXML,
          }
        : typeXML
```

- [ ] **Step 5: Run TypeDescription tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/typeDescription/toXML.test.ts
```

Expected:

```text
PASS metadata/commonObjects/typeDescription/toXML.test.ts
```

- [ ] **Step 6: Commit Task 2**

Run:

```bash
git add packages/core/metadata/commonObjects/typeDescription/types.ts packages/core/metadata/commonObjects/typeDescription/toXML.ts packages/core/metadata/commonObjects/typeDescription/toXML.test.ts
git commit -m "fix: :bug: добавить локальный namespace TypeDescription"
```

## Task 3: Enable Local Type Namespace for DataProcessor Attributes

**Files:**
- Modify: `packages/core/metadata/appliedObjects/metadataDataProcessor/rules.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataDataProcessor/toXML.test.ts`

- [ ] **Step 1: Write the failing DataProcessor export test**

In `packages/core/metadata/appliedObjects/metadataDataProcessor/toXML.test.ts`, import `testExportPropertyToXML` and `MetadataDataProcessorRules` if they are not already imported:

```ts
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"
import { MetadataDataProcessorRules } from "./rules"
```

Add this test:

```ts
  it("exports attribute SettingsComposer type with local dcsset namespace", () => {
    const { result } = testExportPropertyToXML({
      rule: MetadataDataProcessorRules.properties.attributes,
      value: [
        {
          uuid: "8a57d427-a34e-4121-84e6-1a86a9f9092d",
          name: "КомпоновщикОтбораВсехДокументов",
          synonym: { items: { ru: "Компоновщик отбора всех документов" } },
          type: { type: ["SettingsComposer"] },
        },
      ],
      xmlRootTag: "Attribute",
    })

    expect(result).toContain(
      '<v8:Type xmlns:dcsset="http://v8.1c.ru/8.1/data-composition-system/settings">dcsset:SettingsComposer</v8:Type>'
    )
  })
```

- [ ] **Step 2: Run the focused DataProcessor test and verify it fails**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/metadataDataProcessor/toXML.test.ts -t "exports attribute SettingsComposer type with local dcsset namespace"
```

Expected:

```text
FAIL metadata/appliedObjects/metadataDataProcessor/toXML.test.ts
```

- [ ] **Step 3: Override DataProcessor attribute rules**

In `packages/core/metadata/appliedObjects/metadataDataProcessor/rules.ts`, add imports:

```ts
import { MetadataAttributeRules } from "~/metadata/commonObjects/metadataAttribute/rules"
```

Add this constant before `export const MetadataDataProcessorRules`:

```ts
const MetadataDataProcessorAttributeRules = {
  ...MetadataAttributeRules,
  properties: {
    ...MetadataAttributeRules.properties,
    type: {
      ...MetadataAttributeRules.properties.type,
      declareTypeNamespaceXML: true,
    },
  },
} as const satisfies MetadataItemRule
```

Change the `attributes` property from:

```ts
    attributes: {
      yaml: "Реквизиты",
      type: "MetadataAttributes",
      xmlParents: childObjects,
      xml: "Attribute",
    },
```

to:

```ts
    attributes: {
      yaml: "Реквизиты",
      type: "MetadataAttributes",
      itemRule: MetadataDataProcessorAttributeRules,
      xmlParents: childObjects,
      xml: "Attribute",
    },
```

- [ ] **Step 4: Run DataProcessor and TypeDescription tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/appliedObjects/metadataDataProcessor/toXML.test.ts metadata/commonObjects/typeDescription/toXML.test.ts
```

Expected:

```text
PASS metadata/appliedObjects/metadataDataProcessor/toXML.test.ts
PASS metadata/commonObjects/typeDescription/toXML.test.ts
```

- [ ] **Step 5: Run form attribute guard tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms/commonObjects/formAttribute/toXML.test.ts metadata/commonObjects/typeDescription/toXML.test.ts -t "does not export local type namespace by default"
```

Expected:

```text
PASS
```

This verifies the namespace flag is not global.

- [ ] **Step 6: Commit Task 3**

Run:

```bash
git add packages/core/metadata/appliedObjects/metadataDataProcessor/rules.ts packages/core/metadata/appliedObjects/metadataDataProcessor/toXML.test.ts
git commit -m "fix: :bug: объявлять dcsset для реквизитов обработки"
```

## Task 4: Preserve dcscor:Field and Add Explicit YAML Form

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/types.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromXML.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromYAML.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toYAML.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/__fixtures__/data.ts`
- Existing fixture-table tests cover:
  - `fromXML.test.ts`
  - `toXML.test.ts`
  - `fromYAML.test.ts`
  - `toYAML.test.ts`

- [ ] **Step 1: Add fixture cases that fail**

In `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/__fixtures__/data.ts`, add these exports near other fixture constants:

```ts
export const fixtureDesignTimeFieldPath = "Сертификаты.СертификатПредставление"
export const yamlDesignTimeFieldExplicit = {
  Тип: "Поле",
  Значение: fixtureDesignTimeFieldPath,
} as const
```

Add this fixture before `export const dcsMetadataValueFixtures`:

```ts
const designTimeFieldFixture: DcsMetadataValueFixture = {
  id: "designTimeField",
  title: "DesignTimeValue explicit Field",
  rule: { type: "MetadataDcsMetadataValue", valueType: "DesignTimeValue", yaml: "value" },
  value: {
    type: "Field",
    value: fixtureDesignTimeFieldPath,
  },
  yaml: yamlDesignTimeFieldExplicit,
  xml: "design-time-field.xml",
}
```

Add `designTimeFieldFixture` to both `dcsMetadataValueXMLFixtures` and `dcsMetadataValueFromXMLFixtures`.

Create `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/__fixtures__/design-time-field.xml` with:

```xml
<dcscor:value xsi:type="dcscor:Field">Сертификаты.СертификатПредставление</dcscor:value>
```

- [ ] **Step 2: Run focused DCS value tests and verify failures**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromXML.test.ts metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toXML.test.ts metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromYAML.test.ts metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toYAML.test.ts -t "DesignTimeValue explicit Field"
```

Expected:

```text
FAIL
```

The XML import currently returns a string, and YAML explicit form is not supported.

- [ ] **Step 3: Extend DCS metadata value YAML types**

In `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/types.ts`, add:

```ts
export type MetadataDcsExplicitTextValueYAML =
  | {
      Тип: "Поле"
      Значение: string
    }
  | {
      Тип: "ЗначениеВремениПроектирования"
      Значение: string
    }
```

Add `MetadataDcsExplicitTextValueYAML` to `MetadataDcsMetadataSingleValueYAML`:

```ts
export type MetadataDcsMetadataSingleValueYAML =
  | null
  | MetadataDcsExplicitTextValueYAML
  | ColorYAML
  | MetadataFieldYAML
  | ChoiceParametersYAML
  | I8nTextYAML
  | MetadataValueYAML
  | TypeLinkYAML
  | ChoiceParameterLinksYAML
  | FontYAML
  | string
```

- [ ] **Step 4: Preserve dcscor:Field on XML import for DesignTimeValue**

In `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromXML.ts`, replace:

```ts
  if (xsi === "dcscor:Field") {
    return textNode(root as string | { "#text"?: string })
  }
```

with:

```ts
  if (xsi === "dcscor:Field") {
    const value = textNode(root as string | { "#text"?: string })
    return rule.valueType === "DesignTimeValue" ? { type: "Field", value } : value
  }
```

- [ ] **Step 5: Parse explicit YAML form**

In `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromYAML.ts`, add this helper after `isEnterpriseDesignTimeValue`:

```ts
const importExplicitTextValueFromYAML = (data: unknown): MetadataDcsMetadataValue | undefined => {
  if (typeof data !== "object" || data === null || Array.isArray(data)) return undefined
  const record = data as Record<string, unknown>
  if (record["Тип"] === "Поле" && typeof record["Значение"] === "string") {
    return { type: "Field", value: record["Значение"] }
  }
  if (record["Тип"] === "ЗначениеВремениПроектирования" && typeof record["Значение"] === "string") {
    return { type: "DesignTimeValue", value: record["Значение"] }
  }
  return undefined
}
```

In the `case "DesignTimeValue":` branch, add this as the first statement:

```ts
      const explicitTextValue = importExplicitTextValueFromYAML(data)
      if (explicitTextValue !== undefined) return explicitTextValue
```

- [ ] **Step 6: Export explicit YAML form**

In `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toYAML.ts`, replace the `isExplicitTextValue(data)` branch with:

```ts
  if (isExplicitTextValue(data)) {
    if (rule.valueType === "DesignTimeValue") {
      return {
        Тип: data.type === "Field" ? "Поле" : "ЗначениеВремениПроектирования",
        Значение: data.value,
      } as MetadataDcsMetadataValueYAML
    }

    if (data.type === "DesignTimeValue") {
      return (exportMetadataValueStringToYAML(context, undefined, data.value) ?? data.value) as MetadataDcsMetadataValueYAML
    }

    return (exportMetadataFieldStringToYAML(context, undefined, data.value) ?? data.value) as MetadataDcsMetadataValueYAML
  }
```

- [ ] **Step 7: Run focused DCS value tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromXML.test.ts metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toXML.test.ts metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromYAML.test.ts metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toYAML.test.ts -t "DesignTimeValue explicit Field"
```

Expected:

```text
PASS
```

- [ ] **Step 8: Run full DCS value tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/dataCompositionSystem/dcsMetadataValue
```

Expected:

```text
PASS
```

- [ ] **Step 9: Commit Task 4**

Run:

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue
git commit -m "fix: :bug: сохранять DCS Field в DesignTimeValue"
```

## Task 5: Restore DcsMetadataTypedValue v8:Type Undefined From Reference

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/types.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromXML.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/toXML.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/toXML.test.ts`

- [ ] **Step 1: Write failing import tests**

In `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromXML.test.ts`, add:

```ts
  it("imports v8 Type Undefined as missing value", () => {
    const result = testImportPropertyFromXML({
      rule,
      xmlRootTag: "value",
      xmlString:
        '<value xmlns:d8p1="http://v8.1c.ru/8.2/data/types" xsi:type="v8:Type">d8p1:Undefined</value>',
    })

    expect(result).toBeUndefined()
  })

  it("imports reference v8 Type Undefined as raw XML", () => {
    const result = testImportPropertyFromXML({
      rule,
      xmlRootTag: "value",
      xmlString:
        '<value xmlns:d8p1="http://v8.1c.ru/8.2/data/types" xsi:type="v8:Type">d8p1:Undefined</value>',
      forReference: true,
    })

    expect(result).toEqual({
      "_xmlns:d8p1": "http://v8.1c.ru/8.2/data/types",
      "_xsi:type": "v8:Type",
      "#text": "d8p1:Undefined",
    })
  })
```

- [ ] **Step 2: Write failing export tests**

In `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/toXML.test.ts`, add:

```ts
const undefinedTypeReferenceValue = {
  "_xmlns:d8p1": "http://v8.1c.ru/8.2/data/types",
  "_xsi:type": "v8:Type",
  "#text": "d8p1:Undefined",
}
```

Add tests inside `describe("export DcsMetadataTypedValue to XML", () => { ... })`:

```ts
  it("exports missing value from reference v8 Type Undefined", () => {
    const { result } = testExportPropertyToXML({
      rule,
      value: undefined,
      referenceMetadata: undefinedTypeReferenceValue,
      xmlRootTag: "value",
    })

    expect(result).toEqual(
      '<value xmlns:d8p1="http://v8.1c.ru/8.2/data/types" xsi:type="v8:Type">d8p1:Undefined</value>'
    )
  })

  it("does not export invalid reference v8 Type value", () => {
    const { result } = testExportPropertyToXML({
      rule,
      value: undefined,
      referenceMetadata: {
        ...undefinedTypeReferenceValue,
        "#text": "d8p1:String",
      },
      xmlRootTag: "value",
    })

    expect(result).toEqual("<value/>")
  })
```

- [ ] **Step 3: Run focused tests and verify failures**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromXML.test.ts metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/toXML.test.ts -t "v8 Type"
```

Expected:

```text
FAIL
```

The import currently throws unsupported `_xsi:type v8:Type`; export currently ignores reference raw XML.

- [ ] **Step 4: Extend typed value XML type**

In `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/types.ts`, add this union member to `DcsMetadataTypedValueXML`:

```ts
  | {
      "_xsi:type": "v8:Type"
      "#text"?: string
      [key: `_xmlns:${string}`]: string | undefined
    }
```

- [ ] **Step 5: Implement v8 Type Undefined import**

In `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromXML.ts`, change imports to include `ConfigurationContextFromXML` as already present.

Add helpers above `importSingle`:

```ts
const getUndefinedTypePrefix = (xml: DcsMetadataTypedValueXML): string | undefined => {
  if (xml["_xsi:type"] !== "v8:Type") return undefined
  const text = "#text" in xml ? xml["#text"] : undefined
  if (typeof text !== "string") return undefined
  const parts = text.split(":")
  if (parts.length !== 2) return undefined
  const [prefix, name] = parts
  return prefix !== "" && name === "Undefined" ? prefix : undefined
}

const asReferenceUndefinedTypeValueXML = (
  xml: DcsMetadataTypedValueXML,
  prefix: string
): DcsMetadataTypedValueXML | undefined => {
  const namespaceKey = `_xmlns:${prefix}`
  return typeof (xml as Record<string, unknown>)[namespaceKey] === "string" ? xml : undefined
}
```

Change `importSingle` return type and body:

```ts
const importSingle = (
  context: ConfigurationContextFromXML,
  rule: DcsMetadataTypedValuePropertyRule,
  xml: DcsMetadataTypedValueXML
): DcsMetadataTypedValue | undefined => {
  const undefinedTypePrefix = getUndefinedTypePrefix(xml)
  if (undefinedTypePrefix !== undefined) {
    return context.fromXML.forReference ? asReferenceUndefinedTypeValueXML(xml, undefinedTypePrefix) as unknown as DcsMetadataTypedValue : undefined
  }

  const type = DcsMetadataTypedValueTypeFromXML(xml["_xsi:type"])
  return DcsMetadataTypedValueRegistry[type].fromXML({ context, rule, xml })
}
```

Change `importDcsMetadataTypedValueFromXML` return type and array handling:

```ts
): DcsMetadataTypedValue | DcsMetadataTypedValue[] | undefined => {
  if (xml === undefined) return undefined
  if (Array.isArray(xml)) {
    const values = xml
      .map((item) => importSingle(context, rule, item))
      .filter((item): item is DcsMetadataTypedValue => item !== undefined)
    return values.length > 0 ? values : undefined
  }
  return importSingle(context, rule, xml)
}
```

- [ ] **Step 6: Implement reference restoration on export**

In `packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/toXML.ts`, add helpers above `exportSingle`:

```ts
type ReferenceUndefinedTypeValueXML = DcsMetadataTypedValueXML & {
  "_xsi:type": "v8:Type"
  "#text": string
}

const getReferenceUndefinedTypeValue = (value: unknown): ReferenceUndefinedTypeValueXML | undefined => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined
  const record = value as Record<string, unknown>
  if (record["_xsi:type"] !== "v8:Type") return undefined
  const text = record["#text"]
  if (typeof text !== "string") return undefined
  const parts = text.split(":")
  if (parts.length !== 2) return undefined
  const [prefix, name] = parts
  if (prefix === "" || name !== "Undefined") return undefined
  const namespaceKey = `_xmlns:${prefix}`
  return typeof record[namespaceKey] === "string" ? (value as ReferenceUndefinedTypeValueXML) : undefined
}
```

Change `exportDcsMetadataTypedValueToXML` signature to accept `referenceMetadata`:

```ts
export const exportDcsMetadataTypedValueToXML = (
  context: ConfigurationContextWithExportToXML,
  rule: DcsMetadataTypedValuePropertyRule,
  value: DcsMetadataTypedValue | DcsMetadataTypedValue[] | undefined,
  referenceMetadata?: unknown
): DcsMetadataTypedValueXML | DcsMetadataTypedValueXML[] | undefined => {
  if (value === undefined) return getReferenceUndefinedTypeValue(referenceMetadata)
  if (Array.isArray(value)) return value.map((item) => exportSingle(context, rule, item))
  return exportSingle(context, rule, value)
}
```

Change the wrapper to pass reference metadata:

```ts
const exportDcsMetadataTypedValueToXMLForRule = (
  context: ConfigurationContextWithExportToXML,
  rule: PropertyRule,
  value: unknown,
  referenceMetadata?: unknown
): DcsMetadataTypedValueXML | DcsMetadataTypedValueXML[] | undefined =>
  exportDcsMetadataTypedValueToXML(
    context,
    rule as DcsMetadataTypedValuePropertyRule,
    value as DcsMetadataTypedValue | DcsMetadataTypedValue[] | undefined,
    referenceMetadata
  )
```

- [ ] **Step 7: Run focused typed value tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/fromXML.test.ts metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue/toXML.test.ts -t "v8 Type"
```

Expected:

```text
PASS
```

- [ ] **Step 8: Run full typed value tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue
```

Expected:

```text
PASS
```

- [ ] **Step 9: Commit Task 5**

Run:

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue
git commit -m "fix: :bug: восстанавливать DCS v8 Type Undefined"
```

## Task 6: Verify Integrated Round-Trip Behavior

**Files:**
- No new source files.
- Uses all files changed in Tasks 1-5.

- [ ] **Step 1: Run focused metadata suites**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/metadataAttribute metadata/commonObjects/typeDescription metadata/appliedObjects/metadataDataProcessor metadata/commonObjects/dataCompositionSystem/dcsMetadataValue metadata/commonObjects/dataCompositionSystem/dscMetadataTypedValue
```

Expected:

```text
PASS
```

- [ ] **Step 2: Run full core tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run
```

Expected:

```text
PASS
```

- [ ] **Step 3: Run round-trip triage batch**

Run from repository root:

```bash
./.agents/skills/round-trip-xml/round-trip.sh --triage --batch-size 5
```

Expected:

```text
[round-trip] ...
```

The previous blocker `DcsMetadataTypedValue XML: unsupported _xsi:type v8:Type` must not appear. If new diffs remain, record the first five in the final implementation report; do not edit XML fixtures.

- [ ] **Step 4: Run project tests if closing the work**

Run:

```bash
pnpm test
```

Expected:

```text
PASS
```

- [ ] **Step 5: Commit verification-only changes if any**

If verification produced no file changes, skip this step. If a tool updated generated files that are tracked and required, review them and run:

```bash
git add <tracked-generated-file>
git commit -m "chore: :wrench: обновить проверочные файлы"
```

## Task 7: Add Accumulation Register RecordType Standard Attribute

**Files:**
- Modify: `packages/core/metadata/commonObjects/standardAttributeDescription/*`
- Modify: `packages/core/metadata/appliedObjects/metadataAccumulationRegister/*`

- [x] **Step 1: Add failing XML tests**

Cover `RecordType` export for balance/default accumulation registers and prove `Turnovers` does not receive it.

- [x] **Step 2: Implement contextual standard attributes**

Add `RecordType: "ВидДвижения"` to standard attribute dictionaries and derive XML export order from accumulation register type.

- [x] **Step 3: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/standardAttributeDescription metadata/appliedObjects/metadataAccumulationRegister
```

Expected: `PASS`.

- [x] **Step 4: Commit**

Committed as:

```text
fix: :bug: сохранять RecordType регистра накопления
```

## Task 8: Preserve Root Form Event XML Case

**Files:**
- Modify: `packages/core/metadata/forms/clientApplicationForm/rules.ts`
- Modify: `packages/core/metadata/forms/commonObjects/event/toXML.test.ts`

- [x] **Step 1: Add failing event export test**

Export `onUpdateUserSettingSetAtServer` through root form event rules and expect XML `name="OnUpdateUserSettingSetAtServer"`.

- [x] **Step 2: Add event to root form rule**

Add:

```ts
onUpdateUserSettingSetAtServer: "ПриОбновленииСоставаПользовательскихНастроекНаСервере"
```

- [x] **Step 3: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms/commonObjects/event/toXML.test.ts metadata/forms/clientApplicationForm/toXML.test.ts
```

Expected: `PASS`.

- [x] **Step 4: Commit**

Committed as:

```text
fix: :bug: сохранять регистр события формы
```

## Task 9: Restore CommonAttribute FillValue xsi:nil

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataValue/fromXML.ts`
- Modify: `packages/core/metadata/commonObjects/metadataValue/toXML.ts`
- Modify: `packages/core/metadata/orchestration/property/fromXML.ts`
- Modify: `packages/core/metadata/commonObjects/metadataValue/fromXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/metadataValue/toXML.test.ts`
- Modify: `packages/core/metadata/appliedObjects/metadataCommonAttribute/toXML.test.ts`

- [x] **Step 1: Add failing nil tests**

Assert normal import of `{ "_xsi:nil": true }` is `undefined`, reference import preserves the raw marker, and export restores `<FillValue xsi:nil="true"/>` from reference.

- [x] **Step 2: Preserve raw nil marker at XML import boundary**

When an XML key is present but its parsed value is `undefined`, pass `{ "_xsi:nil": true }` to `MetadataValue` import.

- [x] **Step 3: Restore marker during XML export**

If `value` or `referenceMetadata` is the raw nil marker, export it unchanged.

- [x] **Step 4: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/metadataValue metadata/appliedObjects/metadataCommonAttribute
```

Expected: `PASS`.

- [x] **Step 5: Commit**

Committed as:

```text
fix: :bug: сохранять nil MetadataValue
```

## Task 10: Keep GraphicalSchemaField Edit in XML Only

**Files:**
- Modify: `packages/core/metadata/forms/elements/graphicalSchemaField/rules.ts`
- Modify: `packages/core/metadata/forms/elements/graphicalSchemaField/toXML.test.ts`
- Modify: `packages/core/metadata/forms/elements/__fixtures__/data.ts`

- [x] **Step 1: Add failing XML export test**

Export `GraphicalSchemaField` with `edit: false` and expect `<Edit>false</Edit>`.

- [x] **Step 2: Make `edit` XML-only**

Use:

```ts
edit: { type: "boolean", xml: "Edit", yaml: "Редактирование", toYAML: false, fromYAML: false, toEnterprise: false }
```

- [x] **Step 3: Keep generic YAML/enterprise fixtures stable**

Remove `edit` from generic full fixture expectations where YAML/enterprise export should not expose it.

- [x] **Step 4: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms/elements/graphicalSchemaField metadata/forms/elements
```

Expected: `PASS`.

- [x] **Step 5: Commit**

Committed as:

```text
fix: :bug: сохранять Edit графической схемы
```

## Task 11: Preserve DynamicList KeyField for RowKey

**Files:**
- Modify: `packages/core/metadata/forms/commonObjects/dynamicList/rules.ts`
- Modify: `packages/core/metadata/forms/commonObjects/dynamicList/fromXML.test.ts`
- Modify: `packages/core/metadata/forms/commonObjects/dynamicList/toXML.test.ts`
- Modify if needed: `packages/core/metadata/forms/commonObjects/dynamicList/fromYAML.test.ts`
- Modify if needed: `packages/core/metadata/forms/commonObjects/dynamicList/toYAML.test.ts`
- Modify if needed: `packages/core/metadata/orchestration/property/toXML.ts`

- [x] **Step 1: Prove direct multi-KeyField XML import/export**

Add a test to `fromXML.test.ts`:

```ts
  it("imports multiple KeyField nodes as an array", () => {
    const result = importPropertyFromXML({
      context: mockContextFromXML(),
      rule,
      value: {
        "_xsi:type": "DynamicList",
        KeyType: "RowKey",
        KeyField: ["КлючПриглашения", "Контрагент", "ИдентификаторОрганизации"],
      },
    })

    expect(result).toEqual({
      itemType: "DynamicList",
      customQuery: false,
      keyType: "RowKey",
      keyFields: ["КлючПриглашения", "Контрагент", "ИдентификаторОрганизации"],
    })
  })
```

Add a matching `toXML.test.ts` assertion that exports all three repeated `<KeyField>` nodes from a model value.

- [x] **Step 2: Prove YAML preserves arrays if YAML is the loss point**

If Step 1 passes but round-trip still drops `KeyField`, add YAML tests where `ПоляКлюча` is an array of three strings and assert import/export keeps the array unchanged.

- [x] **Step 3: Implement the minimal fix**

Keep `preserveFromReferenceXML: true` for `DynamicList.keyFields`. If XML/YAML array tests fail, adjust only the narrow string-property import/export path or the `keyFields` rule so repeated `KeyField` stays `string[]`; do not add a new broad conversion for all string fields without tests.

- [x] **Step 4: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms/commonObjects/dynamicList/fromXML.test.ts metadata/forms/commonObjects/dynamicList/toXML.test.ts metadata/forms/commonObjects/dynamicList/fromYAML.test.ts metadata/forms/commonObjects/dynamicList/toYAML.test.ts
```

Expected: `PASS`.

- [ ] **Step 5: Run round-trip triage**

Run:

```bash
env NKDK_XML_REPO=/Users/nikita/git/round-trip-source NKDK_XML_DIR=/Users/nikita/git/round-trip-source/trade ./.agents/skills/round-trip-xml/round-trip.sh --triage --batch-size 5
```

Expected: the first diff must no longer be loss of `DynamicList` `KeyField`.

- [x] **Step 6: Commit**

Run:

```bash
git add packages/core/metadata/forms/commonObjects/dynamicList packages/core/metadata/orchestration/property/toXML.ts docs/superpowers/specs/2026-05-14-round-trip-xml-next-5-design.md docs/superpowers/plans/2026-05-14-round-trip-xml-next-5.md
git commit -m "fix: :bug: сохранять KeyField динамического списка"
```

## Task 12: Continue With Next Triage Diff

**Files:**
- To be selected from the next first unresolved diff after Task 11.

- [ ] **Step 1: Capture the first unresolved diff**

Run the round-trip triage command from Task 11 and copy the first diff class into the spec under `Принятые решения`.

- [ ] **Step 2: Brainstorm the solution**

Compare XML reference, imported model, YAML output, and XML export. Choose the narrowest rule-level fix that does not edit source XML fixtures.

- [ ] **Step 3: Add focused failing tests**

Place tests next to the owning metadata object or common object. The test must fail before implementation and must not depend on external XML fixture mutation.

- [ ] **Step 4: Implement, verify, and commit**

Run focused tests, then round-trip triage. Commit only after the targeted diff class disappears.

## Self-Review Notes

- Spec coverage: Tasks 1-6 cover the initial four accepted issues and integrated verification. Tasks 7-11 cover all later accepted decisions currently written in the spec: `RecordType`, form event XML case, `xsi:nil`, `GraphicalSchemaField.Edit`, and `DynamicList.KeyField`.
- Placeholder scan: the only future-looking task is Task 12, intentionally a triage loop because the exact next diff is discovered by the tool after Task 11.
- Type consistency: `declareTypeNamespaceXML`, explicit DCS YAML `Тип`/`Значение`, `v8:Type *:Undefined`, `RecordType`, `edit`, and `keyFields` names match the source rules and tests.
