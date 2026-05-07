# Table RowFilter Non DynamicList ValueTree Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Emit XML-only `RowFilter` for table data paths whose form attribute is neither `DynamicList` nor `ValueTree`.

**Architecture:** Keep conditional XML defaults in `TableRules` through `cypherPredicate`. Replace the current `ValueTable`-specific row-filter cache with a behavior-oriented row-filter eligibility cache derived from the same form-attribute data in real form export and element-level tests. `RowFilter`, `Period`, and `TopLevelParent` stay out of explicit TS models and YAML.

**Tech Stack:** TypeScript, Vitest, pnpm, rules.ts-based metadata orchestration, CypherCache, XML fixture tests.

---

## Current Context

This plan extends `docs/superpowers/specs/2026-05-07-table-row-filter-non-dynamic-value-tree-design.md`.

The current implementation has:

- `dynamicListFormAttributeQuery` in `packages/core/metadata/forms/elements/table/rules.ts`.
- `valueTableFormAttributeQuery` in the same file.
- `TableRules.rowFilter` using `valueTableFormAttributeQuery`.
- `ensureTableFormAttributeCypherCache` in `packages/core/metadata/forms/clientApplicationForm/toXML.ts`.
- Element-level CypherCache setup in `packages/core/tests/element/exportElementToXML.ts`.

The new behavior:

- `Period` and `TopLevelParent` remain DynamicList-only.
- `RowFilter` is emitted when the first segment of `dataPath` matches a form attribute returned by `rowFilterFormAttributeQuery`.
- `rowFilterFormAttributeQuery` returns form attributes whose `p_type_type` does not contain `DynamicList` and does not contain `ValueTree`.
- Missing cache rows never imply `RowFilter`.

## File Structure

- Modify `packages/core/metadata/forms/elements/table/rules.ts`
  - Replace `valueTableFormAttributeQuery` with `rowFilterFormAttributeQuery`.
  - Keep `dynamicListFormAttributeQuery`.
  - Point `rowFilter.toXML` at `rowFilterFormAttributeQuery`.

- Modify `packages/core/metadata/forms/elements/table/cypherPredicate.test.ts`
  - Rename helper row bucket from `valueTable` to `rowFilter`.
  - Add tests for nested `Объект.ЦеновыеГруппы`, `ValueTree`, empty cache, absent cache, and DynamicList.

- Modify `packages/core/metadata/forms/clientApplicationForm/toXML.ts`
  - Replace `valueTableFormAttributeQuery` import and cache handling with `rowFilterFormAttributeQuery`.
  - Add a derived row helper that excludes `DynamicList` and `ValueTree`.

- Modify `packages/core/metadata/forms/clientApplicationForm/toXML.test.ts`
  - Add focused real-export tests for row-filter eligible attributes, ValueTree exclusion, and existing-cache preservation.

- Modify `packages/core/tests/element/exportElementToXML.ts`
  - Replace `valueTableFormAttributeQuery` cache setup with `rowFilterFormAttributeQuery`.
  - Derive row-filter rows from `contextAttributes`, excluding `DynamicList` and `ValueTree`.

- No explicit fixture model/YAML changes are expected.

## Task 1: Red Predicate Tests For RowFilter Eligibility

**Files:**

- Modify: `packages/core/metadata/forms/elements/table/cypherPredicate.test.ts`
- Test: `packages/core/metadata/forms/elements/table/cypherPredicate.test.ts`

- [ ] **Step 1: Rename the imported query in the test**

Replace the import:

```ts
import { TableRules, dynamicListFormAttributeQuery, valueTableFormAttributeQuery } from "./rules"
```

with:

```ts
import { TableRules, dynamicListFormAttributeQuery, rowFilterFormAttributeQuery } from "./rules"
```

- [ ] **Step 2: Rename the helper row bucket**

Replace the `exportTableWithRows` signature and cache block with:

```ts
function exportTableWithRows(
  table: Table,
  rows:
    | {
        dynamicList?: Record<string, unknown>[]
        rowFilter?: Record<string, unknown>[]
      }
    | undefined,
): Record<string, unknown> {
  const context = mockContextToXML()

  if (rows !== undefined) {
    const cache = new CypherCache()
    if (rows.dynamicList !== undefined) {
      cache.set(dynamicListFormAttributeQuery, rows.dynamicList)
    }
    if (rows.rowFilter !== undefined) {
      cache.set(rowFilterFormAttributeQuery, rows.rowFilter)
    }
    context.exportToXML!.cypherCache = cache
  }

  return exportPropertiesToXML({
    context,
    metadata: table,
    rule: TableRules,
  }) as Record<string, unknown>
}
```

