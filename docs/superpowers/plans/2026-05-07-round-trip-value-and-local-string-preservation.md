# Round-trip Value And Local String Preservation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve the next round-trip XML differences for unknown `Font` references, empty `ChoiceParameters`, `DCSParameter.value`, and DCS local-string presentation fields.

**Architecture:** Keep object-specific behavior in the common object converters and `rules.ts`, and keep `packages/core/metadata/orchestration/` generic. `DCSParameter.value` uses a general `preserveFromReferenceXML` rule that emits a field when either the current model has the key or the XML reference had the key. `UserSettingPresentation` is removed; its behavior moves into the broader `DcsLocalStringType` property type.

**Tech Stack:** TypeScript, Vitest, pnpm, fast-xml-parser, Nakidka metadata orchestration property rules.

---

## References

- Design spec: `docs/superpowers/specs/2026-05-07-round-trip-font-and-choice-parameters-design.md`
- Design spec: `docs/superpowers/specs/2026-05-07-round-trip-dcs-parameter-value-design.md`
- Design spec: `docs/superpowers/specs/2026-05-07-round-trip-dcs-local-string-type-design.md`
- Project rules: `AGENTS.md`
- Orchestration invariants: `.agents/architecture-orchestration.md`

## File Structure

Modify:

- `packages/core/tests/fixtures/font/data.ts` - adds one unknown `style:*` font fixture shared by XML, YAML, and Enterprise tests.
- `packages/core/metadata/commonObjects/font/types.ts` - widens font refs to known system enumeration values or raw prefixed XML refs.
- `packages/core/metadata/commonObjects/font/fromXML.ts` - preserves unknown `_ref` as a raw string.
- `packages/core/metadata/commonObjects/font/toXML.ts` - exports known refs through the map and raw refs unchanged.
- `packages/core/metadata/commonObjects/font/fromYAML.ts` - parses `style:*` and `sys:*` YAML strings as refs, not face names.
- `packages/core/metadata/commonObjects/font/toYAML.ts` - exports raw prefixed refs unchanged.
- `packages/core/metadata/commonObjects/font/toEnterprise.ts` - exports raw prefixed refs as raw Enterprise `Value`.
- `packages/core/metadata/commonObjects/сhoiceParameters/__fixtures__/withoutValue.xml` - changes empty item XML to canonical `xsi:nil`.
- `packages/core/metadata/commonObjects/сhoiceParameters/__fixtures__/withoutOneValue.xml` - changes the empty item XML to canonical `xsi:nil`.
- `packages/core/metadata/commonObjects/сhoiceParameters/fromXML.ts` - omits the `value` property when XML value imports as `undefined`.
- `packages/core/metadata/commonObjects/сhoiceParameters/toXML.ts` - exports missing values as `<app:value xsi:nil="true"/>`.
- `packages/core/metadata/orchestration/property/helpers.ts` - makes `preserveFromReferenceXML` export explicit current keys as well as reference keys.
- `packages/core/metadata/orchestration/property/helpers.test.ts` - covers current-key preservation.
- `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/types.ts` - includes `null` in DCS metadata value model and YAML types.
- `packages/core/metadata/commonObjects/dataCompositionSystem/dcsParameter/rules.ts` - replaces the `valueListAllowed` heuristic with `preserveFromReferenceXML`.
- `packages/core/metadata/commonObjects/dataCompositionSystem/dcsParameter/__fixtures__/data.ts` - adds explicit-null YAML/XML fixtures.
- `packages/core/metadata/commonObjects/dataCompositionSystem/dcsParameter/toXML.test.ts` - imports XML reference from the fixture and adds focused nil tests.
- `packages/core/metadata/commonObjects/dataCompositionSystem/dcsParameter/fromYAML.test.ts` - covers explicit YAML `null`.
- `packages/core/metadata/commonObjects/dataCompositionSystem/dcsParameter/toYAML.test.ts` - covers explicit YAML `null`.
- `packages/core/metadata/commonObjects/dataCompositionSystem/index.ts` - registers new `DcsLocalStringType` module and removes old `UserSettingPresentation` registration.
- `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/inlineTypes.ts` - imports common `DcsLocalStringType` registration instead of the filter-local implementation.
- `packages/core/metadata/orchestration/property/registry.ts` - removes `UserSettingPresentation` and keeps `DcsLocalStringType`.
- `packages/core/metadata/forms/commonObjects/dynamicList/rules.ts` - switches user-setting presentation field to `DcsLocalStringType`.
- `packages/core/metadata/commonObjects/dataCompositionSystem/filter/rules.ts` - switches user-setting presentation field to `DcsLocalStringType`.
- `packages/core/metadata/commonObjects/dataCompositionSystem/conditionalAppearance/rules.ts` - switches user-setting presentation field to `DcsLocalStringType`.
- `packages/core/metadata/commonObjects/dataCompositionSystem/conditionalAppearanceItem/rules.ts` - switches presentation fields to `DcsLocalStringType`.
- `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/rules.ts` - switches comparison presentation fields to `DcsLocalStringType`.
- `packages/core/metadata/commonObjects/dataCompositionSystem/order/rules.ts` - switches user-setting presentation field to `DcsLocalStringType`.
- `packages/core/metadata/commonObjects/dataCompositionSystem/dcsParameter/rules.ts` - switches `title` from `I8nText + typedXML` to `DcsLocalStringType`.
- `packages/core/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/rules.ts` - switches `title` from `I8nText + typedXML` to `DcsLocalStringType`.
- `packages/core/metadata/commonObjects/dataCompositionSystem/calculatedField/rules.ts` - switches `title` from `I8nText + typedXML` to `DcsLocalStringType`.

Create:

- `packages/core/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/index.ts` - side-effect registration barrel.
- `packages/core/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/types.ts` - XML/reference helper types.
- `packages/core/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/fromXML.ts` - imports `xs:string` and `v8:LocalStringType`.
- `packages/core/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/toXML.ts` - exports `xs:string` when the reference was string, otherwise `v8:LocalStringType`.
- `packages/core/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/fromYAML.ts` - delegates to `I8nText` YAML import.
- `packages/core/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/toYAML.ts` - delegates to `I8nText` YAML export.
- `packages/core/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/__fixtures__/data.ts` - moved and renamed fixture data.
- `packages/core/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/__fixtures__/string.xml` - moved fixture.
- `packages/core/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/__fixtures__/localString.xml` - moved fixture.
- `packages/core/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/__fixtures__/localStringTwoLangs.xml` - moved fixture.
- `packages/core/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/fromXML.test.ts` - moved tests with `DcsLocalStringType` rule.
- `packages/core/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/toXML.test.ts` - moved tests with string-reference behavior.

