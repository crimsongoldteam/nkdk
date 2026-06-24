# Form Attribute Columns Schema Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make YAML validation accept `Колонки` and `ДополнительныеКолонки` inside form `Реквизиты`.

**Architecture:** Keep form attribute import/export unchanged. Add a schema-only extension in `formAttribute/toJSONSchema.ts` so `FormAttribute` JSON Schema includes the YAML fields that custom form attribute import/export already supports.

**Tech Stack:** TypeScript, TypeBox, Vitest, existing metadata validation command.

---

## File Structure

- Modify `packages/core/metadata/forms/commonObjects/formAttribute/fromYAML.test.ts`
  - Add focused JSON Schema tests for `Колонки` and `ДополнительныеКолонки`.
- Modify `packages/core/metadata/forms/commonObjects/formAttribute/toJSONSchema.ts`
  - Build the base `FormAttribute` schema from `FormAttributeRules`.
  - Extend only that object schema with optional `Колонки` and `ДополнительныеКолонки`.
  - Reuse strict `FormAttributeColumn` schema for column values.

No XML fixtures, YAML fixtures, `rules.ts`, or importer/exporter behavior should change.

---

### Task 1: Add Failing Schema Tests

**Files:**
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/fromYAML.test.ts`

- [ ] **Step 1: Add tests for form attribute column schema**

In `packages/core/metadata/forms/commonObjects/formAttribute/fromYAML.test.ts`, append these tests inside `describe("importFormAttributesFromYAML", ...)`, after the existing `rejects scalar form attribute YAML in JSON Schema` test:

```ts
  it("accepts table columns in JSON Schema", () => {
    const formAttributesSchema = exportFormAttributesToJSONSchema({
      context: mockContext,
      rule: { type: "FormAttributes" },
      value: undefined,
    })
    const schema = TypeCompiler.Compile(formAttributesSchema)

    expect(
      schema.Check({
        Таблица: {
          Тип: "ТаблицаЗначений",
          Колонки: {
            Колонка: {
              Заголовок: "Колонка",
              Тип: "Строка",
            },
          },
        },
      })
    ).toBe(true)
  })

  it("accepts additional table columns in JSON Schema", () => {
    const formAttributesSchema = exportFormAttributesToJSONSchema({
      context: mockContext,
      rule: { type: "FormAttributes" },
      value: undefined,
    })
    const schema = TypeCompiler.Compile(formAttributesSchema)

    expect(
      schema.Check({
        Объект: {
          Тип: "ДокументОбъект.АвансовыйОтчет",
          ДополнительныеКолонки: {
            "Объект.Товары": {
              Колонка: {
                Заголовок: "Колонка",
                Тип: "Строка",
              },
            },
          },
        },
      })
    ).toBe(true)
  })

  it("rejects unsupported table column properties in JSON Schema", () => {
    const formAttributesSchema = exportFormAttributesToJSONSchema({
      context: mockContext,
      rule: { type: "FormAttributes" },
      value: undefined,
    })
    const schema = TypeCompiler.Compile(formAttributesSchema)

    expect(
      schema.Check({
        Таблица: {
          Тип: "ТаблицаЗначений",
          Колонки: {
            Колонка: {
              Тип: "Строка",
              НеизвестноеПоле: "значение",
            },
          },
        },
      })
    ).toBe(false)
  })
```

- [ ] **Step 2: Run tests to verify RED**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/forms/commonObjects/formAttribute/fromYAML.test.ts
```

Expected:

- `accepts table columns in JSON Schema` fails because `Колонки` is an unexpected property.
- `accepts additional table columns in JSON Schema` fails because `ДополнительныеКолонки` is an unexpected property.
- `rejects unsupported table column properties in JSON Schema` passes or fails for the wrong broad reason; the useful RED signal is the first two failing tests.

---

### Task 2: Extend FormAttribute JSON Schema Locally

**Files:**
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/toJSONSchema.ts`

- [ ] **Step 1: Replace `toJSONSchema.ts` implementation with local schema extension**

Update `packages/core/metadata/forms/commonObjects/formAttribute/toJSONSchema.ts` to this complete content:

```ts
import { TObject, TProperties, TSchema, Type } from "@sinclair/typebox"
import { ConfigurationContext } from "~/metadata/context/types"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/orchestration"
import { exportMetadataItemToJSONSchema } from "~/metadata/orchestration/metadataItem/toJSONSchema"
import { FormAttributeColumnRules, FormAttributeRules } from "./rules"

export const exportFormAttributesToJSONSchema: ExportToJSONSchemaFn = (params: {
  context: ConfigurationContext
}): TSchema => {
  const { context } = params
  const attributeSchema = extendFormAttributeColumnsSchema(
    exportMetadataItemToJSONSchema({
      context,
      rule: FormAttributeRules,
    }),
    context
  )
  return Type.Record(Type.String(), attributeSchema)
}