- [ ] **Step 3: Update existing positive RowFilter tests to use `rowFilter` rows**

In the test `экспортирует rowFilter, когда dataPath равен имени ValueTable-реквизита`, replace:

```ts
{ valueTable: [{ name: "Таблица" }] },
```

with:

```ts
{ rowFilter: [{ name: "Таблица" }] },
```

In the test `экспортирует rowFilter, когда dataPath начинается с имени ValueTable-реквизита`, replace:

```ts
{ valueTable: [{ name: "Таблица" }] },
```

with:

```ts
{ rowFilter: [{ name: "Таблица" }] },
```

- [ ] **Step 4: Replace the DynamicList negative RowFilter rows**

In the test `НЕ экспортирует rowFilter для DynamicList-реквизита`, replace:

```ts
{
  dynamicList: [{ name: "ДинамическийСписок" }],
  valueTable: [],
},
```

with:

```ts
{
  dynamicList: [{ name: "ДинамическийСписок" }],
  rowFilter: [],
},
```

- [ ] **Step 5: Replace the empty-cache RowFilter test rows**

In the test `НЕ экспортирует rowFilter, когда кеш пуст`, replace:

```ts
{ valueTable: [] },
```

with:

```ts
{ rowFilter: [] },
```

- [ ] **Step 6: Add a nested dataPath positive test**

Add this test inside `describe("Table CypherPredicate — rowFilter", () => { ... })`, after the current `Таблица.Колонка` positive test:

```ts
it("экспортирует rowFilter, когда dataPath начинается с обычного form attribute", () => {
  const result = exportTableWithRows(
    {
      itemType: "Table",
      name: "ЦеновыеГруппы",
      dataPath: "Объект.ЦеновыеГруппы",
      id: undefined,
    },
    { rowFilter: [{ name: "Объект" }] },
  )

  expect(result.RowFilter).toEqual({ "_xsi:nil": "true" })
})
```

- [ ] **Step 7: Add a ValueTree exclusion test**

Add this test inside the same `rowFilter` describe block, after the DynamicList negative test:

```ts
it("НЕ экспортирует rowFilter для ValueTree-реквизита", () => {
  const result = exportTableWithRows(
    {
      itemType: "Table",
      name: "Дерево",
      dataPath: "Дерево",
      id: undefined,
    },
    { rowFilter: [] },
  )

  expect(result.RowFilter).toBeUndefined()
})
```

This test models the post-query behavior: `ValueTree` attributes are excluded before rows reach the predicate.

- [ ] **Step 8: Run predicate tests and verify they fail for the right reason**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/elements/table/cypherPredicate.test.ts
```

Expected: FAIL because `rowFilterFormAttributeQuery` is not exported yet.

If the failure is not an unresolved import for `rowFilterFormAttributeQuery`, inspect the test changes before proceeding.

- [ ] **Step 9: Leave red tests uncommitted for Task 2**

Do not commit after Task 1. Leave the changed test file in the worktree so Task 2 can make it green and commit the tests together with the rule implementation.

Expected `git status --short` includes:

```text
 M packages/core/metadata/forms/elements/table/cypherPredicate.test.ts
```

## Task 2: Implement RowFilter Eligibility Query And Predicate

**Files:**

- Modify: `packages/core/metadata/forms/elements/table/rules.ts`
- Test: `packages/core/metadata/forms/elements/table/cypherPredicate.test.ts`

- [ ] **Step 1: Replace the ValueTable query export**

In `packages/core/metadata/forms/elements/table/rules.ts`, replace:

```ts
export const valueTableFormAttributeQuery =
  'MATCH (s {id: $scope})-[:FORM_ATTRIBUTE]->(a:FormAttribute) WHERE "ValueTable" IN a.p_type_type RETURN a.name AS name'
```

with:

```ts
export const rowFilterFormAttributeQuery =
  'MATCH (s {id: $scope})-[:FORM_ATTRIBUTE]->(a:FormAttribute) WHERE a.p_type_type IS NOT NULL AND NOT ("DynamicList" IN a.p_type_type) AND NOT ("ValueTree" IN a.p_type_type) RETURN a.name AS name'
```

- [ ] **Step 2: Point `rowFilter` at the new query**

In `TableRules.properties.rowFilter.toXML`, replace:

```ts
query: valueTableFormAttributeQuery,
```

with:

```ts
query: rowFilterFormAttributeQuery,
```

Leave the predicate body unchanged:

```ts
test: (el: any, rows: Record<string, unknown>[]) =>
  rows.some((r) => r.name === el?.dataPath?.split(".")[0]),