Delete:

- `packages/core/metadata/commonObjects/dataCompositionSystem/userSettingPresentation/`
- `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/fields/dcsLocalStringType.ts`

## Preflight

- [ ] **Step 1: Confirm worktree and branch**

Run:

```bash
git status --short
git branch --show-current
```

Expected:

```text
codex/round-trip-analysis
```

`git status --short` may show this plan file as untracked. Before implementation, there should be no unrelated code changes; if there are, inspect the files and do not revert unrelated user changes.

- [ ] **Step 2: Generate Langium files in this worktree**

Run:

```bash
pnpm --filter nkdk-language langium:generate
```

Expected: command exits with code `0`.

## Task 1: Preserve Unknown Font Refs

**Files:**

- Modify: `packages/core/tests/fixtures/font/data.ts`
- Modify: `packages/core/metadata/commonObjects/font/types.ts`
- Modify: `packages/core/metadata/commonObjects/font/fromXML.ts`
- Modify: `packages/core/metadata/commonObjects/font/toXML.ts`
- Modify: `packages/core/metadata/commonObjects/font/fromYAML.ts`
- Modify: `packages/core/metadata/commonObjects/font/toYAML.ts`
- Modify: `packages/core/metadata/commonObjects/font/toEnterprise.ts`
- Test: `packages/core/metadata/commonObjects/font/fromXML.test.ts`
- Test: `packages/core/metadata/commonObjects/font/toXML.test.ts`
- Test: `packages/core/metadata/commonObjects/font/fromYAML.test.ts`
- Test: `packages/core/metadata/commonObjects/font/toYAML.test.ts`
- Test: `packages/core/metadata/commonObjects/font/toEnterprise.test.ts`

- [ ] **Step 1: Write the failing unknown-ref fixture**

In `packages/core/tests/fixtures/font/data.ts`, add this block after `styleMinimalFontYAML`:

```ts
// #region unknownStyleMinimalFont

export const unknownStyleMinimalFont: Font = {
  ref: "style:TooltipTitleFont",
  kind: "StyleItem",
}

export const unknownStyleMinimalFontYAML: FontYAML = "style:TooltipTitleFont"

// #endregion
```

Then add this fixture entry after the existing `"style minimal"` entry in `fontYAMLFixtures`:

```ts
  {
    name: "unknown style minimal",
    xml: `<Font ref="style:TooltipTitleFont" kind="StyleItem"/>`,
    font: unknownStyleMinimalFont,
    yaml: unknownStyleMinimalFontYAML,
    preview: { Type: "Font", Value: "style:TooltipTitleFont" },
  },
```

- [ ] **Step 2: Run font tests and verify the fixture fails**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/font/fromXML.test.ts metadata/commonObjects/font/toXML.test.ts metadata/commonObjects/font/fromYAML.test.ts metadata/commonObjects/font/toYAML.test.ts metadata/commonObjects/font/toEnterprise.test.ts
```

Expected: at least one test fails because `style:TooltipTitleFont` is imported as an absolute face name or exported without the raw XML ref.

- [ ] **Step 3: Widen Font ref types**

In `packages/core/metadata/commonObjects/font/types.ts`, replace the `PrefixedFontsXML`, `FontXML`, `Font`, and `FontFullYAML` ref-related declarations with:

```ts
export type PrefixedFontsXML = keyof typeof PrefixedFontsFromXML
export type RawPrefixedFontRef = `style:${string}` | `sys:${string}`
export type FontRef = SE.StyleFonts | SE.WindowsFonts | RawPrefixedFontRef

export const isRawPrefixedFontRef = (value: unknown): value is RawPrefixedFontRef =>
  typeof value === "string" && (value.startsWith("style:") || value.startsWith("sys:"))

export interface FontXML {
  _ref?: PrefixedFontsXML | RawPrefixedFontRef
  _faceName?: string
  _scale?: number
  _height?: number
  _bold?: boolean
  _italic?: boolean
  _underline?: boolean
  _strikeout?: boolean
  _kind: string
}

export interface Font {
  kind: SE.FontType
  ref?: FontRef
  faceName?: string
  scale?: number
  height?: number
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strikeout?: boolean
}

export interface FontFullYAML {
  Вид?: SE.StyleFontsYAML | SE.WindowsFontsYAML | RawPrefixedFontRef
  Имя?: string
  Масштаб?: number
  Размер?: number
  Наклонный?: StringboolYAML
  Подчеркивание?: StringboolYAML
  Полужирный?: StringboolYAML
  Зачеркивание?: StringboolYAML
}
```

- [ ] **Step 4: Preserve raw ref on XML import**

In `packages/core/metadata/commonObjects/font/fromXML.ts`, change the local types import to:

```ts
import { Font, FontXML, PrefixedFontsFromXML, PrefixedFontsXML } from "./types"
```

In `packages/core/metadata/commonObjects/font/fromXML.ts`, replace the `_ref` block with:

```ts
  if (xml._ref !== undefined) {
    result.ref = PrefixedFontsFromXML[xml._ref as PrefixedFontsXML] ?? xml._ref
  }
```

- [ ] **Step 5: Preserve raw ref on XML export**

In `packages/core/metadata/commonObjects/font/toXML.ts`, replace the `_ref` block with:

```ts
  if (font.ref !== undefined) {
    const prefixedRef = PrefixedFontsToXML[font.ref as keyof typeof PrefixedFontsToXML] ?? font.ref
    result._ref = prefixedRef
  }
