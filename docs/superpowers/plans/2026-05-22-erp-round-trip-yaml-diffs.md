# ERP Round-Trip YAML Diffs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement all accepted decisions from `docs/superpowers/specs/2026-05-22-erp-round-trip-yaml-diffs-design.md` so ERP YAML round-trip stops producing the 169 known diffs.

**Architecture:** Keep XML fixtures as the source of truth and preserve existing YAML contracts where the spec says to do so. Implement semantic YAML disambiguation in the focused converters that already own the affected value types, and implement raw file preservation in form sync helpers. Keep the ERP `AdditionalColumns` duplicate workaround path-specific so it cannot leak into the general form attribute model.

**Tech Stack:** TypeScript, Vitest, fast-xml-parser through existing XML helpers, YAML import/export helpers, `pnpm --filter @nakidka/core test:isolated`, round-trip scripts in `.agents/skills`.

---

## File Structure

- Modify `packages/core/metadata/commonObjects/сhoiceParameterLinks/types.ts`: change YAML schema from compact string-only to structured list while keeping string import compatibility.
- Modify `packages/core/metadata/commonObjects/сhoiceParameterLinks/fromYAML.ts`: import the new `Имя` / `ПутьКДанным` / `РежимИзменения` objects and keep old compact string import.
- Modify `packages/core/metadata/commonObjects/сhoiceParameterLinks/toYAML.ts`: export structured YAML and keep raw `ПутьКДанным`.
- Modify `packages/core/metadata/commonObjects/сhoiceParameterLinks/fromYAML.test.ts` and `toYAML.test.ts`: cover raw path preservation and `DontChange`.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/structureItemGroup/items/groupItemField/types.ts`: add object YAML type for non-default group fields.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/structureItemGroup/items/groupItemField/fromYAML.ts` and `toYAML.ts`: import/export object shape for non-defaults while keeping old strings for import.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/structureItemGroup/items/groupItemField/fromYAML.test.ts`, `toYAML.test.ts`, and `__fixtures__/data.ts`: cover `Hierarchy` and disabled object export.
- Modify `packages/core/metadata/commonObjects/metadataValue/types.ts`: allow explicit typed wrappers inside form choice list YAML values.
- Modify `packages/core/metadata/commonObjects/metadataValue/formChoiceList/fromYAML.ts` and `toYAML.ts`: import/export `DataCompositionComparisonType` wrapper.
- Modify `packages/core/metadata/commonObjects/metadataValue/formChoiceList/fromYAML.test.ts`, `toYAML.test.ts`, and `__fixtures__/data.ts`: cover typed enum choice list values.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/types.ts`: allow explicit primitive wrappers for DCS values.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromYAML.ts` and `toYAML.ts`: import/export `Тип: Строка` for primitive strings in field-like contexts.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromYAML.test.ts`, `toYAML.test.ts`, and `toXML.test.ts`: cover empty `xs:string`.
- Create `packages/core/metadata/forms/clientApplicationForm/externalRawFiles.ts`: focused helper for recursive raw file copy between form XML and nkdk form directories.
- Modify `packages/core/metadata/forms/clientApplicationForm/convertFromXML.ts`: copy `Ext/Form.bin` for every form and copy form `Ext/Help/_files/**`.
- Modify `packages/core/metadata/forms/clientApplicationForm/syncToXML.ts`: restore `Form.bin` for every form and restore form help files.
- Modify `packages/core/metadata/forms/clientApplicationForm/convertFromXML.test.ts` and `syncToXML.test.ts`: cover all-form `Form.bin` and help `_files`.
- Modify `packages/core/metadata/forms/commonObjects/formAttribute/toXML.ts`: add path-specific ERP duplicate additional columns restoration.
- Modify `packages/core/metadata/forms/commonObjects/formAttribute/toXML.test.ts`: cover the path-specific duplicate restoration and a normal negative case.
- Run final package tests and ERP round-trip triage.

## Task 1: ChoiceParameterLinks Structured YAML

**Files:**
- Modify: `packages/core/metadata/commonObjects/сhoiceParameterLinks/types.ts`
- Modify: `packages/core/metadata/commonObjects/сhoiceParameterLinks/fromYAML.ts`
- Modify: `packages/core/metadata/commonObjects/сhoiceParameterLinks/toYAML.ts`
- Test: `packages/core/metadata/commonObjects/сhoiceParameterLinks/fromYAML.test.ts`
- Test: `packages/core/metadata/commonObjects/сhoiceParameterLinks/toYAML.test.ts`

- [ ] **Step 1: Write failing import tests**

Add these cases to `packages/core/metadata/commonObjects/сhoiceParameterLinks/fromYAML.test.ts`:

```ts
  it("imports structured links with raw dataPath", () => {
    const result = importChoiceParameterLinksFromYAML(mockContext, mockRule, [
      {
        Имя: "Отбор.ПланСчетов",
        ПутьКДанным: "ПланСчетов",
      },
    ])

    expect(result).toEqual([
      {
        name: "Отбор.ПланСчетов",
        dataPath: "ПланСчетов",
        valueChange: "Clear",
      },
    ])
  })

  it("imports structured links with DontChange", () => {
    const result = importChoiceParameterLinksFromYAML(mockContext, mockRule, [
      {
        Имя: "Отбор.ПланСчетов",
        ПутьКДанным: "ПланСчетов.Ref",
        РежимИзменения: "НеИзменять",
      },
    ])

    expect(result).toEqual([
      {
        name: "Отбор.ПланСчетов",
        dataPath: "ПланСчетов.Ref",
        valueChange: "DontChange",
      },
    ])
  })
```

- [ ] **Step 2: Write failing export tests**

Change expected YAML in existing export tests from strings to arrays, and add this test to `toYAML.test.ts`:

