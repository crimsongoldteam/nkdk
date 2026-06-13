# FormattedI8nText Value-Based YAML Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Перевести `FormattedI8nText` на единый YAML-ключ с объектным значением `{ Текст, Форматированный? }` и убрать старый `yamlFormatted`.

**Architecture:** Изменение живёт в общем типе `FormattedI8nText`: YAML-представление становится отдельным от `I8nText`, а import/export/schema получают один общий контракт. Правила форм больше не знают про отдельный ключ `ФорматированныйЗаголовок`; они используют только `yaml: "Заголовок"`.

**Tech Stack:** TypeScript, TypeBox, Vitest, pnpm, существующая metadata orchestration.

---

## File Structure

- `packages/core/metadata/commonObjects/formattedI8nText/types.ts` — определить новый `FormattedI8nTextYAML`, JSON Schema и убрать `yamlFormatted` из правила.
- `packages/core/metadata/commonObjects/formattedI8nText/__fixtures__/data.ts` — обновить YAML-ожидания фикстур под `{ Текст, Форматированный? }`.
- `packages/core/metadata/commonObjects/formattedI8nText/toYAML.test.ts` — зафиксировать новый экспорт и отсутствие старого ключа.
- `packages/core/metadata/commonObjects/formattedI8nText/fromYAML.test.ts` — зафиксировать новый импорт и отсутствие совместимости со старым ключом.
- `packages/core/metadata/commonObjects/formattedI8nText/toJSONSchema.test.ts` — добавить focused schema-проверки.
- `packages/core/metadata/commonObjects/formattedI8nText/toYAML.ts` — всегда экспортировать базовый `rule.yaml` с объектным значением.
- `packages/core/metadata/commonObjects/formattedI8nText/fromYAML.ts` — читать только объектное значение из `rule.yaml`.
- `packages/core/metadata/commonObjects/formattedI8nText/toJSONSchema.ts` — вернуть новую `FormattedI8nTextJSONSchema`.
- `packages/core/metadata/forms/elements/extendedTooltip/rules.ts` — удалить `yamlFormatted`.
- `packages/core/metadata/forms/elements/labelDecoration/rules.ts` — удалить `yamlFormatted`.
- `packages/core/metadata/forms/elements/pictureDecoration/rules.ts` — удалить `yamlFormatted`.
- `packages/core/metadata/forms/elements/labelDecoration/types.ts` — убрать ручное добавление `ФорматированныйЗаголовок`.
- `packages/core/metadata/forms/elements/pictureDecoration/types.ts` — убрать ручное добавление `ФорматированныйЗаголовок`.
- `packages/core/metadata/forms/elements/*/__fixtures__/data.ts` — обновить YAML-фикстуры, где есть `ФорматированныйЗаголовок`.
- `packages/core/metadata/validation/schemaRegistry.test.ts` — добавить проверку, что form schema не принимает старый ключ.

---

### Task 1: Add New YAML Type And Schema Tests

**Files:**
- Modify: `packages/core/metadata/commonObjects/formattedI8nText/types.ts`
- Create: `packages/core/metadata/commonObjects/formattedI8nText/toJSONSchema.test.ts`
- Test: `packages/core/metadata/commonObjects/formattedI8nText/toJSONSchema.test.ts`

- [ ] **Step 1: Replace the YAML type and property rule shape**

In `packages/core/metadata/commonObjects/formattedI8nText/types.ts`, replace the current imports and YAML/schema declarations with:

```ts
import { Static, Type } from "@sinclair/typebox"
import { BasePropertyRule } from "~/metadata/orchestration/property/types"
import { StringboolXML } from "../boolean/types"
import { I8nText, I8nTextJSONSchema, I8nTextXML } from "../i8nText/types"

export interface FormattedI8nText extends I8nText {
  formatted: boolean
  items: Record<string, string>
}

export const FormattedI8nTextJSONSchema = Type.Object(
  {
    Форматированный: Type.Optional(Type.Literal("Истина")),
    Текст: I8nTextJSONSchema,
  },
  { additionalProperties: false }
)

export type FormattedI8nTextYAML = Static<typeof FormattedI8nTextJSONSchema>

export interface FormattedI8nTextXML extends I8nTextXML {
  _formatted?: StringboolXML
}

export interface FormattedI8nTextPropertyRule extends BasePropertyRule {
  type: "FormattedI8nText"
  xmlWithDefaultLanguage?: true
}
```

