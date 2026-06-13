# Form Validation Schema Errors Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce mass `Expected union value` errors in form validation by making generic form element schemas include singleton element properties such as `КоманднаяПанель`.

**Architecture:** The validation schema for `Форма.yaml` is exported from `ClientApplicationForm` in inline JSON Schema mode. Generic child-item schemas are built from element rules without a concrete model, so properties whose type handlers do not export JSON Schema are omitted. Register JSON Schema export for singleton elements at the same boundary that already registers their XML/YAML import and export behavior.

**Tech Stack:** TypeScript, TypeBox, Vitest, metadata orchestration rules.

---

### Task 1: Add A Regression Test For Singleton Element Schema

**Files:**
- Modify: `packages/core/metadata/validation/schemaRegistry.test.ts`

- [x] **Step 1: Add the failing test**

Add this test after `accepts nested child items in inline form element schemas`:

```ts
  it("accepts table auto command bar in inline client form schemas", () => {
    const schema = exportJSONSchemaForSchemaName({ context, name: "ClientApplicationForm", mode: "inline" })
    const compiled = TypeCompiler.Compile(schema)
    const value = {
      Элементы: {
        Таблица: {
          Вид: "ТаблицаФормы",
          КоманднаяПанель: {
            Автозаполнение: "Ложь",
            ГоризонтальноеПоложение: "Лево",
          },
          Элементы: {
            Колонка: {
              Вид: "ПолеВвода",
            },
          },
        },
      },
    }

    expect([...compiled.Errors(value)].map((error) => `${error.path}: ${error.message}`)).toEqual([])
  })
```

- [x] **Step 2: Run the test and verify the current failure**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/schemaRegistry.test.ts -t "accepts table auto command bar in inline client form schemas"
```

Expected: FAIL with a diagnostic like:

```text
/Элементы/Таблица: Expected union value
```

- [x] **Step 3: Commit the failing test only if the team wants red-green commits**

Kept uncommitted until Task 2, because this repository usually commits passing slices.

### Task 2: Export JSON Schema For Singleton Form Elements

**Files:**
- Modify: `packages/core/metadata/forms/commonObjects/index.ts`
- Create: `packages/core/metadata/forms/commonObjects/commandName/toJSONSchema.ts`
- Modify: `packages/core/metadata/forms/elements/orchestration/ruleFactory.ts`
- Modify: `packages/core/metadata/forms/elements/orchestration/toJSONSchema.ts`

- [x] **Step 1: Add a singleton schema helper**

In `packages/core/metadata/forms/elements/orchestration/toJSONSchema.ts`, add this function after `exportElementRuleToJSONSchema`:

```ts
export const exportSingleElementRuleToJSONSchema = (params: {
  context: ConfigurationContext
  rule: ElementRule
}): TSchema => {
  const { context, rule } = params
  const properties = exportPropertiesToJSONSchema({
    context,
    rule,
  })

  return Type.Object(
    {
      ...(properties as TProperties),
    },
    {
      additionalProperties: false,
    }
  )
}
```

This intentionally does not add the tree discriminator `Вид`: singleton elements are serialized as property values, for example `КоманднаяПанель: { Автозаполнение: Ложь }`.

- [x] **Step 2: Register `exportToJSONSchema` in `registerElementAsType`**

In `packages/core/metadata/forms/elements/orchestration/ruleFactory.ts`, import the helper:

```ts
import { exportSingleElementRuleToJSONSchema } from "./toJSONSchema"
```

Add a registration call inside `registerElementAsType`, next to the existing YAML/XML registrations:

```ts
  registerExportToJSONSchema({ propertyType, elementRule })
```

Add this helper near the other local `register*` helpers:

```ts
const registerExportToJSONSchema = <Rule extends ElementRule>(params: {
  propertyType: PropertyRuleType
  elementRule: Rule
}): void => {
  const { propertyType, elementRule } = params

  registerTypeRule(propertyType, "exportToJSONSchema", ({ context }) =>
    exportSingleElementRuleToJSONSchema({
      context,
      rule: elementRule,
    })
  )
}
```

- [x] **Step 3: Add and register `CommandName` JSON Schema**

Singleton command bars expose command-bar buttons. Those buttons use `ИмяКоманды`, so the first slice also needs `CommandName` to export as a string schema:

```ts
import { Type } from "@sinclair/typebox"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"