```ts
  it("exports structured links without translating dataPath", () => {
    const mock: ChoiceParameterLinks = [
      {
        name: "Отбор.ПланСчетов",
        dataPath: "ПланСчетов",
        valueChange: "Clear",
      },
      {
        name: "Отбор.Характеристика",
        dataPath: "Характеристика",
        valueChange: "DontChange",
      },
    ]

    const result = exportChoiceParameterLinksToYAML(mockContext, mockRule, mock)

    expect(result).toEqual([
      {
        Имя: "Отбор.ПланСчетов",
        ПутьКДанным: "ПланСчетов",
      },
      {
        Имя: "Отбор.Характеристика",
        ПутьКДанным: "Характеристика",
        РежимИзменения: "НеИзменять",
      },
    ])
  })
```

- [ ] **Step 3: Run failing tests**

Run:

```bash
pnpm --filter @nakidka/core test:isolated packages/core/metadata/commonObjects/сhoiceParameterLinks/fromYAML.test.ts packages/core/metadata/commonObjects/сhoiceParameterLinks/toYAML.test.ts
```

Expected: FAIL because `ChoiceParameterLinksYAML` is string-only and export still returns compact strings.

- [ ] **Step 4: Implement structured types**

In `types.ts`, replace the YAML region with:

```ts
//#region ChoiceParameterLinkYAML

export interface ChoiceParameterLinkYAML {
  Имя: string
  ПутьКДанным: string
  РежимИзменения?: "НеИзменять"
}

export const ChoiceParameterLinkJSONSchema = Type.Object({
  Имя: Type.String(),
  ПутьКДанным: Type.String(),
  РежимИзменения: Type.Optional(Type.Literal("НеИзменять")),
})

export const ChoiceParameterLinksJSONSchema = Type.Union([
  Type.String(),
  Type.Array(ChoiceParameterLinkJSONSchema),
])
export type ChoiceParameterLinksYAML = string | ChoiceParameterLinkYAML[]

//#endregion
```

- [ ] **Step 5: Implement structured import**

In `fromYAML.ts`, keep `parseChoiceParameterLinksString` for compatibility, and change the public importer to:

```ts
export const importChoiceParameterLinksFromYAML = (
  context: ConfigurationContext,
  rule: PropertyRule | undefined,
  data: ChoiceParameterLinksYAML | undefined
): ChoiceParameterLinks | undefined => {
  if (!data) return undefined
  if (typeof data === "string") return parseChoiceParameterLinksString(context, rule, data)

  return data.map((link) => ({
    name: link.Имя,
    dataPath: link.ПутьКДанным,
    valueChange: link.РежимИзменения === "НеИзменять" ? "DontChange" : "Clear",
  }))
}
```

- [ ] **Step 6: Implement structured export**

In `toYAML.ts`, remove `exportMetadataFieldToYAML` import and change the exporter to:

```ts
export const exportChoiceParameterLinksToYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: ChoiceParameterLinks | undefined
): ChoiceParameterLinksYAML | undefined => {
  if (!data) return undefined

  return data.map((link) => ({
    Имя: link.name,
    ПутьКДанным: link.dataPath,
    ...(link.valueChange === "DontChange" ? { РежимИзменения: "НеИзменять" as const } : {}),
  }))
}
```

- [ ] **Step 7: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/core test:isolated packages/core/metadata/commonObjects/сhoiceParameterLinks/fromYAML.test.ts packages/core/metadata/commonObjects/сhoiceParameterLinks/toYAML.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/core/metadata/commonObjects/сhoiceParameterLinks
git commit -m "fix: :bug: сохранить ChoiceParameterLinks в YAML объектами"
```

## Task 2: GroupItemField Object YAML For Non-Defaults

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/structureItemGroup/items/groupItemField/types.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/structureItemGroup/items/groupItemField/fromYAML.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/structureItemGroup/items/groupItemField/toYAML.ts`
- Test: `packages/core/metadata/commonObjects/dataCompositionSystem/structureItemGroup/items/groupItemField/fromYAML.test.ts`
- Test: `packages/core/metadata/commonObjects/dataCompositionSystem/structureItemGroup/items/groupItemField/toYAML.test.ts`

- [ ] **Step 1: Write failing tests**

Add these tests:

```ts
  it("imports object with hierarchy group type", () => {
    const result = testImportPropertyFromYAML({
      rule,
      value: {
        Поле: "СсылкаВидЦен",
        ТипГруппировки: "Иерархия",
      },
    })

    expect(result).toEqual({
      itemType: "GroupItemField",
      field: "СсылкаВидЦен",
      groupType: "Hierarchy",
    })
  })
```

```ts
  it("exports hierarchy group type as object", () => {
    const result = testExportPropertyToYAML({
      rule,
      value: {
        itemType: "GroupItemField",
        field: "СсылкаВидЦен",
        groupType: "Hierarchy",
      },
    })

    expect(result).toEqual({
      ПоляГруппировки: {
        Поле: "СсылкаВидЦен",
        ТипГруппировки: "Иерархия",
      },
    })
  })

  it("exports disabled group field as object", () => {
    const result = testExportPropertyToYAML({
      rule,
      value: {
        itemType: "GroupItemField",
        field: "СсылкаВидЦен",
        use: false,
      },
    })

    expect(result).toEqual({
      ПоляГруппировки: {
        Поле: "СсылкаВидЦен",
        Использование: "Ложь",
      },
    })
  })
```

- [ ] **Step 2: Run failing tests**

Run:

```bash
pnpm --filter @nakidka/core test:isolated packages/core/metadata/commonObjects/dataCompositionSystem/structureItemGroup/items/groupItemField/fromYAML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/structureItemGroup/items/groupItemField/toYAML.test.ts
```

Expected: FAIL because object YAML is not supported and disabled export still uses `(Поле)`.

- [ ] **Step 3: Implement YAML type**

In `types.ts`, replace `GroupItemFieldYAML` with:

```ts
export type GroupItemFieldYAML =
  | string
  | {
      Поле: string
      Использование?: "Ложь"
      ТипГруппировки?: "Элементы" | "Иерархия"
      ТипДополнения?: "Нет" | "Элементы" | "Иерархия"
      НачалоПериода?: string
      КонецПериода?: string
    }
```

