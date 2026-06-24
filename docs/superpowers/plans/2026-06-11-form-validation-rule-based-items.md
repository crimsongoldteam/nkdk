# Form Validation Rule-Based Items Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make rule-based metadata item types export JSON Schema by default so form validation accepts `ДинамическийСписок.УсловноеОформление` and reduces related `Expected union value` cascades.

**Architecture:** `registerMetadataItemRule` is the common registration boundary for rule-based object types. Add a default `exportToJSONSchema` registration there, deriving schemas from `exportMetadataItemToJSONSchema({ context, rule: itemRule })`, the same rule source used by XML/YAML import/export. Keep schemas strict with the existing `additionalProperties: false` behavior.

**Tech Stack:** TypeScript, TypeBox, Vitest, metadata orchestration rules, CLI validation.

---

### File Structure

- Modify `packages/core/metadata/validation/schemaRegistry.test.ts`
  - Add focused regression tests for `ДинамическийСписок.УсловноеОформление` in inline `ClientApplicationForm` schema.
- Modify `packages/core/metadata/orchestration/metadataItem/ruleFactory.ts`
  - Register default `exportToJSONSchema` for every `registerMetadataItemRule` type.
- Modify `packages/core/metadata/orchestration/metadataCollection/ruleFactory.ts`
  - Apply the same JSON Schema recursion guard to collection schemas.
- Create `packages/core/metadata/commonObjects/userSettingsID/toJSONSchema.ts`
  - Export `UserSettingsID` as the existing YAML boolean schema.
- Create `packages/core/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/toJSONSchema.ts`
  - Export `DcsLocalStringType` as the existing `I8nText` YAML schema.
- No XML fixture changes.
- No changes to YAML shape.

### Task 1: Add Failing Regression Tests

**Files:**
- Modify: `packages/core/metadata/validation/schemaRegistry.test.ts`

- [x] **Step 1: Add tests after `accepts command names in command bar button schemas`**

Insert this code:

```ts
  it("exports dynamic list conditional appearance in inline client form schemas", () => {
    const schema = exportJSONSchemaForSchemaName({ context, name: "ClientApplicationForm", mode: "inline" })

    expect(JSON.stringify(schema)).toContain('"УсловноеОформление"')
  })

  it("accepts dynamic list conditional appearance in inline client form schemas", () => {
    const schema = exportJSONSchemaForSchemaName({ context, name: "ClientApplicationForm", mode: "inline" })
    const compiled = TypeCompiler.Compile(schema)
    const value = {
      Реквизиты: {
        Список: {
          Тип: "ДинамическийСписок",
          ОсновнойРеквизит: "Истина",
          ДинамическийСписок: {
            УсловноеОформление: {
              РежимОтображения: "Обычный",
              ИспользоватьПользовательскуюНастройку: "Истина",
              ПредставлениеПользовательскойНастройки: {
                ru: "Условное оформление",
              },
            },
            ДинамическоеСчитываниеДанных: "Истина",
          },
        },
      },
      Элементы: {
        Список: {
          Вид: "ТаблицаФормы",
          ПутьКДанным: "Список",
        },
      },
    }

    expect([...compiled.Errors(value)].map((error) => `${error.path}: ${error.message}`)).toEqual([])
  })
```

- [x] **Step 2: Run the focused tests and verify they fail**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/schemaRegistry.test.ts -t "conditional appearance"
```

Expected: at least one of the new tests fails before implementation. Acceptable failure messages include:

```text
expected '...' to contain '"УсловноеОформление"'
```

or:

```text
/Реквизиты/Список/ДинамическийСписок/УсловноеОформление: Unexpected property
```

- [x] **Step 3: Keep the failing tests uncommitted**

Do not commit a red state unless explicitly requested. Continue to Task 2 in the same working tree.

### Task 2: Register Default JSON Schema For Rule-Based Metadata Items

**Files:**
- Modify: `packages/core/metadata/orchestration/metadataItem/ruleFactory.ts`
- Modify: `packages/core/metadata/orchestration/metadataCollection/ruleFactory.ts`
- Create: `packages/core/metadata/commonObjects/userSettingsID/toJSONSchema.ts`
- Create: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/toJSONSchema.ts`

- [x] **Step 1: Import the schema exporter and type-rule registry**

Change the import block to include:

```ts
import { Type } from "@sinclair/typebox"
import { registerTypeRule } from "../property/typeRuleRegistry"
import { exportMetadataItemToJSONSchema } from "./toJSONSchema"
```

The top of the file should look like:

```ts
import { Type } from "@sinclair/typebox"
import { PropertyRuleType } from "~/metadata/orchestration/property/registry"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"
import { registerTypeRule } from "../property/typeRuleRegistry"
import { registerExportToXML } from "./registerExportToXML"
import { registerExportToYAML } from "./registerExportToYAML"
import { registerImportFromXML } from "./registerImportFromXML"
import { registerImportFromYAML } from "./registerImportFromYAML"
import { exportMetadataItemToJSONSchema } from "./toJSONSchema"
```

- [x] **Step 2: Register `exportToJSONSchema` inside `registerMetadataItemRule`**

Replace the function body with recursion protection:

```ts
export const registerMetadataItemRule = <
  Rule extends MetadataItemRule,
  PropertyType extends PropertyRuleType,
>(
  params: MetadataItemRuleParams<Rule, PropertyType>
): void => {
  const { propertyType, itemRule } = params

  registerImportFromXML(propertyType, itemRule)
  registerImportFromYAML(propertyType, itemRule)
  registerExportToYAML(propertyType, itemRule)
  registerExportToXML(propertyType, itemRule)
  registerTypeRule(propertyType, "exportToJSONSchema", ({ context }) => {
    const schemaStack = context.exportToJSONSchema?.schemaStack ?? []
    if (schemaStack.includes(propertyType)) return Type.Unknown()

    return exportMetadataItemToJSONSchema({
      context: context.exportToJSONSchema
        ? {
            ...context,
            exportToJSONSchema: {
              ...context.exportToJSONSchema,
              schemaStack: [...schemaStack, propertyType],
            },
          }
        : context,
      rule: itemRule,
    })
  })
}
```

Do not add a special-case registration for `ConditionalAppearance`.

- [x] **Step 3: Add the same recursion guard to collection schema export**

In `packages/core/metadata/orchestration/metadataCollection/ruleFactory.ts`, update `toJSONSchemaDefault`:

```ts
  const toJSONSchemaDefault: ExportToJSONSchemaFn = ({ context }) => {
    const schemaStack = context.exportToJSONSchema?.schemaStack ?? []
    if (schemaStack.includes(propertyType)) return Type.Record(Type.String(), Type.Unknown())

    const itemSchema = exportMetadataItemToJSONSchema({
      context: context.exportToJSONSchema
        ? {
            ...context,
            exportToJSONSchema: {
              ...context.exportToJSONSchema,
              schemaStack: [...schemaStack, propertyType],
            },
          }
        : context,
      rule: itemRule,
    })
    return Type.Record(Type.String(), itemSchema)
  }
```

- [x] **Step 4: Run the focused tests again**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/schemaRegistry.test.ts -t "conditional appearance"
```

Expected: both tests pass.

- [x] **Step 5: Run the whole schema registry test file**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation/schemaRegistry.test.ts
```

Expected: all tests in the file pass. If a stack overflow appears, stop and inspect the schema path before broadening the change.

- [x] **Step 6: Add JSON Schema for surfaced DCS leaf types**

Create `packages/core/metadata/commonObjects/userSettingsID/toJSONSchema.ts`:

```ts
import { BooleanJSONSchema } from "../boolean/types"
import { registerTypeRule } from "~/metadata/orchestration"

registerTypeRule("UserSettingsID", "exportToJSONSchema", () => BooleanJSONSchema)
```

Create `packages/core/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/toJSONSchema.ts`:

```ts
import { exportI8nTextToJSONSchema } from "~/metadata/commonObjects/i8nText/toJSONSchema"
import { registerTypeRule } from "~/metadata/orchestration"

registerTypeRule("DcsLocalStringType", "exportToJSONSchema", exportI8nTextToJSONSchema)
```

Register both from their existing index files:

```ts
import "./userSettingsID/toJSONSchema"
import "./toJSONSchema"
```

### Task 3: Measure ERP Validation Impact

**Files:**
- No source changes.

- [x] **Step 1: Run validation on a known affected file**

Run:

```bash
pnpm --filter @nakidka/cli dev validate /home/nikita/git/temp-yaml --file "Документ/АвансовыйОтчет/Формы/ФормаВыбора/Форма.yaml" > /tmp/nkdk-validation-form-rule-based-single.txt
```

Actual: command exits with code `1`, but diagnostics for `ДинамическийСписок.УсловноеОформление` disappear. The file now has `2 error, 8 warning`; remaining errors are `Expected union value` for the table and `Expected 'Истина'` for explicit `ПроизвольныйЗапрос: Ложь`.