```

- [ ] **Step 3: Run predicate tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/elements/table/cypherPredicate.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit the rule update and predicate tests**

Run:

```bash
git add packages/core/metadata/forms/elements/table/rules.ts packages/core/metadata/forms/elements/table/cypherPredicate.test.ts
git commit -m "fix: :bug: выбирать RowFilter по типу реквизита"
```

## Task 3: Update Form Export Cache Wiring

**Files:**

- Modify: `packages/core/metadata/forms/clientApplicationForm/toXML.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/toXML.test.ts`
- Test: `packages/core/metadata/forms/clientApplicationForm/toXML.test.ts`
- Test: `packages/core/metadata/forms/elements/table/cypherPredicate.test.ts`

- [ ] **Step 1: Update the form export import**

In `packages/core/metadata/forms/clientApplicationForm/toXML.ts`, replace:

```ts
import { dynamicListFormAttributeQuery, valueTableFormAttributeQuery } from "~/metadata/forms/elements/table/rules"
```

with:

```ts
import { dynamicListFormAttributeQuery, rowFilterFormAttributeQuery } from "~/metadata/forms/elements/table/rules"
```

- [ ] **Step 2: Replace ValueTable cache flags with row-filter flags**

In `ensureTableFormAttributeCypherCache`, replace:

```ts
const hasValueTableRows = existingCache?.get(valueTableFormAttributeQuery) !== undefined

if (hasDynamicListRows && hasValueTableRows) return
```

with:

```ts
const hasRowFilterRows = existingCache?.get(rowFilterFormAttributeQuery) !== undefined

if (hasDynamicListRows && hasRowFilterRows) return
```

- [ ] **Step 3: Replace ValueTable row population**

In `ensureTableFormAttributeCypherCache`, replace:

```ts
if (!hasValueTableRows) {
  cache.set(valueTableFormAttributeQuery, getFormAttributeRowsByType(form, "ValueTable"))
}
```

with:

```ts
if (!hasRowFilterRows) {
  cache.set(rowFilterFormAttributeQuery, getRowFilterFormAttributeRows(form))
}
```

- [ ] **Step 4: Add the row-filter derived rows helper**

Add this helper below `getFormAttributeRowsByType`:

```ts
const getRowFilterFormAttributeRows = (form: ClientApplicationForm): Record<string, unknown>[] => {
  return (form.attributes ?? [])
    .filter((attr) => {
      if (attr.itemType !== "FormAttribute") return false
      if (!Array.isArray(attr.type?.type)) return false

      return !attr.type.type.includes("DynamicList") && !attr.type.type.includes("ValueTree")
    })
    .map((attr) => ({ name: attr.name }))
}
```

Leave `getFormAttributeRowsByType` in place for DynamicList.

- [ ] **Step 5: Update imports in `toXML.test.ts`**

In `packages/core/metadata/forms/clientApplicationForm/toXML.test.ts`, add these imports near the existing imports:

```ts
import { dynamicListFormAttributeQuery, rowFilterFormAttributeQuery } from "~/metadata/forms/elements/table/rules"
import { CypherCache } from "~/metadata/orchestration/property/cypherCache"
```

If `dynamicListFormAttributeQuery` is unused after adding tests, remove it before committing.

- [ ] **Step 6: Add a real-export positive test for nested paths**

Add this test inside `describe("exportClientApplicationFormToXML", () => { ... })`, after the existing DynamicList cache test:

```ts
it("экспортирует RowFilter для таблицы обычного реквизита без внешнего CypherCache", () => {
  const xmlData = exportClientApplicationFormToXML({
    context: mockContextToXML(),
    form: {
      ...minimalClientApplicationForm,
      attributes: [
        {
          itemType: "FormAttribute",
          name: "Объект",
          type: { type: ["CatalogObject.БонусныеПрограммыЛояльности"] },
          columns: [],
        },
      ],
      childItems: [
        {
          itemType: "Table",
          name: "ЦеновыеГруппы",
          dataPath: "Объект.ЦеновыеГруппы",
          id: undefined,
        },
      ],
    },
    referenceForm: undefined,
  })

  const childItems: Array<{ Table?: { RowFilter?: unknown } }> = Array.isArray(xmlData.ChildItems)
    ? xmlData.ChildItems
    : []
  const table = childItems[0]?.Table

  expect(table?.RowFilter).toEqual({ "_xsi:nil": "true" })
})
```

- [ ] **Step 7: Add a real-export ValueTree exclusion test**

Add this test after the positive nested-path test:

```ts
it("не экспортирует RowFilter для таблицы ValueTree-реквизита без внешнего CypherCache", () => {
  const xmlData = exportClientApplicationFormToXML({
    context: mockContextToXML(),
    form: {
      ...minimalClientApplicationForm,
      attributes: [
        {
          itemType: "FormAttribute",
          name: "Дерево",
          type: { type: ["ValueTree"] },
          columns: [],
        },
      ],
      childItems: [
        {
          itemType: "Table",
          name: "Дерево",
          dataPath: "Дерево",
          id: undefined,
        },
      ],
    },
    referenceForm: undefined,
  })

  const childItems: Array<{ Table?: { RowFilter?: unknown } }> = Array.isArray(xmlData.ChildItems)
    ? xmlData.ChildItems
    : []
  const table = childItems[0]?.Table

  expect(table?.RowFilter).toBeUndefined()
})
```

- [ ] **Step 8: Add a cache-preservation test**

Add this test after the ValueTree exclusion test:

```ts
it("не перезаписывает заранее заполненные rowFilter rows", () => {
  const context = mockContextToXML()
  const cache = new CypherCache()
  cache.set(rowFilterFormAttributeQuery, [])
  context.exportToXML!.cypherCache = cache

  const xmlData = exportClientApplicationFormToXML({
    context,
    form: {
      ...minimalClientApplicationForm,
      attributes: [
        {
          itemType: "FormAttribute",
          name: "Объект",
          type: { type: ["CatalogObject.БонусныеПрограммыЛояльности"] },
          columns: [],
        },
      ],
      childItems: [
        {
          itemType: "Table",
          name: "ЦеновыеГруппы",
          dataPath: "Объект.ЦеновыеГруппы",
          id: undefined,
        },
      ],
    },
    referenceForm: undefined,
  })

  const childItems: Array<{ Table?: { RowFilter?: unknown } }> = Array.isArray(xmlData.ChildItems)
    ? xmlData.ChildItems
    : []
  const table = childItems[0]?.Table

  expect(table?.RowFilter).toBeUndefined()
  expect(context.exportToXML!.cypherCache?.get(rowFilterFormAttributeQuery)).toEqual([])
})
```

- [ ] **Step 9: Run form export and predicate tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/clientApplicationForm/toXML.test.ts metadata/forms/elements/table/cypherPredicate.test.ts
```

