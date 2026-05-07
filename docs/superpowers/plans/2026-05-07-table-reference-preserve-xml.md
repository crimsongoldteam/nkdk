# Table Reference Preserve XML Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve `Table` XML-only service fields from reference XML instead of inferring them through Cypher.

**Architecture:** Add a declarative `preserveFromReferenceXML: true` property-rule flag. XML export will process such a property only when the current reference metadata object owns the same property key, then the existing `defaultValueXMLRaw` path emits the XML. `Table.period`, `Table.topLevelParent`, and `Table.rowFilter` use this flag; the old Cypher-driven export path is removed while `cypherSet` remains.

**Tech Stack:** TypeScript, Vitest, pnpm, metadata orchestration rules, XML fixture round-trip tests.

---

## Current Context

This plan implements `docs/superpowers/specs/2026-05-07-table-reference-preserve-xml-design.md`.

The current branch has the more complex Cypher-based implementation:

- `TableRules.period` and `TableRules.topLevelParent` use `dynamicListFormAttributeQuery`.
- `TableRules.rowFilter` uses `rowFilterFormAttributeQuery`.
- `exportClientApplicationFormToXML` populates a `CypherCache` from form attributes.
- `testExportElementToXML` populates equivalent cache rows from fixture `contextAttributes`.
- `syncFormToXML` pre-resolves `cypherPredicate` values through graph queries.

The new behavior is simpler:

- `Period`, `TopLevelParent`, and `RowFilter` are not inferred.
- If the reference table owns the corresponding model key, export the fixed XML raw default.
- If the reference table does not own the key, do not export the field.
- Without reference metadata, never add these fields.

Important implementation detail:

`importPropertiesFromXML` already preserves `fromXML: false` fields for reference imports when the XML tag is present. It writes the key even if the imported value is `undefined`. Therefore export must use `Object.hasOwn(referenceMetadata, key)`, not a truthiness check.

## File Structure

- Modify `packages/core/metadata/orchestration/property/types.ts`
  - Add `preserveFromReferenceXML?: true` to `BasePropertyRule`.
  - Remove `CypherPredicate` from the `toXML` type after table rules no longer use it.

- Modify `packages/core/metadata/orchestration/property/helpers.ts`
  - Teach `shouldProcessProperty` about property key and reference metadata.
  - Add `preserveFromReferenceXML` handling during `exportToXML`.
  - Later remove the `cypherPredicate` branch when unused.

- Modify `packages/core/metadata/orchestration/property/toXML.ts`
  - Pass `key` and the containing `referenceMetadata` object into `shouldProcessProperty`.

- Modify `packages/core/metadata/orchestration/property/helpers.test.ts`
  - Add focused tests for `preserveFromReferenceXML`.

- Modify `packages/core/metadata/forms/elements/table/rules.ts`
  - Replace `cypherPredicate` usage with `preserveFromReferenceXML: true`.
  - Remove `dynamicListFormAttributeQuery` and `rowFilterFormAttributeQuery` after dependent imports are removed.

- Create `packages/core/metadata/forms/elements/table/preserveFromReferenceXML.test.ts`
  - Test table-level behavior directly through `exportPropertiesToXML`.

- Delete `packages/core/metadata/forms/elements/table/cypherPredicate.test.ts`
  - Its assertions describe the old inferred behavior.

- Modify `packages/core/metadata/forms/clientApplicationForm/toXML.ts`
  - Remove form-attribute Cypher cache preparation.

- Modify `packages/core/metadata/forms/clientApplicationForm/toXML.test.ts`
  - Replace Cypher cache tests with reference-preservation tests.

- Modify `packages/core/tests/element/exportElementToXML.ts`
  - Remove `contextAttributes` and `CypherCache` setup.

- Modify `packages/core/metadata/forms/elements/__tests__/fixtures.ts`
  - Remove `contextAttributes` from the fixture type and table fixtures.

- Modify `packages/core/metadata/forms/elements/__tests__/toXML.test.ts`
  - Stop passing `contextAttributes` into the test helper.

- Modify `packages/core/metadata/forms/clientApplicationForm/syncToXML.ts`
  - Remove pre-resolution of Cypher predicates.

- Modify `packages/core/metadata/context/types.ts`
  - Remove `cypherCache` from export context after no production code uses it.

- Modify `packages/core/metadata/orchestration/property/cypherPredicate.ts`
  - Keep `CypherSet`, `cypherSet()`, and `isCypherSet()`.
  - Remove `CypherPredicate`, `cypherPredicate()`, and `isCypherPredicate()`.

- Modify `packages/core/metadata/orchestration/property/cypherPredicate.test.ts`
  - Keep only `cypherSet` tests.

- Delete `packages/core/metadata/orchestration/property/cypherCache.ts`
- Delete `packages/core/metadata/orchestration/property/cypherCache.test.ts`
- Delete `packages/core/metadata/orchestration/property/cypherResolver.ts`

## Task 1: Red Tests For `preserveFromReferenceXML`

**Files:**

- Modify: `packages/core/metadata/orchestration/property/helpers.test.ts`
- Test: `packages/core/metadata/orchestration/property/helpers.test.ts`

- [ ] **Step 1: Import `shouldProcessProperty`**

In `packages/core/metadata/orchestration/property/helpers.test.ts`, replace:

```ts
import { applyRequiredXMLParents, getOrderedKeysFromXML } from "./helpers"
```

with:

```ts
import { applyRequiredXMLParents, getOrderedKeysFromXML, shouldProcessProperty } from "./helpers"
```

- [ ] **Step 2: Add red tests for reference key preservation**

Append this block before `describe("setXMLValue", () => { ... })`:

```ts
describe("shouldProcessProperty preserveFromReferenceXML", () => {
  const preserveRule = {
    type: "boolean",
    fromXML: false,
    preserveFromReferenceXML: true,
    defaultValueXMLRaw: { "_xsi:nil": "true" },
  } as any

  it("экспортирует поле, когда referenceMetadata содержит ключ со значением undefined", () => {
    const result = shouldProcessProperty({
      rule: preserveRule,
      operation: "exportToXML",
      propertyKey: "rowFilter",
      referenceMetadata: { rowFilter: undefined },
    })

    expect(result).toBe(true)
  })

  it("не экспортирует поле, когда referenceMetadata не содержит ключ", () => {
    const result = shouldProcessProperty({
      rule: preserveRule,
      operation: "exportToXML",
      propertyKey: "rowFilter",
      referenceMetadata: {},
    })

    expect(result).toBe(false)
  })

  it("не экспортирует поле без referenceMetadata", () => {
    const result = shouldProcessProperty({
      rule: preserveRule,
      operation: "exportToXML",
      propertyKey: "rowFilter",
    })

    expect(result).toBe(false)
  })

  it("не меняет поведение обычных полей без preserveFromReferenceXML", () => {
    const result = shouldProcessProperty({
      rule: { type: "string" } as any,
      operation: "exportToXML",
      propertyKey: "name",
      referenceMetadata: {},
    })

    expect(result).toBe(true)
  })
})
```

- [ ] **Step 3: Run the red focused test**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/orchestration/property/helpers.test.ts -t "preserveFromReferenceXML"
```

Expected: FAIL. At this point `shouldProcessProperty` does not accept `propertyKey` / `referenceMetadata` and does not implement `preserveFromReferenceXML`, so at least the missing-key and no-reference tests should fail by returning `true`.

- [ ] **Step 4: Leave red tests uncommitted**

Do not commit after Task 1. Leave `packages/core/metadata/orchestration/property/helpers.test.ts` dirty for Task 2.

## Task 2: Implement `preserveFromReferenceXML`

**Files:**

- Modify: `packages/core/metadata/orchestration/property/types.ts`
- Modify: `packages/core/metadata/orchestration/property/helpers.ts`
- Modify: `packages/core/metadata/orchestration/property/toXML.ts`
- Modify: `packages/core/metadata/orchestration/property/helpers.test.ts`
- Test: `packages/core/metadata/orchestration/property/helpers.test.ts`

- [ ] **Step 1: Add the property-rule flag type**

In `packages/core/metadata/orchestration/property/types.ts`, inside `BasePropertyRule`, add this field near `fromXML` / `toXML`:

```ts
  /**
   * XML-only preservation mode: export this property only when the reference metadata object
   * owns the same property key. Used for service tags that must be kept during round-trip
   * but never inferred for newly-created XML.
   */
  preserveFromReferenceXML?: true