registerTypeRule("CommandName", "exportToJSONSchema", () => Type.String())
```

Register the file from `packages/core/metadata/forms/commonObjects/index.ts`:

```ts
import "./commandName/toJSONSchema"
```

- [x] **Step 4: Run the focused regression test**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/schemaRegistry.test.ts -t "accepts table auto command bar in inline client form schemas"
```

Expected: PASS.

- [x] **Step 5: Run the validation schema tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/schemaRegistry.test.ts
```

Expected: all tests in `schemaRegistry.test.ts` pass.

- [x] **Step 6: Commit**

```bash
git add packages/core/metadata/forms/elements/orchestration/toJSONSchema.ts \
  packages/core/metadata/forms/elements/orchestration/ruleFactory.ts \
  packages/core/metadata/forms/commonObjects/commandName/toJSONSchema.ts \
  packages/core/metadata/forms/commonObjects/index.ts \
  packages/core/metadata/validation/schemaRegistry.test.ts
git commit -m "fix: :bug: исправить схему singleton-элементов формы"
```

### Task 3: Verify The Impact On ERP Validation Group (Б)

**Files:**
- No source changes.

- [x] **Step 1: Run the focused validation file that reproduced the issue**

Run:

```bash
pnpm --filter @nakidka/cli dev validate /home/nikita/git/temp-yaml --file "Документ/АвансовыйОтчет/Формы/ИтогоПоВалютам/Форма.yaml"
```

Expected: the previous `Expected union value` at line `5` for `Вид: ТаблицаФормы` is gone. Other diagnostics may remain.

- [x] **Step 2: Recount group (Б) on the full ERP project**

Run:

```bash
/usr/bin/time -v pnpm --filter @nakidka/cli dev validate /home/nikita/git/temp-yaml > /tmp/nkdk-validation-after-form-schema.txt 2> /tmp/nkdk-validation-after-form-schema.err
```

Expected: command exits with code `1` because unrelated diagnostics remain.

Then run:

```bash
rg -c "Expected union value" /tmp/nkdk-validation-after-form-schema.txt
rg -c "Unexpected property" /tmp/nkdk-validation-after-form-schema.txt
```

Expected: `Expected union value` decreases from `11647`; `Unexpected property` may also decrease for `Автозаполнение` because table command bars are now present in schema.

- [x] **Step 3: Run metadata validation tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation
```

Expected: `17` validation test files pass.

- [x] **Step 4: Run the full project tests before finishing**

Run:

```bash
pnpm test
```

Expected: all package tests pass.

### Task 4: Decide The Next Rule-Expansion Slice

**Files:**
- No source changes unless Task 3 shows the first slice is complete and the user approves the next slice.

- [x] **Step 1: Recount the four frequent keys after Task 2**

Run:

```bash
rg "Unexpected property" /tmp/nkdk-validation-after-form-schema.txt | while IFS=: read -r file line col rest; do
  sed -n "${line}p" "/home/nikita/git/temp-yaml/$file"
done | sed -E 's/^ *([^:#]+):.*/\1/' \
  | rg "^(Автозаполнение|УсловноеОформление|ДополнительныеКолонки|ГоризонтальноеПоложение)$" \
  | sort | uniq -c | sort -nr
```

Expected: a smaller list than before Task 2. Use this list to choose the next implementation plan:

- If `УсловноеОформление` remains high, inspect table/dynamic-list schema support.
- If `ДополнительныеКолонки` remains high, inspect `FormAttribute.additionalColumns` JSON Schema.
- If `ГоризонтальноеПоложение` remains high, inspect the specific element rules by coordinate.

- [x] **Step 2: Stop before expanding more rules**

Report the new counts and ask which remaining key to handle next. Do not mix additional rule expansion into the singleton schema fix.
