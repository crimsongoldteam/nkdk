# Object YAML Ambiguous Form Values Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace ambiguous compact YAML for `FormChoiceListDesTimeValue` and `Font` with explicit object YAML that preserves XML round-trip semantics.

**Architecture:** Keep the change inside shared value serializers: `metadataValue/formChoiceList` owns choice-list value shape, and `commonObjects/font` owns font shape. Callers such as `ChoiceParameters` continue to use the shared `MetadataValue` and `Font` type rules without private conversion logic.

**Tech Stack:** TypeScript, Vitest, TypeBox JSON schemas, existing metadata orchestration type-rule registry, `round-trip-yaml`.

---

## File Structure

- Modify `packages/core/metadata/commonObjects/metadataValue/types.ts`
  - Remove compact string from the `MetadataFormChoiceListValueYAML` schema and keep object-only YAML for `FormChoiceListDesTimeValue`.
- Modify `packages/core/metadata/commonObjects/metadataValue/fromYAML.ts`
  - Remove string heuristics that create `formChoiceListDesTimeValue` from compact strings.
- Modify `packages/core/metadata/commonObjects/metadataValue/formChoiceList/__fixtures__/data.ts`
  - Update expected YAML fixtures from compact strings to object values.
- Modify `packages/core/metadata/commonObjects/metadataValue/formChoiceList/toYAML.ts`
  - Always export `FormChoiceListDesTimeValue` as an object.
- Modify `packages/core/metadata/commonObjects/metadataValue/formChoiceList/fromYAML.ts`
  - Import only object YAML for this type.
- Modify `packages/core/metadata/commonObjects/metadataValue/formChoiceList/toYAML.test.ts`
  - Update assertions for object export, including boolean values.
- Modify `packages/core/metadata/commonObjects/metadataValue/formChoiceList/fromYAML.test.ts`
  - Update assertions for object import.
- Modify `packages/core/metadata/commonObjects/сhoiceParameters/__fixtures__/data.ts`
  - Update form choice parameter YAML fixtures to object values.
- Modify `packages/core/metadata/commonObjects/сhoiceParameters/toYAML.test.ts`
  - Ensure `ChoiceParameters` exports wrapped form values through object YAML.
- Modify `packages/core/metadata/commonObjects/сhoiceParameters/fromYAML.test.ts`
  - Ensure `ChoiceParameters` imports wrapped form values from object YAML.
- Modify `packages/core/metadata/commonObjects/font/types.ts`
  - Add `ВидXML` to full YAML, remove compact string from JSON schema, and keep the TypeScript `FontYAML` object-only.
- Modify `packages/core/metadata/commonObjects/font/toYAML.ts`
  - Always export a full object and include `ВидXML` when `kind` cannot be reconstructed from `Вид`.
- Modify `packages/core/metadata/commonObjects/font/fromYAML.ts`
  - Restore `kind` from `Вид` or `ВидXML`; keep `Absolute` only for explicit absolute font objects.
- Modify `packages/core/tests/fixtures/font/data.ts`
  - Update existing font YAML fixtures to object format and add `AutoFont` plus `scale: 100` cases.
- Modify `packages/core/metadata/commonObjects/font/toYAML.test.ts`
  - Existing fixture-driven tests should cover the new object export.
- Modify `packages/core/metadata/commonObjects/font/fromYAML.test.ts`
  - Existing fixture-driven tests should cover the new object import.

Do not modify XML fixtures. Existing XML fixtures are the source of truth.

---