- [ ] **Step 4: Implement object import**

In `fromYAML.ts`, change the importer to:

```ts
const groupTypeFromYAML = {
  Элементы: "Items",
  Иерархия: "Hierarchy",
} as const

const additionTypeFromYAML = {
  Нет: "None",
  Элементы: "Items",
  Иерархия: "Hierarchy",
} as const

export const importGroupItemFieldFromYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule,
  value: GroupItemFieldYAML | undefined
): GroupItemField | undefined => {
  if (typeof value === "string") {
    const isDisabled = value.startsWith("(") && value.endsWith(")")
    const field = isDisabled ? value.slice(1, -1) : value
    if (!field) return undefined
    return isDisabled ? { itemType: "GroupItemField", field, use: false } : { itemType: "GroupItemField", field }
  }

  if (typeof value !== "object" || value === null || !value.Поле) return undefined

  return {
    itemType: "GroupItemField",
    field: value.Поле,
    ...(value.Использование === "Ложь" ? { use: false } : {}),
    ...(value.ТипГруппировки !== undefined ? { groupType: groupTypeFromYAML[value.ТипГруппировки] } : {}),
    ...(value.ТипДополнения !== undefined ? { additionType: additionTypeFromYAML[value.ТипДополнения] } : {}),
    ...(value.НачалоПериода !== undefined ? { periodStartDate: value.НачалоПериода } : {}),
    ...(value.КонецПериода !== undefined ? { periodEndDate: value.КонецПериода } : {}),
  }
}
```

- [ ] **Step 5: Implement object export**

In `toYAML.ts`, change the exporter to:

```ts
const groupTypeToYAML = {
  Items: "Элементы",
  Hierarchy: "Иерархия",
} as const

const additionTypeToYAML = {
  None: "Нет",
  Items: "Элементы",
  Hierarchy: "Иерархия",
} as const

const isDefaultGroupItemField = (value: GroupItemField): boolean =>
  value.use !== false &&
  (value.groupType === undefined || value.groupType === "Items") &&
  (value.additionType === undefined || value.additionType === "None") &&
  value.periodStartDate === undefined &&
  value.periodEndDate === undefined

export const exportGroupItemFieldToYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule,
  value: GroupItemField | undefined
): GroupItemFieldYAML | undefined => {
  if (value == null) return undefined
  if (isDefaultGroupItemField(value)) return value.field

  return {
    Поле: value.field,
    ...(value.use === false ? { Использование: "Ложь" as const } : {}),
    ...(value.groupType !== undefined && value.groupType !== "Items" ? { ТипГруппировки: groupTypeToYAML[value.groupType] } : {}),
    ...(value.additionType !== undefined && value.additionType !== "None" ? { ТипДополнения: additionTypeToYAML[value.additionType] } : {}),
    ...(value.periodStartDate !== undefined ? { НачалоПериода: value.periodStartDate } : {}),
    ...(value.periodEndDate !== undefined ? { КонецПериода: value.periodEndDate } : {}),
  }
}
```

- [ ] **Step 6: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/core test:isolated packages/core/metadata/commonObjects/dataCompositionSystem/structureItemGroup/items/groupItemField/fromYAML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/structureItemGroup/items/groupItemField/toYAML.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem/structureItemGroup/items/groupItemField
git commit -m "fix: :bug: сохранить настройки GroupItemField в YAML"
```

## Task 3: Typed FormChoiceList Values

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataValue/types.ts`
- Modify: `packages/core/metadata/commonObjects/metadataValue/formChoiceList/fromYAML.ts`
- Modify: `packages/core/metadata/commonObjects/metadataValue/formChoiceList/toYAML.ts`
- Test: `packages/core/metadata/commonObjects/metadataValue/formChoiceList/fromYAML.test.ts`
- Test: `packages/core/metadata/commonObjects/metadataValue/formChoiceList/toYAML.test.ts`

- [ ] **Step 1: Write failing tests**

Add imports in both tests:

```ts
import type { MetadataFormChoiceListValue, MetadataFormChoiceListValueYAML } from "../types"
```

Add to `fromYAML.test.ts`:

```ts
  it("imports DataCompositionComparisonType explicit value", () => {
    const yaml: MetadataFormChoiceListValueYAML = {
      Представление: "Равно",
      Значение: {
        Тип: "ВидСравненияКомпоновкиДанных",
        Значение: "Равно",
      },
    }

    const result = importFormChoiceListFromYAML(mockContext, yaml)

    expect(result.value).toEqual({
      type: "DataCompositionComparisonType",
      value: "Equal",
    })
  })
```

Add to `toYAML.test.ts`:

```ts
  it("exports DataCompositionComparisonType explicit value", () => {
    const value: MetadataFormChoiceListValue = {
      type: "formChoiceListDesTimeValue",
      presentation: { items: { ru: "Равно" } },
      value: {
        type: "DataCompositionComparisonType",
        value: "Equal",
      } as MetadataFormChoiceListValue["value"],
    }

    const result = exportFormChoiceListToYAML(mockContext, value)

    expect(result).toEqual({
      Представление: "Равно",
      Значение: {
        Тип: "ВидСравненияКомпоновкиДанных",
        Значение: "Равно",
      },
    })
  })
```

- [ ] **Step 2: Run failing tests**

Run:

```bash
pnpm --filter @nakidka/core test:isolated packages/core/metadata/commonObjects/metadataValue/formChoiceList/fromYAML.test.ts packages/core/metadata/commonObjects/metadataValue/formChoiceList/toYAML.test.ts
```

Expected: FAIL because `Значение` does not accept or produce an explicit `Тип`.

- [ ] **Step 3: Extend YAML types**

In `metadataValue/types.ts`, add:

```ts
export const MetadataExplicitDataCompositionComparisonTypeYAMLJSONSchema = Type.Object({
  Тип: Type.Literal("ВидСравненияКомпоновкиДанных"),
  Значение: Type.String(),
})
export type MetadataExplicitDataCompositionComparisonTypeYAML = Static<
  typeof MetadataExplicitDataCompositionComparisonTypeYAMLJSONSchema
>
```

Then include `MetadataExplicitDataCompositionComparisonTypeYAMLJSONSchema` in the `MetadataValueJSONSchema` union.

- [ ] **Step 4: Implement explicit import**

In `formChoiceList/fromYAML.ts`, add:

```ts
import { DataCompositionComparisonTypeFromYAML } from "~/metadata/systemEnumerations/types"
```

Add helper:

```ts
const importExplicitChoiceListValueFromYAML = (value: unknown): MetadataFormChoiceListValue["value"] | undefined => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined
  const data = value as Record<string, unknown>
  if (data.Тип !== "ВидСравненияКомпоновкиДанных" || typeof data.Значение !== "string") return undefined
  const enumValue = DataCompositionComparisonTypeFromYAML[data.Значение as keyof typeof DataCompositionComparisonTypeFromYAML]
  if (enumValue === undefined) return undefined
  return {
    type: "DataCompositionComparisonType",
    value: enumValue,
  } as MetadataFormChoiceListValue["value"]
}
```

Then build `value` like this:

```ts
  const value =
    data.Значение === undefined
      ? undefined
      : (importExplicitChoiceListValueFromYAML(data.Значение) ??
        importMetadataValueFromYAML(context, undefined, data.Значение))
```

- [ ] **Step 5: Implement explicit export**

In `formChoiceList/toYAML.ts`, add:

```ts
import { DataCompositionComparisonTypeToYAML } from "~/metadata/systemEnumerations/types"
```

Add helper:

```ts
const exportExplicitChoiceListValueToYAML = (
  value: MetadataFormChoiceListValue["value"]
): MetadataFormChoiceListValueYAML["Значение"] | undefined => {
  if (value?.type !== "DataCompositionComparisonType") return undefined
  return {
    Тип: "ВидСравненияКомпоновкиДанных",
    Значение: DataCompositionComparisonTypeToYAML[
      value.value as keyof typeof DataCompositionComparisonTypeToYAML
    ],
  }
}
```

Then compute:

```ts
  const valueResult =
    exportExplicitChoiceListValueToYAML(data.value) ??
    exportMetadataValueToYAML(context, undefined, data.value as MetadataTypedValue | undefined)
```

- [ ] **Step 6: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/core test:isolated packages/core/metadata/commonObjects/metadataValue/formChoiceList/fromYAML.test.ts packages/core/metadata/commonObjects/metadataValue/formChoiceList/toYAML.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/core/metadata/commonObjects/metadataValue
git commit -m "fix: :bug: сохранить тип значений FormChoiceList"
```

## Task 4: Empty xs:string In DCS SettingsParameterValue

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/types.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/fromYAML.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/toYAML.ts`
- Test: `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromYAML.test.ts`
- Test: `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toYAML.test.ts`
- Test: `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toXML.test.ts`

- [ ] **Step 1: Write failing YAML tests**

Add to `fromYAML.test.ts`:

```ts
  it("imports explicit empty string value in field context", () => {
    const result = testImportPropertyFromYAML({
      rule: { type: "SettingsParameterValue", valueType: "Field", yaml: "НоменклатураВключение" } as PropertyRule,
      value: {
        Использовать: "Ложь",
        Значение: {
          Тип: "Строка",
          Значение: "",
        },
      },
    })

    expect(result).toEqual({
      parameter: "НоменклатураВключение",
      use: false,
      value: { type: "string", value: "" },
    })
  })
```

Add to `toYAML.test.ts`:

```ts
  it("exports explicit empty string value in field context", () => {
    const result = testExportPropertyToYAML({
      rule: { type: "SettingsParameterValue", valueType: "Field", yaml: "НоменклатураВключение" } as PropertyRule,
      value: {
        parameter: "НоменклатураВключение",
        use: false,
        value: { type: "string", value: "" },
      },
    })

    expect(result).toEqual({
      НоменклатураВключение: {
        Использовать: "Ложь",
        Значение: {
          Тип: "Строка",
          Значение: "",
        },
      },
    })
  })
```

- [ ] **Step 2: Write failing XML test**

Add to `toXML.test.ts`:

```ts
  it("exports explicit empty xs:string instead of dcscor:Field", () => {
    const { result } = testExportPropertyToXML({
      rule: { type: "SettingsParameterValue", valueType: "Field" },
      value: {
        parameter: "НоменклатураВключение",
        use: false,
        value: { type: "string", value: "" },
      },
      xmlRootTag: "dcscor:item",
    })

    expect(result).toContain('<dcscor:value xsi:type="xs:string"/>')
    expect(result).not.toContain('xsi:type="dcscor:Field"')
  })
```

- [ ] **Step 3: Run failing tests**

Run:

```bash
pnpm --filter @nakidka/core test:isolated packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromYAML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toYAML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toXML.test.ts
```

Expected: FAIL because `Тип: Строка` is not accepted by DCS value YAML.

- [ ] **Step 4: Add explicit DCS primitive YAML type**

In `dcsMetadataValue/types.ts`, add to the YAML type area:

```ts
export type MetadataDcsPrimitiveStringValueYAML = {
  Тип: "Строка"
  Значение: string
}
```

Include `MetadataDcsPrimitiveStringValueYAML` in `MetadataDcsMetadataValueYAML`.

- [ ] **Step 5: Implement import**

In `dcsMetadataValue/fromYAML.ts`, add:

```ts
const isExplicitPrimitiveStringValueYAML = (
  data: unknown
): data is { Тип: "Строка"; Значение: string } =>
  typeof data === "object" &&
  data !== null &&
  !Array.isArray(data) &&
  (data as Record<string, unknown>).Тип === "Строка" &&
  typeof (data as Record<string, unknown>).Значение === "string"
```