Expected: PASS.

- [ ] **Step 10: Commit form export cache wiring**

Run:

```bash
git add packages/core/metadata/forms/clientApplicationForm/toXML.ts packages/core/metadata/forms/clientApplicationForm/toXML.test.ts
git commit -m "fix: :bug: заполнить кеш RowFilter для форм"
```

## Task 4: Update Element-Level Export Helper

**Files:**

- Modify: `packages/core/tests/element/exportElementToXML.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/toXML.test.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/fromXML.test.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/toYAML.test.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/fromYAML.test.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/toEnterprise.test.ts`

- [ ] **Step 1: Update imports**

In `packages/core/tests/element/exportElementToXML.ts`, replace:

```ts
import { dynamicListFormAttributeQuery, valueTableFormAttributeQuery } from "~/metadata/forms/elements/table/rules"
```

with:

```ts
import { dynamicListFormAttributeQuery, rowFilterFormAttributeQuery } from "~/metadata/forms/elements/table/rules"
```

- [ ] **Step 2: Replace ValueTable rows in the helper**

Inside `if (contextAttributes) { ... }`, replace:

```ts
const valueTableRows = getContextAttributeRowsByType(contextAttributes, "ValueTable")
if (valueTableRows.length > 0) {
  cache.set(valueTableFormAttributeQuery, valueTableRows)
}
```

with:

```ts
const rowFilterRows = getRowFilterContextAttributeRows(contextAttributes)
if (rowFilterRows.length > 0) {
  cache.set(rowFilterFormAttributeQuery, rowFilterRows)
}
```

- [ ] **Step 3: Add row-filter helper for context attributes**

Add this helper below `getContextAttributeRowsByType`:

```ts
function getRowFilterContextAttributeRows(contextAttributes: FormAttribute[]): Record<string, unknown>[] {
  return contextAttributes
    .filter((attr) => {
      if (attr.itemType !== "FormAttribute") return false
      if (!Array.isArray(attr.type?.type)) return false

      return !attr.type.type.includes("DynamicList") && !attr.type.type.includes("ValueTree")
    })
    .map((attr) => ({ name: attr.name }))
}
```