- [ ] **Step 2: Add focused JSON Schema tests**

Create `packages/core/metadata/commonObjects/formattedI8nText/toJSONSchema.test.ts`:

```ts
import { TypeCompiler } from "@sinclair/typebox/compiler"
import { describe, expect, it } from "vitest"
import { FormattedI8nTextJSONSchema } from "./types"

describe("FormattedI8nTextJSONSchema", () => {
  const compiled = TypeCompiler.Compile(FormattedI8nTextJSONSchema)

  it("accepts plain default-language text", () => {
    expect(compiled.Check({ Текст: "Заголовок" })).toBe(true)
  })

  it("accepts plain multilingual text", () => {
    expect(compiled.Check({ Текст: { ru: "Заголовок", en: "Title" } })).toBe(true)
  })

  it("accepts formatted text with explicit Истина marker", () => {
    expect(compiled.Check({ Форматированный: "Истина", Текст: "<b>Заголовок</>" })).toBe(true)
  })

  it("rejects explicit formatted false marker", () => {
    expect(compiled.Check({ Форматированный: "Ложь", Текст: "Заголовок" })).toBe(false)
  })

  it("rejects empty object without text", () => {
    expect(compiled.Check({})).toBe(false)
  })

  it("rejects legacy formatted key shape", () => {
    expect(compiled.Check({ ФорматированныйЗаголовок: "<b>Заголовок</>" })).toBe(false)
  })

  it("rejects additional properties", () => {
    expect(compiled.Check({ Текст: "Заголовок", Лишнее: "значение" })).toBe(false)
  })
})
```