```

- [ ] **Step 6: Parse raw refs from YAML**

In `packages/core/metadata/commonObjects/font/fromYAML.ts`, import `isRawPrefixedFontRef`:

```ts
import { Font, FontFullYAML, FontYAML, isRawPrefixedFontRef, RawPrefixedFontRef } from "./types"
```

Add this helper above `export const importFontFromYAML`:

```ts
const importRefFromYAML = (
  context: ConfigurationContext,
  value: string
): { ref: SE.StyleFonts | SE.WindowsFonts | RawPrefixedFontRef; kind: SE.FontType } | undefined => {
  if (isRawPrefixedFontRef(value)) {
    return {
      ref: value,
      kind: value.startsWith("style:") ? "StyleItem" : "WindowsFont",
    }
  }

  const styleFontRef = importSystemEnumerationFromYAMLDeprecated<SE.StyleFonts>(
    context,
    { type: "SystemEnumeration", typeSE: "StyleFonts" },
    value
  )
  if (styleFontRef) {
    return {
      ref: styleFontRef,
      kind: "StyleItem",
    }
  }

  const windowsFontRef = importSystemEnumerationFromYAMLDeprecated<SE.WindowsFonts>(
    context,
    { type: "SystemEnumeration", typeSE: "WindowsFonts" },
    value
  )
  if (windowsFontRef) {
    return {
      ref: windowsFontRef,
      kind: "WindowsFont",
    }
  }

  return undefined
}
```

Replace the compact-string branch with:

```ts
  if (typeof yaml === "string") {
    const ref = importRefFromYAML(context, yaml)
    if (ref) return ref

    return {
      faceName: yaml,
      kind: "Absolute",
    }
  }
```

Replace the `fullData.Вид` conversion block with:

```ts
  if (fullData.Вид !== undefined) {
    const ref = importRefFromYAML(context, fullData.Вид)
    if (ref) {
      result.ref = ref.ref
      result.kind = ref.kind
    }
  } else {
    result.kind = "Absolute"
  }
```

- [ ] **Step 7: Export raw refs to YAML**

In `packages/core/metadata/commonObjects/font/toYAML.ts`, import `isRawPrefixedFontRef`:

```ts
import { Font, FontFullYAML, FontYAML, isRawPrefixedFontRef } from "./types"
```

Replace `convertRefToYAML` with:

```ts
const convertRefToYAML = (
  context: ConfigurationContext,
  ref: Font["ref"] | undefined,
  kind: SE.FontType
): SE.StyleFontsYAML | SE.WindowsFontsYAML | string | undefined => {
  if (ref === undefined) return undefined
  if (isRawPrefixedFontRef(ref)) return ref

  if (kind === "StyleItem") {
    return exportSystemEnumerationToYAMLDeprecated(context, { type: "SystemEnumeration", typeSE: "StyleFonts" }, ref)
  }

  return exportSystemEnumerationToYAMLDeprecated(context, { type: "SystemEnumeration", typeSE: "WindowsFonts" }, ref)
}
```

- [ ] **Step 8: Export raw refs to Enterprise preview**

In `packages/core/metadata/commonObjects/font/toEnterprise.ts`, import `isRawPrefixedFontRef`:

```ts
import { Font, FontEnterprise, isRawPrefixedFontRef } from "./types"
```

Replace the `Value` block with:

```ts
  if (font.ref && isRawPrefixedFontRef(font.ref)) {
    result.Value = font.ref
  } else if (font.kind === "WindowsFont" && font.ref) {
    result.Value = `WindowsFonts.${font.ref}`
  } else if (font.kind === "StyleItem" && font.ref) {
    result.Value = `StyleFonts.${font.ref}`
  }
```

- [ ] **Step 9: Run font tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/font/fromXML.test.ts metadata/commonObjects/font/toXML.test.ts metadata/commonObjects/font/fromYAML.test.ts metadata/commonObjects/font/toYAML.test.ts metadata/commonObjects/font/toEnterprise.test.ts
```

Expected:

```text
Test Files  5 passed
```

- [ ] **Step 10: Commit font preservation**

Run:

```bash
git add packages/core/tests/fixtures/font/data.ts packages/core/metadata/commonObjects/font/types.ts packages/core/metadata/commonObjects/font/fromXML.ts packages/core/metadata/commonObjects/font/toXML.ts packages/core/metadata/commonObjects/font/fromYAML.ts packages/core/metadata/commonObjects/font/toYAML.ts packages/core/metadata/commonObjects/font/toEnterprise.ts
git commit -m "fix: :bug: сохранять неизвестные ссылки шрифтов"
```

Expected: commit exits with code `0`.

## Task 2: Canonical ChoiceParameters Nil Values

**Files:**

- Modify: `packages/core/metadata/commonObjects/сhoiceParameters/__fixtures__/withoutValue.xml`
- Modify: `packages/core/metadata/commonObjects/сhoiceParameters/__fixtures__/withoutOneValue.xml`
- Modify: `packages/core/metadata/commonObjects/сhoiceParameters/fromXML.ts`
- Modify: `packages/core/metadata/commonObjects/сhoiceParameters/toXML.ts`
- Test: `packages/core/metadata/commonObjects/сhoiceParameters/fromXML.test.ts`
- Test: `packages/core/metadata/commonObjects/сhoiceParameters/toXML.test.ts`
- Test: `packages/core/metadata/commonObjects/сhoiceParameters/fromYAML.test.ts`
- Test: `packages/core/metadata/commonObjects/сhoiceParameters/toYAML.test.ts`

- [ ] **Step 1: Update XML fixtures to canonical nil**

Replace `packages/core/metadata/commonObjects/сhoiceParameters/__fixtures__/withoutValue.xml` with:

```xml
<ChoiceParameters>
	<app:item name="ВыборСчетовГоловнойОрганизации">
		<app:value xsi:nil="true"/>
	</app:item>
</ChoiceParameters>
```

Replace `packages/core/metadata/commonObjects/сhoiceParameters/__fixtures__/withoutOneValue.xml` with:

```xml
<ChoiceParameters>
	<app:item name="ВыборСчетовГоловнойОрганизации">
		<app:value xsi:nil="true"/>
	</app:item>
	<app:item name="Отбор.Закрыт">
		<app:value xsi:type="xs:boolean">false</app:value>
	</app:item>
</ChoiceParameters>
```

- [ ] **Step 2: Run ChoiceParameters XML tests and verify the exporter fails**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/сhoiceParameters/fromXML.test.ts metadata/commonObjects/сhoiceParameters/toXML.test.ts
```

Expected: `toXML` tests for `withoutValue.xml` or `withoutOneValue.xml` fail because missing `value` still exports as an empty `<app:item/>`.

- [ ] **Step 3: Omit undefined values on XML import**

In `packages/core/metadata/commonObjects/сhoiceParameters/fromXML.ts`, replace the return in `importChoiceParameterFromXML` with:

```ts
  const result: ChoiceParameter = {
    name: xml._name,
  }

  if (value !== undefined) result.value = value

  return result