- [ ] **Step 4: Run focused Table fixture tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/elements/__tests__/fromXML.test.ts metadata/forms/elements/__tests__/toXML.test.ts metadata/forms/elements/__tests__/fromYAML.test.ts metadata/forms/elements/__tests__/toYAML.test.ts metadata/forms/elements/__tests__/toEnterprise.test.ts -t "Table"
```

Expected: PASS.

- [ ] **Step 5: Commit element helper wiring**

Run:

```bash
git add packages/core/tests/element/exportElementToXML.ts
git commit -m "fix: :bug: учитывать RowFilter в тестовом экспорте"
```

## Task 5: Final Verification And Round-Trip Check

**Files:**

- Test: `packages/core/metadata/forms/elements/table/cypherPredicate.test.ts`
- Test: `packages/core/metadata/forms/clientApplicationForm/toXML.test.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/fromXML.test.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/toXML.test.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/fromYAML.test.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/toYAML.test.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/toEnterprise.test.ts`

- [ ] **Step 1: Run focused implementation verification**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/elements/table/cypherPredicate.test.ts metadata/forms/clientApplicationForm/toXML.test.ts metadata/forms/elements/__tests__/fromXML.test.ts metadata/forms/elements/__tests__/toXML.test.ts metadata/forms/elements/__tests__/fromYAML.test.ts metadata/forms/elements/__tests__/toYAML.test.ts metadata/forms/elements/__tests__/toEnterprise.test.ts -t "Table|RowFilter|rowFilter"
```

Expected: PASS.

- [ ] **Step 2: Run adjacent child-item fixture verification**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/elements/__tests__/fromXML.test.ts metadata/forms/elements/__tests__/toXML.test.ts metadata/forms/elements/__tests__/fromYAML.test.ts metadata/forms/elements/__tests__/toYAML.test.ts -t "TableInputField|TableCheckBoxField|TableLabelField|TablePictureField|ColumnGroup"
```

Expected: PASS.

- [ ] **Step 3: Run the project test suite**

Run:

```bash
pnpm test
```

Expected: PASS.

- [ ] **Step 4: Run round-trip triage to verify the motivating RowFilter diff**

Run:

```bash
env NKDK_XML_REPO=/Users/nikita/git/round-trip-source NKDK_XML_DIR=/Users/nikita/git/round-trip-source/trade ./.agents/skills/round-trip-xml/round-trip.sh --triage --batch-size 5
```

Expected:

- The previous diff at index 2 for `Catalogs/БонусныеПрограммыЛояльности/Forms/ФормаЭлемента/Ext/Form.xml` should no longer show deletion of `<RowFilter xsi:nil="true"/>`.
- Other unrelated diffs may remain, including `TypeDomainEnabled`, empty form parameter `Type`, or DCS MetadataValue crashes.

If the `ЦеновыеГруппы` `RowFilter` diff still appears, stop and inspect whether the real form export has a form attribute row named `Объект` that is included in `rowFilterFormAttributeQuery`.

- [ ] **Step 5: Inspect git diff and status**

Run:

```bash
git status --short
git diff --stat
git diff -- packages/core/metadata/forms/elements/table/rules.ts packages/core/metadata/forms/clientApplicationForm/toXML.ts packages/core/metadata/forms/clientApplicationForm/toXML.test.ts packages/core/tests/element/exportElementToXML.ts packages/core/metadata/forms/elements/table/cypherPredicate.test.ts
```

Expected:

- Worktree is clean after commits, or only intentional uncommitted verification files exist.
- No XML fixture changes are needed for this plan.
- `valueTableFormAttributeQuery` no longer appears in changed code.
- `rowFilterFormAttributeQuery` is used by `TableRules`, real form export, element test export, and predicate tests.

- [ ] **Step 6: Commit final adjustments if any were needed**

If Steps 1-5 required code changes not already committed, run:

```bash
git add packages/core/metadata/forms/elements/table/rules.ts packages/core/metadata/forms/clientApplicationForm/toXML.ts packages/core/metadata/forms/clientApplicationForm/toXML.test.ts packages/core/tests/element/exportElementToXML.ts packages/core/metadata/forms/elements/table/cypherPredicate.test.ts
git commit -m "test: :white_check_mark: проверить RowFilter обычных таблиц"
```

If there are no follow-up edits, do not create an empty commit.

## Self-Review

- Spec coverage: the plan covers query renaming, predicate behavior, cache derivation, cache preservation, element-level export cache setup, focused fixture tests, full tests, and round-trip verification.
- Placeholder scan: no `TBD`, `TODO`, or “write tests later” placeholders are present.
- Type consistency: the plan consistently uses `rowFilterFormAttributeQuery`, `dynamicListFormAttributeQuery`, `getRowFilterFormAttributeRows`, and `getRowFilterContextAttributeRows`.
- Scope check: unrelated short round-trip diffs are explicitly out of scope.
