# FilterItem Right Value Nil Array Item Schema Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make JSON Schema accept `{}` as a nil item inside array-shaped `FilterItemComparison.ПравоеЗначение`, without changing YAML/XML conversion.

**Architecture:** Keep the change local to `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/toJSONSchema.ts`. Add a strict empty-object schema and include it only in array items for `ПравоеЗначение`; scalar `ПравоеЗначение`, `ЛевоеЗначение`, and the shared `DcsMetadataTypedValueJSONSchema` stay unchanged.

**Tech Stack:** TypeScript, TypeBox, Vitest, existing metadata JSON Schema generation, `pnpm`.

---

### Task 1: Add Failing Schema Tests

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/toJSONSchema.test.ts`

- [ ] **Step 1: Add tests for nil items in array-shaped right value**

Add these tests after `accepts InList comparison items with enumeration-reference array right value`:

```ts
  it("accepts InList comparison items with nil object in right value array", () => {
    const compiled = compileFilterItemSchema()

    expect(
      compiled.Check([
        {
          ЛевоеЗначение: ".Объект.Корректировки.Документ",
          ВидСравнения: "ВСписке",
          ПравоеЗначение: [
            "Документ.ВыбытиеИнвестиций.ПустаяСсылка",
            "Документ.ПоступлениеИнвестиций.ПустаяСсылка",
            {},
          ],
        },
      ])
    ).toBe(true)
  })

  it("accepts InList comparison items with only nil objects in right value array", () => {
    const compiled = compileFilterItemSchema()

    expect(
      compiled.Check([
        {
          ЛевоеЗначение: ".Тип",
          ВидСравнения: "ВСписке",
          ПравоеЗначение: [{}, {}],
        },
      ])
    ).toBe(true)
  })
```

- [ ] **Step 2: Add tests that keep nil object out of scalar positions**

Add these tests after `does not accept array-shaped left value`:

```ts
  it("does not accept nil object as scalar right value", () => {
    const compiled = compileFilterItemSchema()

    expect(
      compiled.Check([
        {
          ЛевоеЗначение: ".Тип",
          ПравоеЗначение: {},
        },
      ])
    ).toBe(false)
  })

  it("does not accept nil object as left value", () => {
    const compiled = compileFilterItemSchema()

    expect(
      compiled.Check([
        {
          ЛевоеЗначение: {},
          ВидСравнения: "ВСписке",
          ПравоеЗначение: [{}, {}],
        },
      ])
    ).toBe(false)
  })
```

- [ ] **Step 3: Run the focused test and verify the new positive tests fail**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/commonObjects/dataCompositionSystem/filterItem/toJSONSchema.test.ts
```

Expected: the two positive nil-array tests fail because `{}` is not yet allowed in `ПравоеЗначение` array items. The two negative tests should pass.

---

### Task 2: Add Local Nil Array Item Schema

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/toJSONSchema.ts`

- [ ] **Step 1: Add a strict empty-object schema**

Add this before `FilterItemRightValueJSONSchema`:

```ts
const DcsMetadataTypedValueNilArrayItemJSONSchema = Type.Object({}, { additionalProperties: false })
```

- [ ] **Step 2: Use the empty-object schema only inside array-shaped right value**

Replace the current `FilterItemRightValueJSONSchema` definition:

```ts
const FilterItemRightValueJSONSchema = Type.Union([
  DcsMetadataTypedValueJSONSchema,
  Type.Array(DcsMetadataTypedValueJSONSchema),
])
```

with:

```ts
const FilterItemRightValueArrayItemJSONSchema = Type.Union([
  DcsMetadataTypedValueJSONSchema,
  DcsMetadataTypedValueNilArrayItemJSONSchema,
])

const FilterItemRightValueJSONSchema = Type.Union([
  DcsMetadataTypedValueJSONSchema,
  Type.Array(FilterItemRightValueArrayItemJSONSchema),
])
```

- [ ] **Step 3: Run the focused test and verify all FilterItem schema tests pass**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/commonObjects/dataCompositionSystem/filterItem/toJSONSchema.test.ts
```

Expected: all tests in `filterItem/toJSONSchema.test.ts` pass.

---

### Task 3: Validate ERP Error Group Reduction

**Files:**
- Write: `/tmp/nkdk-erp-validate-after-filter-right-nil.log`

- [ ] **Step 1: Run validation against the already imported YAML**

Run:

```bash
pnpm --filter '@nakidka/cli' exec tsx src/cli.ts validate /home/nikita/git/temp-yaml > /tmp/nkdk-erp-validate-after-filter-right-nil.log
```

Expected: command exits with code `1` while unrelated validation errors remain.

- [ ] **Step 2: List remaining `Expected union value` errors**

Run:

```bash
rg "Expected union value|значение не подходит ни под один вариант union" /tmp/nkdk-erp-validate-after-filter-right-nil.log
```

Expected: only these two `Expected union value` locations remain:

```text
Отчет/ДвиженияНастраиваемойОтчетности/Формы/ФормаОтчета/Форма.yaml:30:19 error: Expected union value
Справочник/РесурсныеСпецификации/Формы/ФормаЭлемента/Форма.yaml:2730:75 error: Expected union value
```

- [ ] **Step 3: Verify the two DCS filter item locations disappeared**

Run:

```bash
rg "ЖурналДокументов/ЧекиККМ|Обработка/СтруктураВладения" /tmp/nkdk-erp-validate-after-filter-right-nil.log
```

Expected: no `Expected union value` lines for these two files.

---

### Task 4: Full Verification And Commit

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/toJSONSchema.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/toJSONSchema.test.ts`

- [ ] **Step 1: Run the full project test suite**

Run:

```bash
pnpm test
```

Expected: all package tests pass.

- [ ] **Step 2: Check git diff**

Run:

```bash
git diff -- packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/toJSONSchema.ts packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/toJSONSchema.test.ts
```

Expected: the diff only adds the local nil-array-item schema and focused tests.

- [ ] **Step 3: Commit the implementation**

Run:

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/toJSONSchema.ts packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/toJSONSchema.test.ts
git commit -m "fix: :bug: разрешить nil в массиве ПравоеЗначение"
```

Expected: one implementation commit on the current branch.
