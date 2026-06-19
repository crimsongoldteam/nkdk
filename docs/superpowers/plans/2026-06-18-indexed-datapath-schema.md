# Indexed DataPath Schema Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow JSON Schema validation for DataPath strings with indexed segments such as `Объект.Товары[0].Номенклатура`.

**Architecture:** Keep the fix in the metadata target JSON Schema layer only. `dataPathSchema` will share one path segment pattern between normal DataPath strings and tilde variant paths, while resolver/import/export behavior remains unchanged.

**Tech Stack:** TypeScript, TypeBox JSON Schema, Vitest, existing metadata validation CLI.

---

## File Structure

- Modify: `packages/core/metadata/commonObjects/metadataTargets/schema.ts`
  - Responsibility: build JSON Schema regex patterns for metadata targets, including `kind: "dataPath"`.
- Modify: `packages/core/metadata/commonObjects/metadataTargets/schema.test.ts`
  - Responsibility: unit coverage for generated schema patterns.
- Optionally modify: `packages/core/metadata/validation/validateForm.test.ts`
  - Responsibility: integration coverage if current indexed DataPath tests do not fail before the schema change.

## Task 1: Add Failing Schema Tests

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataTargets/schema.test.ts`

- [ ] **Step 1: Add the failing checks to the existing `returns constrained schema for form data paths` test**

Find the test named `returns constrained schema for form data paths` and replace the current negative indexed assertion with positive and negative indexed cases:

```ts
    expectMatches(schema, "Список[0].Поле")
    expectMatches(schema, "Объект.Товары[0].Номенклатура")
    expectMatches(schema, "~Список[0].DefaultPicture")
    expectMatches(schema, "~Список[0].Period~Список.Период")
    expectNotMatches(schema, "Список[].Поле")
    expectNotMatches(schema, "Список[abc].Поле")
    expectNotMatches(schema, "Список[0]..Поле")
```

Keep the existing checks for `ИмяРеквизита`, `ИмяТаблицы.ИмяКолонки`, `~Список.DefaultPicture`, and `~Список.Period~Список.Период`.

- [ ] **Step 2: Run schema test and verify it fails**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/commonObjects/metadataTargets/schema.test.ts
```

Expected: FAIL because `Список[0].Поле` and indexed tilde paths do not match the current regex.

## Task 2: Implement Indexed Segment Pattern

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataTargets/schema.ts`

- [ ] **Step 1: Replace the local path pattern in `dataPathSchema`**

Change:

```ts
  const simplePathPattern = `${METADATA_NAME_PATTERN}(?:\\.${METADATA_NAME_PATTERN})*`
  const tildeVariantPathPattern = `~${simplePathPattern}(?:~${simplePathPattern})*`
```

to:

```ts
  const indexedSegmentPattern = `${METADATA_NAME_PATTERN}(?:\\[[0-9]+\\])?`
  const simplePathPattern = `${indexedSegmentPattern}(?:\\.${indexedSegmentPattern})*`
  const tildeVariantPathPattern = `~${simplePathPattern}(?:~${simplePathPattern})*`
```

Do not change object/member/type/value metadata target schemas.

- [ ] **Step 2: Run schema test and verify it passes**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/commonObjects/metadataTargets/schema.test.ts
```

Expected: PASS.

## Task 3: Validate Integration Coverage

**Files:**
- Inspect: `packages/core/metadata/validation/validateForm.test.ts`

- [ ] **Step 1: Check existing indexed DataPath integration tests**

Confirm these tests already exist:

```ts
it("accepts indexed row paths for owner tabular sections", () => {
  // contains: ПутьКДанным: Объект.Товары[0].Сумма
})
```

and:

```ts
it("accepts indexed nested ValueTable paths from form additional columns", () => {
  // contains nested indexed ValueTable paths
})
```

- [ ] **Step 2: Add an integration test only if coverage is missing**

If the existing tests are absent or do not run schema validation, add this test near the other indexed DataPath tests:

```ts
  it("accepts indexed owner tabular section DataPath in schema validation", () => {
    const project = createProject({
      ownerDir: "Документ",
      ownerName: "Заказ",
      owner: [
        "ТабличныеЧасти:",
        "  Товары:",
        "    Реквизиты:",
        "      Номенклатура:",
        "        Тип: Справочник.Номенклатура",
      ],
      form: [
        "Реквизиты:",
        "  Объект:",
        "    Тип: Документ.Заказ",
        "Элементы:",
        "  Номенклатура:",
        "    Вид: ПолеВвода",
        "    ПутьКДанным: Объект.Товары[0].Номенклатура",
      ],
    })

    expect(runValidateForm(project)).toEqual([])
  })
```

- [ ] **Step 3: Run focused validation tests**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/commonObjects/metadataTargets/schema.test.ts metadata/validation/validateForm.test.ts metadata/validation/validateProject.test.ts
```

Expected: PASS.

## Task 4: ERP Validation and Final Tests

**Files:**
- No code edits.

- [ ] **Step 1: Run ERP YAML validation**

Run:

```bash
env npm_config_cache=/tmp/npm-cache npx -y -p node@22 -c 'pnpm --dir packages/cli exec tsx src/cli.ts validate /tmp/round-trip-yaml-validation/erp' > /tmp/erp-yaml-validate-indexed-datapath-schema.log
```

Expected: command exits with validation errors still present, but the `Expected string to match '^(?:...)$'` DataPath regex group drops substantially from 573.

- [ ] **Step 2: Count the targeted regex group**

Run:

```bash
rg -F "error: Expected string to match '^(?:" /tmp/erp-yaml-validate-indexed-datapath-schema.log | wc -l
```

Expected: lower than 573. If remaining lines exist, inspect the first 40:

```bash
rg -F "error: Expected string to match '^(?:" /tmp/erp-yaml-validate-indexed-datapath-schema.log | sed -n '1,40p'
```

- [ ] **Step 3: Run full test suite**

Run:

```bash
env npm_config_cache=/tmp/npm-cache npx -y -p node@22 -c 'pnpm test'
```

Expected: PASS.

## Self-Review

- Spec coverage: the plan changes only DataPath JSON Schema and leaves resolver/import/export/XML untouched.
- Placeholder scan: no unresolved placeholders or open-ended implementation steps.
- Type consistency: uses existing `METADATA_NAME_PATTERN`, `buildMetadataTargetSchema`, `expectMatches`, and `expectNotMatches`.