```

The full function body after the change should be:

```ts
const importChoiceParameterFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: ChoiceParameterXML
): ChoiceParameter => {
  const value = importMetadataValueFromXML({
    context,
    rule: {
      type: "MetadataValue",
      valueType: ["string", "decimal", "boolean", "ref", "objectRef", "fixedArray", "formChoiceListDesTimeValue"],
    },
    value: xml["app:value"],
  })

  const result: ChoiceParameter = {
    name: xml._name,
  }

  if (value !== undefined) result.value = value

  return result
}
```

- [ ] **Step 4: Export missing values as XML nil**

In `packages/core/metadata/commonObjects/сhoiceParameters/toXML.ts`, replace the `rule` passed to `exportMetadataValueToXML` with:

```ts
      rule: {
        type: "MetadataValue",
        valueType: ["string", "decimal", "boolean", "ref", "objectRef", "fixedArray", "formChoiceListDesTimeValue"],
        exportNilValue: true,
      },
```

The `items` mapping should become:

```ts
  const items = parameters.map((param) => ({
    _name: param.name,
    "app:value": exportMetadataValueToXML({
      context,
      rule: {
        type: "MetadataValue",
        valueType: ["string", "decimal", "boolean", "ref", "objectRef", "fixedArray", "formChoiceListDesTimeValue"],
        exportNilValue: true,
      },
      value: param.value,
    })!,
  }))
```

- [ ] **Step 5: Run ChoiceParameters tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/сhoiceParameters/fromXML.test.ts metadata/commonObjects/сhoiceParameters/toXML.test.ts metadata/commonObjects/сhoiceParameters/fromYAML.test.ts metadata/commonObjects/сhoiceParameters/toYAML.test.ts
```

Expected:

```text
Test Files  4 passed
```

YAML remains a key with no value:

```yaml
ВыборСчетовГоловнойОрганизации:
```

- [ ] **Step 6: Commit ChoiceParameters nil preservation**

Run:

```bash
git add packages/core/metadata/commonObjects/сhoiceParameters/__fixtures__/withoutValue.xml packages/core/metadata/commonObjects/сhoiceParameters/__fixtures__/withoutOneValue.xml packages/core/metadata/commonObjects/сhoiceParameters/fromXML.ts packages/core/metadata/commonObjects/сhoiceParameters/toXML.ts
git commit -m "fix: :bug: экспортировать пустые ChoiceParameters как nil"
```

Expected: commit exits with code `0`.

## Task 3: Preserve DCSParameter Value By Reference Key

**Files:**

- Modify: `packages/core/metadata/orchestration/property/helpers.ts`
- Modify: `packages/core/metadata/orchestration/property/helpers.test.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/types.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsParameter/rules.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsParameter/__fixtures__/data.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsParameter/toXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsParameter/fromYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsParameter/toYAML.test.ts`

- [ ] **Step 1: Add failing orchestration tests for explicit current keys**

In `packages/core/metadata/orchestration/property/helpers.test.ts`, add these tests inside `describe("shouldProcessProperty preserveFromReferenceXML", () => { ... })`, after the reference `undefined` test:

```ts
  it("экспортирует поле, когда текущая модель содержит ключ со значением undefined", () => {
    const result = shouldProcessProperty({
      rule: preserveRule,
      operation: "exportToXML",
      propertyKey: "rowFilter",
      metadataItem: { rowFilter: undefined },
    })

    expect(result).toBe(true)
  })

  it("экспортирует поле, когда текущая модель содержит ключ со значением null", () => {
    const result = shouldProcessProperty({
      rule: preserveRule,
      operation: "exportToXML",
      propertyKey: "rowFilter",
      metadataItem: { rowFilter: null },
    })

    expect(result).toBe(true)
  })
```

- [ ] **Step 2: Run helper tests and verify the new tests fail**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/orchestration/property/helpers.test.ts
```

Expected: the new `metadataItem` tests fail because `preserveFromReferenceXML` currently only checks `referenceMetadata`.

- [ ] **Step 3: Make preserveFromReferenceXML check current model first**

In `packages/core/metadata/orchestration/property/helpers.ts`, replace the `preserveFromReferenceXML` branch in `shouldProcessProperty` with:

```ts
      if (rule.preserveFromReferenceXML === true) {
        if (propertyKey === undefined) return false

        const metadataHasOwnKey =
          metadataItem !== null &&
          metadataItem !== undefined &&
          typeof metadataItem === "object" &&
          Object.prototype.hasOwnProperty.call(metadataItem, propertyKey)

        if (metadataHasOwnKey) return true

        if (referenceMetadata === null || referenceMetadata === undefined || typeof referenceMetadata !== "object") {
          return false
        }

        return Object.prototype.hasOwnProperty.call(referenceMetadata, propertyKey)
      }
```

- [ ] **Step 4: Run helper tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/orchestration/property/helpers.test.ts
```

Expected:

```text
Test Files  1 passed
```

- [ ] **Step 5: Widen DCS metadata value types to include null**

In `packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/types.ts`, add `null` to both unions:

```ts
export type MetadataDcsMetadataValue =
  | Color
  | MetadataField
  | ChoiceParameter
  | I8nText
  | MetadataValue
  | TypeLink
  | ChoiceParameterLinks
  | Font
  | string
  | null
```

```ts
export type MetadataDcsMetadataValueYAML =
  | ColorYAML
  | MetadataFieldYAML
  | ChoiceParametersYAML
  | I8nTextYAML
  | MetadataValueYAML
  | TypeLinkYAML
  | ChoiceParameterLinksYAML
  | FontYAML
  | string
  | null
```

- [ ] **Step 6: Replace the DCSParameter value heuristic with reference preservation**

In `packages/core/metadata/commonObjects/dataCompositionSystem/dcsParameter/rules.ts`, replace the `value` rule with:

```ts
    value: {
      type: "MetadataDcsMetadataValue",
      valueType: "Primitive",
      xml: "dcssch:value",
      yaml: "Значение",
      order: 4,
      exportNilValue: true,
      preserveFromReferenceXML: true,
    },
```

- [ ] **Step 7: Add explicit-null fixtures**