export const exportFormColumnAttributesToJSONSchema: ExportToJSONSchemaFn = (params: {
  context: ConfigurationContext
}): TSchema => {
  const { context } = params
  const attributeSchema = exportMetadataItemToJSONSchema({
    context,
    rule: FormAttributeColumnRules,
  })
  return Type.Record(Type.String(), attributeSchema)
}

function extendFormAttributeColumnsSchema(schema: TSchema, context: ConfigurationContext): TSchema {
  if (!isObjectSchema(schema)) return schema

  const columnsSchema = exportFormColumnAttributesToJSONSchema({ context, rule: undefined, value: undefined })

  return Type.Object(
    {
      ...schema.properties,
      Колонки: Type.Optional(columnsSchema),
      ДополнительныеКолонки: Type.Optional(Type.Record(Type.String(), columnsSchema)),
    },
    { additionalProperties: false }
  )
}

function isObjectSchema(schema: TSchema): schema is TObject<TProperties> {
  return schema.type === "object" && "properties" in schema
}

registerTypeRule("FormAttributes", "exportToJSONSchema", exportFormAttributesToJSONSchema)
registerTypeRule("FormAttributeColumns", "exportToJSONSchema", exportFormColumnAttributesToJSONSchema)
```

Implementation notes:

- `extendFormAttributeColumnsSchema` is intentionally local to `formAttribute/toJSONSchema.ts`.
- It does not modify `FormAttributeRules`.
- It reuses the existing strict `FormAttributeColumnRules` schema through `exportFormColumnAttributesToJSONSchema`.
- It keeps `additionalProperties: false` on the form attribute object.

- [ ] **Step 2: Run tests to verify GREEN**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/forms/commonObjects/formAttribute/fromYAML.test.ts
```

Expected:

- All tests in `fromYAML.test.ts` pass.

- [ ] **Step 3: Run focused validation schema tests**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/validation/schemaRegistry.test.ts metadata/validation/validateProject.test.ts
```

Expected:

- Both test files pass.

- [ ] **Step 4: Commit implementation**

Run:

```bash
git add packages/core/metadata/forms/commonObjects/formAttribute/fromYAML.test.ts packages/core/metadata/forms/commonObjects/formAttribute/toJSONSchema.ts
git commit -m "fix: :bug: валидировать колонки реквизитов формы"
```

---

### Task 3: Verify Against ERP YAML

**Files:**
- No source files changed.
- Reads: `/tmp/round-trip-yaml-validation/erp`
- Writes: `/tmp/erp-yaml-validate-after-form-attribute-columns.log`

- [ ] **Step 1: Run ERP YAML validation**

Run:

```bash
env npm_config_cache=/tmp/npm-cache npx -y -p node@22 -c 'pnpm -s --dir /home/codexwsl/nkdk/packages/cli exec tsx src/cli.ts validate /tmp/round-trip-yaml-validation/erp' > /tmp/erp-yaml-validate-after-form-attribute-columns.log 2>&1
```

Expected:

- Command exits with code `1` because unrelated validation errors remain.
- Log exists at `/tmp/erp-yaml-validate-after-form-attribute-columns.log`.

- [ ] **Step 2: Compare `Unexpected property` count**

Run:

```bash
rg ' error: Unexpected property$' /tmp/erp-yaml-validate.log | wc -l
rg ' error: Unexpected property$' /tmp/erp-yaml-validate-after-form-attribute-columns.log | wc -l
tail -1 /tmp/erp-yaml-validate-after-form-attribute-columns.log
```

Expected:

- Baseline count is `5534`.
- New count is lower than `5534`.
- Summary still contains errors and warnings from unrelated categories.

- [ ] **Step 3: Check that column keys are no longer the main `Unexpected property` source**

Run:

```bash
rg ' error: Unexpected property$' /tmp/erp-yaml-validate-after-form-attribute-columns.log \
  | sed -E 's/^([^:]+):([0-9]+):[0-9]+ error: Unexpected property$/\/tmp\/round-trip-yaml-validation\/erp\/\1 \2/' \
  | while read -r file line; do sed -n "${line}p" "$file"; done \
  | sed -E 's/^ *//; s/:.*$//' \
  | sort \
  | uniq -c \
  | sort -nr \
  | head -20
```

Expected:

- `Колонки` and `ДополнительныеКолонки` are absent from the top causes.
- Remaining `Unexpected property` diagnostics, if any, belong to other unsupported YAML fields and should be handled in separate tasks.

- [ ] **Step 4: Run full test suite with Node 22**

Run:

```bash
env npm_config_cache=/tmp/npm-cache npx -y -p node@22 -c 'pnpm test'
```

Expected:

- Full test suite passes.

- [ ] **Step 5: Report outcome**

Include in the final report:

- commit hash for the implementation;
- focused test results;
- full `pnpm test` result;
- old and new `Unexpected property` counts;
- final validation summary line;
- note that `ПутьКДанным` and metadataTarget errors were intentionally left for later.
