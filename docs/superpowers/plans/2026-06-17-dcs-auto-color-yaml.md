# DCS Auto Color YAML Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hide platform `auto` color values from DCS appearance YAML and restore them when exporting XML.

**Architecture:** Keep `auto` out of the shared `Color` contract. Implement the special case at the DCS `SettingsParameterValue` layer for `valueType: "Color"` so `ЦветТекста:` means an enabled color parameter with no YAML value, and XML export writes `v8ui:Color auto` when the value is absent.

**Tech Stack:** TypeScript, Vitest, TypeBox JSON Schema, existing metadata orchestration rules.

---

## File Structure

- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromYAML.ts`
  - Import `null` YAML as a present color `SettingsParameterValue` only when `rule.valueType === "Color"`.
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toYAML.ts`
  - Export color `SettingsParameterValue` with `auto` value as omitted YAML value.
  - Return `null` for active color parameters that have no YAML value.
  - Return `{ Использовать: "Ложь" }` for disabled color parameters without value.
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toXML.ts`
  - Restore `dcscor:value xsi:type="v8ui:Color"` with text `auto` for color parameters with no explicit value.
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/fromXML.test.ts`
  - Add XML import tests using inline XML strings.
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/fromYAML.test.ts`
  - Add YAML import tests for empty active and disabled color parameters.
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/toYAML.test.ts`
  - Add YAML export tests for active and disabled auto colors.
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/toXML.test.ts`
  - Add XML export tests that restore `auto`.
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/toJSONSchema.test.ts`
  - Add validation tests for the YAML syntax and for keeping `auto` out of normal colors.

No XML fixture files are created or modified.

---