- [ ] **Step 3: Run the schema test and verify the baseline failure**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate packages/core/metadata/commonObjects/formattedI8nText/toJSONSchema.test.ts
```

Expected: PASS after Step 1 because the schema is implemented together with the test. If TypeScript reports an unused import, remove that import and rerun the same command.

- [ ] **Step 4: Commit**

```bash
git add packages/core/metadata/commonObjects/formattedI8nText/types.ts packages/core/metadata/commonObjects/formattedI8nText/toJSONSchema.test.ts
git commit -m "feat: :sparkles: описать YAML-схему FormattedI8nText"
```

---

### Task 2: Update FormattedI8nText Export To YAML

**Files:**
- Modify: `packages/core/metadata/commonObjects/formattedI8nText/__fixtures__/data.ts`
- Modify: `packages/core/metadata/commonObjects/formattedI8nText/toYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/formattedI8nText/toYAML.ts`
- Test: `packages/core/metadata/commonObjects/formattedI8nText/toYAML.test.ts`

- [ ] **Step 1: Update fixture interface fields**

In `packages/core/metadata/commonObjects/formattedI8nText/__fixtures__/data.ts`, change the fixture interface to remove the old split between plain and formatted YAML:

```ts
export interface FormattedI8nTextFixture {
  name: string
  text: FormattedI8nText | undefined
  textFromStructure?: I8nText | undefined
  textYAML?: FormattedI8nTextYAML | undefined
  defaultLanguageYAML?: string | undefined
  otherLanguagesTextYAML?: FormattedI8nTextYAML | undefined
  xml?: string
}
```

- [ ] **Step 2: Update fixture YAML values**

In the same file, update each fixture:

```ts
{
  name: "undefined",
  text: undefined,
  textYAML: undefined,
  defaultLanguageYAML: undefined,
  otherLanguagesTextYAML: undefined,
},
{
  name: "only default language with formatted false",
  text: { formatted: false, items: { ru: "Поле" } },
  textFromStructure: { items: { ru: "Поле" } },
  textYAML: { Текст: "Поле" },
  defaultLanguageYAML: "Поле",
  otherLanguagesTextYAML: undefined,
  xml: `<Title formatted="false">
	<v8:item>
		<v8:lang>ru</v8:lang>
		<v8:content>Поле</v8:content>
	</v8:item>
</Title>`,
},
{
  name: "only default language with formatted true",
  text: { formatted: true, items: { ru: "Поле" } },
  textFromStructure: { items: { ru: "Поле" } },
  textYAML: { Форматированный: "Истина", Текст: "Поле" },
  defaultLanguageYAML: "Поле",
  otherLanguagesTextYAML: undefined,
  xml: `<Title formatted="true">
	<v8:item>
		<v8:lang>ru</v8:lang>
		<v8:content>Поле</v8:content>
	</v8:item>
</Title>`,
},
{
  name: "only other languages (single language) with formatted false",
  text: { formatted: false, items: { en: "Field" } },
  textYAML: { Текст: { en: "Field" } },
  defaultLanguageYAML: undefined,
  otherLanguagesTextYAML: { Текст: { en: "Field" } },
  xml: `<Title formatted="false">
	<v8:item>
		<v8:lang>en</v8:lang>
		<v8:content>Field</v8:content>
	</v8:item>
</Title>`,
},
{
  name: "only other languages (single language) with formatted true",
  text: { formatted: true, items: { en: "Field" } },
  textYAML: { Форматированный: "Истина", Текст: { en: "Field" } },
  defaultLanguageYAML: undefined,
  otherLanguagesTextYAML: { Форматированный: "Истина", Текст: { en: "Field" } },
  xml: `<Title formatted="true">
	<v8:item>
		<v8:lang>en</v8:lang>
		<v8:content>Field</v8:content>
	</v8:item>
</Title>`,
},
{
  name: "only other languages (multiple languages) with formatted false",
  text: { formatted: false, items: { en: "Field" } },
  textYAML: { Текст: { en: "Field" } },
  defaultLanguageYAML: undefined,
  otherLanguagesTextYAML: { Текст: { en: "Field" } },
  xml: `<Title formatted="false">
	<v8:item>
		<v8:lang>en</v8:lang>
		<v8:content>Field</v8:content>
	</v8:item>
</Title>`,
},
{
  name: "only other languages (multiple languages) with formatted true",
  text: { formatted: true, items: { en: "Field" } },
  textYAML: { Форматированный: "Истина", Текст: { en: "Field" } },
  defaultLanguageYAML: undefined,
  otherLanguagesTextYAML: { Форматированный: "Истина", Текст: { en: "Field" } },
  xml: `<Title formatted="true">
	<v8:item>
		<v8:lang>en</v8:lang>
		<v8:content>Field</v8:content>
	</v8:item>
</Title>`,
},
{
  name: "both default and other languages with formatted false",
  text: { formatted: false, items: { ru: "Поле", en: "Field" } },
  textFromStructure: { items: { ru: "Поле" } },
  textYAML: { Текст: { ru: "Поле", en: "Field" } },
  defaultLanguageYAML: "Поле",
  otherLanguagesTextYAML: { Текст: { en: "Field" } },
  xml: `<Title formatted="false">
	<v8:item>
		<v8:lang>ru</v8:lang>
		<v8:content>Поле</v8:content>
	</v8:item>
	<v8:item>
		<v8:lang>en</v8:lang>
		<v8:content>Field</v8:content>
	</v8:item>
</Title>`,
},
{
  name: "both default and other languages with formatted true",
  text: { formatted: true, items: { ru: "Поле", en: "Field" } },
  textFromStructure: { items: { ru: "Поле" } },
  textYAML: { Форматированный: "Истина", Текст: { ru: "Поле", en: "Field" } },
  defaultLanguageYAML: "Поле",
  otherLanguagesTextYAML: { Форматированный: "Истина", Текст: { en: "Field" } },
  xml: `<Title formatted="true">
	<v8:item>
		<v8:lang>ru</v8:lang>
		<v8:content>Поле</v8:content>
	</v8:item>
	<v8:item>
		<v8:lang>en</v8:lang>
		<v8:content>Field</v8:content>
	</v8:item>
</Title>`,
},
{
  name: "with escaped content and formatted false",
  text: { formatted: false, items: { ru: "<Текст с экранированным символом>" } },
  textFromStructure: { items: { ru: "<Текст с экранированным символом>" } },
  textYAML: { Текст: "<Текст с экранированным символом>" },
  defaultLanguageYAML: "<Текст с экранированным символом>",
  otherLanguagesTextYAML: undefined,
  xml: `<Title formatted="false">
	<v8:item>
		<v8:lang>ru</v8:lang>
		<v8:content>&lt;Текст с экранированным символом&gt;</v8:content>
	</v8:item>
</Title>`,
},
{
  name: "with escaped content and formatted true",
  text: { formatted: true, items: { ru: 'Тест экранирования: & < > " \' ]]>' } },
  textFromStructure: { items: { ru: 'Тест экранирования: & < > " \' ]]>' } },
  textYAML: { Форматированный: "Истина", Текст: 'Тест экранирования: & < > " \' ]]>' },
  defaultLanguageYAML: 'Тест экранирования: & < > " \' ]]>',
  otherLanguagesTextYAML: undefined,
  xml: `<Title formatted="true">
	<v8:item>
		<v8:lang>ru</v8:lang>
		<v8:content>Тест экранирования: &amp; &lt; &gt; " ' ]]&gt;</v8:content>
	</v8:item>
</Title>`,
},
```

- [ ] **Step 3: Update export tests**

Replace `packages/core/metadata/commonObjects/formattedI8nText/toYAML.test.ts` with:

```ts
import { describe, expect, it } from "vitest"
import { formattedI8nTextFixtures } from "~/metadata/commonObjects/formattedI8nText/__fixtures__/data"
import { mockContextToYAML, mockRule } from "~/tests/mockContext"
import { exportFormattedI8nTextDefaultToYAML, exportFormattedI8nTextToYAML } from "./toYAML"
import { FormattedI8nTextPropertyRule } from "./types"

