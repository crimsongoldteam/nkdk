# SettingsParameterValue Full YAML Form Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every `SettingsParameterValue` export to canonical full YAML form while keeping legacy compact YAML readable.

**Architecture:** Keep wrapper handling inside `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/*`. `SettingsParameterValue.fromYAML` decides whether YAML is a full wrapper or a raw value; value-specific importers such as `Color.fromYAML` continue to receive only raw values. `SettingsParameterValue.toYAML` always returns an object wrapper and collection export keeps the parameter name as the outer map key.

**Tech Stack:** TypeScript, Vitest, pnpm, existing metadata rule/type registry, YAML import/export helpers.

---

## File Structure

- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromYAML.ts`
  - Responsibility: recognize full `SettingsParameterValue` wrapper forms without misclassifying legacy object values such as `{ Тип, Значение }`.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toYAML.ts`
  - Responsibility: export all `SettingsParameterValue` values as full object form.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/types.ts`
  - Responsibility: narrow YAML types so `ParameterValueYAML` / `SettingsParameterValueYAML` document full object output while import still accepts legacy input through runtime code.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/__fixtures__/data.ts`
  - Responsibility: update canonical YAML fixture expectations to full form.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromYAML.test.ts`
  - Responsibility: regression tests for full-form import and legacy compact import.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toYAML.test.ts`
  - Responsibility: regression tests for canonical full-form export.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/__fixtures__/data.ts`
  - Responsibility: update canonical `AppearanceFields` YAML fixture to full form for every `SettingsParameterValue` field.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/fromYAML.test.ts`
  - Responsibility: integration import coverage for `ЦветФона` / `ЦветТекста` full form and legacy compact form.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/toYAML.test.ts`
  - Responsibility: integration export coverage for full-form colors, including enabled and disabled auto color.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/settingsParameterValueCollection/__fixtures__/data.ts`
  - Responsibility: update collection fixture so the outer key remains the parameter name and the inner value is full form.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/settingsParameterValueCollection/fromYAML.test.ts`
  - Responsibility: verify collection import still reads compact legacy entries and full entries.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/settingsParameterValueCollection/toYAML.test.ts`
  - Responsibility: verify collection export uses full entries.

## Task 1: Metadata Context And Import Tests

**Files:**
- Read: `.agents/knowledge/metadata/INDEX.md`
- Read: `.agents/knowledge/metadata/sources-of-truth.md`
- Read: `.agents/knowledge/metadata/round-trip-cycle.md`
- Read: `.agents/knowledge/metadata/yaml-contract.md`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/fromYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/settingsParameterValueCollection/fromYAML.test.ts`

- [ ] **Step 1: Read required metadata knowledge**

Run:

```bash
sed -n '1,220p' .agents/knowledge/metadata/INDEX.md
sed -n '1,260p' .agents/knowledge/metadata/sources-of-truth.md
sed -n '1,260p' .agents/knowledge/metadata/round-trip-cycle.md
sed -n '1,260p' .agents/knowledge/metadata/yaml-contract.md
```

Expected: all four files are readable. Keep the rule "do not edit XML fixtures" in mind.

- [ ] **Step 2: Add failing full-form and legacy import tests for `SettingsParameterValue`**

Append these tests inside `describe("importParameterValueFromYAML (через importPropertyFromYAML)", () => { ... })` in `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromYAML.test.ts`:

```ts
  it("imports full color value form without passing wrapper to Color importer", () => {
    const result = testImportPropertyFromYAML({
      rule: { type: "SettingsParameterValue", valueType: "Color", yaml: "ЦветТекста" } as PropertyRule,
      value: {
        Значение: "#FF0000",
      },
    })

    expect(result).toEqual({
      parameter: "ЦветТекста",
      value: {
        type: "Absolute",
        value: "#FF0000",
      },
    })
  })

  it("imports disabled full color value form", () => {
    const result = testImportPropertyFromYAML({
      rule: { type: "SettingsParameterValue", valueType: "Color", yaml: "ЦветТекста" } as PropertyRule,
      value: {
        Использовать: "Ложь",
        Значение: "#FF0000",
      },
    })

    expect(result).toEqual({
      parameter: "ЦветТекста",
      use: false,
      value: {
        type: "Absolute",
        value: "#FF0000",
      },
    })
  })

  it("keeps legacy explicit DCS object value readable as compact value", () => {
    const result = testImportPropertyFromYAML({
      rule: { type: "SettingsParameterValue", valueType: "Field", yaml: "Текст" } as PropertyRule,
      value: {
        Тип: "Поле",
        Значение: "Сертификаты.СертификатПредставление",
      },
    })

    expect(result).toEqual({
      parameter: "Текст",
      value: {
        type: "Field",
        value: "Сертификаты.СертификатПредставление",
      },
    })
  })

  it("imports object DCS value from full wrapper without flattening inner object", () => {
    const result = testImportPropertyFromYAML({
      rule: { type: "SettingsParameterValue", valueType: "Field", yaml: "Текст" } as PropertyRule,
      value: {
        Значение: {
          Тип: "Поле",
          Значение: "Сертификаты.СертификатПредставление",
        },
      },
    })

    expect(result).toEqual({
      parameter: "Текст",
      value: {
        type: "Field",
        value: "Сертификаты.СертификатПредставление",
      },
    })
  })