### Task 1: FormChoiceList Object YAML Tests

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataValue/formChoiceList/__fixtures__/data.ts`
- Modify: `packages/core/metadata/commonObjects/metadataValue/formChoiceList/toYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/metadataValue/formChoiceList/fromYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/сhoiceParameters/__fixtures__/data.ts`
- Modify: `packages/core/metadata/commonObjects/сhoiceParameters/toYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/сhoiceParameters/fromYAML.test.ts`

- [ ] **Step 1: Update form choice list YAML fixtures to object shape**

In `packages/core/metadata/commonObjects/metadataValue/formChoiceList/__fixtures__/data.ts`, replace `withStringValueYAML` with:

```ts
export const withStringValueYAML: MetadataFormChoiceListValueYAML = {
  Представление: "Физическое лицо",
  Значение: '"ФЛ"',
}
```

Add a YAML fixture for the existing `withoutPresentation` model:

```ts
export const withoutPresentationYAML: MetadataFormChoiceListValueYAML = {
  Представление: "",
  Значение: "Истина",
}
```

Add a YAML fixture for the existing `withNumericPresentation` model:

```ts
export const withNumericPresentationYAML: MetadataFormChoiceListValueYAML = {
  Представление: "2.0",
  Значение: "Ложь",
}
```

Keep `withMultiLangPresentationYAML` as object YAML:

```ts
export const withMultiLangPresentationYAML: MetadataFormChoiceListValueYAML = {
  Представление: { ru: "Физическое лицо", en: "Physical person" },
  Значение: '"ФЛ"',
}
```

- [ ] **Step 2: Update form choice list toYAML tests**

In `packages/core/metadata/commonObjects/metadataValue/formChoiceList/toYAML.test.ts`, import the new fixtures and use these tests:

```ts
import { describe, expect, it } from "vitest"
import { mockContext } from "~/tests/mockContext"
import {
  withMultiLangPresentation,
  withMultiLangPresentationYAML,
  withNumericPresentation,
  withNumericPresentationYAML,
  withStringValue,
  withStringValueYAML,
  withoutPresentation,
  withoutPresentationYAML,
} from "./__fixtures__/data"
import { exportFormChoiceListToYAML } from "./toYAML"

describe("exportFormChoiceListToYAML", () => {
  it("exports formChoiceList with string value to YAML object", () => {
    const result = exportFormChoiceListToYAML(mockContext, withStringValue)
    expect(result).toEqual(withStringValueYAML)
  })

  it("exports formChoiceList without presentation to YAML object with empty presentation", () => {
    const result = exportFormChoiceListToYAML(mockContext, withoutPresentation)
    expect(result).toEqual(withoutPresentationYAML)
  })

  it("exports formChoiceList with numeric presentation to YAML object", () => {
    const result = exportFormChoiceListToYAML(mockContext, withNumericPresentation)
    expect(result).toEqual(withNumericPresentationYAML)
  })

  it("exports formChoiceList with multilingual presentation to YAML object", () => {
    const result = exportFormChoiceListToYAML(mockContext, withMultiLangPresentation)
    expect(result).toEqual(withMultiLangPresentationYAML)
  })
})
```

- [ ] **Step 3: Update form choice list fromYAML tests**

In `packages/core/metadata/commonObjects/metadataValue/formChoiceList/fromYAML.test.ts`, import the new fixtures and use these tests:

```ts
import { describe, expect, it } from "vitest"
import { mockContext } from "~/tests/mockContext"
import {
  withMultiLangPresentation,
  withMultiLangPresentationYAML,
  withNumericPresentation,
  withNumericPresentationYAML,
  withStringValue,
  withStringValueYAML,
  withoutPresentation,
  withoutPresentationYAML,
} from "./__fixtures__/data"
import { importFormChoiceListFromYAML } from "./fromYAML"

describe("importFormChoiceListFromYAML", () => {
  it("imports formChoiceList with string value from YAML object", () => {
    const result = importFormChoiceListFromYAML(mockContext, withStringValueYAML)
    expect(result).toEqual(withStringValue)
  })

  it("imports formChoiceList without presentation from YAML object", () => {
    const result = importFormChoiceListFromYAML(mockContext, withoutPresentationYAML)
    expect(result).toEqual(withoutPresentation)
  })

  it("imports formChoiceList with numeric presentation from YAML object", () => {
    const result = importFormChoiceListFromYAML(mockContext, withNumericPresentationYAML)
    expect(result).toEqual(withNumericPresentation)
  })

  it("imports formChoiceList with multilingual presentation from YAML object", () => {
    const result = importFormChoiceListFromYAML(mockContext, withMultiLangPresentationYAML)
    expect(result).toEqual(withMultiLangPresentation)
  })
})
```

- [ ] **Step 4: Update ChoiceParameters form-value YAML fixtures**

In `packages/core/metadata/commonObjects/сhoiceParameters/__fixtures__/data.ts`, replace `formBooleanChoiceParametersYAML` with:

```ts
export const formBooleanChoiceParametersYAML: ChoiceParametersYAML = {
  БезПроизводныхЗначений: {
    Представление: "",
    Значение: "Истина",
  },
}
```

Replace `formEnumChoiceParametersYAML` with:

```ts
export const formEnumChoiceParametersYAML: ChoiceParametersYAML = {
  "Отбор.ТипСчета": {
    Представление: "",
    Значение: "Перечисление.ТипыСчетов.НераспределеннаяПрибыль",
  },
}
```

- [ ] **Step 5: Add ChoiceParameters form-value assertions**

In `packages/core/metadata/commonObjects/сhoiceParameters/toYAML.test.ts`, add the missing imports:

```ts
  formBooleanChoiceParameter,
  formBooleanChoiceParametersYAML,
  formEnumChoiceParameter,
  formEnumChoiceParametersYAML,
