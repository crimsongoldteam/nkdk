# Form Attribute Safe Schema Tail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the safe `Unexpected property` YAML validation diagnostics for form attribute settings fragments and dynamic list key fields.

**Architecture:** Keep the fix in JSON Schema export only. Reuse the existing local `FormAttribute` schema extension and the existing `settingsFragment` abstraction; add a narrow schema exporter for `DynamicListKeyFields`.

**Tech Stack:** TypeScript, TypeBox, Vitest, existing metadata orchestration rule registry.

---

## File Structure

- Modify `packages/core/metadata/forms/commonObjects/formAttribute/fromYAML.test.ts`.
  Adds RED/GREEN schema tests for `Диаграмма`, `ДиаграммаГанта`, and `ТабличныйДокумент`.
- Modify `packages/core/metadata/forms/commonObjects/formAttribute/toJSONSchema.ts`.
  Extends the custom `FormAttribute` JSON Schema with strict string schemas for settings fragment YAML fields.
- Modify `packages/core/metadata/forms/commonObjects/dynamicList/fromYAML.test.ts`.
  Adds RED/GREEN schema tests for `ПоляКлюча` as scalar string and string array.
- Modify `packages/core/metadata/forms/commonObjects/dynamicList/types.ts`.
  Registers a JSON Schema exporter for `DynamicListKeyFields`.
- Run focused tests and ERP YAML validation.

## Task 1: Form Attribute Settings Fragment Schema

**Files:**
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/fromYAML.test.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/toJSONSchema.ts`

- [ ] **Step 1: Read required metadata docs before code changes**

Run:

```bash
sed -n '1,220p' .agents/knowledge/metadata/INDEX.md
sed -n '1,220p' .agents/knowledge/metadata/sources-of-truth.md
sed -n '1,220p' .agents/knowledge/metadata/yaml-contract.md
```

Expected: docs confirm XML fixtures are source of truth and YAML contract should not be changed for this task.

- [ ] **Step 2: Add failing schema tests for settings fragments**

In `packages/core/metadata/forms/commonObjects/formAttribute/fromYAML.test.ts`, add tests near the existing JSON Schema tests:

```ts
it("accepts spreadsheet document settings in JSON Schema", () => {
  const schema = TypeCompiler.Compile(exportFormAttributesToJSONSchema({ context: mockContext }))

  expect(
    schema.Check({
      Макет: {
        Тип: "ТабличныйДокумент",
        ТабличныйДокумент: "<mxl:columns><mxl:size>0</mxl:size></mxl:columns>",
      },
    })
  ).toBe(true)
})

it("accepts chart settings in JSON Schema", () => {
  const schema = TypeCompiler.Compile(exportFormAttributesToJSONSchema({ context: mockContext }))

  expect(
    schema.Check({
      ДиаграммаПродаж: {
        Тип: "Диаграмма",
        Диаграмма: "<d4p1:chart><d4p1:seriesCurId>1</d4p1:seriesCurId></d4p1:chart>",
      },
    })
  ).toBe(true)
})

it("accepts gantt chart settings in JSON Schema", () => {
  const schema = TypeCompiler.Compile(exportFormAttributesToJSONSchema({ context: mockContext }))

  expect(
    schema.Check({
      ДиаграммаГанта: {
        Тип: "ДиаграммаГанта",
        ДиаграммаГанта: "<d4p1:chart><d4p1:pointsCurId>0</d4p1:pointsCurId></d4p1:chart>",
      },
    })
  ).toBe(true)
})

it("rejects non-string spreadsheet document settings in JSON Schema", () => {
  const schema = TypeCompiler.Compile(exportFormAttributesToJSONSchema({ context: mockContext }))

  expect(
    schema.Check({
      Макет: {
        Тип: "ТабличныйДокумент",
        ТабличныйДокумент: { mxl: "columns" },
      },
    })
  ).toBe(false)
})
```

- [ ] **Step 3: Run RED tests**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/forms/commonObjects/formAttribute/fromYAML.test.ts
```

Expected: the three positive tests fail because these properties are still rejected by JSON Schema. The negative test may already pass.

- [ ] **Step 4: Extend `FormAttribute` JSON Schema narrowly**

In `packages/core/metadata/forms/commonObjects/formAttribute/toJSONSchema.ts`, update `extendFormAttributeColumnsSchema` so the returned object includes these optional fields:

```ts
return Type.Object(
  {
    ...schema.properties,
    Колонки: Type.Optional(columnsSchema),
    ДополнительныеКолонки: Type.Optional(Type.Record(Type.String(), columnsSchema)),
    Диаграмма: Type.Optional(Type.String()),
    ДиаграммаГанта: Type.Optional(Type.String()),
    ТабличныйДокумент: Type.Optional(Type.String()),
  },
  { additionalProperties: false }
)
```

Do not change `FormAttributeRules`, XML fixtures, or YAML shape.

