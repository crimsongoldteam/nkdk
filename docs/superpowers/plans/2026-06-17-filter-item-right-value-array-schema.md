# FilterItem rightValue Array JSON Schema Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Разрешить YAML-массив в `FilterItemComparison.ПравоеЗначение` при JSON Schema валидации, не меняя XML/YAML преобразование и не расширяя остальные поля типа `DcsMetadataTypedValue`.

**Architecture:** Изменение остаётся внутри схемы `FilterItem`: обычная схема `DcsMetadataTypedValue` продолжает использоваться для `ЛевоеЗначение`, а для YAML-ключа `ПравоеЗначение` в сравнении локально подставляется union из одиночного значения и массива значений. Существующий рекурсивный `FilterItemGroup` и поведение XML/YAML не меняются.

**Tech Stack:** TypeScript, TypeBox JSON Schema, Vitest, pnpm, CLI `@nakidka/cli`.

---

## File Structure

- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/toJSONSchema.test.ts`
  - Добавляет проверку массива `ПравоеЗначение` для `ВСписке`.
  - Добавляет защитную проверку, что `ЛевоеЗначение` не стало принимать массив.
  - Сохраняет проверку скалярного `ПравоеЗначение`.
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/toJSONSchema.ts`
  - Добавляет локальную схему `FilterItemRightValueJSONSchema`.
  - Строит схему `FilterItemComparison` как раньше, затем заменяет только YAML-свойство `ПравоеЗначение` на одиночное значение или массив.
  - Не меняет общий `DcsMetadataTypedValueJSONSchema`.

## Task 1: Red Tests For Array rightValue

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/toJSONSchema.test.ts`

- [ ] **Step 1: Add a local schema helper to the test file**

Add this helper inside `describe("FilterItem JSON Schema", () => { ... })`, before the first `it(...)`:

```ts
  const compileFilterItemSchema = () => {
    const schema = exportPropertyToJSONSchema({
      context,
      rule: { type: "FilterItem", yaml: "Элементы" },
      value: undefined,
    })

    return TypeCompiler.Compile(schema!)
  }
```

- [ ] **Step 2: Replace repeated schema compilation in existing tests**

In every existing test in `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/toJSONSchema.test.ts`, replace this block:

```ts
    const schema = exportPropertyToJSONSchema({
      context,
      rule: { type: "FilterItem", yaml: "Элементы" },
      value: undefined,
    })
    const compiled = TypeCompiler.Compile(schema!)
```

with:

```ts
    const compiled = compileFilterItemSchema()
```

- [ ] **Step 3: Add failing tests for array-shaped `ПравоеЗначение`**

Add these tests after `it("accepts comparison items", ...)`:

```ts
  it("accepts InList comparison items with string array right value", () => {
    const compiled = compileFilterItemSchema()

    expect(
      compiled.Check([
        {
          ЛевоеЗначение: ".Состояние",
          ВидСравнения: "ВСписке",
          ПравоеЗначение: ["'Согласовано'", "'Не согласовано'"],
        },
      ])
    ).toBe(true)
  })

  it("accepts InList comparison items with enumeration-reference array right value", () => {
    const compiled = compileFilterItemSchema()

    expect(
      compiled.Check([
        {
          ЛевоеЗначение: ".Объект.ВНА.СпособНачисленияАмортизацииМСФО",
          ВидСравнения: "ВСписке",
          ПравоеЗначение: [
            "Перечисление.СпособыНачисленияАмортизацииВНА.Линейный",
            "Перечисление.СпособыНачисленияАмортизацииВНА.УменьшаемогоОстатка",
          ],
        },
      ])
    ).toBe(true)
  })
```

- [ ] **Step 4: Add regression tests for scalar right value and scalar left value**

Add these tests after the array tests:

```ts
  it("keeps accepting scalar comparison right value", () => {
    const compiled = compileFilterItemSchema()

    expect(
      compiled.Check([
        {
          ЛевоеЗначение: ".Просрочен",
          ПравоеЗначение: "Истина",
        },
      ])
    ).toBe(true)
  })

  it("does not accept array-shaped left value", () => {
    const compiled = compileFilterItemSchema()

    expect(
      compiled.Check([
        {
          ЛевоеЗначение: [".Состояние"],
          ВидСравнения: "ВСписке",
          ПравоеЗначение: ["'Согласовано'", "'Не согласовано'"],
        },
      ])
    ).toBe(false)
  })
```

- [ ] **Step 5: Run the focused test and verify it fails**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run --no-isolate --sequence.shuffle /home/nikita/git/nkdk/packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/toJSONSchema.test.ts
```

Expected: the new array `ПравоеЗначение` tests fail, while existing tests still pass.