```

Add these tests before the nil-value test:

```ts
  it("exports choice parameters with form boolean value to yaml object", () => {
    const result = exportChoiceParametersToYAML(mockContext, mockRule, formBooleanChoiceParameter)

    expect(result).toEqual(formBooleanChoiceParametersYAML)
  })

  it("exports choice parameters with form enum value to yaml object", () => {
    const result = exportChoiceParametersToYAML(mockContext, mockRule, formEnumChoiceParameter)

    expect(result).toEqual(formEnumChoiceParametersYAML)
  })
```

In `packages/core/metadata/commonObjects/сhoiceParameters/fromYAML.test.ts`, add the same four imports and these tests before the nil-value test:

```ts
  it("imports choice parameters with form boolean value from yaml object", () => {
    const result = importChoiceParametersFromYAML(mockContext, mockRule, formBooleanChoiceParametersYAML)

    expect(result).toEqual(formBooleanChoiceParameter)
  })

  it("imports choice parameters with form enum value from yaml object", () => {
    const result = importChoiceParametersFromYAML(mockContext, mockRule, formEnumChoiceParametersYAML)

    expect(result).toEqual(formEnumChoiceParameter)
  })
```

- [ ] **Step 6: Run focused tests and verify they fail**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/metadataValue/formChoiceList/toYAML.test.ts metadata/commonObjects/metadataValue/formChoiceList/fromYAML.test.ts metadata/commonObjects/сhoiceParameters/toYAML.test.ts metadata/commonObjects/сhoiceParameters/fromYAML.test.ts --no-isolate
```

Expected: failures showing compact string export behavior still exists. At minimum, `exportFormChoiceListToYAML` should still return strings like `"ФЛ"(Физическое лицо)` or `Истина()`.

- [ ] **Step 7: Commit failing tests**

```bash
git add packages/core/metadata/commonObjects/metadataValue/formChoiceList/__fixtures__/data.ts packages/core/metadata/commonObjects/metadataValue/formChoiceList/toYAML.test.ts packages/core/metadata/commonObjects/metadataValue/formChoiceList/fromYAML.test.ts packages/core/metadata/commonObjects/сhoiceParameters/__fixtures__/data.ts packages/core/metadata/commonObjects/сhoiceParameters/toYAML.test.ts packages/core/metadata/commonObjects/сhoiceParameters/fromYAML.test.ts
git commit -m "test: :white_check_mark: зафиксировать объектный YAML выбора"
```

---

### Task 2: FormChoiceList Object YAML Implementation

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataValue/types.ts`
- Modify: `packages/core/metadata/commonObjects/metadataValue/fromYAML.ts`
- Modify: `packages/core/metadata/commonObjects/metadataValue/formChoiceList/toYAML.ts`
- Modify: `packages/core/metadata/commonObjects/metadataValue/formChoiceList/fromYAML.ts`

- [ ] **Step 1: Make FormChoiceList YAML schema object-only**

In `packages/core/metadata/commonObjects/metadataValue/types.ts`, replace the form choice list YAML schema block with:

```ts
export const MetadataFormChoiceListComplexValueJSONSchema = Type.Object({
  Представление: I8nTextJSONSchema,
  Значение: Type.Optional(MetadataValueJSONSchema),
})
export type MetadataFormChoiceListComplexValueYAML = Static<typeof MetadataFormChoiceListComplexValueJSONSchema>