const formattedI8nTextRule: FormattedI8nTextPropertyRule = {
  type: "FormattedI8nText",
  yaml: "Title",
}

describe("exportFormattedI8nTextToYAML", () => {
  formattedI8nTextFixtures.forEach((fixture) => {
    it(`exports value-based YAML: ${fixture.name}`, () => {
      const result = exportFormattedI8nTextToYAML({
        context: mockContextToYAML,
        rule: formattedI8nTextRule,
        value: fixture.text,
      })

      const expected = fixture.textYAML ? { Title: fixture.textYAML } : {}
      expect(result).toEqual(expected)
      expect(result).not.toHaveProperty("FormattedTitle")
    })
  })

  describe("exportFormattedI8nTextDefaultToYAML", () => {
    formattedI8nTextFixtures.forEach((fixture) => {
      it(`exports default language: ${fixture.name}`, () => {
        const result = exportFormattedI8nTextDefaultToYAML(mockContextToYAML, mockRule, fixture.text)

        expect(result).toEqual(fixture.defaultLanguageYAML)
      })
    })
  })
})
```

- [ ] **Step 4: Run export test and verify it fails**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate packages/core/metadata/commonObjects/formattedI8nText/toYAML.test.ts
```

Expected: FAIL because `toYAML.ts` still exports formatted values under `FormattedTitle` / `yamlFormatted`.

- [ ] **Step 5: Implement value-based YAML export**

Replace `packages/core/metadata/commonObjects/formattedI8nText/toYAML.ts` with:

```ts
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import { exportI8nTextDefaultToYAML, exportI8nTextToYAML } from "../i8nText/toYAML"
import { FormattedI8nText, FormattedI8nTextPropertyRule, FormattedI8nTextYAML } from "./types"

export const exportFormattedI8nTextToYAML = <R extends FormattedI8nTextPropertyRule>(params: {
  context: ConfigurationContext
  rule: PropertyRule
  value: FormattedI8nText | undefined
  name?: string
}): { [K in NonNullable<R["yaml"]>]?: FormattedI8nTextYAML } => {
  const { context, rule, value: text, name } = params
  if (!text) return {}

  const formattedRule = rule as FormattedI8nTextPropertyRule
  if (!formattedRule.yaml) throw Error(`Rule must have yaml property`)

  const exportedText = exportI8nTextToYAML({ context, rule: formattedRule, value: text, name })
  if (exportedText === undefined) return {}

  return {
    [formattedRule.yaml]: {
      ...(text.formatted ? { Форматированный: "Истина" as const } : {}),
      Текст: exportedText,
    },
  } as { [K in NonNullable<R["yaml"]>]?: FormattedI8nTextYAML }
}

export const exportFormattedI8nTextDefaultToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule,
  title: FormattedI8nText | undefined
): string | undefined => {
  return exportI8nTextDefaultToYAML(context, title)
}

registerTypeRule("FormattedI8nText", "exportToYAML", exportFormattedI8nTextToYAML as any)
```

- [ ] **Step 6: Run export and schema tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate packages/core/metadata/commonObjects/formattedI8nText/toYAML.test.ts packages/core/metadata/commonObjects/formattedI8nText/toJSONSchema.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/core/metadata/commonObjects/formattedI8nText/__fixtures__/data.ts packages/core/metadata/commonObjects/formattedI8nText/toYAML.test.ts packages/core/metadata/commonObjects/formattedI8nText/toYAML.ts
git commit -m "feat: :sparkles: выгружать FormattedI8nText value-based YAML"
```

---

### Task 3: Update FormattedI8nText Import From YAML

**Files:**
- Modify: `packages/core/metadata/commonObjects/formattedI8nText/fromYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/formattedI8nText/fromYAML.ts`
- Test: `packages/core/metadata/commonObjects/formattedI8nText/fromYAML.test.ts`

- [ ] **Step 1: Update import tests**

Replace `packages/core/metadata/commonObjects/formattedI8nText/fromYAML.test.ts` with:

```ts
import { describe, expect, it } from "vitest"
import { formattedI8nTextFixtures } from "~/metadata/commonObjects/formattedI8nText/__fixtures__/data"
import { mockContext } from "~/tests/mockContext"
import { importFormattedI8nTextFromYAML } from "./fromYAML"
import { FormattedI8nTextPropertyRule } from "./types"

const formattedI8nTextRule: FormattedI8nTextPropertyRule = {
  type: "FormattedI8nText",
  yaml: "Title",
}