In `packages/core/metadata/commonObjects/dataCompositionSystem/dcsParameter/__fixtures__/data.ts`, add this block before `export const minimalDCSParameters`:

```ts
export const explicitNullValueDCSParameters = [
  {
    itemType: "DCSParameter" as const,
    name: "ПустоеЗначение",
    title: { items: { ru: "Пустое значение" } },
    value: null,
  },
] as const satisfies DCSParameters
```

Add this block before `export const minimalDCSParametersYAML`:

```ts
export const explicitNullValueDCSParametersYAML = {
  ПустоеЗначение: {
    Заголовок: "Пустое значение",
    Значение: null,
  },
} as const satisfies DCSParametersYAML
```

- [ ] **Step 8: Make DCSParameter XML export tests use imported XML references**

In `packages/core/metadata/commonObjects/dataCompositionSystem/dcsParameter/toXML.test.ts`, remove the `referenceMetadata` property from both existing fixture tests.

The minimal test should be:

```ts
  it("exports minimal.xml", () => {
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: minimalDCSParameters,
      xmlRootTag: "Settings",
      path: "minimal.xml",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(expectedResult)
  })
```

The full test should be:

```ts
  it("exports full.xml", () => {
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: fullDCSParameters,
      xmlRootTag: "Settings",
      path: "full.xml",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(expectedResult)
  })
```

- [ ] **Step 9: Add focused XML nil tests**

In `packages/core/metadata/commonObjects/dataCompositionSystem/dcsParameter/toXML.test.ts`, extend the imports:

```ts
import { xmlExport } from "~/xml/export/exporter"
import { exportPropertyToXML } from "~/metadata/orchestration"
import { mockContextToXML } from "~/tests/mockContext"
import { explicitNullValueDCSParameters, fullDCSParameters, minimalDCSParameters } from "./__fixtures__/data"
```

Add this helper below `const rule`:

```ts
const exportDCSParameters = (value: unknown, referenceMetadata?: unknown): string => {
  const xmlData = exportPropertyToXML({
    context: mockContextToXML(),
    rule,
    value,
    referenceMetadata,
  })

  return xmlExport({ Settings: xmlData }, false)
}
```

Add these tests inside the `describe` block:

```ts
  it("exports explicit null value as xsi:nil without reference", () => {
    const result = exportDCSParameters(explicitNullValueDCSParameters)

    expect(result).toContain(`<dcssch:value xsi:nil="true"/>`)
  })

  it("exports missing value as xsi:nil when reference item has value key", () => {
    const value = [
      {
        itemType: "DCSParameter" as const,
        name: "ПустоеЗначение",
        title: { items: { ru: "Пустое значение" } },
      },
    ]
    const referenceMetadata = [
      {
        itemType: "DCSParameter" as const,
        name: "ПустоеЗначение",
        title: { items: { ru: "Пустое значение" } },
        value: undefined,
      },
    ]

    const result = exportDCSParameters(value, referenceMetadata)

    expect(result).toContain(`<dcssch:value xsi:nil="true"/>`)
  })

  it("omits missing value when neither model nor reference has value key", () => {
    const value = [
      {
        itemType: "DCSParameter" as const,
        name: "БезЗначения",
        title: { items: { ru: "Без значения" } },
      },
    ]

    const result = exportDCSParameters(value, value)

    expect(result).not.toContain(`<dcssch:value`)
  })
```

- [ ] **Step 10: Add explicit-null YAML import test**

In `packages/core/metadata/commonObjects/dataCompositionSystem/dcsParameter/fromYAML.test.ts`, include the new fixtures in the import:

```ts
  explicitNullValueDCSParameters,
  explicitNullValueDCSParametersYAML,
```

Add this test:

```ts
  it("imports explicit null value fixture", () => {
    const result = testImportPropertyFromYAML({ rule, value: explicitNullValueDCSParametersYAML })
    expect(result).toEqual(explicitNullValueDCSParameters)
  })
```

- [ ] **Step 11: Add explicit-null YAML export test**

In `packages/core/metadata/commonObjects/dataCompositionSystem/dcsParameter/toYAML.test.ts`, include the new fixtures in the import:

```ts
  explicitNullValueDCSParameters,
  explicitNullValueDCSParametersYAML,
```

Add this test:

```ts
  it("exports explicit null value fixture", () => {
    const result = testExportPropertyToYAML({ rule, value: explicitNullValueDCSParameters })
    expect(result).toEqual({ Параметры: explicitNullValueDCSParametersYAML })
  })
```

- [ ] **Step 12: Run DCSParameter and orchestration tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/orchestration/property/helpers.test.ts metadata/commonObjects/dataCompositionSystem/dcsParameter/fromXML.test.ts metadata/commonObjects/dataCompositionSystem/dcsParameter/toXML.test.ts metadata/commonObjects/dataCompositionSystem/dcsParameter/fromYAML.test.ts metadata/commonObjects/dataCompositionSystem/dcsParameter/toYAML.test.ts
```

Expected:

```text
Test Files  5 passed
```

- [ ] **Step 13: Commit DCSParameter value preservation**

Run:

```bash
git add packages/core/metadata/orchestration/property/helpers.ts packages/core/metadata/orchestration/property/helpers.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/dcsMetadataValue/types.ts packages/core/metadata/commonObjects/dataCompositionSystem/dcsParameter/rules.ts packages/core/metadata/commonObjects/dataCompositionSystem/dcsParameter/__fixtures__/data.ts packages/core/metadata/commonObjects/dataCompositionSystem/dcsParameter/toXML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/dcsParameter/fromYAML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/dcsParameter/toYAML.test.ts
git commit -m "fix: :bug: сохранять nil значения параметров СКД по референсу"
```

Expected: commit exits with code `0`.

## Task 4: Replace UserSettingPresentation With DcsLocalStringType

**Files:**

- Create: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/index.ts`
- Create: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/types.ts`
- Create: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/fromXML.ts`
- Create: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/toXML.ts`
- Create: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/fromYAML.ts`
- Create: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/toYAML.ts`
- Create: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/__fixtures__/data.ts`
- Create: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/fromXML.test.ts`
- Create: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/toXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/index.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/inlineTypes.ts`
- Modify: `packages/core/metadata/orchestration/property/registry.ts`
- Modify: `packages/core/metadata/forms/commonObjects/dynamicList/rules.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/filter/rules.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/conditionalAppearance/rules.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/conditionalAppearanceItem/rules.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/rules.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/order/rules.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsParameter/rules.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/rules.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/calculatedField/rules.ts`
- Delete: `packages/core/metadata/commonObjects/dataCompositionSystem/userSettingPresentation/`
- Delete: `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/fields/dcsLocalStringType.ts`