At the top of `importDcsMetadataValueFromYAML`, after null handling and before `switch`, add:

```ts
  if (isExplicitPrimitiveStringValueYAML(data)) {
    return { type: "string", value: data.Значение }
  }
```

- [ ] **Step 6: Implement export**

In `dcsMetadataValue/toYAML.ts`, add:

```ts
const isPrimitiveStringValue = (
  data: MetadataDcsMetadataValue
): data is { type: "string"; value: string } =>
  data !== null &&
  typeof data === "object" &&
  !Array.isArray(data) &&
  (data as Record<string, unknown>).type === "string" &&
  typeof (data as Record<string, unknown>).value === "string"
```

Before `isExplicitTextValue(data)`, add:

```ts
  if (rule.valueType === "Field" && isPrimitiveStringValue(data)) {
    return {
      Тип: "Строка",
      Значение: data.value,
    } as MetadataDcsMetadataValueYAML
  }
```

- [ ] **Step 7: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/core test:isolated packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromYAML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toYAML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toXML.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue
git commit -m "fix: :bug: сохранить пустой xs:string в DCS"
```

## Task 5: Preserve Form Raw Files

**Files:**
- Create: `packages/core/metadata/forms/clientApplicationForm/externalRawFiles.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/convertFromXML.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/syncToXML.ts`
- Test: `packages/core/metadata/forms/clientApplicationForm/convertFromXML.test.ts`
- Test: `packages/core/metadata/forms/clientApplicationForm/syncToXML.test.ts`

- [ ] **Step 1: Write failing convert tests**

Add to `convertFromXML.test.ts`:

```ts
  it("copies managed form Form.bin even when Form.xml exists", async () => {
    const managedFormName = "УправляемаяСБинарнымТелом"
    const input = join(outputDir, "managed-bin-input")
    const formExtDir = join(input, managedFormName, "Ext")
    fs.mkdirSync(formExtDir, { recursive: true })
    fs.writeFileSync(join(input, `${managedFormName}.xml`), managedFormMetadataXML(managedFormName))
    fs.writeFileSync(join(formExtDir, "Form.xml"), `<Form xmlns="http://v8.1c.ru/8.3/xcf/form" version="2.20"/>`)
    fs.writeFileSync(join(formExtDir, "Form.bin"), Buffer.from([10, 20, 30]))

    await convertFormFromXML({
      context: mockContextFromXML(),
      inputDir: input,
      formName: managedFormName,
      outputDir,
    })

    expect([...fs.readFileSync(join(outputDir, "Формы", managedFormName, "Form.bin"))]).toEqual([10, 20, 30])
  })

  it("copies form help _files recursively", async () => {
    const tmpRoot = fs.mkdtempSync(join(os.tmpdir(), "nakidka-form-help-files-"))
    const tmpInputDir = join(tmpRoot, "xml")

    try {
      fs.cpSync(inputDir, tmpInputDir, { recursive: true })
      fs.mkdirSync(join(tmpInputDir, formName, "Ext", "Help", "_files", "nested"), { recursive: true })
      fs.writeFileSync(join(tmpInputDir, formName, "Ext", "Help", "_files", "001.png"), Buffer.from([1, 2]))
      fs.writeFileSync(join(tmpInputDir, formName, "Ext", "Help", "_files", "nested", "002.png"), Buffer.from([3, 4]))

      await convertFormFromXML({
        context: mockContextFromXML(),
        inputDir: tmpInputDir,
        formName,
        outputDir,
      })

      expect([...fs.readFileSync(join(outputDir, "Формы", formName, "Справка", "_files", "001.png"))]).toEqual([1, 2])
      expect([...fs.readFileSync(join(outputDir, "Формы", formName, "Справка", "_files", "nested", "002.png"))]).toEqual([3, 4])
    } finally {
      fs.rmSync(tmpRoot, { recursive: true, force: true })
    }
  })