export const MetadataFormChoiceListValueJSONSchema = MetadataFormChoiceListComplexValueJSONSchema
export type MetadataFormChoiceListValueYAML = MetadataFormChoiceListComplexValueYAML
```

Keep `MetadataValueJSONSchema` recursive union able to include the object form:

```ts
export const MetadataValueJSONSchema = Type.Recursive((ThisType) =>
  Type.Union([
    MetadataSingleValueJSONSchema,
    MetadataFixedArrayValueJSONSchema,
    Type.Object({
      Представление: I8nTextJSONSchema,
      Значение: Type.Optional(ThisType),
    }),
  ])
)
```

- [ ] **Step 2: Remove compact string FormChoiceList heuristic**

In `packages/core/metadata/commonObjects/metadataValue/fromYAML.ts`, remove the `MetadataStringValue` import if it becomes unused, and remove these two string parsing blocks from `heuristicFromYAML`:

```ts
  // FormChoiceList: "значение"(представление)
  const formChoiceListMatch = data.match(/^"([^"]+)"\(([^)]+)\)$/)
  if (formChoiceListMatch) {
    const [, value, presentation] = formChoiceListMatch
    return {
      type: "formChoiceListDesTimeValue",
      presentation: { items: { ru: presentation } },
      value: { type: "string", value } satisfies MetadataStringValue,
    }
  }

  // FormChoiceList с пустым значением: (представление)
  const emptyFormChoiceListMatch = data.match(/^\(([^)]+)\)$/)
  if (emptyFormChoiceListMatch) {
    const [, presentation] = emptyFormChoiceListMatch
    return {
      type: "formChoiceListDesTimeValue",
      presentation: { items: { ru: presentation } },
      value: undefined,
    }
  }
```

Keep object dispatch:

```ts
  if (typeof data === "object" && !Array.isArray(data) && "Представление" in data) {
    return importFormChoiceListFromYAML(context, data as MetadataFormChoiceListValueYAML)
  }
```

- [ ] **Step 3: Export FormChoiceList as object**

Replace `exportFormChoiceListToYAML` in `packages/core/metadata/commonObjects/metadataValue/formChoiceList/toYAML.ts` with:

```ts
export const exportFormChoiceListToYAML = (
  context: ConfigurationContext,
  data: MetadataFormChoiceListValue
): MetadataFormChoiceListValueYAML => {
  const valueResult = exportMetadataValueToYAML(context, undefined, data.value as MetadataTypedValue | undefined)
  const presentationItems = data.presentation?.items
  const hasMultipleLanguages = presentationItems && Object.keys(presentationItems).length > 1
  const presentation = hasMultipleLanguages
    ? presentationItems
    : presentationItems?.[context.defaultLanguage] || presentationItems?.ru || ""

  const result: MetadataFormChoiceListValueYAML = {
    Представление: presentation,
  }

  if (valueResult !== undefined) result.Значение = valueResult

  return result
}
```

- [ ] **Step 4: Import FormChoiceList only from object**

Replace `packages/core/metadata/commonObjects/metadataValue/formChoiceList/fromYAML.ts` with object-only logic and remove `formulaFormatParser` import:

```ts
import { ConfigurationContext } from "~/metadata/context/types"
import { I8nText } from "../../i8nText/types"
import { importI8nTextFromYAML } from "../../i8nText/fromYAML"
import { importMetadataValueFromYAML } from "../fromYAML"
import { MetadataFormChoiceListValue, MetadataFormChoiceListValueYAML } from "../types"

const importPresentationFromYAML = (
  context: ConfigurationContext,
  value: MetadataFormChoiceListValueYAML["Представление"]
): I8nText | undefined => {
  if (value === "") return undefined
  return importI8nTextFromYAML({ context, rule: { type: "I8nText" }, value })
}

export const importFormChoiceListFromYAML = (
  context: ConfigurationContext,
  data: MetadataFormChoiceListValueYAML
): MetadataFormChoiceListValue => {
  const value =
    data.Значение === undefined ? undefined : importMetadataValueFromYAML(context, undefined, data.Значение)

  return {
    type: "formChoiceListDesTimeValue",
    presentation: importPresentationFromYAML(context, data.Представление),
    value,
  }
}
```

- [ ] **Step 5: Run focused tests and verify they pass**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/metadataValue/formChoiceList/toYAML.test.ts metadata/commonObjects/metadataValue/formChoiceList/fromYAML.test.ts metadata/commonObjects/сhoiceParameters/toYAML.test.ts metadata/commonObjects/сhoiceParameters/fromYAML.test.ts --no-isolate
```

