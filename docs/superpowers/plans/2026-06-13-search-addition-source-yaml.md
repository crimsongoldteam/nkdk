# Search Addition Source YAML Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Exclude `Источник` from YAML and JSON Schema for typed search additions while preserving existing XML/reference behavior.

**Architecture:** Keep the model and XML path intact: `additionSource` stays a `TableAdditionalSource` for search additions. Teach YAML Schema generation to ignore `fromYAML: false`, then mark typed `SearchStringAddition` and `SearchControlAddition` sources as excluded from YAML import/export.

**Tech Stack:** TypeScript, TypeBox JSON Schema generation, Vitest, pnpm.

---

## File Structure

- Modify `packages/core/metadata/orchestration/property/toJSONSchema.ts`: skip properties whose rules have `fromYAML: false`.
- Modify `packages/core/metadata/validation/schemaRegistry.test.ts`: lock schema behavior for `Источник` in typed search additions.
- Modify `packages/core/metadata/forms/elements/searchStringAddition/rules.ts`: mark typed `additionSource` as YAML-excluded.
- Modify `packages/core/metadata/forms/elements/searchControlAddition/rules.ts`: mark typed `additionSource` as YAML-excluded.
- Modify `packages/core/metadata/forms/elements/__tests__/toYAML.test.ts`: lock YAML export behavior for typed search additions with model `additionSource`.
- No XML fixture changes.

---

### Task 1: Make JSON Schema Respect `fromYAML: false`

**Files:**
- Modify: `packages/core/metadata/orchestration/property/toJSONSchema.ts`
- Modify: `packages/core/metadata/validation/schemaRegistry.test.ts`

- [ ] **Step 1: Add failing schema tests**

In `packages/core/metadata/validation/schemaRegistry.test.ts`, add these tests near the existing command bar / form schema tests:

```ts
  it("rejects source in command bar search string additions", () => {
    const schema = exportJSONSchemaForSchemaName({ context, name: "ClientApplicationForm", mode: "inline" })
    const compiled = TypeCompiler.Compile(schema)
    const value = {
      Элементы: {
        Таблица: {
          Вид: "ТаблицаФормы",
          КоманднаяПанель: {
            Элементы: {
              СтрокаПоиска: {
                Вид: "ОтображениеСтрокиПоиска",
                Источник: "Таблица",
              },
            },
          },
        },
      },
    }

    expect(compiled.Check(value)).toBe(false)
    expect([...compiled.Errors(value)].map((error) => `${error.path}: ${error.message}`)).toContain(
      "/Элементы/Таблица: Expected union value"
    )
  })

  it("rejects source in command bar search control additions", () => {
    const schema = exportJSONSchemaForSchemaName({ context, name: "ClientApplicationForm", mode: "inline" })
    const compiled = TypeCompiler.Compile(schema)
    const value = {
      Элементы: {
        Таблица: {
          Вид: "ТаблицаФормы",
          КоманднаяПанель: {
            Элементы: {
              УправлениеПоиском: {
                Вид: "УправлениеПоиском",
                Источник: "Таблица",
              },
            },
          },
        },
      },
    }

    expect(compiled.Check(value)).toBe(false)
    expect([...compiled.Errors(value)].map((error) => `${error.path}: ${error.message}`)).toContain(
      "/Элементы/Таблица: Expected union value"
    )
  })
```

- [ ] **Step 2: Run the focused schema tests**

Run:

```bash
pnpm --dir packages/core test -- metadata/validation/schemaRegistry.test.ts
```

Expected before implementation: both new tests fail because typed search additions currently allow `Источник` in schema.

- [ ] **Step 3: Update JSON Schema generation**

In `packages/core/metadata/orchestration/property/toJSONSchema.ts`, import `shouldProcessProperty` and skip properties that are not imported from YAML.

Change the imports to:

```ts
import { shouldProcessProperty } from "./helpers"
import { MetadataItem, MetadataItemRule, PropertyRule } from "./types"
```

Then change the loop body in `exportPropertiesToJSONSchema` to:

```ts
    if (!shouldProcessProperty({ rule: ruleProp, operation: "importFromYAML" })) continue

    const yamlKey = ruleProp.yaml
    if (!yamlKey) continue
```

- [ ] **Step 4: Run the focused schema tests again**

Run:

```bash
pnpm --dir packages/core test -- metadata/validation/schemaRegistry.test.ts
```

Expected: all tests in `schemaRegistry.test.ts` pass.

- [ ] **Step 5: Commit Task 1**

Run:

```bash
git add packages/core/metadata/orchestration/property/toJSONSchema.ts packages/core/metadata/validation/schemaRegistry.test.ts
git commit -m "fix: :bug: исключить fromYAML false из схемы"
```

---

### Task 2: Exclude Typed Search Sources From YAML

**Files:**
- Modify: `packages/core/metadata/forms/elements/searchStringAddition/rules.ts`
- Modify: `packages/core/metadata/forms/elements/searchControlAddition/rules.ts`
- Modify: `packages/core/metadata/forms/elements/__tests__/toYAML.test.ts`

