# FilterItem Presentation Schema Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make JSON Schema accept `FilterItem` group presentations exported as DCS `DesignTimeValue` strings, without changing YAML/XML conversion.

**Architecture:** Keep the fix local to `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/toJSONSchema.ts`. Reuse the existing `MetadataDcsMetadataValue` JSON Schema exporter with `valueType: "DesignTimeValue"` and pass it as an override for `FilterItemPresentationValue` only while building the recursive `FilterItem` schema.

**Tech Stack:** TypeScript, TypeBox, Vitest, existing metadata orchestration JSON Schema exporters, `pnpm`.

---

### Task 1: Add Failing Schema Tests

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/toJSONSchema.test.ts`

- [ ] **Step 1: Add tests for group presentation DesignTimeValue strings**

Add these tests after `accepts group items with nested elements`:

```ts
  it("accepts group presentation as design-time string", () => {
    const compiled = compileFilterItemSchema()

    expect(
      compiled.Check([
        {
          ТипГруппы: "ГруппаИли",
          Представление: '"ГруппаОрганизацияПредприятие"',
        },
      ])
    ).toBe(true)
  })

  it("accepts disabled group with nested elements and design-time presentation", () => {
    const compiled = compileFilterItemSchema()

    expect(
      compiled.Check([
        {
          Использование: "Ложь",
          ТипГруппы: "ГруппаИли",
          Элементы: [
            {
              Использование: "Ложь",
              ЛевоеЗначение: ".ИсполняетсяТекущимПользователем",
              ПравоеЗначение: "Истина",
            },
            {
              Использование: "Ложь",
              ЛевоеЗначение: ".СогласуетсяТекущимПользователем",
              ПравоеЗначение: "Истина",
            },
          ],
          Представление: '"Мои отчеты"',
        },
      ])
    ).toBe(true)
  })

  it("accepts group user setting presentation as design-time string", () => {
    const compiled = compileFilterItemSchema()

    expect(
      compiled.Check([
        {
          ТипГруппы: "ГруппаИ",
          ПредставлениеПользовательскойНастройки: '"Ожидают обеспечения"',
        },
      ])
    ).toBe(true)
  })
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/toJSONSchema.test.ts
```

Expected: the new tests fail because `FilterItemPresentationValue` is still validated as `I8nTextYAML`, while the YAML examples are DCS `DesignTimeValue` strings.

---

### Task 2: Add Local Presentation Schema Override

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/toJSONSchema.ts`

- [ ] **Step 1: Import the reusable DCS metadata value JSON Schema exporter and rule type**

Update the imports:

```ts
import { exportDcsMetadataValueToJSONSchema } from "../dcsMetadataValue/toJSONSchema"
import { DcsMetadataValuePropertyRule } from "../dcsMetadataValue/types"
```

- [ ] **Step 2: Define the DesignTimeValue schema for FilterItem presentations**

Add this near `FilterItemRightValueJSONSchema`:

```ts
const FilterItemPresentationValueRule = {
  type: "MetadataDcsMetadataValue",
  valueType: "DesignTimeValue",
} as const satisfies DcsMetadataValuePropertyRule

const createFilterItemPresentationValueJSONSchema = (context: ConfigurationContext): TSchema =>
  exportDcsMetadataValueToJSONSchema({
    context,
    rule: FilterItemPresentationValueRule,
    value: undefined,
  })
```

- [ ] **Step 3: Apply the override while building the recursive FilterItem schema**

Change the group branch inside `exportFilterItemToJSONSchema` to pass the presentation override:

```ts
      exportMetadataItemToJSONSchema({
        context: createFilterItemSchemaContext(context, {
          FilterItem: Type.Array(This),
          FilterItemPresentationValue: createFilterItemPresentationValueJSONSchema(context),
        }),
        rule: FilterItemGroupRules,
      }),
```

Keep the comparison branch unchanged so `FilterItemComparisonRules.presentation` continues to use `DcsLocalStringType`.

- [ ] **Step 4: Run the focused test and verify it passes**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/toJSONSchema.test.ts
```

Expected: all tests in `filterItem/toJSONSchema.test.ts` pass.

---

### Task 3: Validate ERP Error Group Reduction

**Files:**
- Read: `/tmp/nkdk-erp-validate-after-fresh-import.log`
- Write: `/tmp/nkdk-erp-validate-after-filter-presentation.log`

- [ ] **Step 1: Run validation against the already imported YAML**

Run:

```bash
pnpm --filter '@nakidka/cli' exec tsx src/cli.ts validate /home/nikita/git/temp-yaml > /tmp/nkdk-erp-validate-after-filter-presentation.log
```

Expected: command exits with code `1` while unrelated validation errors remain.

- [ ] **Step 2: Count remaining `Expected union value` errors**

Run:

```bash
rg "Expected union value|значение не подходит ни под один вариант union" /tmp/nkdk-erp-validate-after-filter-presentation.log
```

Expected: the count drops by the group-presentation cases; no remaining matches should point at `ТипГруппы: ГруппаИ` or `ТипГруппы: ГруппаИли`.

- [ ] **Step 3: Verify the first group disappeared**

Run:

```bash
rg "ТипГруппы: ГруппаИ|ТипГруппы: ГруппаИли" /tmp/nkdk-erp-validate-after-filter-presentation.log
```

Expected: no output.

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

Expected: the diff only contains the local schema override and focused tests.

- [ ] **Step 3: Commit the implementation**

Run:

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/toJSONSchema.ts packages/core/metadata/commonObjects/dataCompositionSystem/filterItem/toJSONSchema.test.ts
git commit -m "fix: :bug: разрешить представление групп FilterItem"
```

Expected: one implementation commit on the current branch.