```

Add this helper near the existing ordinary form metadata helper area if it does not already exist:

```ts
const managedFormMetadataXML = (formName: string): string => `<?xml version="1.0" encoding="UTF-8"?>
<MetaDataObject xmlns="http://v8.1c.ru/8.3/MDClasses" xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
  <Form uuid="aaaaaaaa-1111-2222-3333-bbbbbbbbbbbb">
    <Properties>
      <Name>${formName}</Name>
      <Synonym/>
      <Comment/>
      <FormType>Managed</FormType>
      <IncludeHelpInContents>false</IncludeHelpInContents>
    </Properties>
  </Form>
</MetaDataObject>`
```

- [ ] **Step 2: Write failing sync tests**

Add to `syncToXML.test.ts`:

```ts
  it("restores managed form Form.bin", async () => {
    const managedFormName = "УправляемаяСБинарнымТелом"
    const tmpRoot = fs.mkdtempSync(join(os.tmpdir(), "nakidka-managed-form-bin-"))
    const xmlInputDir = join(tmpRoot, "xml", "Forms")
    const yamlInputDir = join(tmpRoot, "yaml")
    const formExtDir = join(xmlInputDir, managedFormName, "Ext")

    try {
      fs.mkdirSync(formExtDir, { recursive: true })
      fs.writeFileSync(join(xmlInputDir, `${managedFormName}.xml`), managedFormMetadataXML(managedFormName))
      fs.writeFileSync(join(formExtDir, "Form.xml"), `<Form xmlns="http://v8.1c.ru/8.3/xcf/form" version="2.20"/>`)
      fs.writeFileSync(join(formExtDir, "Form.bin"), Buffer.from([10, 20, 30]))

      await convertFormFromXML({
        context: mockContextFromXML(),
        inputDir: xmlInputDir,
        formName: managedFormName,
        outputDir: yamlInputDir,
      })

      await syncFormToXML({
        context: mockContextToXML(),
        inputDir: yamlInputDir,
        outputDir,
        referenceDir: xmlInputDir,
        formName: managedFormName,
      })

      expect([...fs.readFileSync(join(outputDir, "Forms", managedFormName, "Ext", "Form.bin"))]).toEqual([10, 20, 30])
    } finally {
      fs.rmSync(tmpRoot, { recursive: true, force: true })
    }
  })

  it("restores form help _files recursively and records manifest entries", async () => {
    const tmpRoot = fs.mkdtempSync(join(os.tmpdir(), "nakidka-form-help-files-to-xml-"))
    const tmpInputDir = join(tmpRoot, "yaml")
    const tmpReferenceDir = join(tmpRoot, "reference-forms")
    const xmlManifest = new XmlSyncManifest(outputDir)

    try {
      fs.cpSync(inputDir, tmpInputDir, { recursive: true })
      fs.cpSync(referenceDir, tmpReferenceDir, { recursive: true })
      fs.mkdirSync(join(tmpInputDir, "Формы", formName, "Справка", "_files", "nested"), { recursive: true })
      fs.writeFileSync(join(tmpInputDir, "Формы", formName, "Справка", "_files", "001.png"), Buffer.from([1, 2]))
      fs.writeFileSync(join(tmpInputDir, "Формы", formName, "Справка", "_files", "nested", "002.png"), Buffer.from([3, 4]))

      await syncFormToXML({
        context: mockContextToXML(),
        inputDir: tmpInputDir,
        outputDir,
        referenceDir: tmpReferenceDir,
        formName,
        xmlManifest,
      })

      expect([...fs.readFileSync(join(outputDir, "Forms", formName, "Ext", "Help", "_files", "001.png"))]).toEqual([1, 2])
      expect([...fs.readFileSync(join(outputDir, "Forms", formName, "Ext", "Help", "_files", "nested", "002.png"))]).toEqual([3, 4])
      expect(xmlManifest.expectedFiles()).toContain(`Forms/${formName}/Ext/Help/_files/001.png`)
      expect(xmlManifest.expectedFiles()).toContain(`Forms/${formName}/Ext/Help/_files/nested/002.png`)
    } finally {
      fs.rmSync(tmpRoot, { recursive: true, force: true })
    }
  })
```

- [ ] **Step 3: Run failing tests**

Run:

```bash
pnpm --filter @nakidka/core test:isolated packages/core/metadata/forms/clientApplicationForm/convertFromXML.test.ts packages/core/metadata/forms/clientApplicationForm/syncToXML.test.ts
```

Expected: FAIL because managed `Form.bin` and form help files are not copied.

- [ ] **Step 4: Create raw copy helper**

Create `externalRawFiles.ts`:

```ts
import fs from "fs"
import { dirname, join, relative } from "path"

type Manifest = import("~/metadata/appliedObjects/configuration/migrations/xmlManifest").XmlSyncManifest

export const copyFileIfExists = async (params: {
  sourcePath: string
  targetPath: string
  xmlManifest?: Manifest
}): Promise<boolean> => {
  if (!fs.existsSync(params.sourcePath)) return false
  await fs.promises.mkdir(dirname(params.targetPath), { recursive: true })
  await fs.promises.copyFile(params.sourcePath, params.targetPath)
  params.xmlManifest?.addFile(params.targetPath)
  return true
}

export const copyDirectoryRecursiveIfExists = async (params: {
  sourceDir: string
  targetDir: string
  xmlManifest?: Manifest
}): Promise<void> => {
  if (!fs.existsSync(params.sourceDir)) return
  const entries = await fs.promises.readdir(params.sourceDir, { withFileTypes: true })
  for (const entry of entries) {
    const sourcePath = join(params.sourceDir, entry.name)
    const targetPath = join(params.targetDir, entry.name)
    if (entry.isDirectory()) {
      await copyDirectoryRecursiveIfExists({
        sourceDir: sourcePath,
        targetDir: targetPath,
        xmlManifest: params.xmlManifest,
      })
    } else if (entry.isFile()) {
      await fs.promises.mkdir(dirname(targetPath), { recursive: true })
      await fs.promises.copyFile(sourcePath, targetPath)
      params.xmlManifest?.addFile(targetPath)
    }
  }
}

export const copyDirectoryRelativeFiles = async (params: {
  sourceDir: string
  targetDir: string
  fromPrefix: string
  toPrefix: string
  xmlManifest?: Manifest
}): Promise<void> => {
  if (!fs.existsSync(params.sourceDir)) return
  const entries = await fs.promises.readdir(params.sourceDir, { withFileTypes: true })
  for (const entry of entries) {
    const sourcePath = join(params.sourceDir, entry.name)
    const sourceRelative = relative(params.fromPrefix, sourcePath)
    const targetPath = join(params.toPrefix, sourceRelative)
    if (entry.isDirectory()) {
      await copyDirectoryRelativeFiles({
        sourceDir: sourcePath,
        targetDir: params.targetDir,
        fromPrefix: params.fromPrefix,
        toPrefix: params.toPrefix,
        xmlManifest: params.xmlManifest,
      })
    } else if (entry.isFile()) {
      await fs.promises.mkdir(dirname(targetPath), { recursive: true })
      await fs.promises.copyFile(sourcePath, targetPath)
      params.xmlManifest?.addFile(targetPath)
    }
  }
}
```

- [ ] **Step 5: Use helper in XML -> YAML**

In `convertFromXML.ts`, import:

```ts
import { copyDirectoryRecursiveIfExists, copyFileIfExists } from "./externalRawFiles"
```

Change `readFormBodyFromXML` and sync variant to set `hasFormBin: fs.existsSync(formBinPath)` without checking `isOrdinaryForm`.

Add after `copyFormBinFromXML`:

```ts
  await copyDirectoryRecursiveIfExists({
    sourceDir: join(inputDir, formName, "Ext", "Help", "_files"),
    targetDir: join(outputDir, "Формы", formName, "Справка", "_files"),
  })