- [ ] **Step 1: Move fixtures and tests to the new module path**

Run:

```bash
mkdir -p packages/core/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType
git mv packages/core/metadata/commonObjects/dataCompositionSystem/userSettingPresentation/__fixtures__ packages/core/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/__fixtures__
git mv packages/core/metadata/commonObjects/dataCompositionSystem/userSettingPresentation/fromXML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/fromXML.test.ts
git mv packages/core/metadata/commonObjects/dataCompositionSystem/userSettingPresentation/toXML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/toXML.test.ts
```

Expected: files are moved and `git status --short` shows renames.

- [ ] **Step 2: Rename fixture symbols**

Replace the full content of `packages/core/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/__fixtures__/data.ts` with:

```ts
import { I8nText } from "~/metadata/commonObjects/i8nText/types"

export const fixtureDcsStringSingleLang: I8nText = { items: { ru: "Один язык - string" } }
export const fixtureDcsLocalStringSingleLang: I8nText = { items: { ru: "Один язык - local string" } }
export const fixtureDcsLocalStringTwoLangs: I8nText = {
  items: { ru: "Русский язык - local string", en: "English language - local string" },
}

export const fixtureDcsStringRef = "Один язык - string"
export const fixtureDcsLocalStringRef: I8nText = { items: { ru: "Один язык - local string" } }
export const fixtureDcsLocalStringTwoLangsRef: I8nText = {
  items: { ru: "Русский язык - local string", en: "English language - local string" },
}
```

- [ ] **Step 3: Create DcsLocalStringType types**

Create `packages/core/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/types.ts`:

```ts
import type { I8nText } from "~/metadata/commonObjects/i8nText/types"

export type DcsLocalStringTypeXML =
  | string
  | {
      "_xsi:type"?: string
      "#text"?: unknown
      "v8:item"?: unknown
    }
  | undefined

export type DcsLocalStringTypeReference = I8nText | string
```

- [ ] **Step 4: Create XML importer**

Create `packages/core/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/fromXML.ts`:

```ts
import { importI8nTextFromXML } from "~/metadata/commonObjects/i8nText/fromXML"
import { I8nText, I8nTextXML } from "~/metadata/commonObjects/i8nText/types"
import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import { DcsLocalStringTypeXML } from "./types"

const extractStringValue = (xml: DcsLocalStringTypeXML): string | undefined => {
  if (typeof xml === "string") return xml
  if (xml !== undefined && xml !== null && typeof xml === "object" && xml["_xsi:type"] === "xs:string") {
    const text = xml["#text"]
    return text !== undefined ? String(text) : ""
  }
  return undefined
}

export const importDcsLocalStringTypeFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: DcsLocalStringTypeXML
): I8nText | string | undefined => {
  if (xml === undefined) return undefined

  const stringValue = extractStringValue(xml)
  if (stringValue !== undefined) {
    if (context.fromXML.forReference) return stringValue
    return { items: { [context.defaultLanguage]: stringValue } }
  }

  if (typeof xml !== "object" || xml === null) return undefined
  return importI8nTextFromXML(context, { type: "I8nText" } as any, xml as I8nTextXML)
}

registerTypeRule("DcsLocalStringType", "importFromXML", importDcsLocalStringTypeFromXML as any)
```

- [ ] **Step 5: Create XML exporter**

Create `packages/core/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/toXML.ts`:

```ts
import { exportI8nTextToXML } from "~/metadata/commonObjects/i8nText/toXML"
import { I8nText } from "~/metadata/commonObjects/i8nText/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import { DcsLocalStringTypeReference } from "./types"

const exportAsLocalString = (context: ConfigurationContext, data: I8nText) => {
  const base = exportI8nTextToXML(context, { type: "I8nText" } as any, data)
  if (!base) return undefined
  return { "_xsi:type": "v8:LocalStringType", ...base }
}

export const exportDcsLocalStringTypeToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: I8nText | string | undefined,
  referenceMetadata?: DcsLocalStringTypeReference
) => {
  if (!data) return undefined

  if (typeof data === "string") {
    return { "_xsi:type": "xs:string", "#text": data }
  }

  if (!("items" in (data as object))) return undefined
  const items = Object.entries(data.items)
  if (items.length === 0) return undefined

  if (items.length > 1) {
    return exportAsLocalString(context, data)
  }

  if (typeof referenceMetadata === "string") {
    return { "_xsi:type": "xs:string", "#text": items[0][1] }
  }

  return exportAsLocalString(context, data)
}

registerTypeRule("DcsLocalStringType", "exportToXML", exportDcsLocalStringTypeToXML as any)
```

- [ ] **Step 6: Create YAML registration files**

Create `packages/core/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/fromYAML.ts`:

```ts
import { importI8nTextFromYAML } from "~/metadata/commonObjects/i8nText/fromYAML"
import { registerTypeRule } from "~/metadata/orchestration"

registerTypeRule("DcsLocalStringType", "importFromYAML", importI8nTextFromYAML)
```

Create `packages/core/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/toYAML.ts`:

```ts
import { exportI8nTextToYAML } from "~/metadata/commonObjects/i8nText/toYAML"
import { registerTypeRule } from "~/metadata/orchestration"

registerTypeRule("DcsLocalStringType", "exportToYAML", exportI8nTextToYAML)
```

Create `packages/core/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/index.ts`:

```ts
import "./fromXML"
import "./fromYAML"
import "./toXML"
import "./toYAML"
```

- [ ] **Step 7: Rewrite DcsLocalStringType XML import tests**

Replace `packages/core/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/fromXML.test.ts` with:

```ts
import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testImportPropertyFromXML } from "~/tests/property/importPropertyFromXML"
import {
  fixtureDcsLocalStringRef,
  fixtureDcsLocalStringSingleLang,
  fixtureDcsLocalStringTwoLangs,
  fixtureDcsLocalStringTwoLangsRef,
  fixtureDcsStringRef,
  fixtureDcsStringSingleLang,
} from "./__fixtures__/data"

const rule: PropertyRule = { type: "DcsLocalStringType" }
const xmlRootTag = "dcsset:userSettingPresentation"

describe("importDcsLocalStringTypeFromXML", () => {
  describe("обычный импорт", () => {
    it("string.xml -> I8nText", () => {
      const result = testImportPropertyFromXML({
        rule,
        path: "string.xml",
        xmlRootTag,
        importMetaUrl: import.meta.url,
      })

      expect(result).toEqual(fixtureDcsStringSingleLang)
    })

    it("localString.xml -> I8nText с одним языком", () => {
      const result = testImportPropertyFromXML({
        rule,
        path: "localString.xml",
        xmlRootTag,
        importMetaUrl: import.meta.url,
      })

      expect(result).toEqual(fixtureDcsLocalStringSingleLang)
    })

    it("localStringTwoLangs.xml -> I8nText с двумя языками", () => {
      const result = testImportPropertyFromXML({
        rule,
        path: "localStringTwoLangs.xml",
        xmlRootTag,
        importMetaUrl: import.meta.url,
      })

      expect(result).toEqual(fixtureDcsLocalStringTwoLangs)
    })
  })

  describe("импорт референса", () => {
    it("string.xml -> строковый референс", () => {
      const result = testImportPropertyFromXML({
        rule,
        path: "string.xml",
        xmlRootTag,
        importMetaUrl: import.meta.url,
        forReference: true,
      })

      expect(result).toEqual(fixtureDcsStringRef)
    })

    it("localString.xml -> I8nText референс", () => {
      const result = testImportPropertyFromXML({
        rule,
        path: "localString.xml",
        xmlRootTag,
        importMetaUrl: import.meta.url,
        forReference: true,
      })

      expect(result).toEqual(fixtureDcsLocalStringRef)
    })

    it("localStringTwoLangs.xml -> I8nText референс", () => {
      const result = testImportPropertyFromXML({
        rule,
        path: "localStringTwoLangs.xml",
        xmlRootTag,
        importMetaUrl: import.meta.url,
        forReference: true,
      })

      expect(result).toEqual(fixtureDcsLocalStringTwoLangsRef)
    })
  })
})
```

- [ ] **Step 8: Rewrite DcsLocalStringType XML export tests**

Replace `packages/core/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/toXML.test.ts` with:

```ts
import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"
import {
  fixtureDcsLocalStringSingleLang,
  fixtureDcsLocalStringTwoLangs,
  fixtureDcsStringSingleLang,
} from "./__fixtures__/data"

const rule: PropertyRule = { type: "DcsLocalStringType" }
const xmlRootTag = "dcsset:userSettingPresentation"

describe("exportDcsLocalStringTypeToXML", () => {
  it("один язык + string reference -> xs:string", () => {
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: fixtureDcsStringSingleLang,
      xmlRootTag,
      path: "string.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult?.trimEnd())
  })

  it("один язык + LocalString reference -> v8:LocalStringType", () => {
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: fixtureDcsLocalStringSingleLang,
      xmlRootTag,
      path: "localString.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult?.trimEnd())
  })

  it("один язык без референса -> v8:LocalStringType", () => {
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: fixtureDcsLocalStringSingleLang,
      xmlRootTag,
      path: "localString.xml",
      importMetaUrl: import.meta.url,
      referenceMetadata: undefined,
    })

    expect(result).toEqual(expectedResult?.trimEnd())
  })

  it("два языка -> v8:LocalStringType", () => {
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: fixtureDcsLocalStringTwoLangs,
      xmlRootTag,
      path: "localStringTwoLangs.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult?.trimEnd())
  })

  it("undefined -> пустой элемент", () => {
    const { result } = testExportPropertyToXML({
      rule,
      value: undefined,
      xmlRootTag,
      referenceMetadata: "reference",
    })

    expect(result).toBe("")
  })

  it("пустой items -> пустой элемент", () => {
    const { result } = testExportPropertyToXML({
      rule,
      value: { items: {} },
      xmlRootTag,
      referenceMetadata: "reference",
    })

    expect(result).toBe("")
  })
})
```

- [ ] **Step 9: Register the new common type module**

In `packages/core/metadata/commonObjects/dataCompositionSystem/index.ts`, replace:

```ts
import "./userSettingPresentation/fromXML"
import "./userSettingPresentation/fromYAML"
import "./userSettingPresentation/toXML"
import "./userSettingPresentation/toYAML"
```

with:

```ts
import "./dcsLocalStringType"
```

In `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/inlineTypes.ts`, replace:

```ts
import "./fields/dcsLocalStringType"
```

with:

```ts
import "../dcsLocalStringType"
```

- [ ] **Step 10: Remove UserSettingPresentation from the property registry**

In `packages/core/metadata/orchestration/property/registry.ts`, delete this registry entry:

```ts
  UserSettingPresentation: {
    item: I8nText
    yaml: I8nTextYAML
  }
```

Also delete this key from `PropertyRuleTypeKeys`:

```ts
  UserSettingPresentation: "UserSettingPresentation",
```

Keep the existing `DcsLocalStringType` registry entry unchanged:

```ts
  DcsLocalStringType: {
    item: I8nText
    yaml: I8nTextYAML
  }
```

- [ ] **Step 11: Switch user-setting presentation rules to DcsLocalStringType**

Replace `type: "UserSettingPresentation"` with `type: "DcsLocalStringType"` in these files:

```text
packages/core/metadata/forms/commonObjects/dynamicList/rules.ts
packages/core/metadata/commonObjects/dataCompositionSystem/filter/rules.ts
packages/core/metadata/commonObjects/dataCompositionSystem/conditionalAppearance/rules.ts
packages/core/metadata/commonObjects/dataCompositionSystem/conditionalAppearanceItem/rules.ts
packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/rules.ts
packages/core/metadata/commonObjects/dataCompositionSystem/order/rules.ts
```

After the replacement, `rg -n 'UserSettingPresentation' packages/core/metadata packages/core/tests -g '*.ts'` should only show files inside the old directory before deletion.

- [ ] **Step 12: Switch DCS title rules to DcsLocalStringType**

In `packages/core/metadata/commonObjects/dataCompositionSystem/dcsParameter/rules.ts`, replace the `title` rule with:

```ts
    title: {
      type: "DcsLocalStringType",
      xml: "dcssch:title",
      yaml: "Заголовок",
      order: 2,
    },
```

In `packages/core/metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/rules.ts`, replace the `title` rule with:

```ts
    title: {
      type: "DcsLocalStringType",
      xml: "dcssch:title",
      yaml: "Заголовок",
      order: 3,
    },
```

In `packages/core/metadata/commonObjects/dataCompositionSystem/calculatedField/rules.ts`, replace the `title` rule with:

```ts
    title: {
      type: "DcsLocalStringType",
      xml: "dcssch:title",
      yaml: "Заголовок",
      order: 3,
    },
```

- [ ] **Step 13: Delete the old implementations**

Run:

```bash
git rm -r packages/core/metadata/commonObjects/dataCompositionSystem/userSettingPresentation
git rm packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/fields/dcsLocalStringType.ts
```

Expected: files are staged as deleted or renamed by Git.

- [ ] **Step 14: Verify no old type references remain**

Run:

```bash
rg -n "UserSettingPresentation" packages/core/metadata packages/core/tests -g "*.ts"
```

Expected: no matches.

Run:

```bash
rg -n "fields/dcsLocalStringType|userSettingPresentation/fromXML|userSettingPresentation/toXML|userSettingPresentation/fromYAML|userSettingPresentation/toYAML" packages/core/metadata packages/core/tests -g "*.ts"
```

Expected: no matches.

- [ ] **Step 15: Run local-string and affected DCS tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/fromXML.test.ts metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/toXML.test.ts metadata/commonObjects/dataCompositionSystem/dcsParameter/fromXML.test.ts metadata/commonObjects/dataCompositionSystem/dcsParameter/toXML.test.ts metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/fromXML.test.ts metadata/commonObjects/dataCompositionSystem/dataCompositionSchemaDataSetField/toXML.test.ts metadata/commonObjects/dataCompositionSystem/calculatedField/fromXML.test.ts metadata/commonObjects/dataCompositionSystem/calculatedField/toXML.test.ts metadata/commonObjects/dataCompositionSystem/filter/fromXML.test.ts metadata/commonObjects/dataCompositionSystem/filter/toXML.test.ts metadata/commonObjects/dataCompositionSystem/order/fromXML.test.ts metadata/commonObjects/dataCompositionSystem/order/toXML.test.ts metadata/commonObjects/dataCompositionSystem/conditionalAppearance/fromXML.test.ts metadata/commonObjects/dataCompositionSystem/conditionalAppearance/toXML.test.ts metadata/commonObjects/dataCompositionSystem/conditionalAppearanceItem/fromXML.test.ts metadata/commonObjects/dataCompositionSystem/conditionalAppearanceItem/toXML.test.ts metadata/commonObjects/dataCompositionSystem/filterItem/fromXML.test.ts metadata/commonObjects/dataCompositionSystem/filterItem/toXML.test.ts
```

Expected:

```text
Test Files  18 passed
```

- [ ] **Step 16: Commit local-string type consolidation**

Run:

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem packages/core/metadata/forms/commonObjects/dynamicList/rules.ts packages/core/metadata/orchestration/property/registry.ts
git commit -m "refactor: :recycle: заменить UserSettingPresentation на DcsLocalStringType"
```

Expected: commit exits with code `0`.

## Task 5: Full Verification

**Files:**

- Verify: full worktree.

- [ ] **Step 1: Run focused core tests for all changed areas**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/font/fromXML.test.ts metadata/commonObjects/font/toXML.test.ts metadata/commonObjects/font/fromYAML.test.ts metadata/commonObjects/font/toYAML.test.ts metadata/commonObjects/font/toEnterprise.test.ts metadata/commonObjects/сhoiceParameters/fromXML.test.ts metadata/commonObjects/сhoiceParameters/toXML.test.ts metadata/commonObjects/сhoiceParameters/fromYAML.test.ts metadata/commonObjects/сhoiceParameters/toYAML.test.ts metadata/orchestration/property/helpers.test.ts metadata/commonObjects/dataCompositionSystem/dcsParameter/fromXML.test.ts metadata/commonObjects/dataCompositionSystem/dcsParameter/toXML.test.ts metadata/commonObjects/dataCompositionSystem/dcsParameter/fromYAML.test.ts metadata/commonObjects/dataCompositionSystem/dcsParameter/toYAML.test.ts metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/fromXML.test.ts metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/toXML.test.ts
```

Expected:

```text
Test Files  16 passed
```

- [ ] **Step 2: Run type-check for core**

Run:

```bash
pnpm --filter @nakidka/core type-check
```

Expected: command exits with code `0`.

- [ ] **Step 3: Run full project tests**

Run:

```bash
pnpm test
```

Expected: command exits with code `0`.

- [ ] **Step 4: Run a short round-trip batch**

Run:

```bash
env NKDK_XML_REPO=/Users/nikita/git/round-trip-source NKDK_XML_DIR=/Users/nikita/git/round-trip-source/trade ./.agents/skills/round-trip-xml/round-trip.sh
```

Expected: command exits with code `0` and the first differences no longer include the handled unknown font ref, `ChoiceParameters` without value, `DCSParameter.value` nil omission, or `UserSettingPresentation` type mismatch.

- [ ] **Step 5: Commit verification-only adjustments if the previous tasks required small fixes**

Run this only when Step 1-4 required additional code or fixture changes:

```bash
git add packages/core docs/superpowers
git commit -m "test: :white_check_mark: закрепить round-trip проверки значений СКД"
```

Expected: commit exits with code `0`. If Step 1-4 required no extra changes, skip this commit.

## Notes For Implementation

- `ChoiceParameters` YAML empty value must stay a real empty key: `ВыборСчетовГоловнойОрганизации:`.
- The real XML corpus had many `xsi:nil` values and no confirmed `app:item` without `app:value`, so canonical XML for empty choice parameters is `xsi:nil`.
- `DCSParameter.value` absence is not determined by `valueListAllowed`. Export the field when the current model has the `value` key, or when the imported XML reference had the `value` key.
- The boolean reference flag from the old `UserSettingPresentation` tests is not carried forward. The new generic signal is the actual reference shape: string reference means export `xs:string`; object reference means export `v8:LocalStringType`.
- Do not add DCS-specific imports to `packages/core/metadata/orchestration/`; only the generic own-key check belongs there.