Expected: all tests pass.

- [ ] **Step 6: Commit implementation**

```bash
git add packages/core/metadata/commonObjects/metadataValue/types.ts packages/core/metadata/commonObjects/metadataValue/fromYAML.ts packages/core/metadata/commonObjects/metadataValue/formChoiceList/toYAML.ts packages/core/metadata/commonObjects/metadataValue/formChoiceList/fromYAML.ts
git commit -m "fix: :bug: сделать YAML выбора объектным"
```

---

### Task 3: Font Object YAML Tests

**Files:**
- Modify: `packages/core/tests/fixtures/font/data.ts`
- Modify: `packages/core/metadata/commonObjects/font/toYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/font/fromYAML.test.ts`

- [ ] **Step 1: Update minimal font fixture YAML values to objects**

In `packages/core/tests/fixtures/font/data.ts`, replace compact YAML constants with object values:

```ts
export const normalMinimalFontYAML: FontYAML = {
  ВидXML: "Absolute",
  Имя: "Academy Engraved LET",
}

export const emptyFaceNameMinimalFontYAML: FontYAML = {
  ВидXML: "Absolute",
  Имя: "",
}

export const systemMinimalFontYAML: FontYAML = {
  Вид: "ANSIШрифтМоноширинный",
}

export const styleMinimalFontYAML: FontYAML = {
  Вид: "ОченьКрупныйШрифтТекста",
}

export const unknownStyleMinimalFontYAML: FontYAML = {
  Вид: "style:TooltipTitleFont",
}
```

- [ ] **Step 2: Add explicit ВидXML for absolute full font fixtures**

In the same file, update absolute full YAML objects to include `ВидXML: "Absolute"`:

```ts
export const prefixedFaceNameFontYAML: FontYAML = {
  ВидXML: "Absolute",
  Имя: "style:TooltipTitleFont",
}
```

For `normalFullFontYAML`, add `ВидXML` at the top:

```ts
export const normalFullFontYAML: FontYAML = {
  ВидXML: "Absolute",
  Имя: "Times New Roman",
  Размер: 20,
  Масштаб: 200,
  Наклонный: "Истина",
  Подчеркивание: "Истина",
  Полужирный: "Истина",
  Зачеркивание: "Истина",
}
```

For `emptyFaceNameFullFontYAML`, add `ВидXML` at the top:

```ts
export const emptyFaceNameFullFontYAML: FontYAML = {
  ВидXML: "Absolute",
  Имя: "",
  Размер: 12,
  Масштаб: 100,
  Наклонный: "Ложь",
  Подчеркивание: "Ложь",
  Полужирный: "Ложь",
  Зачеркивание: "Ложь",
}
```

- [ ] **Step 3: Add Font fixtures for the triage cases**

Add these constants before `interface FontYAMLFixture` in `packages/core/tests/fixtures/font/data.ts`:

```ts
export const styleScale100Font: Font = {
  ref: "NormalTextFont",
  kind: "StyleItem",
  scale: 100,
}

export const styleScale100FontYAML: FontYAML = {
  Вид: "ОбычныйШрифтТекста",
  Масштаб: 100,
}

export const autoBoldFont: Font = {
  kind: "AutoFont",
  bold: true,
}

export const autoBoldFontYAML: FontYAML = {
  ВидXML: "AutoFont",
  Полужирный: "Истина",
}
```

Add these two cases to `fontYAMLFixtures`:

```ts
  {
    name: "style scale 100",
    xml: `<Font ref="style:NormalTextFont" kind="StyleItem" scale="100"/>`,
    font: styleScale100Font,
    yaml: styleScale100FontYAML,
    preview: { Type: "Font", Value: "StyleFonts.NormalTextFont", Scale: 100 },
  },
  {
    name: "auto bold",
    xml: `<Font bold="true" kind="AutoFont"/>`,
    font: autoBoldFont,
    yaml: autoBoldFontYAML,
    preview: { Type: "Font", Bold: true },
  },
```