```

Keep the existing `toXML` type unchanged in this task. `CypherPredicate` is removed later after `TableRules` no longer uses it.

- [ ] **Step 2: Extend `shouldProcessProperty` parameters**

In `packages/core/metadata/orchestration/property/helpers.ts`, update the `shouldProcessProperty` parameter type from:

```ts
export const shouldProcessProperty = (params: {
  rule: PropertyRule
  operation: PropertyExportImportOperation
  metadataItem?: any
  context?: import("~/metadata/context/types").ConfigurationContextWithExportToXML
}): boolean => {
  const { rule, operation, metadataItem, context } = params
```

to:

```ts
export const shouldProcessProperty = (params: {
  rule: PropertyRule
  operation: PropertyExportImportOperation
  metadataItem?: any
  context?: import("~/metadata/context/types").ConfigurationContextWithExportToXML
  propertyKey?: string
  referenceMetadata?: unknown
}): boolean => {
  const { rule, operation, metadataItem, context, propertyKey, referenceMetadata } = params
```

- [ ] **Step 3: Implement the preserve check**

In the `"exportToXML"` branch of `shouldProcessProperty`, replace:

```ts
    case "exportToXML":
      if (rule.toXML === false) return false
      if (rule.filePath !== undefined) return false
      if (typeof rule.toXML === "function") return rule.toXML(metadataItem, context)
      if (isCypherPredicate(rule.toXML)) return shouldProcessCypherPredicate(rule.toXML, metadataItem, context)
      return true
```

with:

```ts
    case "exportToXML":
      if (rule.toXML === false) return false
      if (rule.filePath !== undefined) return false
      if (rule.preserveFromReferenceXML === true) {
        if (propertyKey === undefined) return false
        if (referenceMetadata === undefined || referenceMetadata === null || typeof referenceMetadata !== "object") {
          return false
        }
        return Object.hasOwn(referenceMetadata, propertyKey)
      }
      if (typeof rule.toXML === "function") return rule.toXML(metadataItem, context)
      if (isCypherPredicate(rule.toXML)) return shouldProcessCypherPredicate(rule.toXML, metadataItem, context)
      return true
```

Keep the `cypherPredicate` branch for now; `TableRules` still uses it until Task 4.

- [ ] **Step 4: Pass the property key and reference object from XML export**

In `packages/core/metadata/orchestration/property/toXML.ts`, replace:

```ts
      if (!shouldProcessProperty({ rule: ruleProp, operation: "exportToXML", metadataItem: metadata, context })) continue
```

with:

```ts
      if (
        !shouldProcessProperty({
          rule: ruleProp,
          operation: "exportToXML",
          metadataItem: metadata,
          context,
          propertyKey: key,
          referenceMetadata,
        })
      ) {
        continue
      }
```

- [ ] **Step 5: Run the focused preserve tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/orchestration/property/helpers.test.ts -t "preserveFromReferenceXML"
```

Expected: PASS.

- [ ] **Step 6: Run all helper tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/orchestration/property/helpers.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit the orchestration flag**

Run:

```bash
git add packages/core/metadata/orchestration/property/types.ts packages/core/metadata/orchestration/property/helpers.ts packages/core/metadata/orchestration/property/toXML.ts packages/core/metadata/orchestration/property/helpers.test.ts
git commit -m "feat: :sparkles: сохранять XML-поля из референса"
```

## Task 3: Red Table Tests For Reference Preservation

**Files:**

- Create: `packages/core/metadata/forms/elements/table/preserveFromReferenceXML.test.ts`
- Test: `packages/core/metadata/forms/elements/table/preserveFromReferenceXML.test.ts`

- [ ] **Step 1: Add direct table preservation tests**

Create `packages/core/metadata/forms/elements/table/preserveFromReferenceXML.test.ts` with this content:

```ts
import { describe, expect, it } from "vitest"
import { mockContextToXML } from "~/tests/mockContext"
import { exportPropertiesToXML } from "~/metadata/orchestration/property/toXML"
import { TableRules } from "./rules"
import type { Table } from "./types"

const baseTable = {
  itemType: "Table",
  name: "Таблица",
  dataPath: "Таблица",
  id: undefined,
} satisfies Table

function exportTable(params: {
  table?: Table
  referenceTable?: Table
}): Record<string, unknown> {
  return exportPropertiesToXML({
    context: mockContextToXML(),
    metadata: params.table,
    referenceMetadata: params.referenceTable,
    rule: TableRules,
  }) as Record<string, unknown>
}

describe("Table preserveFromReferenceXML", () => {
  it("сохраняет RowFilter, когда ключ есть в referenceMetadata со значением undefined", () => {
    const result = exportTable({
      table: baseTable,
      referenceTable: {
        ...baseTable,
        rowFilter: undefined,
      },
    })

    expect(result.RowFilter).toEqual({ "_xsi:nil": "true" })
  })

  it("не добавляет RowFilter без ключа в referenceMetadata", () => {
    const result = exportTable({
      table: {
        ...baseTable,
        name: "ЦеновыеГруппы",
        dataPath: "Объект.ЦеновыеГруппы",
      },
      referenceTable: {
        ...baseTable,
        name: "ЦеновыеГруппы",
        dataPath: "Объект.ЦеновыеГруппы",
      },
    })

    expect(result.RowFilter).toBeUndefined()
  })

  it("сохраняет Period и TopLevelParent, когда ключи есть в referenceMetadata", () => {
    const result = exportTable({
      table: {
        ...baseTable,
        name: "ДинамическийСписок",
        dataPath: "ДинамическийСписок",
      },
      referenceTable: {
        ...baseTable,
        name: "ДинамическийСписок",
        dataPath: "ДинамическийСписок",
        period: undefined,
        topLevelParent: undefined,
      },
    })

    expect(result.Period).toEqual({
      "v8:variant": { "#text": "Custom", "_xsi:type": "v8:StandardPeriodVariant" },
      "v8:startDate": "0001-01-01T00:00:00",
      "v8:endDate": "0001-01-01T00:00:00",
    })
    expect(result.TopLevelParent).toEqual({ "_xsi:nil": "true" })
  })

  it("не добавляет XML-only поля без referenceMetadata", () => {
    const result = exportTable({
      table: {
        ...baseTable,
        name: "ДинамическийСписок",
        dataPath: "ДинамическийСписок",
      },
    })

    expect(result.Period).toBeUndefined()
    expect(result.TopLevelParent).toBeUndefined()
    expect(result.RowFilter).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run the new red table test**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/elements/table/preserveFromReferenceXML.test.ts
```

Expected: FAIL. The current `TableRules` still uses `cypherPredicate`; without a `CypherCache`, the positive reference-preservation tests should not emit `RowFilter`, `Period`, or `TopLevelParent`.

- [ ] **Step 3: Leave red tests uncommitted**

Do not commit after Task 3. Leave the new test file dirty for Task 4.

## Task 4: Switch `TableRules` To Reference Preservation

**Files:**

- Modify: `packages/core/metadata/forms/elements/table/rules.ts`
- Create: `packages/core/metadata/forms/elements/table/preserveFromReferenceXML.test.ts`
- Delete: `packages/core/metadata/forms/elements/table/cypherPredicate.test.ts`
- Test: `packages/core/metadata/forms/elements/table/preserveFromReferenceXML.test.ts`

- [ ] **Step 1: Remove the `cypherPredicate` import from `TableRules`**

In `packages/core/metadata/forms/elements/table/rules.ts`, remove:

```ts
import { cypherPredicate } from "~/metadata/orchestration/property/cypherPredicate"
```

Keep these query constants temporarily:

```ts
export const dynamicListFormAttributeQuery =
  'MATCH (s {id: $scope})-[:FORM_ATTRIBUTE]->(a:FormAttribute) WHERE "DynamicList" IN a.p_type_type RETURN a.name AS name'

export const rowFilterFormAttributeQuery =
  'MATCH (s {id: $scope})-[:FORM_ATTRIBUTE]->(a:FormAttribute) WHERE a.p_type_type IS NOT NULL AND NOT ("DynamicList" IN a.p_type_type) AND NOT ("ValueTree" IN a.p_type_type) RETURN a.name AS name'
```

They are still imported by form export and element-level test helpers until Tasks 5 and 6. Removing them in Task 4 would leave the repository with broken imports between commits.

- [ ] **Step 2: Change `period` to preserve from reference**

In `TableRules.properties.period`, replace the current comment and `toXML: cypherPredicate(...)` block with:

```ts
    // XML-only service fields are preserved only when present in the reference XML.
    period: {
      yaml: "Период",
      type: "boolean",
      fromXML: false,
      toYAML: false,
      fromYAML: false,
      preserveFromReferenceXML: true,
      defaultValueXMLRaw: {
        "v8:variant": { "#text": "Custom", "_xsi:type": "v8:StandardPeriodVariant" },
        "v8:startDate": "0001-01-01T00:00:00",
        "v8:endDate": "0001-01-01T00:00:00",
      },
    },
```

- [ ] **Step 3: Change `topLevelParent` to preserve from reference**

Replace `TableRules.properties.topLevelParent` with:

```ts
    topLevelParent: {
      yaml: "РодительВерхнегоУровня",
      type: "boolean",
      fromXML: false,
      toYAML: false,
      fromYAML: false,
      preserveFromReferenceXML: true,
      defaultValueXMLRaw: { "_xsi:nil": "true" },
    },
```

- [ ] **Step 4: Change `rowFilter` to preserve from reference**

Replace `TableRules.properties.rowFilter` with:

```ts
    rowFilter: {
      yaml: "ОтборСтрок",
      type: "boolean",
      fromXML: false,
      toYAML: false,
      fromYAML: false,
      preserveFromReferenceXML: true,
      defaultValueXMLRaw: { "_xsi:nil": "true" },
    },
```

- [ ] **Step 5: Delete the old table Cypher predicate test**

Delete:

```bash
packages/core/metadata/forms/elements/table/cypherPredicate.test.ts
```

The deleted tests assert data-path/type inference that no longer exists.

- [ ] **Step 6: Run the new table preservation test**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/elements/table/preserveFromReferenceXML.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit table rule preservation**

Run:

```bash
git add packages/core/metadata/forms/elements/table/rules.ts packages/core/metadata/forms/elements/table/preserveFromReferenceXML.test.ts
git add -u packages/core/metadata/forms/elements/table/cypherPredicate.test.ts
git commit -m "fix: :bug: сохранять XML-поля таблицы из референса"
```

## Task 5: Remove Form Export Cypher Cache Wiring

**Files:**

- Modify: `packages/core/metadata/forms/clientApplicationForm/toXML.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/toXML.test.ts`
- Test: `packages/core/metadata/forms/clientApplicationForm/toXML.test.ts`
- Test: `packages/core/metadata/forms/elements/table/preserveFromReferenceXML.test.ts`

- [ ] **Step 1: Remove Cypher imports from form export**

In `packages/core/metadata/forms/clientApplicationForm/toXML.ts`, remove:

```ts
import { dynamicListFormAttributeQuery, rowFilterFormAttributeQuery } from "~/metadata/forms/elements/table/rules"
import { CypherCache } from "~/metadata/orchestration/property/cypherCache"
```

- [ ] **Step 2: Stop preparing the table form-attribute cache**

In `exportClientApplicationFormToXML`, remove:

```ts
  ensureTableFormAttributeCypherCache(context, form)
```

- [ ] **Step 3: Remove the local cache helpers**

Delete these functions from `packages/core/metadata/forms/clientApplicationForm/toXML.ts`:

```ts
const ensureTableFormAttributeCypherCache = (
  context: ConfigurationContextWithExportToXML,
  form: ClientApplicationForm
): void => {
  const existingCache = context.exportToXML.cypherCache
  const hasDynamicListRows = existingCache?.get(dynamicListFormAttributeQuery) !== undefined
  const hasRowFilterRows = existingCache?.get(rowFilterFormAttributeQuery) !== undefined

  if (hasDynamicListRows && hasRowFilterRows) return

  const cache = existingCache ?? new CypherCache()

  if (!hasDynamicListRows) {
    cache.set(dynamicListFormAttributeQuery, getFormAttributeRowsByType(form, "DynamicList"))
  }

  if (!hasRowFilterRows) {
    cache.set(rowFilterFormAttributeQuery, getRowFilterFormAttributeRows(form))
  }

  context.exportToXML.cypherCache = cache
}

const getFormAttributeRowsByType = (
  form: ClientApplicationForm,
  typeName: "DynamicList"
): Record<string, unknown>[] => {
  return (form.attributes ?? [])
    .filter(
      (attr) =>
        attr.itemType === "FormAttribute" &&
        Array.isArray(attr.type?.type) &&
        attr.type.type.includes(typeName)
    )
    .map((attr) => ({ name: attr.name }))
}

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

- [ ] **Step 4: Remove Cypher imports from form export tests**

In `packages/core/metadata/forms/clientApplicationForm/toXML.test.ts`, remove:

```ts
import { rowFilterFormAttributeQuery } from "~/metadata/forms/elements/table/rules"
import { CypherCache } from "~/metadata/orchestration/property/cypherCache"
```

- [ ] **Step 5: Replace the DynamicList inference test with a no-reference test**

Replace the test named:

```ts
it("экспортирует Period и TopLevelParent для таблицы DynamicList без внешнего CypherCache", () => {
```

with this test:

```ts
it("не добавляет Period и TopLevelParent для DynamicList-таблицы без referenceForm", () => {
  const xmlData = exportClientApplicationFormToXML({
    context: mockContextToXML(),
    form: {
      ...minimalClientApplicationForm,
      attributes: [
        {
          itemType: "FormAttribute",
          name: "Список",
          type: { type: ["DynamicList"] },
          columns: [],
        },
      ],
      childItems: [
        {
          itemType: "Table",
          name: "Список",
          dataPath: "Список",
          id: undefined,
        },
      ],
    },
    referenceForm: undefined,
  })

  const childItems: Array<{ Table?: { Period?: unknown; TopLevelParent?: unknown } }> = Array.isArray(
    xmlData.ChildItems,
  )
    ? xmlData.ChildItems
    : []
  const table = childItems[0]?.Table

  expect(table?.Period).toBeUndefined()
  expect(table?.TopLevelParent).toBeUndefined()
})
```

- [ ] **Step 6: Add a form-level reference preservation test for DynamicList service fields**

Add this test after the no-reference DynamicList test:

```ts
it("сохраняет Period и TopLevelParent для таблицы из referenceForm", () => {
  const xmlData = exportClientApplicationFormToXML({
    context: mockContextToXML(),
    form: {
      ...minimalClientApplicationForm,
      childItems: [
        {
          itemType: "Table",
          name: "Список",
          dataPath: "Список",
          id: undefined,
        },
      ],
    },
    referenceForm: {
      ...minimalClientApplicationForm,
      childItems: [
        {
          itemType: "Table",
          name: "Список",
          dataPath: "Список",
          id: undefined,
          period: undefined,
          topLevelParent: undefined,
        },
      ],
    },
  })

  const childItems: Array<{ Table?: { Period?: unknown; TopLevelParent?: unknown } }> = Array.isArray(
    xmlData.ChildItems,
  )
    ? xmlData.ChildItems
    : []
  const table = childItems[0]?.Table

  expect(table?.Period).toBeDefined()
  expect(table?.TopLevelParent).toEqual({ "_xsi:nil": "true" })
})
```

- [ ] **Step 7: Replace RowFilter inference tests**

Delete these tests from `toXML.test.ts`:

```ts
it("экспортирует RowFilter для таблицы обычного реквизита без внешнего CypherCache", ...)
it("не экспортирует RowFilter для таблицы ValueTree-реквизита без внешнего CypherCache", ...)
it("не перезаписывает заранее заполненные rowFilter rows", ...)
```

Add these two tests in their place:

```ts
it("не добавляет RowFilter для обычного реквизита без referenceForm", () => {
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

  expect(table?.RowFilter).toBeUndefined()
})

it("сохраняет RowFilter для таблицы из referenceForm", () => {
  const xmlData = exportClientApplicationFormToXML({
    context: mockContextToXML(),
    form: {
      ...minimalClientApplicationForm,
      childItems: [
        {
          itemType: "Table",
          name: "ЦеновыеГруппы",
          dataPath: "Объект.ЦеновыеГруппы",
          id: undefined,
        },
      ],
    },
    referenceForm: {
      ...minimalClientApplicationForm,
      childItems: [
        {
          itemType: "Table",
          name: "ЦеновыеГруппы",
          dataPath: "Объект.ЦеновыеГруппы",
          id: undefined,
          rowFilter: undefined,
        },
      ],
    },
  })

  const childItems: Array<{ Table?: { RowFilter?: unknown } }> = Array.isArray(xmlData.ChildItems)
    ? xmlData.ChildItems
    : []
  const table = childItems[0]?.Table

  expect(table?.RowFilter).toEqual({ "_xsi:nil": "true" })
})
```

- [ ] **Step 8: Run form export and table preservation tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/clientApplicationForm/toXML.test.ts metadata/forms/elements/table/preserveFromReferenceXML.test.ts
```

Expected: PASS.

- [ ] **Step 9: Commit form export cleanup**

Run:

```bash
git add packages/core/metadata/forms/clientApplicationForm/toXML.ts packages/core/metadata/forms/clientApplicationForm/toXML.test.ts
git commit -m "refactor: :recycle: убрать Cypher из экспорта формы"
```

## Task 6: Remove Element Fixture Cypher Context

**Files:**

- Modify: `packages/core/tests/element/exportElementToXML.ts`
- Modify: `packages/core/metadata/forms/elements/__tests__/fixtures.ts`
- Modify: `packages/core/metadata/forms/elements/__tests__/toXML.test.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/fromXML.test.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/toXML.test.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/fromYAML.test.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/toYAML.test.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/toEnterprise.test.ts`

- [ ] **Step 1: Remove `contextAttributes` from the element export helper type**

In `packages/core/tests/element/exportElementToXML.ts`, remove these imports:

```ts
import { FormAttribute } from "~/metadata/forms/commonObjects/formAttribute/types"
import { dynamicListFormAttributeQuery, rowFilterFormAttributeQuery } from "~/metadata/forms/elements/table/rules"
import { CypherCache } from "~/metadata/orchestration/property/cypherCache"
```

Then replace:

```ts
export type TestExportElementToXMLParams<TElement extends CollectableElement = CollectableElement> = {
  element: TElement
  path: string
  baseDir?: string
  contextAttributes?: FormAttribute[]
}
```

with:

```ts
export type TestExportElementToXMLParams<TElement extends CollectableElement = CollectableElement> = {
  element: TElement
  path: string
  baseDir?: string
}
```

- [ ] **Step 2: Remove cache setup from the helper**

In the same file, replace:

```ts
  const { element, path, baseDir, contextAttributes } = params
```

with:

```ts
  const { element, path, baseDir } = params
```

Delete the whole block:

```ts
  if (contextAttributes) {
    const cache = new CypherCache()

    const dynamicListRows = getContextAttributeRowsByType(contextAttributes, "DynamicList")
    if (dynamicListRows.length > 0) {
      cache.set(dynamicListFormAttributeQuery, dynamicListRows)
    }

    const rowFilterRows = getRowFilterContextAttributeRows(contextAttributes)
    if (rowFilterRows.length > 0) {
      cache.set(rowFilterFormAttributeQuery, rowFilterRows)
    }

    context.exportToXML!.cypherCache = cache
  }
```

Delete both helper functions at the end of the file:

```ts
function getContextAttributeRowsByType(...)
function getRowFilterContextAttributeRows(...)
```

- [ ] **Step 3: Remove fixture `contextAttributes` type and import**

In `packages/core/metadata/forms/elements/__tests__/fixtures.ts`, remove the import:

```ts
import { FormAttribute } from "~/metadata/forms/commonObjects/formAttribute/types"
```

Then remove this field from `ElementFixture`:

```ts
  /** Мок-атрибуты формы для predicate'ов, читающих metadataForNumbering (например, isDynamicListAttribute) */
  contextAttributes?: FormAttribute[]
```

- [ ] **Step 4: Remove table fixture context attributes**

In the `Table` fixture entries, delete these blocks:

```ts
    contextAttributes: [
      { itemType: "FormAttribute", name: "Таблица", type: { type: ["ValueTable"] }, columns: [] },
    ],
```

and:

```ts
    contextAttributes: [
      { itemType: "FormAttribute", name: "ДинамическийСписок", type: { type: ["DynamicList"] }, columns: [] },
    ],
```

- [ ] **Step 5: Stop passing `contextAttributes` into element XML tests**

In `packages/core/metadata/forms/elements/__tests__/toXML.test.ts`, replace:

```ts
      const params: TestExportElementToXMLParams = {
        element: fixture.model as CollectableElement,
        path: fixture.xml,
        baseDir: fixtureXmlBaseDir(fixture),
        contextAttributes: fixture.contextAttributes,
      }
```

with:

```ts
      const params: TestExportElementToXMLParams = {
        element: fixture.model as CollectableElement,
        path: fixture.xml,
        baseDir: fixtureXmlBaseDir(fixture),
      }
```

- [ ] **Step 6: Remove now-unused table query constants**

After Steps 1-5, no TypeScript file should import `dynamicListFormAttributeQuery` or `rowFilterFormAttributeQuery`. In `packages/core/metadata/forms/elements/table/rules.ts`, remove:

```ts
export const dynamicListFormAttributeQuery =
  'MATCH (s {id: $scope})-[:FORM_ATTRIBUTE]->(a:FormAttribute) WHERE "DynamicList" IN a.p_type_type RETURN a.name AS name'

export const rowFilterFormAttributeQuery =
  'MATCH (s {id: $scope})-[:FORM_ATTRIBUTE]->(a:FormAttribute) WHERE a.p_type_type IS NOT NULL AND NOT ("DynamicList" IN a.p_type_type) AND NOT ("ValueTree" IN a.p_type_type) RETURN a.name AS name'
```

- [ ] **Step 7: Verify no table query constants remain**

Run:

```bash
rg -n "dynamicListFormAttributeQuery|rowFilterFormAttributeQuery|valueTableFormAttributeQuery" packages/core packages/cli packages/graph packages/language -g '*.ts'
```

Expected: no matches.

- [ ] **Step 8: Run focused Table fixture tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/elements/__tests__/fromXML.test.ts metadata/forms/elements/__tests__/toXML.test.ts metadata/forms/elements/__tests__/fromYAML.test.ts metadata/forms/elements/__tests__/toYAML.test.ts metadata/forms/elements/__tests__/toEnterprise.test.ts -t "Table"
```

Expected: PASS. `full.xml` preserves `RowFilter` from the reference XML, `dynamicList.xml` preserves `Period` / `TopLevelParent`, and `fullTree.xml` does not add those service fields.

- [ ] **Step 9: Commit element fixture cleanup**

Run:

```bash
git add packages/core/tests/element/exportElementToXML.ts packages/core/metadata/forms/elements/__tests__/fixtures.ts packages/core/metadata/forms/elements/__tests__/toXML.test.ts packages/core/metadata/forms/elements/table/rules.ts
git commit -m "refactor: :recycle: убрать Cypher из тестов элементов"
```

## Task 7: Remove Obsolete `cypherPredicate` Export Path

**Files:**

- Modify: `packages/core/metadata/forms/clientApplicationForm/syncToXML.ts`
- Modify: `packages/core/metadata/context/types.ts`
- Modify: `packages/core/metadata/orchestration/property/types.ts`
- Modify: `packages/core/metadata/orchestration/property/helpers.ts`
- Modify: `packages/core/metadata/orchestration/property/cypherPredicate.ts`
- Modify: `packages/core/metadata/orchestration/property/cypherPredicate.test.ts`
- Delete: `packages/core/metadata/orchestration/property/cypherCache.ts`
- Delete: `packages/core/metadata/orchestration/property/cypherCache.test.ts`
- Delete: `packages/core/metadata/orchestration/property/cypherResolver.ts`
- Test: `packages/core/metadata/orchestration/property/cypherPredicate.test.ts`
- Test: `packages/core/metadata/orchestration/property/helpers.test.ts`
- Test: `packages/core/metadata/forms/clientApplicationForm/syncToXML.test.ts`

- [ ] **Step 1: Remove Cypher predicate pre-resolution from sync**

In `packages/core/metadata/forms/clientApplicationForm/syncToXML.ts`, remove:

```ts
import { CypherCache } from "~/metadata/orchestration/property/cypherCache"
import { collectCypherPredicates, resolveCypherPredicates } from "~/metadata/orchestration/property/cypherResolver"
```

Then delete this block:

```ts
  const cypherCache = new CypherCache()
  const cypherPredicates = collectCypherPredicates(ClientApplicationFormRules, "")
  await resolveCypherPredicates(cypherPredicates, cypherCache)

  context.exportToXML.cypherCache = cypherCache
```

- [ ] **Step 2: Remove `cypherCache` from export context type**

In `packages/core/metadata/context/types.ts`, remove:

```ts
import type { CypherCache } from "../orchestration/property/cypherCache"
```

Then remove this field from `ToXMLConfigurationContext`:

```ts
  /** Кеш результатов Cypher-запросов, заполняется до начала обхода свойств. */
  cypherCache?: CypherCache
```

- [ ] **Step 3: Remove `CypherPredicate` from property rule types**

In `packages/core/metadata/orchestration/property/types.ts`, replace:

```ts
import type { CypherPredicate, CypherSet } from "./cypherPredicate"
```

with:

```ts
import type { CypherSet } from "./cypherPredicate"
```

Then replace the `toXML` property type:

```ts
  toXML?: false | ((metadataItem: any, context?: ConfigurationContextWithExportToXML) => boolean) | CypherPredicate
```

with:

```ts
  toXML?: false | ((metadataItem: any, context?: ConfigurationContextWithExportToXML) => boolean)
```

- [ ] **Step 4: Remove Cypher predicate handling from helpers**

In `packages/core/metadata/orchestration/property/helpers.ts`, remove:

```ts
import { isCypherPredicate } from "./cypherPredicate"
```

In the `exportToXML` branch, remove:

```ts
      if (isCypherPredicate(rule.toXML)) return shouldProcessCypherPredicate(rule.toXML, metadataItem, context)
```

Then delete the whole `shouldProcessCypherPredicate` function:

```ts
const shouldProcessCypherPredicate = (
  predicate: import("./cypherPredicate").CypherPredicate,
  metadataItem: unknown,
  context?: import("~/metadata/context/types").ConfigurationContextWithExportToXML,
): boolean => {
  const cache = context?.exportToXML?.cypherCache
  if (!cache) return false
  const rows = cache.get(predicate.query)
  if (rows === undefined) return false
  return predicate.test(metadataItem, rows)
}
```

- [ ] **Step 5: Keep only `cypherSet` in `cypherPredicate.ts`**

In `packages/core/metadata/orchestration/property/cypherPredicate.ts`, delete:

```ts
const cypherPredicateBrand: unique symbol = Symbol("cypherPredicate")

export interface CypherPredicate {
  query: string
  test: (metadataItem: unknown, rows: Record<string, unknown>[]) => boolean
}

export const cypherPredicate = (p: CypherPredicate): CypherPredicate => {
  ;(p as unknown as Record<PropertyKey, unknown>)[cypherPredicateBrand] = true
  return p
}

export const isCypherPredicate = (value: unknown): value is CypherPredicate => {
  if (typeof value !== "object" || value === null) return false
  return cypherPredicateBrand in (value as Record<PropertyKey, unknown>)
}
```

Leave the existing `CypherSet`, `cypherSet()`, and `isCypherSet()` implementation in place. Do not rename the file in this task; imports already use this path for `cypherSet`.

- [ ] **Step 6: Keep only `cypherSet` tests**

In `packages/core/metadata/orchestration/property/cypherPredicate.test.ts`, replace the whole file with:

```ts
import { describe, expect, it } from "vitest"
import { cypherSet, isCypherSet } from "./cypherPredicate"

describe("cypherSet", () => {
  it("возвращает переданный объект, помеченный брендом", () => {
    const s = cypherSet({
      query: "MATCH (n {id: $scope}) RETURN n.name AS name",
    })
    expect(s.query).toBe("MATCH (n {id: $scope}) RETURN n.name AS name")
  })

  it("isCypherSet возвращает true для результата cypherSet", () => {
    const s = cypherSet({ query: "RETURN 1" })
    expect(isCypherSet(s)).toBe(true)
  })

  it("isCypherSet возвращает false для обычного объекта", () => {
    expect(isCypherSet({ query: "RETURN 1" })).toBe(false)
  })

  it("isCypherSet возвращает false для null/undefined/функции/строки", () => {
    expect(isCypherSet(null)).toBe(false)
    expect(isCypherSet(undefined)).toBe(false)
    expect(isCypherSet(() => true)).toBe(false)
    expect(isCypherSet("hello")).toBe(false)
  })
})
```

- [ ] **Step 7: Delete obsolete cache and resolver files**

Delete these files:

```bash
packages/core/metadata/orchestration/property/cypherCache.ts
packages/core/metadata/orchestration/property/cypherCache.test.ts
packages/core/metadata/orchestration/property/cypherResolver.ts
```

- [ ] **Step 8: Verify no obsolete symbols remain in production code**

Run:

```bash
rg -n "cypherPredicate\\(|isCypherPredicate|CypherPredicate|CypherCache|collectCypherPredicates|resolveCypherPredicates|cypherCache|dynamicListFormAttributeQuery|rowFilterFormAttributeQuery|valueTableFormAttributeQuery" packages/core packages/cli packages/graph packages/language -g '*.ts'
```

Expected: no matches for obsolete symbols. `cypherSet` references may remain and are expected.

If the command prints any of the obsolete symbol names in `.ts` code, remove that reference before continuing.

- [ ] **Step 9: Run focused cleanup tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/orchestration/property/cypherPredicate.test.ts metadata/orchestration/property/helpers.test.ts metadata/forms/clientApplicationForm/syncToXML.test.ts
```

Expected: PASS.

- [ ] **Step 10: Commit Cypher predicate cleanup**

Run:

```bash
git add packages/core/metadata/forms/clientApplicationForm/syncToXML.ts packages/core/metadata/context/types.ts packages/core/metadata/orchestration/property/types.ts packages/core/metadata/orchestration/property/helpers.ts packages/core/metadata/orchestration/property/cypherPredicate.ts packages/core/metadata/orchestration/property/cypherPredicate.test.ts
git add -u packages/core/metadata/orchestration/property/cypherCache.ts packages/core/metadata/orchestration/property/cypherCache.test.ts packages/core/metadata/orchestration/property/cypherResolver.ts
git commit -m "refactor: :recycle: удалить CypherPredicate из XML-экспорта"
```

## Task 8: Final Verification And Round-Trip Check

**Files:**

- Test: `packages/core/metadata/orchestration/property/helpers.test.ts`
- Test: `packages/core/metadata/orchestration/property/cypherPredicate.test.ts`
- Test: `packages/core/metadata/forms/elements/table/preserveFromReferenceXML.test.ts`
- Test: `packages/core/metadata/forms/clientApplicationForm/toXML.test.ts`
- Test: `packages/core/metadata/forms/clientApplicationForm/syncToXML.test.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/fromXML.test.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/toXML.test.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/fromYAML.test.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/toYAML.test.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/toEnterprise.test.ts`

- [ ] **Step 1: Run focused implementation verification**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/orchestration/property/helpers.test.ts metadata/orchestration/property/cypherPredicate.test.ts metadata/forms/elements/table/preserveFromReferenceXML.test.ts metadata/forms/clientApplicationForm/toXML.test.ts metadata/forms/clientApplicationForm/syncToXML.test.ts metadata/forms/elements/__tests__/fromXML.test.ts metadata/forms/elements/__tests__/toXML.test.ts metadata/forms/elements/__tests__/fromYAML.test.ts metadata/forms/elements/__tests__/toYAML.test.ts metadata/forms/elements/__tests__/toEnterprise.test.ts -t "Table|preserveFromReferenceXML|cypherSet|round-trip"
```

Expected: PASS.

- [ ] **Step 2: Run adjacent child-item fixture verification**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/elements/__tests__/fromXML.test.ts metadata/forms/elements/__tests__/toXML.test.ts metadata/forms/elements/__tests__/fromYAML.test.ts metadata/forms/elements/__tests__/toYAML.test.ts -t "TableInputField|TableCheckBoxField|TableLabelField|TablePictureField|ColumnGroup"
```

Expected: PASS.

- [ ] **Step 3: Run the full project test suite**

Run:

```bash
pnpm test
```

Expected: PASS.

- [ ] **Step 4: Run round-trip triage**

Run:

```bash
env NKDK_XML_REPO=/Users/nikita/git/round-trip-source NKDK_XML_DIR=/Users/nikita/git/round-trip-source/trade ./.agents/skills/round-trip-xml/round-trip.sh --triage --batch-size 5
```

Expected:

- Existing `RowFilter`, `Period`, and `TopLevelParent` tags are preserved when present in reference XML.
- These tags are not newly added when absent from reference XML.
- Unrelated diffs may remain, including `TypeDomainEnabled`, empty form parameter `Type`, command interface ordering, or DCS `MetadataValue` export errors.

- [ ] **Step 5: Inspect status and obsolete-symbol search**

Run:

```bash
git status --short
git diff --stat
rg -n "cypherPredicate\\(|isCypherPredicate|CypherPredicate|CypherCache|collectCypherPredicates|resolveCypherPredicates|cypherCache|dynamicListFormAttributeQuery|rowFilterFormAttributeQuery|valueTableFormAttributeQuery" packages/core packages/cli packages/graph packages/language -g '*.ts'
```

Expected:

- Worktree is clean after commits.
- `git diff --stat` is empty.
- The obsolete-symbol search prints no TypeScript code matches for the removed export path.
- `cypherSet` references remain valid.

- [ ] **Step 6: Commit final adjustments if any were needed**

If Steps 1-5 required code changes not already committed, run:

```bash
git add packages/core/metadata/orchestration/property/helpers.test.ts packages/core/metadata/orchestration/property/types.ts packages/core/metadata/orchestration/property/helpers.ts packages/core/metadata/orchestration/property/toXML.ts packages/core/metadata/forms/elements/table/rules.ts packages/core/metadata/forms/elements/table/preserveFromReferenceXML.test.ts packages/core/metadata/forms/clientApplicationForm/toXML.ts packages/core/metadata/forms/clientApplicationForm/toXML.test.ts packages/core/tests/element/exportElementToXML.ts packages/core/metadata/forms/elements/__tests__/fixtures.ts packages/core/metadata/forms/elements/__tests__/toXML.test.ts packages/core/metadata/forms/clientApplicationForm/syncToXML.ts packages/core/metadata/context/types.ts packages/core/metadata/orchestration/property/cypherPredicate.ts packages/core/metadata/orchestration/property/cypherPredicate.test.ts
git add -u packages/core/metadata/forms/elements/table/cypherPredicate.test.ts packages/core/metadata/orchestration/property/cypherCache.ts packages/core/metadata/orchestration/property/cypherCache.test.ts packages/core/metadata/orchestration/property/cypherResolver.ts
git commit -m "test: :white_check_mark: проверить сохранение XML-полей таблицы"
```

If there are no follow-up edits, do not create an empty commit.

## Self-Review

- Spec coverage: Tasks 1-2 add the generic flag, Tasks 3-4 apply it to the three `Table` XML-only fields, Tasks 5-7 remove unnecessary Cypher export machinery while keeping `cypherSet`, and Task 8 verifies tests plus round-trip behavior.
- Placeholder scan: no `TBD`, `TODO`, or “write tests later” placeholders are present.
- Type consistency: the plan consistently uses `preserveFromReferenceXML`, `referenceMetadata`, `propertyKey`, `rowFilter`, `period`, and `topLevelParent`.
- Scope check: the plan is limited to `Table.period`, `Table.topLevelParent`, `Table.rowFilter`, and the Cypher export machinery made obsolete by removing those predicates.