```

- [ ] **Step 3: Add failing full-form integration tests for `AppearanceFields` import**

Append these tests inside `describe("import Appearance from YAML", () => { ... })` in `packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/fromYAML.test.ts`:

```ts
  it("imports full color appearance value form", () => {
    const result = testImportPropertyFromYAML({
      rule,
      value: {
        ЦветТекста: {
          Значение: "#FF0000",
        },
      },
    })

    expect(result).toEqual({
      itemType: "AppearanceFields",
      ЦветТекста: {
        parameter: "ЦветТекста",
        value: {
          type: "Absolute",
          value: "#FF0000",
        },
      },
    })
  })

  it("keeps legacy compact color appearance readable", () => {
    const result = testImportPropertyFromYAML({
      rule,
      value: {
        ЦветТекста: "#FF0000",
      },
    })

    expect(result).toEqual({
      itemType: "AppearanceFields",
      ЦветТекста: {
        parameter: "ЦветТекста",
        value: {
          type: "Absolute",
          value: "#FF0000",
        },
      },
    })
  })
```

- [ ] **Step 4: Add failing collection import test for full entries**

Append this test inside `describe("import SettingsParameterValueCollection from YAML", () => { ... })` in `packages/core/metadata/commonObjects/dataCompositionSystem/settingsParameterValueCollection/fromYAML.test.ts`:

```ts
  it("imports full SettingsParameterValue entries while keeping outer parameter name", () => {
    const result = testImportPropertyFromYAML({
      rule,
      value: {
        Параметр1: {
          Значение: "ПараметрыДанных.Параметр1",
        },
      },
    })

    expect(result).toEqual({
      itemType: "SettingsParameterValueCollection",
      parameters: {
        Параметр1: {
          parameter: "Параметр1",
          value: "ПараметрыДанных.Параметр1",
        },
      },
    })
  })
```

If `rule` is not currently file-scoped in `fromYAML.test.ts`, move the existing rule constant from the nearest test block to file scope with this exact value:

```ts
const rule: PropertyRule = {
  type: "SettingsParameterValueCollection",
  yaml: "ПараметрыДанных",
  defaultItemRule: {
    type: "SettingsParameterValue",
    valueType: "Field",
  },
}
```

- [ ] **Step 5: Run import tests and verify failure**

Run:

```bash
pnpm --dir packages/core vitest run \
  metadata/commonObjects/dataCompositionSystem/parameterValue/fromYAML.test.ts \
  metadata/commonObjects/dataCompositionSystem/appearanceFields/fromYAML.test.ts \
  metadata/commonObjects/dataCompositionSystem/settingsParameterValueCollection/fromYAML.test.ts