## Task 2: Implement Local rightValue Schema Override

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/toJSONSchema.ts`

- [ ] **Step 1: Add TypeBox schema types and the local right-value schema**

Change the first import from TypeBox:

```ts
import { TSchema, Type } from "@sinclair/typebox"
```

Then add this constant after the imports:

```ts
const FilterItemRightValueJSONSchema = Type.Union([
  DcsMetadataTypedValueJSONSchema,
  Type.Array(DcsMetadataTypedValueJSONSchema),
])
```

- [ ] **Step 2: Add a helper that replaces only `ПравоеЗначение`**

Add this helper before `export const exportFilterItemToJSONSchema`:

```ts
type ObjectSchemaWithProperties = TSchema & {
  properties?: Record<string, TSchema>
}

const createFilterItemComparisonSchema = (context: ConfigurationContext): TSchema => {
  const comparisonSchema = exportMetadataItemToJSONSchema({
    context: createFilterItemSchemaContext(context),
    rule: FilterItemComparisonRules,
  }) as ObjectSchemaWithProperties

  if (comparisonSchema.properties?.["ПравоеЗначение"] === undefined) return comparisonSchema

  return Type.Object(
    {
      ...comparisonSchema.properties,
      ПравоеЗначение: Type.Optional(FilterItemRightValueJSONSchema),
    },
    { additionalProperties: false }
  )
}
```

This cast stays at the TypeBox integration boundary. It is intentionally local and covered by the tests from Task 1.

- [ ] **Step 3: Use the helper for comparison items only**

Replace the first union branch in `exportFilterItemToJSONSchema`:

```ts
      exportMetadataItemToJSONSchema({
        context: createFilterItemSchemaContext(context),
        rule: FilterItemComparisonRules,
      }),
```

with:

```ts
      createFilterItemComparisonSchema(context),
```

Leave the `FilterItemGroupRules` branch unchanged:

```ts
      exportMetadataItemToJSONSchema({
        context: createFilterItemSchemaContext(context, { FilterItem: Type.Array(This) }),
        rule: FilterItemGroupRules,
      }),
```

- [ ] **Step 4: Run the focused test and verify it passes**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run --no-isolate --sequence.shuffle /home/nikita/git/nkdk/packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/toJSONSchema.test.ts
```

Expected: all tests in `toJSONSchema.test.ts` pass.

## Task 3: Validate ERP Impact And Full Test Suite

**Files:**
- No file changes.

- [ ] **Step 1: Re-import ERP YAML from XML**

Run:

```bash
pnpm --filter '@nakidka/cli' exec tsx src/cli.ts import /home/nikita/git/round-trip/erp /home/nikita/git/temp-yaml
```

Expected: import completes without failed files.

- [ ] **Step 2: Validate ERP YAML and save diagnostics**

Run:

```bash
pnpm --filter '@nakidka/cli' exec tsx src/cli.ts validate /home/nikita/git/temp-yaml > /tmp/nkdk-erp-validate-filter-item-right-value.log
```

Expected: command may exit non-zero because unrelated validation groups remain.

- [ ] **Step 3: Confirm the `ЛевоеЗначение: .…` union group is gone**

Run:

```bash
rg -n "ЛевоеЗначение: \\." /tmp/nkdk-erp-validate-filter-item-right-value.log
```

Expected: no matches for `Expected union value` diagnostics in the previous 61-case group. If this command still prints matches, inspect the surrounding lines before continuing.

- [ ] **Step 4: Run the full project test suite**

Run:

```bash
pnpm test
```

Expected: all package tests pass.

## Task 4: Commit The Implementation

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/toJSONSchema.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/toJSONSchema.test.ts`

- [ ] **Step 1: Review the diff**

Run:

```bash
git diff -- packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/toJSONSchema.ts packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/toJSONSchema.test.ts
```

Expected: only the local JSON Schema override and focused tests are changed.

- [ ] **Step 2: Check repository status**

Run:

```bash
git status --short
```

Expected: only the two implementation files are modified, unless the plan file itself has not been committed yet.

- [ ] **Step 3: Commit the implementation**

Run:

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/toJSONSchema.ts packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/toJSONSchema.test.ts
git commit -m "fix: :bug: разрешить массив ПравоеЗначение FilterItem"
```

Expected: commit is created successfully.

## Self-Review

- Spec coverage: Task 1 and Task 2 accept array `FilterItemComparison.ПравоеЗначение`; Task 1 keeps scalar `ПравоеЗначение`; Task 1 protects `ЛевоеЗначение`; Task 3 checks ERP validation impact; no task changes XML/YAML conversion or shared `DcsMetadataTypedValueJSONSchema`.
- Placeholder scan: no `TBD`, `TODO`, vague validation step, or omitted code block remains.
- Type consistency: the plan uses existing names `FilterItemComparisonRules`, `FilterItemGroupRules`, `DcsMetadataTypedValueJSONSchema`, `exportFilterItemToJSONSchema`, and YAML key `ПравоеЗначение` consistently.
