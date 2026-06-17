# Tilde DataPath Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `~` variant form `DataPath` values pass validation without diagnostics while preserving them unchanged.

**Architecture:** Keep the behavior in the existing schema and resolver boundaries. JSON Schema accepts tilde variant paths; the semantic resolver skips them with an `ok` result and no target.

**Tech Stack:** TypeScript, Vitest, TypeBox JSON Schema, existing metadata validation pipeline.

## Global Constraints

- Do not change XML fixtures.
- Do not add new fromXML/toXML/fromYAML/toYAML rules.
- Do not transform tilde variant path strings.
- Do not include indexed `[0]` paths in this change.

---

### Task 1: Add failing tests for tilde variant paths

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataTargets/schema.test.ts`
- Modify: `packages/core/metadata/validation/dataPath/resolver.test.ts`

**Interfaces:**
- Consumes: `buildMetadataTargetSchema({ kind: "dataPath", context: "form" })`
- Consumes: `resolveDataPath` through the local `resolve` helper in `resolver.test.ts`
- Produces: Failing tests that describe the desired behavior.

- [ ] **Step 1: Update schema test**

In `packages/core/metadata/commonObjects/metadataTargets/schema.test.ts`, in `returns constrained schema for form data paths`, replace the exact `pattern` assertion with behavioral checks:

```ts
expect(schema).toMatchObject({
  type: "string",
  examples: ["ИмяРеквизита", "ИмяТаблицы.ИмяКолонки"],
})
expectMatches(schema, "ИмяРеквизита")
expectMatches(schema, "ИмяТаблицы.ИмяКолонки")
expectMatches(schema, "~Список.DefaultPicture")
expectMatches(schema, "~Список.Period~Список.Период")
expectNotMatches(schema, "Список[0].Поле")
expect(String(schema.description)).toContain("string")
```

- [ ] **Step 2: Update resolver tests**

In `packages/core/metadata/validation/dataPath/resolver.test.ts`, replace the two tilde warning tests with:

```ts
it("skips tilde variant paths without diagnostics", () => {
  const result = resolve("~Список.Period~Список.Период", {
    index: indexWithAttributes([]),
  })

  expect(result).toMatchObject({
    status: "ok",
    diagnostics: [],
  })
})

it("skips tilde variant paths before table context validation", () => {
  const result = resolve("~Список.Period~Список.Период", {
    index: indexWithAttributes([]),
    tableContext: { dataPath: "Список" },
  })

  expect(result).toMatchObject({
    status: "ok",
    diagnostics: [],
  })
})
```

- [ ] **Step 3: Run tests and verify red**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate metadata/commonObjects/metadataTargets/schema.test.ts metadata/validation/dataPath/resolver.test.ts
```

Expected: FAIL. The schema test rejects `~...`, and the resolver tests still return `warning`.

### Task 2: Implement tilde path skipping

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataTargets/schema.ts`
- Modify: `packages/core/metadata/validation/dataPath/resolver.ts`

**Interfaces:**
- Produces: `dataPathSchema` pattern with regular and tilde branches.
- Produces: `resolveDataPath` returning `{ status: "ok", diagnostics: [] }` for tilde variant paths.

- [ ] **Step 1: Extend `dataPathSchema`**

In `packages/core/metadata/commonObjects/metadataTargets/schema.ts`, change `dataPathSchema` to build two pattern branches:

```ts
const simplePathPattern = `${METADATA_NAME_PATTERN}(?:\\.${METADATA_NAME_PATTERN})*`
const tildeVariantPathPattern = `~${simplePathPattern}(?:~${simplePathPattern})*`
return Type.String({
  pattern: `^(?:${simplePathPattern}|${tildeVariantPathPattern})$`,
  examples: ["ИмяРеквизита", "ИмяТаблицы.ИмяКолонки"],
  description: `Путь к данным формы: ИмяРеквизита или ИмяТаблицы.ИмяКолонки.${allowedKinds}${composite} Вариантные пути с "~" сохраняются как есть и не проверяются. Реальные поля проверяются validate.`,
})
```

- [ ] **Step 2: Change resolver tilde branch**

In `packages/core/metadata/validation/dataPath/resolver.ts`, replace the warning branch:

```ts
if (isTildeVariantPath(value)) {
  return { status: "ok", diagnostics: [] }
}
```

- [ ] **Step 3: Run focused tests and verify green**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate metadata/commonObjects/metadataTargets/schema.test.ts metadata/validation/dataPath/resolver.test.ts
```

Expected: PASS.

### Task 3: Verify project validation effect

**Files:**
- No source files.

**Interfaces:**
- Consumes: `/home/nikita/git/temp-yaml` imported ERP YAML.
- Produces: Evidence that `~` paths no longer appear as schema errors or warnings.

- [ ] **Step 1: Run ERP validation**

Run:

```bash
pnpm --filter @nakidka/cli dev validate /home/nikita/git/temp-yaml > /tmp/erp-validate-after-tilde.log 2>&1
```

Expected: command still exits non-zero because other validation errors remain.

- [ ] **Step 2: Count tilde diagnostics**

Run:

```bash
rg 'ПутьКДанным ".*~|Expected string to match' /tmp/erp-validate-after-tilde.log
```

Expected: no diagnostics for tilde variant paths. `Expected string to match` may remain only for non-tilde cases such as indexed `[0]` paths.

- [ ] **Step 3: Run package test target**

Run:

```bash
pnpm --filter @nakidka/core test -- metadataTargets/schema.test.ts dataPath/resolver.test.ts
```

Expected: PASS for the changed behavior. If this command runs broader package tests, the relevant changed tests must pass.