```

Expected: at least one new test fails with `value.startsWith is not a function` or a mismatch showing compact/full form handling is not yet correct.

- [ ] **Step 6: Commit failing tests**

Run:

```bash
git add \
  packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromYAML.test.ts \
  packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/fromYAML.test.ts \
  packages/core/metadata/commonObjects/dataCompositionSystem/settingsParameterValueCollection/fromYAML.test.ts
git commit -m "test: :white_check_mark: зафиксировать полную форму SettingsParameterValue"
```

Expected: commit succeeds and contains only failing regression tests.

## Task 2: Import Boundary Normalization

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromYAML.ts`
- Test: `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromYAML.test.ts`
- Test: `packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/fromYAML.test.ts`
- Test: `packages/core/metadata/commonObjects/dataCompositionSystem/settingsParameterValueCollection/fromYAML.test.ts`

- [ ] **Step 1: Replace full-form detection helpers**

In `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromYAML.ts`, replace the current `isExplicitDcsValueYAML` helper with these helpers:

```ts
const isExplicitDcsValueYAML = (x: unknown): x is Record<string, unknown> =>
  isYamlObject(x) && typeof x["Тип"] === "string" && "Значение" in x

const hasSettingsParameterValueWrapperKey = (x: Record<string, unknown>): boolean =>
  "Использовать" in x ||
  "Элементы" in x ||
  x["РежимОтображения"] !== undefined ||
  x["ИдентификаторПользовательскойНастройки"] !== undefined ||
  x["ПредставлениеПользовательскойНастройки"] !== undefined

const isExpandedSettingsParameterValueShape = (x: unknown): x is Record<string, unknown> =>
  isYamlObject(x) && (hasSettingsParameterValueWrapperKey(x) || ("Значение" in x && !isExplicitDcsValueYAML(x)))
```

- [ ] **Step 2: Use the new helper in `importParameterValueFromYAML`**

In `importParameterValueFromYAML`, replace this block:

```ts
  const y = isYamlObject(yamlToParse) ? (yamlToParse as Record<string, unknown>) : undefined
  const parameterFromRule = typeof rule.yaml === "string" ? rule.yaml : undefined
  const isExpandedSpvShape =
    y !== undefined &&
    ("Значение" in y ||
      "Использовать" in y ||
      "Элементы" in y ||
      y["РежимОтображения"] !== undefined ||
      y["ИдентификаторПользовательскойНастройки"] !== undefined ||
      y["ПредставлениеПользовательскойНастройки"] !== undefined)
```

with:

```ts
  const y = isExpandedSettingsParameterValueShape(yamlToParse) ? yamlToParse : undefined
  const parameterFromRule = typeof rule.yaml === "string" ? rule.yaml : undefined
  const isExpandedSpvShape = y !== undefined
```

- [ ] **Step 3: Simplify raw value selection**

In `importParameterValueFromYAML`, replace the `rawValueBase` expression:

```ts
  const rawValueBase =
    rule.valueType === "Color" && yamlToParse === null
      ? undefined
      : isExplicitDcsValueYAML(yamlToParse)
        ? yamlToParse
        : hasExplicitValue
          ? restoreExplicitRawValue(y, "Значение", y["Значение"])
          : isExpandedSpvShape
            ? undefined
            : yamlToParse
```

with:

```ts
  const rawValueBase =
    rule.valueType === "Color" && yamlToParse === null
      ? undefined
      : hasExplicitValue
        ? restoreExplicitRawValue(y, "Значение", y["Значение"])
        : isExpandedSpvShape
          ? undefined
          : yamlToParse
```

This keeps legacy `{ Тип, Значение }` object values in the compact branch because `y` is `undefined` for them.

- [ ] **Step 4: Run import tests and verify pass**

Run:

```bash
pnpm --dir packages/core vitest run \
  metadata/commonObjects/dataCompositionSystem/parameterValue/fromYAML.test.ts \
  metadata/commonObjects/dataCompositionSystem/appearanceFields/fromYAML.test.ts \
  metadata/commonObjects/dataCompositionSystem/settingsParameterValueCollection/fromYAML.test.ts
```