- [ ] **Step 4: Run focused font tests and verify they fail**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/font/toYAML.test.ts metadata/commonObjects/font/fromYAML.test.ts --no-isolate
```

Expected: failures showing compact string export still exists and `ВидXML` is not recognized.

- [ ] **Step 5: Commit failing font tests**

```bash
git add packages/core/tests/fixtures/font/data.ts packages/core/metadata/commonObjects/font/toYAML.test.ts packages/core/metadata/commonObjects/font/fromYAML.test.ts
git commit -m "test: :white_check_mark: зафиксировать объектный YAML шрифтов"
```

---

### Task 4: Font Object YAML Implementation

**Files:**
- Modify: `packages/core/metadata/commonObjects/font/types.ts`
- Modify: `packages/core/metadata/commonObjects/font/toYAML.ts`
- Modify: `packages/core/metadata/commonObjects/font/fromYAML.ts`

- [ ] **Step 1: Add ВидXML to Font YAML types and schema**

In `packages/core/metadata/commonObjects/font/types.ts`, update `FontFullYAML`:

```ts
export interface FontFullYAML {
  Вид?: SE.StyleFontsYAML | SE.WindowsFontsYAML | RawPrefixedFontRef
  ВидXML?: SE.FontType
  Имя?: string
  Масштаб?: number
  Размер?: number
  Наклонный?: StringboolYAML
  Подчеркивание?: StringboolYAML
  Полужирный?: StringboolYAML
  Зачеркивание?: StringboolYAML
}
```

Remove `FontCompactYAML` if it is unused, and replace `FontJSONSchema` with object-only schema:

```ts
export const FontJSONSchema = Type.Object({
  Вид: Type.Optional(Type.String()),
  ВидXML: Type.Optional(Type.String()),
  Имя: Type.Optional(Type.String()),
  Масштаб: Type.Optional(Type.Number()),
  Размер: Type.Optional(Type.Number()),
  Наклонный: Type.Optional(BooleanJSONSchema),
  Подчеркивание: Type.Optional(BooleanJSONSchema),
  Полужирный: Type.Optional(BooleanJSONSchema),
  Зачеркивание: Type.Optional(BooleanJSONSchema),
})
```

`export type FontYAML = Static<typeof FontJSONSchema>` stays unchanged.

- [ ] **Step 2: Always export Font as object**

In `packages/core/metadata/commonObjects/font/toYAML.ts`, remove `hasFullFormat` and replace `exportFontToYAML` with:

```ts
export const exportFontToYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  font: Font | undefined
): FontYAML | undefined => {
  if (!font) return undefined

  const ref = convertRefToYAML(_context, font.ref, font.kind)
  const result: FontFullYAML = {}

  if (ref !== undefined) {
    result.Вид = ref
  } else {
    result.ВидXML = font.kind
  }

  if (font.faceName !== undefined) result.Имя = font.faceName
  if (font.height !== undefined) result.Размер = font.height
  if (font.scale !== undefined) result.Масштаб = font.scale

  const italicValue = exportBooleanToYAML(_context, undefined, font.italic)
  if (italicValue !== undefined) result.Наклонный = italicValue

  const underlineValue = exportBooleanToYAML(_context, undefined, font.underline)
  if (underlineValue !== undefined) result.Подчеркивание = underlineValue

  const boldValue = exportBooleanToYAML(_context, undefined, font.bold)
  if (boldValue !== undefined) result.Полужирный = boldValue

  const strikeoutValue = exportBooleanToYAML(_context, undefined, font.strikeout)
  if (strikeoutValue !== undefined) result.Зачеркивание = strikeoutValue

  return result
}
```

- [ ] **Step 3: Import Font from Вид or ВидXML**

In `packages/core/metadata/commonObjects/font/fromYAML.ts`, remove the string compact-format branch and update object import:

```ts
export const importFontFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  yaml: FontYAML | undefined
): Font | undefined => {
  if (yaml === undefined) return undefined

  const fullData = yaml as FontFullYAML
  const result: Partial<Font> = {}

  if (fullData.Вид !== undefined) {
    const importedRef = importRefFromYAML(context, fullData.Вид)
    if (importedRef) {
      result.ref = importedRef.ref
      result.kind = importedRef.kind
    }
  }

  if (result.kind === undefined) {
    result.kind = fullData.ВидXML ?? "Absolute"
  }

  if (fullData.Имя !== undefined) result.faceName = fullData.Имя
  if (fullData.Размер !== undefined) result.height = fullData.Размер
  if (fullData.Полужирный !== undefined) result.bold = importBooleanFromYAML(context, undefined, fullData.Полужирный)
  if (fullData.Наклонный !== undefined) result.italic = importBooleanFromYAML(context, undefined, fullData.Наклонный)
  if (fullData.Подчеркивание !== undefined)
    result.underline = importBooleanFromYAML(context, undefined, fullData.Подчеркивание)
  if (fullData.Зачеркивание !== undefined)
    result.strikeout = importBooleanFromYAML(context, undefined, fullData.Зачеркивание)
  if (fullData.Масштаб !== undefined) result.scale = fullData.Масштаб

  return result as Font
}
```

- [ ] **Step 4: Run focused font tests and verify they pass**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/font/toYAML.test.ts metadata/commonObjects/font/fromYAML.test.ts --no-isolate
```