- [ ] **Step 5: Run GREEN tests for form attributes**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/forms/commonObjects/formAttribute/fromYAML.test.ts
```

Expected: all tests in the file pass.

- [ ] **Step 6: Commit Task 1**

Run:

```bash
git add packages/core/metadata/forms/commonObjects/formAttribute/fromYAML.test.ts packages/core/metadata/forms/commonObjects/formAttribute/toJSONSchema.ts
git commit -m "fix: :bug: валидировать фрагменты настроек формы"
```

## Task 2: Dynamic List Key Fields Schema

**Files:**
- Modify: `packages/core/metadata/forms/commonObjects/dynamicList/fromYAML.test.ts`
- Modify: `packages/core/metadata/forms/commonObjects/dynamicList/types.ts`

- [ ] **Step 1: Add failing schema tests for `ПоляКлюча`**

In `packages/core/metadata/forms/commonObjects/dynamicList/fromYAML.test.ts`, import the schema helpers:

```ts
import { TypeCompiler } from "@sinclair/typebox/compiler"
import { exportMetadataItemToJSONSchema } from "~/metadata/orchestration/metadataItem/toJSONSchema"
import { mockContext } from "~/tests/mockContext"
import { DynamicListRules } from "./rules"
```

If any of these imports already exist, reuse the existing import line.

Add these tests:

```ts
it("accepts scalar key fields in JSON Schema", () => {
  const schema = TypeCompiler.Compile(
    exportMetadataItemToJSONSchema({
      context: mockContext,
      rule: DynamicListRules,
    })
  )

  expect(schema.Check({ ПоляКлюча: "Ссылка" })).toBe(true)
})

it("accepts list key fields in JSON Schema", () => {
  const schema = TypeCompiler.Compile(
    exportMetadataItemToJSONSchema({
      context: mockContext,
      rule: DynamicListRules,
    })
  )

  expect(schema.Check({ ПоляКлюча: ["Ссылка", "Организация"] })).toBe(true)
})

it("rejects non-string key fields in JSON Schema", () => {
  const schema = TypeCompiler.Compile(
    exportMetadataItemToJSONSchema({
      context: mockContext,
      rule: DynamicListRules,
    })
  )

  expect(schema.Check({ ПоляКлюча: ["Ссылка", 1] })).toBe(false)
})
```

- [ ] **Step 2: Run RED tests**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/forms/commonObjects/dynamicList/fromYAML.test.ts
```

Expected: the positive JSON Schema tests fail because `DynamicListKeyFields` has no JSON Schema exporter yet.

- [ ] **Step 3: Register `DynamicListKeyFields` JSON Schema exporter**

In `packages/core/metadata/forms/commonObjects/dynamicList/types.ts`, add `Type` import:

```ts
import { Type } from "@sinclair/typebox"
```

Then add this registration near the existing `DynamicListKeyFields` registration:

```ts
registerTypeRule("DynamicListKeyFields", "exportToJSONSchema", () =>
  Type.Union([Type.String(), Type.Array(Type.String())])
)
```

Keep the existing XML import normalizer unchanged.

- [ ] **Step 4: Run GREEN tests for dynamic list**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/forms/commonObjects/dynamicList/fromYAML.test.ts
```

Expected: all tests in the file pass.

- [ ] **Step 5: Commit Task 2**

Run:

```bash
git add packages/core/metadata/forms/commonObjects/dynamicList/fromYAML.test.ts packages/core/metadata/forms/commonObjects/dynamicList/types.ts
git commit -m "fix: :bug: валидировать поля ключа динамического списка"
```

## Task 3: Validation And Final Verification

**Files:**
- No planned code changes.

- [ ] **Step 1: Run focused validation tests**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/forms/commonObjects/formAttribute/fromYAML.test.ts metadata/forms/commonObjects/dynamicList/fromYAML.test.ts metadata/validation/schemaRegistry.test.ts metadata/validation/validateProject.test.ts
```

Expected: all listed tests pass.

- [ ] **Step 2: Re-run ERP YAML validation**

Run:

```bash
env npm_config_cache=/tmp/npm-cache npx -y -p node@22 -c 'pnpm -s --dir /home/codexwsl/nkdk/packages/cli exec tsx src/cli.ts validate /tmp/round-trip-yaml-validation/erp' > /tmp/erp-yaml-validate-after-safe-schema-tail.log 2>&1
```

Expected: command exits with code `1` because unrelated validation errors remain.

- [ ] **Step 3: Count remaining `Unexpected property` diagnostics**

Run:

```bash
rg -c "Unexpected property" /tmp/erp-yaml-validate-after-safe-schema-tail.log
```

Expected: `11`.

Run:

```bash
rg -n "Unexpected property" /tmp/erp-yaml-validate-after-safe-schema-tail.log
```

Expected: no diagnostics for `ТабличныйДокумент`, `Диаграмма`, `ДиаграммаГанта`, or `ПоляКлюча`.

- [ ] **Step 4: Run full tests**

Run:

```bash
env npm_config_cache=/tmp/npm-cache npx -y -p node@22 -c 'pnpm test'
```

Expected: full project test suite passes.

- [ ] **Step 5: Check git status**

Run:

```bash
git status --short --branch
```

Expected: working tree is clean and branch is ahead of `origin/develop` by the new commits.