- [x] **Step 2: Run full ERP validation**

Run:

```bash
/usr/bin/time -v pnpm --filter @nakidka/cli dev validate /home/nikita/git/temp-yaml > /tmp/nkdk-validation-after-rule-based-items.txt 2> /tmp/nkdk-validation-after-rule-based-items.err
```

Actual: command exits with code `1` because unrelated diagnostics remain.

- [x] **Step 3: Count top remaining messages**

Run:

```bash
rg -c "Unexpected property" /tmp/nkdk-validation-after-rule-based-items.txt
rg -c "Expected union value" /tmp/nkdk-validation-after-rule-based-items.txt
rg "Unexpected property" /tmp/nkdk-validation-after-rule-based-items.txt | while IFS=: read -r file line col rest; do case "$file" in *Формы/*/Форма.yaml) sed -n "${line}p" "/home/nikita/git/temp-yaml/$file";; esac; done | sed -E 's/^ *([^:#]+):.*/\1/' | sort | uniq -c | sort -nr | head -25
rg "Expected union value" /tmp/nkdk-validation-after-rule-based-items.txt | while IFS=: read -r file line col rest; do sed -n "${line}p" "/home/nikita/git/temp-yaml/$file"; done | sed -nE 's/^ *Вид: *"?([^"#]+)"?.*/\1/p' | sort | uniq -c | sort -nr | head -25
```

Actual: `Unexpected property` decreases from `7828` to `3579`; `УсловноеОформление` disappears from the top keys. `Expected union value` remains `6574`, because the sampled table now fails on another nested child item (`ЗапретитьИспользование: {}` on `ПолеНадписи`).

### Task 4: Run Required Verification And Commit

**Files:**
- Modify: `packages/core/metadata/validation/schemaRegistry.test.ts`
- Modify: `packages/core/metadata/orchestration/metadataItem/ruleFactory.ts`
- Modify: `packages/core/metadata/orchestration/metadataCollection/ruleFactory.ts`
- Modify: `packages/core/metadata/context/types.ts`
- Modify: `packages/core/metadata/commonObjects/index.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/index.ts`
- Create: `packages/core/metadata/commonObjects/userSettingsID/toJSONSchema.ts`
- Create: `packages/core/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/toJSONSchema.ts`

- [x] **Step 1: Run validation tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/validation
```

Expected: all validation tests pass.

- [x] **Step 2: Run form tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms
```

Expected: all form tests pass.

- [x] **Step 3: Run full project tests**

Run:

```bash
pnpm test
```

Expected: all package tests pass.

- [x] **Step 4: Review changed files**

Run:

```bash
git diff -- packages/core/metadata/validation/schemaRegistry.test.ts packages/core/metadata/orchestration/metadataItem/ruleFactory.ts packages/core/metadata/orchestration/metadataCollection/ruleFactory.ts packages/core/metadata/context/types.ts packages/core/metadata/commonObjects/index.ts packages/core/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/index.ts packages/core/metadata/commonObjects/userSettingsID/toJSONSchema.ts packages/core/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/toJSONSchema.ts
```

Expected: diff contains only the regression tests, generic `exportToJSONSchema` registration, and recursion guard state for schema generation.

- [ ] **Step 5: Commit**

Run:

```bash
git add packages/core/metadata/validation/schemaRegistry.test.ts packages/core/metadata/orchestration/metadataItem/ruleFactory.ts packages/core/metadata/orchestration/metadataCollection/ruleFactory.ts packages/core/metadata/context/types.ts packages/core/metadata/commonObjects/index.ts packages/core/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/index.ts packages/core/metadata/commonObjects/userSettingsID/toJSONSchema.ts packages/core/metadata/commonObjects/dataCompositionSystem/dcsLocalStringType/toJSONSchema.ts docs/superpowers/plans/2026-06-11-form-validation-rule-based-items.md
git commit -m "fix: :bug: исправить validation rule-based типов"
```

Expected: commit succeeds.

### Task 5: Report Results And Decide Next Slice

**Files:**
- No source changes.

- [ ] **Step 1: Summarize validation impact**

Report these numbers:

- total `Unexpected property` after the change;
- total `Expected union value` after the change;
- remaining top form `Unexpected property` keys;
- remaining top form `Expected union value` values;
- wall time and max RSS from `/tmp/nkdk-validation-after-rule-based-items.err`.

- [ ] **Step 2: Stop before handling the next group**

Do not fix the next remaining group in the same implementation slice. Ask which remaining group should be handled next after this branch is reviewed.