Expected: all font YAML tests pass.

- [ ] **Step 5: Commit font implementation**

```bash
git add packages/core/metadata/commonObjects/font/types.ts packages/core/metadata/commonObjects/font/toYAML.ts packages/core/metadata/commonObjects/font/fromYAML.ts
git commit -m "fix: :bug: сделать YAML шрифтов объектным"
```

---

### Task 5: Integration Verification

**Files:**
- No planned source edits.
- May modify YAML fixtures only if focused tests reveal expected object YAML snapshots in existing TypeScript fixture files.

- [ ] **Step 1: Run combined focused tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/metadataValue/formChoiceList/toYAML.test.ts metadata/commonObjects/metadataValue/formChoiceList/fromYAML.test.ts metadata/commonObjects/сhoiceParameters/toYAML.test.ts metadata/commonObjects/сhoiceParameters/fromYAML.test.ts metadata/commonObjects/font/toYAML.test.ts metadata/commonObjects/font/fromYAML.test.ts --no-isolate
```

Expected: all listed test files pass.

- [ ] **Step 2: Run broader YAML-related tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/metadataValue/toYAML.test.ts metadata/commonObjects/metadataValue/fromYAML.test.ts metadata/commonObjects/font/toXML.test.ts metadata/commonObjects/font/fromXML.test.ts metadata/commonObjects/сhoiceParameters/toXML.test.ts metadata/commonObjects/сhoiceParameters/fromXML.test.ts --no-isolate
```

Expected: all listed test files pass. If a failure is only an expected YAML object update in a TypeScript fixture, update that fixture and rerun this command before continuing.

- [ ] **Step 3: Run round-trip-yaml triage**

Run from repo root:

```bash
./.agents/skills/round-trip-yaml/round-trip.sh --triage --batch-size 5
```

Expected:

- XML -> YAML finishes with successful count and 0 errors.
- YAML -> XML finishes with successful count and 0 errors.
- The first 5 diff fragments no longer show `FormChoiceListDesTimeValue` becoming `xs:string` with `Истина()` or `Ложь()`.
- The first 5 diff fragments no longer show `Font ref="style:NormalTextFont" kind="StyleItem" scale="100"` losing `scale`.
- The first 5 diff fragments no longer show `Font bold="true" kind="AutoFont"` becoming `kind="Absolute"`.

- [ ] **Step 4: Run full test suite**

Run from repo root:

```bash
pnpm test
```

Expected: all package tests pass. This is required before closing the issue.

- [ ] **Step 5: Commit any verification fixture updates**

If Step 2 required TypeScript fixture updates, commit them:

```bash
git add packages/core
git commit -m "test: :white_check_mark: обновить YAML фикстуры форм"
```

If no files changed after verification, do not create an empty commit.

- [ ] **Step 6: Record final round-trip status in the handoff**

In the final implementation response, include:

- focused Vitest command and pass result;
- `round-trip-yaml --triage --batch-size 5` result summary;
- `pnpm test` result summary;
- any remaining first diff class if round-trip still has unrelated diffs.