```

Change `copyFormBinFromXML` to use the helper:

```ts
const copyFormBinFromXML = async (params: { inputDir: string; formName: string; outputDir: string }): Promise<void> => {
  await copyFileIfExists({
    sourcePath: join(params.inputDir, params.formName, "Ext", "Form.bin"),
    targetPath: join(params.outputDir, "Формы", params.formName, "Form.bin"),
  })
}
```

- [ ] **Step 6: Use helper in YAML -> XML**

In `syncToXML.ts`, import:

```ts
import { copyDirectoryRecursiveIfExists, copyFileIfExists } from "./externalRawFiles"
```

Call after `writeFormToXML`:

```ts
  await copyDirectoryRecursiveIfExists({
    sourceDir: join(formDir, "Справка", "_files"),
    targetDir: join(outputDir, "Forms", formName, "Ext", "Help", "_files"),
    xmlManifest: params.xmlManifest,
  })
```

Change `if (isOrdinaryForm)` to unconditional:

```ts
  await copyFormBinToXML({ formDir, formName, outputDir, xmlManifest: params.xmlManifest })
```

Change `copyFormBinToXML` body to:

```ts
  await copyFileIfExists({
    sourcePath: join(params.formDir, "Form.bin"),
    targetPath: join(params.outputDir, "Forms", params.formName, "Ext", "Form.bin"),
    xmlManifest: params.xmlManifest,
  })
```

- [ ] **Step 7: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/core test:isolated packages/core/metadata/forms/clientApplicationForm/convertFromXML.test.ts packages/core/metadata/forms/clientApplicationForm/syncToXML.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add packages/core/metadata/forms/clientApplicationForm
git commit -m "fix: :bug: сохранить raw-файлы форм"
```

## Task 6: ERP AdditionalColumns Path-Specific Workaround

**Files:**
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/toXML.ts`
- Test: `packages/core/metadata/forms/commonObjects/formAttribute/toXML.test.ts`

- [ ] **Step 1: Write failing tests**

Create `toXML.test.ts` if it does not exist. Use this content:

```ts
import { describe, expect, it } from "vitest"
import { mockContextToXML } from "~/tests/mockContext"
import { exportFormAttributesToXML } from "./toXML"
import type { FormAttributes } from "./types"

const erpFormPath =
  "Catalogs/СпособыОтраженияРасходовПоАмортизацииМСФО/Forms/ФормаСписка/Ext/Form.xml"