### Task 1: Add Failing YAML And XML Tests

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/fromXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/fromYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/toYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/toXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/toJSONSchema.test.ts`

- [ ] **Step 1: Read required metadata docs**

Run:

```bash
sed -n '1,220p' .agents/knowledge/metadata/INDEX.md
sed -n '1,220p' .agents/knowledge/metadata/yaml-contract.md
sed -n '1,220p' .agents/knowledge/metadata/round-trip-cycle.md
```

Expected: read the documents before editing `packages/core/metadata/**`.

- [ ] **Step 2: Add XML import tests**

In `packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/fromXML.test.ts`, add these tests inside `describe("import Appearance from XML", ...)`:

```ts
  it("imports DCS auto text color as present parameter without value", () => {
    const result = testImportPropertyFromXML({
      rule,
      xmlRootTag: "dcsset:appearance",
      xmlString: `
<dcsset:appearance xmlns:dcsset="http://v8.1c.ru/8.1/data-composition-system/settings" xmlns:dcscor="http://v8.1c.ru/8.1/data-composition-system/core" xmlns:v8ui="http://v8.1c.ru/8.1/data/ui" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dcscor:item xsi:type="dcsset:SettingsParameterValue">
    <dcscor:parameter>ЦветТекста</dcscor:parameter>
    <dcscor:value xsi:type="v8ui:Color">auto</dcscor:value>
  </dcscor:item>
</dcsset:appearance>`,
    })

    expect(result).toEqual({
      itemType: "AppearanceFields",
      ЦветТекста: {
        parameter: "ЦветТекста",
      },
    })
  })

  it("imports disabled DCS auto background color without value", () => {
    const result = testImportPropertyFromXML({
      rule,
      xmlRootTag: "dcsset:appearance",
      xmlString: `
<dcsset:appearance xmlns:dcsset="http://v8.1c.ru/8.1/data-composition-system/settings" xmlns:dcscor="http://v8.1c.ru/8.1/data-composition-system/core" xmlns:v8ui="http://v8.1c.ru/8.1/data/ui" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dcscor:item xsi:type="dcsset:SettingsParameterValue">
    <dcscor:use>false</dcscor:use>
    <dcscor:parameter>ЦветФона</dcscor:parameter>
    <dcscor:value xsi:type="v8ui:Color">auto</dcscor:value>
  </dcscor:item>
</dcsset:appearance>`,
    })

    expect(result).toEqual({
      itemType: "AppearanceFields",
      ЦветФона: {
        parameter: "ЦветФона",
        use: false,
      },
    })
  })
```

- [ ] **Step 3: Add YAML import tests**

In `packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/fromYAML.test.ts`, add:

```ts
  it("imports empty color parameter as enabled DCS auto color", () => {
    const result = testImportPropertyFromYAML({
      rule,
      value: {
        ЦветТекста: null,
      },
    })

    expect(result).toEqual({
      itemType: "AppearanceFields",
      ЦветТекста: {
        parameter: "ЦветТекста",
      },
    })
  })

  it("keeps non-color empty SettingsParameterValue unchanged", () => {
    const result = testImportPropertyFromYAML({
      rule,
      value: {
        Текст: null,
      },
    })

    expect(result).toEqual({
      itemType: "AppearanceFields",
    })
  })
```

- [ ] **Step 4: Add YAML export tests**

In `packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/toYAML.test.ts`, add:

```ts
  it("exports enabled DCS auto color as empty YAML value", () => {
    const result = testExportPropertyToYAML({
      rule,
      value: {
        itemType: "AppearanceFields",
        ЦветТекста: {
          parameter: "ЦветТекста",
        },
      },
    })

    expect(result).toEqual({
      Оформление: {
        ЦветТекста: null,
      },
    })
  })

  it("exports disabled DCS auto color without YAML value", () => {
    const result = testExportPropertyToYAML({
      rule,
      value: {
        itemType: "AppearanceFields",
        ЦветФона: {
          parameter: "ЦветФона",
          use: false,
        },
      },
    })

    expect(result).toEqual({
      Оформление: {
        ЦветФона: {
          Использовать: "Ложь",
        },
      },
    })
  })
```

- [ ] **Step 5: Add XML export tests**

In `packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/toXML.test.ts`, add:

```ts
  it("restores XML auto value for enabled DCS color without YAML value", () => {
    const { result } = testExportPropertyToXML({
      rule: fixtureAppearanceRule,
      value: {
        itemType: "AppearanceFields",
        ЦветТекста: {
          parameter: "ЦветТекста",
        },
      },
      xmlRootTag: "dcsset:appearance",
    })

    expect(result).toContain("<dcscor:parameter>ЦветТекста</dcscor:parameter>")
    expect(result).toContain('<dcscor:value xsi:type="v8ui:Color">auto</dcscor:value>')
  })

  it("restores XML auto value for disabled DCS color without YAML value", () => {
    const { result } = testExportPropertyToXML({
      rule: fixtureAppearanceRule,
      value: {
        itemType: "AppearanceFields",
        ЦветФона: {
          parameter: "ЦветФона",
          use: false,
        },
      },
      xmlRootTag: "dcsset:appearance",
    })

    expect(result).toContain("<dcscor:use>false</dcscor:use>")
    expect(result).toContain("<dcscor:parameter>ЦветФона</dcscor:parameter>")
    expect(result).toContain('<dcscor:value xsi:type="v8ui:Color">auto</dcscor:value>')
  })
```

- [ ] **Step 6: Add JSON Schema tests**

In `packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/toJSONSchema.test.ts`, add:

```ts
  it("accepts omitted value for color SettingsParameterValue", () => {
    const compiled = schemaFor()

    expect(compiled.Check({ ЦветТекста: null })).toBe(true)
    expect(compiled.Check({ ЦветФона: { Использовать: "Ложь" } })).toBe(true)
  })

  it("does not accept auto as a normal color value", () => {
    const compiled = schemaFor()

    expect(compiled.Check({ ЦветТекста: "auto" })).toBe(false)
  })
```

- [ ] **Step 7: Run tests and verify red**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate metadata/commonObjects/dataCompositionSystem/appearanceFields/fromXML.test.ts metadata/commonObjects/dataCompositionSystem/appearanceFields/fromYAML.test.ts metadata/commonObjects/dataCompositionSystem/appearanceFields/toYAML.test.ts metadata/commonObjects/dataCompositionSystem/appearanceFields/toXML.test.ts metadata/commonObjects/dataCompositionSystem/appearanceFields/toJSONSchema.test.ts
```

Expected: FAIL. The new tests fail because `auto` is still imported/exported as a color value and `null` color YAML imports as absent.

---

### Task 2: Implement DCS Auto Color YAML Semantics

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromYAML.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toYAML.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toXML.ts`

- [ ] **Step 1: Update color YAML import**

In `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromYAML.ts`, change the early null guard from:

```ts
  if (yaml === undefined || yaml === null) {
    return undefined
  }
```

to:

```ts
  if (yaml === undefined) {
    return undefined
  }

  if (yaml === null && rule.valueType !== "Color") {
    return undefined
  }
```

This allows `ЦветТекста:` to continue through the existing parser only for color settings. The existing `parameterFromRule` path will produce `{ parameter: "ЦветТекста" }`.

- [ ] **Step 2: Add auto-color helpers to YAML export**

In `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toYAML.ts`, add imports:

```ts
import type { Color } from "~/metadata/commonObjects/color/types"
```

Add helper functions after `hasSettingsExtension`:

```ts
const isDcsAutoColorValue = (value: unknown): value is Color =>
  typeof value === "object" &&
  value !== null &&
  !Array.isArray(value) &&
  "type" in value &&
  "value" in value &&
  (value as { type?: unknown }).type === "Absolute" &&
  (value as { value?: unknown }).value === "auto"

const shouldHideDcsAutoColorValue = (
  rule: SettingsParameterValuePropertyRule,
  values: MetadataDcsMetadataValue[]
): boolean => rule.valueType === "Color" && values.length === 1 && isDcsAutoColorValue(values[0])
```

- [ ] **Step 3: Hide auto color during YAML export**

In `exportParameterValueToYAML`, after:

```ts
  const values = normalizeValues(data.value)
```

insert:

```ts
  const hideAutoColorValue = shouldHideDcsAutoColorValue(rule, values)
  const valuesForYAML = hideAutoColorValue ? [] : values
```

Then replace:

```ts
  const exportedValues = values.map((v) => exportDcsMetadataValueToYAML(context, dcsRule, v))
```

with:

```ts
  const exportedValues = valuesForYAML.map((v) => exportDcsMetadataValueToYAML(context, dcsRule, v))
```

At the end of the function, before:

```ts
  return base as ParameterValueYAML
```

insert:

```ts
  if (rule.valueType === "Color" && !hasUse && !hasValue && !hasElements) {
    return null as unknown as ParameterValueYAML
  }
```

This makes active auto color export as an empty YAML value, while disabled auto color keeps `{ Использовать: "Ложь" }`.

- [ ] **Step 4: Restore auto color during XML export**

In `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toXML.ts`, add after `normalizeValues`:

```ts
const shouldRestoreDcsAutoColorValue = (
  rule: SettingsParameterValuePropertyRule,
  data: ParameterValue | SettingsParameterValue
): boolean => rule.valueType === "Color" && data.value === undefined
```

In `exportParameterValueToDcsXML`, after:

```ts
  const values = normalizeValues(data.value)
```

insert:

```ts
  const valuesForXML: MetadataDcsMetadataValue[] = shouldRestoreDcsAutoColorValue(rule, data)
    ? [{ type: "Absolute", value: "auto" } as unknown as MetadataDcsMetadataValue]
    : values
```

Then replace:

```ts
  for (const v of values) {
```

with:

```ts
  for (const v of valuesForXML) {
```

- [ ] **Step 5: Run focused tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate metadata/commonObjects/dataCompositionSystem/appearanceFields/fromXML.test.ts metadata/commonObjects/dataCompositionSystem/appearanceFields/fromYAML.test.ts metadata/commonObjects/dataCompositionSystem/appearanceFields/toYAML.test.ts metadata/commonObjects/dataCompositionSystem/appearanceFields/toXML.test.ts metadata/commonObjects/dataCompositionSystem/appearanceFields/toJSONSchema.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit implementation**

Run:

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromYAML.ts packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toYAML.ts packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toXML.ts packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/fromXML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/fromYAML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/toYAML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/toXML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/toJSONSchema.test.ts
git commit -m "fix: :bug: скрыть DCS auto color в YAML"
```

Expected: commit created.

---

### Task 3: Verify ERP Validation Effect

**Files:**
- No source files.

- [ ] **Step 1: Rebuild ERP YAML with the new export behavior**

Run:

```bash
rm -rf /home/nikita/git/temp-yaml/*
pnpm --filter @nakidka/cli dev import /home/nikita/git/round-trip/erp /home/nikita/git/temp-yaml
```

Expected: import completes without failed files. The destructive cleanup command must be run only with explicit approval.

- [ ] **Step 2: Confirm DCS auto color is hidden from regenerated YAML**

Run:

```bash
rg -n "Цвет(Текста|Фона): auto|Значение: auto" /home/nikita/git/temp-yaml
```

Expected: no output for the regenerated ERP YAML.

- [ ] **Step 3: Run ERP validate**

Run:

```bash
pnpm --filter @nakidka/cli dev validate /home/nikita/git/temp-yaml > /tmp/erp-validate-after-dcs-auto-color.log 2>&1
```

Expected: command may still exit non-zero because unrelated ERP validation errors remain.

- [ ] **Step 4: Count remaining union errors**

Run:

```bash
rg "Expected union value" /tmp/erp-validate-after-dcs-auto-color.log | wc -l
```

Expected: the count drops from `158`. Some union errors may remain for filters, groups, arrays, or `ChoiceParameters` because this plan only covers DCS auto color.

- [ ] **Step 5: Confirm old auto color locations no longer fail validation**

Run:

```bash
rg "ФормаНастройкиШкалыПериодов/Форма.yaml:320|ФормаНастройкиШкалыПериодов/Форма.yaml:330|ПланЗакупок/Формы/ФормаСписка/Форма.yaml:378|ПланЗакупок/Формы/ФормаСписка/Форма.yaml:381" /tmp/erp-validate-after-dcs-auto-color.log
```

Expected: no output for these old auto color schema diagnostics.

- [ ] **Step 6: Run full package tests**

Run:

```bash
pnpm --filter '@nakidka/core' test
```

Expected: PASS.

- [ ] **Step 7: Run full project tests before closing the issue**

Run from repository root:

```bash
pnpm test
```

Expected: PASS for all packages.