describe("importFormattedI8nTextFromYAML", () => {
  it.each(formattedI8nTextFixtures)("imports value-based YAML: %s", (fixture) => {
    const result = importFormattedI8nTextFromYAML({
      context: mockContext,
      rule: formattedI8nTextRule,
      value: fixture.textYAML,
    })
    expect(result).toEqual(fixture.text)
  })

  it.each(formattedI8nTextFixtures)("imports value-based YAML with source: %s", (fixture) => {
    const result = importFormattedI8nTextFromYAML({
      context: mockContext,
      rule: formattedI8nTextRule,
      value: fixture.otherLanguagesTextYAML,
      source: fixture.textFromStructure,
    })
    expect(result).toEqual(fixture.text)
  })

  it("does not read legacy formatted key from sibling YAML object", () => {
    const result = importFormattedI8nTextFromYAML({
      context: mockContext,
      rule: formattedI8nTextRule,
      value: undefined,
      yaml: { FormattedTitle: "<b>Title</>" },
    })

    expect(result).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run import test and verify it fails**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate packages/core/metadata/commonObjects/formattedI8nText/fromYAML.test.ts
```

Expected: FAIL because `fromYAML.ts` still tries to read `rule.yamlFormatted`.

- [ ] **Step 3: Implement value-based YAML import**

Replace `packages/core/metadata/commonObjects/formattedI8nText/fromYAML.ts` with:

```ts
import { ConfigurationContext } from "~/metadata/context/types"
import { ImportFromYAMLFunctionNew, PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import { importI8nTextFromYAML } from "../i8nText/fromYAML"
import { I8nText } from "../i8nText/types"
import { FormattedI8nText, FormattedI8nTextYAML } from "./types"

export const importFormattedI8nTextFromYAML: ImportFromYAMLFunctionNew = (params: {
  context: ConfigurationContext
  rule: PropertyRule
  value: FormattedI8nTextYAML | undefined
  yaml?: Record<string, any> | undefined
  source?: I8nText | undefined
}): FormattedI8nText | undefined => {
  const { context, rule, value, source } = params
  if (source === undefined && value === undefined) return undefined

  const result: FormattedI8nText = {
    items: {},
    formatted: false,
  }

  if (source !== undefined) {
    result.items = { ...result.items, ...source.items }
    const formattedSource = source as FormattedI8nText
    if (formattedSource.formatted !== undefined) {
      result.formatted = formattedSource.formatted
    }
  }

  if (value !== undefined) {
    const imported = importValueBasedFormattedI8nTextFromYAML(context, rule, value)!
    result.items = { ...result.items, ...imported.items }
    result.formatted = imported.formatted
  }

  if (Object.keys(result.items).length === 0) return undefined

  return result
}

const importValueBasedFormattedI8nTextFromYAML = (
  context: ConfigurationContext,
  rule: PropertyRule,
  value: FormattedI8nTextYAML | undefined
): FormattedI8nText | undefined => {
  if (value === undefined) return undefined

  const textResult = importI8nTextFromYAML({ context, rule, value: value.Текст })!

  return {
    formatted: value.Форматированный === "Истина",
    items: textResult.items,
  }
}

registerTypeRule("FormattedI8nText", "importFromYAML", importFormattedI8nTextFromYAML)
```

- [ ] **Step 4: Run import/export/schema tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate packages/core/metadata/commonObjects/formattedI8nText/fromYAML.test.ts packages/core/metadata/commonObjects/formattedI8nText/toYAML.test.ts packages/core/metadata/commonObjects/formattedI8nText/toJSONSchema.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/commonObjects/formattedI8nText/fromYAML.test.ts packages/core/metadata/commonObjects/formattedI8nText/fromYAML.ts
git commit -m "feat: :sparkles: читать FormattedI8nText value-based YAML"
```

---

### Task 4: Remove yamlFormatted From Form Rules And YAML Types

**Files:**
- Modify: `packages/core/metadata/forms/elements/extendedTooltip/rules.ts`
- Modify: `packages/core/metadata/forms/elements/labelDecoration/rules.ts`
- Modify: `packages/core/metadata/forms/elements/pictureDecoration/rules.ts`
- Modify: `packages/core/metadata/forms/elements/labelDecoration/types.ts`
- Modify: `packages/core/metadata/forms/elements/pictureDecoration/types.ts`
- Test: form element YAML tests

- [ ] **Step 1: Remove yamlFormatted from rules**

In `packages/core/metadata/forms/elements/extendedTooltip/rules.ts`, change:

```ts
title: {
  type: "FormattedI8nText",
  yaml: "Заголовок",
  yamlFormatted: "ФорматированныйЗаголовок",
},
```

to:

```ts
title: {
  type: "FormattedI8nText",
  yaml: "Заголовок",
},
```

Make the same change in:

```ts
packages/core/metadata/forms/elements/labelDecoration/rules.ts
packages/core/metadata/forms/elements/pictureDecoration/rules.ts
```

- [ ] **Step 2: Remove manual legacy YAML type additions**

Replace `packages/core/metadata/forms/elements/labelDecoration/types.ts` with:

```ts
import { FormTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { EnterpriseType } from "~/metadata/orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { LabelDecorationRules } from "./rules"

export type LabelDecoration = FormTypeByRule<typeof LabelDecorationRules>

export type LabelDecorationPartialYAML = YAMLTypeByRule<typeof LabelDecorationRules>

export type LabelDecorationEnterprise = EnterpriseType<typeof LabelDecorationRules>
```

Replace `packages/core/metadata/forms/elements/pictureDecoration/types.ts` with:

```ts
import { FormTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { EnterpriseType } from "~/metadata/orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { PictureDecorationRules } from "./rules"

export type PictureDecoration = FormTypeByRule<typeof PictureDecorationRules>

export type PictureDecorationPartialYAML = YAMLTypeByRule<typeof PictureDecorationRules>

export type PictureDecorationEnterprise = EnterpriseType<typeof PictureDecorationRules>
```

- [ ] **Step 3: Verify no active yamlFormatted remains**

Run:

```bash
rg -n "yamlFormatted|ФорматированныйЗаголовок" packages/core/metadata --glob '!**/__fixtures__/sync/**'
```

Expected: matches only in tests or YAML fixture data that Task 5 will update. There must be no `yamlFormatted` in active `rules.ts`, `types.ts`, `toYAML.ts`, or `fromYAML.ts`.

- [ ] **Step 4: Run TypeScript check for immediate type errors**

Run:

```bash
pnpm --filter @nakidka/core exec tsc --noEmit
```

Expected: FAIL is acceptable at this point if only form YAML fixture types still mention `ФорматированныйЗаголовок`. Any active-code error about `yamlFormatted` means Step 1 or Step 2 missed a file.

- [ ] **Step 5: Commit**

```bash
git add packages/core/metadata/forms/elements/extendedTooltip/rules.ts packages/core/metadata/forms/elements/labelDecoration/rules.ts packages/core/metadata/forms/elements/pictureDecoration/rules.ts packages/core/metadata/forms/elements/labelDecoration/types.ts packages/core/metadata/forms/elements/pictureDecoration/types.ts
git commit -m "refactor: :recycle: убрать yamlFormatted из правил форм"
```

---

### Task 5: Update Form YAML Fixtures And Integration Tests

**Files:**
- Modify: `packages/core/metadata/forms/elements/labelDecoration/__fixtures__/data.ts`
- Modify: `packages/core/metadata/forms/elements/pictureDecoration/__fixtures__/data.ts`
- Modify: `packages/core/metadata/validation/schemaRegistry.test.ts`
- Test: form element YAML tests and schema registry tests

- [ ] **Step 1: Update known formatted title fixture values**

In `packages/core/metadata/forms/elements/labelDecoration/__fixtures__/data.ts`, change:

```ts
ФорматированныйЗаголовок: "<b>Заголовок</>",
```

to:

```ts
Заголовок: {
  Форматированный: "Истина",
  Текст: "<b>Заголовок</>",
},
```

In `packages/core/metadata/forms/elements/pictureDecoration/__fixtures__/data.ts`, make the same change:

```ts
Заголовок: {
  Форматированный: "Истина",
  Текст: "<b>Заголовок</>",
},
```

- [ ] **Step 2: Search for remaining legacy fixture keys**

Run:

```bash
rg -n "ФорматированныйЗаголовок" packages/core/metadata/forms packages/core/metadata/commonObjects
```

Expected: no active fixture expectations remain. If matches appear in test descriptions that intentionally assert rejection of the old key, leave them. If matches appear in expected YAML data, convert them to:

```ts
Заголовок: {
  Форматированный: "Истина",
  Текст: <old value>,
}
```

- [ ] **Step 3: Add schema registry rejection test**

In `packages/core/metadata/validation/schemaRegistry.test.ts`, append this test inside `describe("JSON Schema registry", () => { ... })`:

```ts
it("accepts only value-based FormattedI8nText in form element schemas", () => {
  const schema = exportJSONSchemaForSchemaName({ context, name: "LabelDecoration", mode: "inline" })
  const compiled = TypeCompiler.Compile(schema)

  expect(
    compiled.Check({
      Вид: "ДекорацияНадпись",
      Заголовок: {
        Форматированный: "Истина",
        Текст: "<b>Заголовок</>",
      },
    })
  ).toBe(true)

  expect(
    compiled.Check({
      Вид: "ДекорацияНадпись",
      ФорматированныйЗаголовок: "<b>Заголовок</>",
    })
  ).toBe(false)
})
```

If the schema name or discriminator differs, inspect `packages/core/metadata/forms/elements/labelDecoration/rules.ts` and use the actual `itemType` / YAML discriminator value from that rule.

- [ ] **Step 4: Run focused form tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate packages/core/metadata/forms/elements/__tests__/toYAML.test.ts packages/core/metadata/forms/elements/__tests__/fromYAML.test.ts packages/core/metadata/validation/schemaRegistry.test.ts
```

Expected: PASS. If failures report expected YAML differences for other form fixtures, update only those YAML expected values from `ФорматированныйЗаголовок` to the new `{ Заголовок: { Форматированный, Текст } }` shape and rerun.

- [ ] **Step 5: Run focused common-object tests again**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate packages/core/metadata/commonObjects/formattedI8nText packages/core/metadata/commonObjects/i8nText
```

Expected: PASS. `i8nText` should remain unchanged.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/forms/elements packages/core/metadata/validation/schemaRegistry.test.ts
git commit -m "test: :white_check_mark: обновить YAML-фикстуры FormattedI8nText"
```

---

### Task 6: Final Cleanup And Full Verification

**Files:**
- Inspect: all changed files
- Test: full project test suite

- [ ] **Step 1: Verify old mechanisms are gone from active code**

Run:

```bash
rg -n "yamlFormatted" packages/core/metadata
```

Expected: no matches.

Run:

```bash
rg -n "exportFormattedI8nTextToYAMLDeprecated|FormattedTitle|ФорматированныйЗаголовок" packages/core/metadata --glob '!**/__fixtures__/sync/**'
```

Expected: matches only in tests that intentionally assert old-key rejection. If `exportFormattedI8nTextToYAMLDeprecated` remains, delete it because no old split-key export should survive.

- [ ] **Step 2: Run TypeScript check**

Run:

```bash
pnpm --filter @nakidka/core exec tsc --noEmit
```

Expected: PASS.

- [ ] **Step 3: Run full test suite**

Run:

```bash
pnpm test
```

Expected: PASS for all packages.

- [ ] **Step 4: Review final diff**

Run:

```bash
git diff --stat HEAD~4..HEAD
git diff HEAD~4..HEAD -- packages/core/metadata/commonObjects/formattedI8nText packages/core/metadata/forms/elements packages/core/metadata/validation/schemaRegistry.test.ts
```

Expected: changes are limited to the value-based `FormattedI8nText` migration, related form rules/types/fixtures, and schema tests. No XML fixtures changed.

- [ ] **Step 5: Commit any cleanup**

If Step 1 or Step 4 required cleanup, commit it:

```bash
git add packages/core/metadata
git commit -m "refactor: :recycle: удалить старый YAML-контракт FormattedI8nText"
```

If no cleanup was needed, skip this commit.

- [ ] **Step 6: Report**

Report:

```text
Implemented FormattedI8nText value-based YAML.
Verification:
- pnpm --filter @nakidka/core exec tsc --noEmit
- pnpm test
```

---

## Self-Review

- Spec coverage: the plan covers new object YAML shape, removal of `yamlFormatted`, no legacy read compatibility, focused schema tests, form fixture migration, and full `pnpm test`.
- Placeholder scan: no `TBD` or open-ended implementation-only steps remain.
- Type consistency: `FormattedI8nTextYAML` is consistently `{ Текст: I8nTextYAML; Форматированный?: "Истина" }`; rules use only `yaml`; old `yamlFormatted` is removed from active code.