describe("export FormAttribute additional columns to XML", () => {
  it("restores known ERP duplicate additional columns", () => {
    const context = mockContextToXML()
    context.exportToXML.context = {
      ...context.exportToXML.context,
      currentXMLPath: erpFormPath,
    } as typeof context.exportToXML.context & { currentXMLPath: string }

    const attributes: FormAttributes = [
      {
        itemType: "FormAttribute",
        name: "Список",
        columns: [],
        additionalColumns: [
          {
            table: "Список.Способы",
            columns: [
              {
                itemType: "FormAttributeColumn",
                name: "Реквизит1",
                type: { type: ["string"] },
              },
            ],
          },
        ],
      },
    ]

    const result = exportFormAttributesToXML(context, undefined, attributes)
    const columns = result?.Attribute[0]?.Columns?.AdditionalColumns?.[0]?.Column

    expect(columns).toHaveLength(5)
    expect(columns?.map((column) => column._name)).toEqual([
      "Реквизит1",
      "Реквизит1",
      "Реквизит1",
      "Реквизит1",
      "Реквизит1",
    ])
    expect(columns?.map((column) => column._id)).toEqual(["1", "2", "3", "4", "5"])
  })

  it("does not duplicate additional columns for other forms", () => {
    const context = mockContextToXML()
    context.exportToXML.context = {
      ...context.exportToXML.context,
      currentXMLPath: "Catalogs/Другой/Forms/ФормаСписка/Ext/Form.xml",
    } as typeof context.exportToXML.context & { currentXMLPath: string }

    const attributes: FormAttributes = [
      {
        itemType: "FormAttribute",
        name: "Список",
        columns: [],
        additionalColumns: [
          {
            table: "Список.Способы",
            columns: [
              {
                itemType: "FormAttributeColumn",
                name: "Реквизит1",
                type: { type: ["string"] },
              },
            ],
          },
        ],
      },
    ]

    const result = exportFormAttributesToXML(context, undefined, attributes)
    const columns = result?.Attribute[0]?.Columns?.AdditionalColumns?.[0]?.Column

    expect(columns).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Run failing test**

Run:

```bash
pnpm --filter @nakidka/core test:isolated packages/core/metadata/forms/commonObjects/formAttribute/toXML.test.ts
```

Expected: FAIL because no path-specific duplicate restoration exists and `currentXMLPath` may not yet be propagated.

- [ ] **Step 3: Implement path-specific helper**

In `toXML.ts`, add near `exportAdditionalColumnsToXML`:

```ts
const ERP_DUPLICATE_ADDITIONAL_COLUMNS_FORM =
  "Catalogs/СпособыОтраженияРасходовПоАмортизацииМСФО/Forms/ФормаСписка/Ext/Form.xml"

const shouldRestoreErpDuplicateAdditionalColumns = (
  context: ConfigurationContextWithExportToXML,
  additionalColumn: FormAttributeAdditionalColumns
): boolean => {
  const currentXMLPath = (context.exportToXML.context as { currentXMLPath?: string } | undefined)?.currentXMLPath
  return (
    currentXMLPath === ERP_DUPLICATE_ADDITIONAL_COLUMNS_FORM &&
    additionalColumn.table === "Список.Способы" &&
    additionalColumn.columns.length === 1 &&
    additionalColumn.columns[0]?.name === "Реквизит1"
  )
}

const restoreErpDuplicateAdditionalColumns = (
  column: FormAttributeColumnXML | undefined
): FormAttributeColumnXML[] | undefined => {
  if (column === undefined) return undefined
  return ["1", "2", "3", "4", "5"].map((id) => ({
    ...column,
    _id: id,
  }))
}
```

Inside `exportAdditionalColumnsToXML`, after `columns` is computed, add:

```ts
    const columnList =
      shouldRestoreErpDuplicateAdditionalColumns(context, additionalColumn)
        ? restoreErpDuplicateAdditionalColumns(columns?.Column?.[0])
        : columns?.Column

    return {
      _table: additionalColumn.table,
      ...(columnList ? { Column: columnList } : {}),
    }
```

Replace the existing return object in that map with the snippet above.

- [ ] **Step 4: Propagate current XML path**

Add an optional field to the export context type in `packages/core/metadata/context/types.ts`:

```ts
currentXMLPath?: string
```

In `packages/core/metadata/forms/clientApplicationForm/syncToXML.ts`, extend the params type:

```ts
  currentXMLPath?: string
```

Set the context in `createFormScopedContext` by accepting the path:

```ts
const contextWithFormDir = createFormScopedContext({
  context,
  formDir,
  currentXMLPath: params.currentXMLPath,
})
```

Change the helper signature:

```ts
const createFormScopedContext = (params: {
  context: ConfigurationContextWithExportToXML
  formDir: string
  currentXMLPath?: string
}): ConfigurationContextWithExportToXML => {
```

Inside the returned `context` object, add:

```ts
        ...(params.currentXMLPath !== undefined ? { currentXMLPath: params.currentXMLPath } : {}),
```

In `packages/core/metadata/commonObjects/childFormNames/syncExternalToXML.ts`, import `basename`:

```ts
import { basename, dirname, join } from "path"
```

Pass the exact relative XML path when syncing each child form:

```ts
    await syncFormToXML({
      context,
      inputDir: nkdkDir,
      formName,
      outputDir: formOutputDir,
      referenceDir: formReferenceDir,
      xmlManifest,
      currentXMLPath: join(basename(xmlDir), name, "Forms", formName, "Ext", "Form.xml"),
    })
```

- [ ] **Step 5: Run focused test**

Run:

```bash
pnpm --filter @nakidka/core test:isolated packages/core/metadata/forms/commonObjects/formAttribute/toXML.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/forms/commonObjects/formAttribute packages/core/metadata/context/types.ts packages/core/metadata/forms/clientApplicationForm/syncToXML.ts
git commit -m "fix: :bug: восстановить ERP AdditionalColumns"
```

## Task 7: Focused Regression Sweep

**Files:**
- No production edits expected.
- Use failures to return to the owning task, then commit the fix separately.

- [ ] **Step 1: Run all focused touched tests**

Run:

```bash
pnpm --filter @nakidka/core test:isolated packages/core/metadata/commonObjects/сhoiceParameterLinks/fromYAML.test.ts packages/core/metadata/commonObjects/сhoiceParameterLinks/toYAML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/structureItemGroup/items/groupItemField/fromYAML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/structureItemGroup/items/groupItemField/toYAML.test.ts packages/core/metadata/commonObjects/metadataValue/formChoiceList/fromYAML.test.ts packages/core/metadata/commonObjects/metadataValue/formChoiceList/toYAML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromYAML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toYAML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toXML.test.ts packages/core/metadata/forms/clientApplicationForm/convertFromXML.test.ts packages/core/metadata/forms/clientApplicationForm/syncToXML.test.ts packages/core/metadata/forms/commonObjects/formAttribute/toXML.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run core test suite**

Run:

```bash
pnpm --filter @nakidka/core test
```

Expected: PASS.

- [ ] **Step 3: Commit any regression-only fixes**

If Step 1 or Step 2 required additional fixes, commit them:

```bash
git add packages/core
git commit -m "fix: :bug: стабилизировать ERP YAML round-trip"
```

If there were no additional fixes, do not create an empty commit.

## Task 8: ERP Round-Trip Verification

**Files:**
- No code edits expected.
- XML repository `/Users/nikita/git/round-trip-source` will be modified by diagnostic round-trip output.

- [ ] **Step 1: Run ERP YAML round-trip triage**

Run from repo root:

```bash
env NKDK_XML_REPO=/Users/nikita/git/round-trip-source NKDK_XML_DIR=/Users/nikita/git/round-trip-source/erp ./.agents/skills/round-trip-yaml/round-trip.sh --triage --batch-size 200
```

Expected: `DIFF_COUNT 0` for ERP, or only new groups not covered by the spec.

- [ ] **Step 2: If ERP still has diffs, capture the next group**

Run:

```bash
env NKDK_XML_REPO=/Users/nikita/git/round-trip-source NKDK_XML_DIR=/Users/nikita/git/round-trip-source/erp ./.agents/skills/round-trip-yaml/round-trip.sh --triage --batch-size 5 --start-index 1
```

Expected: If there are diffs, output shows a small group that can be mapped to an existing task or escalated to the user.

- [ ] **Step 3: Run full project tests before closing**

In a fresh worktree, first try:

```bash
pnpm --filter nkdk-language langium:generate
```

Expected in this repo today: either generated Langium files or `No projects matched the filters`.

Then run:

```bash
pnpm test
```

Expected: PASS for all packages.

- [ ] **Step 4: Commit verification-only file changes**

When verification changes docs or test expectations, commit them:

```bash
git add docs packages/core
git commit -m "test: :white_check_mark: проверить ERP YAML round-trip"
```

When no files changed, leave the worktree clean and skip this step.

## Self-Review

- Spec coverage: Decision 1 is Task 1, Decision 2 is Task 2, Decision 3 is Task 3, Decision 4 and Decision 5 are Task 5, Decision 6 is Task 4, Decision 7 is Task 6, package and ERP verification are Tasks 7 and 8.
- Placeholder scan: code-changing steps include concrete snippets and no deferred implementation markers.
- Type consistency: `ChoiceParameterLinksYAML`, `GroupItemFieldYAML`, `MetadataFormChoiceListValueYAML`, and `MetadataDcsMetadataValueYAML` are extended before import/export snippets use the new shapes.