- [ ] **Step 1: Add failing YAML export tests**

In `packages/core/metadata/forms/elements/__tests__/toYAML.test.ts`, add these tests under `describe("exportElementToPartialYAML", () => { ... })`, after the `describe.each` block:

```ts
  it("omits search string addition source from partial YAML", () => {
    const result = exportElementToPartialYAML({
      context: mockContext,
      element: {
        itemType: "SearchStringAddition",
        name: "ТаблицаСтрокаПоиска",
        additionSource: "Таблица",
      },
    })

    expect(result).toEqual({
      Вид: "ОтображениеСтрокиПоиска",
    })
  })

  it("omits search control addition source from partial YAML", () => {
    const result = exportElementToPartialYAML({
      context: mockContext,
      element: {
        itemType: "SearchControlAddition",
        name: "ТаблицаУправлениеПоиском",
        additionSource: "Таблица",
        childItems: [],
      },
    })

    expect(result).toEqual({
      Вид: "УправлениеПоиском",
    })
  })
```

- [ ] **Step 2: Run the focused YAML tests**

Run:

```bash
pnpm --dir packages/core test -- metadata/forms/elements/__tests__/toYAML.test.ts
```

Expected before implementation: both new tests fail because typed `additionSource` is currently exported as `Источник`.

- [ ] **Step 3: Mark search string source as YAML-excluded**

In `packages/core/metadata/forms/elements/searchStringAddition/rules.ts`, change `SearchStringAdditionRules.properties.additionSource` to:

```ts
    additionSource: {
      yaml: "Источник",
      type: "TableAdditionalSource",
      additionalSourceType: "SearchStringRepresentation",
      toYAML: false,
      fromYAML: false,
    },
```

Leave `SingleSearchStringAdditionRules.properties.additionSource` unchanged:

```ts
    additionSource: {
      type: "TableAdditionalSource",
      additionalSourceType: "SearchStringRepresentation",
      fromXML: false,
      forSingleElement: true,
    },
```

- [ ] **Step 4: Mark search control source as YAML-excluded**

In `packages/core/metadata/forms/elements/searchControlAddition/rules.ts`, change `SearchControlAdditionRules.properties.additionSource` to:

```ts
    additionSource: {
      yaml: "Источник",
      type: "TableAdditionalSource",
      additionalSourceType: "SearchControl",
      toYAML: false,
      fromYAML: false,
    },
```

Leave `SingleSearchControlAdditionRules.properties.additionSource` unchanged:

```ts
    additionSource: {
      type: "TableAdditionalSource",
      additionalSourceType: "SearchControl",
      fromXML: false,
      forSingleElement: true,
    },
```

- [ ] **Step 5: Run focused YAML and schema tests**

Run:

```bash
pnpm --dir packages/core test -- metadata/forms/elements/__tests__/toYAML.test.ts metadata/validation/schemaRegistry.test.ts
```

Expected: both test files pass. Typed command bar search additions reject `Источник` in schema and omit it from YAML export.

- [ ] **Step 6: Commit Task 2**

Run:

```bash
git add packages/core/metadata/forms/elements/searchStringAddition/rules.ts packages/core/metadata/forms/elements/searchControlAddition/rules.ts packages/core/metadata/forms/elements/__tests__/toYAML.test.ts packages/core/metadata/validation/schemaRegistry.test.ts
git commit -m "fix: :bug: исключить источник дополнений поиска"
```

---

### Task 3: Verify ERP Validation Impact

**Files:**
- No source files.

- [ ] **Step 1: Run type checking**

Run:

```bash
pnpm --dir packages/core type-check
```

Expected: exits with code 0.

- [ ] **Step 2: Run full project tests**

Run:

```bash
pnpm test
```

Expected: exits with code 0.

- [ ] **Step 3: Regenerate YAML if needed**

If `/home/nikita/git/temp-yaml/erp` was not regenerated after Task 2, rerun the same CLI export command used for this branch to produce `/home/nikita/git/temp-yaml/erp` from `/home/nikita/git/round-trip/erp`.

Expected: regenerated YAML no longer contains `Источник` under `Вид: ОтображениеСтрокиПоиска` and `Вид: УправлениеПоиском`.

- [ ] **Step 4: Run CLI validation**

Run:

```bash
pnpm -s --dir packages/cli exec tsx src/cli.ts validate /home/nikita/git/temp-yaml/erp > /tmp/nkdk-validate-erp-search-source.log 2>&1
```

Expected: validation may still exit with code 1 because other ERP errors remain.

- [ ] **Step 5: Count remaining target errors**

Run:

```bash
rg "Unexpected property" /tmp/nkdk-validate-erp-search-source.log | rg "Источник" | wc -l
```

Expected: this count decreases by the search additions that were previously generated into YAML. If the count is not zero, inspect whether remaining `Источник` errors are stale YAML or another owner type.

- [ ] **Step 6: Check the worktree**

Run:

```bash
git status --short
```

Expected: no unstaged source changes after commits, or only deliberate validation logs outside the repository.