Expected: all selected import tests pass.

- [ ] **Step 5: Commit import fix**

Run:

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromYAML.ts
git commit -m "fix: :bug: нормализовать полную форму SettingsParameterValue"
```

Expected: commit succeeds and includes only the import implementation.

## Task 3: Canonical Full-Form Export

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toYAML.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/types.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/__fixtures__/data.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/__fixtures__/data.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/toYAML.test.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/settingsParameterValueCollection/__fixtures__/data.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/settingsParameterValueCollection/toYAML.test.ts`

- [ ] **Step 1: Update canonical fixture YAML for `parameterValue`**

In `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/__fixtures__/data.ts`, change every fixture with compact `yaml` value to full form:

```ts
    yaml: {
      Значение: fixtureFormatLocalStringYAML,
    },
```

```ts
    yaml: {
      Значение: "Поле1(2)",
    },
```

```ts
    yaml: {
      Значение: fixtureChoiceParameterDecimalYAML,
    },
```

```ts
    yaml: {
      Значение: fixtureChoiceParameterLinksYAML,
    },
```

```ts
    yaml: {
      Значение: "Элементы",
    },
```

```ts
    yaml: {
      Значение: "Синий",
    },
```

Leave fixtures that already contain `Использовать` and `Значение` in full form unchanged.

- [ ] **Step 2: Add explicit export tests for full form**

Append these tests inside `describe("exportParameterValueToYAML (через exportPropertyToYAML)", () => { ... })` in `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toYAML.test.ts`:

```ts
  it("exports value-only SettingsParameterValue in full form", () => {
    const result = testExportPropertyToYAML({
      rule: { type: "SettingsParameterValue", valueType: "Color", yaml: "ЦветТекста" } as PropertyRule,
      value: {
        parameter: "ЦветТекста",
        value: {
          type: "Absolute",
          value: "#FF0000",
        },
      },
    })

    expect(result).toEqual({
      ЦветТекста: {
        Значение: "#FF0000",
      },
    })
  })

  it("exports disabled SettingsParameterValue in full form", () => {
    const result = testExportPropertyToYAML({
      rule: { type: "SettingsParameterValue", valueType: "Color", yaml: "ЦветТекста" } as PropertyRule,
      value: {
        parameter: "ЦветТекста",
        use: false,
        value: {
          type: "Absolute",
          value: "#FF0000",
        },
      },
    })

    expect(result).toEqual({
      ЦветТекста: {
        Использовать: "Ложь",
        Значение: "#FF0000",
      },
    })
  })
```

- [ ] **Step 3: Remove compact-return branch from export**

In `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toYAML.ts`, delete this branch:

```ts
  if (!hasSettingsExtension(data) && !hasUse && hasValue && !hasElements) {
    return значение as ParameterValueYAML
  }
```

Keep the existing color auto-value branch:

```ts
  if (rule.valueType === "Color" && !hasUse && !hasValue && !hasElements) {
    return null
  }
```

The final `return base as ParameterValueYAML` now becomes the canonical value-only path.

- [ ] **Step 4: Update YAML output types**

In `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/types.ts`, replace:

```ts
export type ParameterValueYAML = MetadataDcsMetadataValueYAML | ParameterValueYAMLObject
```

with:

```ts
export type ParameterValueYAML = ParameterValueYAMLObject
export type LegacyParameterValueYAML = MetadataDcsMetadataValueYAML
```

Replace:

```ts
export type SettingsParameterValueYAML = MetadataDcsMetadataValueYAML | SettingsParameterValueYAMLObject
```

with:

```ts
export type SettingsParameterValueYAML = SettingsParameterValueYAMLObject
export type LegacySettingsParameterValueYAML = MetadataDcsMetadataValueYAML
```

Then update `fromYAML.ts` imports and parameter types to accept legacy input explicitly:

```ts
  LegacyParameterValueYAML,
  LegacySettingsParameterValueYAML,
```

and change the `yaml` parameter type to:

```ts
  yaml: ParameterValueYAML | SettingsParameterValueYAML | LegacyParameterValueYAML | LegacySettingsParameterValueYAML,
```

Also update `settingsParameterValueCollection/fromYAML.ts` imports if TypeScript reports a type error around legacy fragments.

- [ ] **Step 5: Update `AppearanceFields` fixture YAML to full form**

In `packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/__fixtures__/data.ts`, replace `fixtureAppearanceFieldsYAML` with:

```ts
export const fixtureAppearanceFieldsYAML: AppearanceFieldsYAML = {
  ЦветФона: {
    Использовать: "Ложь",
    Значение: "Красный",
  },
  ЦветТекста: { Значение: "Синий" },
  Шрифт: { Значение: { Вид: "ОченьКрупныйШрифтТекста" } },
  ГоризонтальноеПоложение: { Значение: "Центр" },
  Формат: { Значение: "ЧЦ=3; ЧДЦ=2" },
  ВыделятьОтрицательные: { Значение: "Истина" },
  ОтметкаНезаполненного: { Значение: "Истина" },
  Текст: { Значение: "Текст" },
  Видимость: { Значение: "Ложь" },
  Доступность: { Значение: "Ложь" },
  ТолькоПросмотр: { Значение: "Истина" },
  Отображать: { Значение: "Ложь" },
}
```

- [ ] **Step 6: Update auto-color export tests**

In `packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/toYAML.test.ts`, keep the enabled auto-color expectation unchanged:

```ts
expect(result).toEqual({
  Оформление: {
    ЦветТекста: null,
  },
})
```

Keep the disabled auto-color expectation unchanged:

```ts
expect(result).toEqual({
  Оформление: {
    ЦветФона: {
      Использовать: "Ложь",
    },
  },
})
```

Add this test inside the same `describe`:

```ts
  it("exports non-auto color in full SettingsParameterValue form", () => {
    const result = testExportPropertyToYAML({
      rule,
      value: {
        itemType: "AppearanceFields",
        ЦветТекста: {
          parameter: "ЦветТекста",
          value: {
            type: "Absolute",
            value: "#FF0000",
          },
        },
      },
    })

    expect(result).toEqual({
      Оформление: {
        ЦветТекста: {
          Значение: "#FF0000",
        },
      },
    })
  })
```

- [ ] **Step 7: Update collection fixture YAML to full inner form**

In `packages/core/metadata/commonObjects/dataCompositionSystem/settingsParameterValueCollection/__fixtures__/data.ts`, replace:

```ts
export const settingsParameterValueCollectionFixtureYAML = {
  Параметр1: "ПараметрыДанных.Параметр1",
} as const satisfies SettingsParameterValueCollectionYAML
```

with:

```ts
export const settingsParameterValueCollectionFixtureYAML = {
  Параметр1: {
    Значение: "ПараметрыДанных.Параметр1",
  },
} as const satisfies SettingsParameterValueCollectionYAML
```

- [ ] **Step 8: Run export tests and fix type errors**

Run:

```bash
pnpm --dir packages/core vitest run \
  metadata/commonObjects/dataCompositionSystem/parameterValue/toYAML.test.ts \
  metadata/commonObjects/dataCompositionSystem/appearanceFields/toYAML.test.ts \
  metadata/commonObjects/dataCompositionSystem/settingsParameterValueCollection/toYAML.test.ts
```

Expected: all selected export tests pass.

Then run type checking through the full test command for this package subset:

```bash
pnpm --dir packages/core test
```

Expected: package tests pass. If TypeScript reports only type-level legacy input errors, update local input types in `fromYAML.ts` or collection `fromYAML.ts`; do not reintroduce compact output types.

- [ ] **Step 9: Commit export fix**

Run:

```bash
git add \
  packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toYAML.ts \
  packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/types.ts \
  packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/__fixtures__/data.ts \
  packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toYAML.test.ts \
  packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/__fixtures__/data.ts \
  packages/core/metadata/commonObjects/dataCompositionSystem/appearanceFields/toYAML.test.ts \
  packages/core/metadata/commonObjects/dataCompositionSystem/settingsParameterValueCollection/__fixtures__/data.ts \
  packages/core/metadata/commonObjects/dataCompositionSystem/settingsParameterValueCollection/toYAML.test.ts
git commit -m "fix: :bug: экспортировать SettingsParameterValue полной формой"
```

Expected: commit succeeds and contains only export/type/fixture changes.

## Task 4: Schema Compatibility And Final Verification

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toJSONSchema.test.ts`
- Modify if needed: `packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toJSONSchema.ts`
- Read: `docs/superpowers/specs/2026-06-20-settings-parameter-value-full-yaml-design.md`

- [ ] **Step 1: Check schema expectations**

Run:

```bash
pnpm --dir packages/core vitest run metadata/commonObjects/dataCompositionSystem/parameterValue/toJSONSchema.test.ts
```

Expected: tests either pass or fail only where the schema still documents compact canonical output.

- [ ] **Step 2: If schema still accepts only compact output, add explicit full-form schema assertion**

If `toJSONSchema.test.ts` lacks full-form acceptance for a value-only parameter, add this test inside `describe("SettingsParameterValue exportToJSONSchema", () => { ... })`:

```ts
  it("accepts full value-only form as canonical SettingsParameterValue YAML", () => {
    const rule = { type: "SettingsParameterValue", valueType: "Color", yaml: "Цвет" } as const

    expect(errorsFor(rule, { Значение: "#FF0000" })).toEqual([])
  })
```

Run:

```bash
pnpm --dir packages/core vitest run metadata/commonObjects/dataCompositionSystem/parameterValue/toJSONSchema.test.ts
```

Expected: the new schema test passes. If it fails, update `toJSONSchema.ts` so full object form with `Значение` is accepted. Keep compact form accepted for backward compatibility unless an existing test already intentionally rejects it.

- [ ] **Step 3: Run focused DCS tests**

Run:

```bash
pnpm --dir packages/core vitest run \
  metadata/commonObjects/dataCompositionSystem/parameterValue \
  metadata/commonObjects/dataCompositionSystem/appearanceFields \
  metadata/commonObjects/dataCompositionSystem/settingsParameterValueCollection
```

Expected: all focused tests pass.

- [ ] **Step 4: Run full project tests**

Run from the worktree root:

```bash
pnpm test
```

Expected: all tests in `packages/core` and `packages/cli` pass.

- [ ] **Step 5: Rerun diagnostic round-trip**

Run from the worktree root:

```bash
./.agents/skills/round-trip-yaml/round-trip.sh
```

Expected: `nkdk sync` no longer stops with:

```text
value.startsWith is not a function
```

If the script reports XML diffs, capture the first selected diff as the next diagnostic result. Do not edit XML fixtures.

- [ ] **Step 6: Commit schema or verification-only changes**

If Step 2 changed schema code or tests, run:

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toJSONSchema.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toJSONSchema.ts
git commit -m "test: :white_check_mark: проверить схему SettingsParameterValue"
```

If Step 2 made no file changes, skip this commit.

- [ ] **Step 7: Final status**

Run:

```bash
git status --short
git log --oneline -5
```

Expected: `git status --short` is empty. The recent log includes the test/import/export commits from this plan.

## Self-Review Notes

- Spec coverage:
  - Full canonical output: Task 3.
  - Legacy compact import: Task 1 and Task 2.
  - Wrapper-specific boundary: Task 2.
  - No value-specific wrapper parsing: Task 2 and `AppearanceFields` tests.
  - Collection outer key preservation: Task 1 and Task 3.
  - Full verification and round-trip rerun: Task 4.
- Placeholder scan: no unfinished markers or unspecified implementation steps are intentionally present.
- Type consistency: the plan uses existing names `ParameterValueYAMLObject`, `SettingsParameterValueYAMLObject`, `importParameterValueFromYAML`, `exportParameterValueToYAML`, `SettingsParameterValueCollectionYAML`, and `testImportPropertyFromYAML` consistently.
