# FormAttribute Round-Trip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve `FormAttribute` XML round-trip for attributes with columns: local column ids, reference XML field order, and empty column `<Type/>`.

**Architecture:** Add local reproducer fixtures next to `packages/core/metadata/forms/commonObjects/formAttribute`, then fix the three causes independently. Numbering becomes scope-aware in the existing export context, `FormAttribute` reference imports preserve XML key order, and `FormAttributeColumnRules.type` exports an empty raw XML tag when the model has no type.

**Tech Stack:** TypeScript, Vitest, pnpm workspace, existing `metadata/orchestration` XML import/export helpers.

---

## File Structure

- Modify `packages/core/metadata/forms/commonObjects/formAttribute/fromXML.test.ts`: add local import tests that use `testImportPropertyFromXML`.
- Modify `packages/core/metadata/forms/commonObjects/formAttribute/toXML.test.ts`: add local export tests that use `testExportPropertyToXML`.
- Create `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/*.xml`: move the user-provided XML reproducer fixtures here.
- Create `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/*.ts`: one expected TS model per XML fixture.
- Modify `packages/core/metadata/forms/commonObjects/formAttribute/rules.ts`: add `id` and empty XML behavior for `FormAttributeColumn`.
- Modify `packages/core/metadata/forms/commonObjects/formAttribute/toXML.ts`: pass a column numbering scope through the `FormAttributeColumns` export rule.
- Modify `packages/core/metadata/forms/commonObjects/formAttribute/fromXML.ts`: preserve reference key order for `FormAttribute` and `FormAttributeColumn`.
- Modify `packages/core/metadata/context/types.ts`: add optional numbering scope to `metadataForNumbering` entries.
- Modify `packages/core/metadata/forms/clientApplicationForm/toXML.ts`: group `setIdsToElements` by numbering scope.

## Implementation Tasks

Before running Vitest in a fresh worktree, generate Langium files once:

```bash
pnpm --filter nkdk-language langium:generate
```

Expected: `packages/language/src/generated` exists and Vitest can import `~/language`.

### Task 1: Local Reproducer Fixtures And Tests

**Files:**
- Create: `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/tableWithColumns.xml`
- Create: `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/treeWithColumn.xml`
- Create: `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/twoTables.xml`
- Create: `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/attributeAnyType.xml`
- Create: `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/columnAnyType.xml`
- Create: `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/tableWithColumns.ts`
- Create: `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/treeWithColumn.ts`
- Create: `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/twoTables.ts`
- Create: `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/attributeAnyType.ts`
- Create: `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/columnAnyType.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/fromXML.test.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/toXML.test.ts`

- [ ] **Step 1: Move XML fixtures into local `__fixtures__`**

Use the user-provided files as source. Preserve their content exactly.

Run:

```bash
mkdir -p packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__
cp packages/core/tests/fixtures/formAttributes/tableWithColumns.xml packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/tableWithColumns.xml
cp packages/core/tests/fixtures/formAttributes/treeWithColumn.xml packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/treeWithColumn.xml
cp packages/core/tests/fixtures/formAttributes/twoTables.xml packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/twoTables.xml
cp packages/core/tests/fixtures/formAttributes/attributeAnyType.xml packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/attributeAnyType.xml
cp packages/core/tests/fixtures/formAttributes/columnAnyType.xml packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/columnAnyType.xml
```

Expected: files exist under `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__`.

- [ ] **Step 2: Create `tableWithColumns.ts`**

Create `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/tableWithColumns.ts`:

```typescript
import type { FormAttributes } from "../types"

export const tableWithColumns = [
  {
    name: "Таблица",
    title: { items: { ru: "" } },
    type: { type: ["ValueTable"] },
    columns: [
      {
        name: "Колонка1",
        type: { type: ["boolean"] },
        itemType: "FormAttributeColumn",
      },
      {
        name: "Колонка2",
        type: { type: ["boolean"] },
        itemType: "FormAttributeColumn",
      },
    ],
    itemType: "FormAttribute",
  },
] as const satisfies FormAttributes
```

- [ ] **Step 3: Create `treeWithColumn.ts`**

Create `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/treeWithColumn.ts`:

```typescript
import type { FormAttributes } from "../types"

export const treeWithColumn = [
  {
    name: "Дерево",
    title: { items: { ru: "" } },
    type: { type: ["ValueTree"] },
    columns: [
      {
        name: "Колонка1",
        title: { items: { ru: "abc" } },
        type: { type: ["string"] },
        view: { common: false, values: [] },
        edit: { common: false, values: [] },
        fillCheck: "ShowError",
        itemType: "FormAttributeColumn",
      },
    ],
    fieldsList: ["Дерево.Колонка1"],
    itemType: "FormAttribute",
  },
] as const satisfies FormAttributes
```

- [ ] **Step 4: Create `twoTables.ts`**

Create `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/twoTables.ts`:

```typescript
import type { FormAttributes } from "../types"

export const twoTables = [
  {
    name: "Таблица1",
    title: { items: { ru: "Таблица1" } },
    type: { type: ["ValueTable"] },
    columns: [
      {
        name: "Колонка1Таблицы1",
        title: { items: { ru: "Колонка1 таблицы1" } },
        type: { type: ["string"] },
        itemType: "FormAttributeColumn",
      },
    ],
    itemType: "FormAttribute",
  },
  {
    name: "Таблица2",
    title: { items: { ru: "Таблица2" } },
    type: { type: ["ValueTable"] },
    columns: [
      {
        name: "Колонка2Таблицы2",
        title: { items: { ru: "Колонка2 таблицы2" } },
        type: { type: ["string"] },
        itemType: "FormAttributeColumn",
      },
    ],
    itemType: "FormAttribute",
  },
] as const satisfies FormAttributes
```

- [ ] **Step 5: Create `attributeAnyType.ts`**

Create `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/attributeAnyType.ts`:

```typescript
import type { FormAttributes } from "../types"

export const attributeAnyType = [
  {
    name: "РеквизитБезТипа",
    title: { items: { ru: "Реквизит без типа" } },
    columns: [],
    itemType: "FormAttribute",
  },
] as const satisfies FormAttributes
```

- [ ] **Step 6: Create `columnAnyType.ts`**

Create `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/columnAnyType.ts`:

```typescript
import type { FormAttributes } from "../types"

export const columnAnyType = [
  {
    name: "ТаблицаСКолонкойБезТипа",
    title: { items: { ru: "Таблица с колонкой без типа" } },
    type: { type: ["ValueTable"] },
    columns: [
      {
        name: "РеквизитБезТипа",
        title: { items: { ru: "Реквизит без типа" } },
        itemType: "FormAttributeColumn",
      },
    ],
    itemType: "FormAttribute",
  },
] as const satisfies FormAttributes
```

- [ ] **Step 7: Add local import tests**

Modify `packages/core/metadata/forms/commonObjects/formAttribute/fromXML.test.ts`.

Add imports:

```typescript
import { attributeAnyType } from "./__fixtures__/attributeAnyType"
import { columnAnyType } from "./__fixtures__/columnAnyType"
import { tableWithColumns } from "./__fixtures__/tableWithColumns"
import { treeWithColumn } from "./__fixtures__/treeWithColumn"
import { twoTables } from "./__fixtures__/twoTables"
import { testImportPropertyFromXML } from "~/tests/property/importPropertyFromXML"
```

Add this rule near imports:

```typescript
const formAttributesRule = { type: "FormAttributes", xml: "Attribute" } as const
```

Add these tests inside the existing `describe("importFormAttributesFromXML", () => {` block:

```typescript
  it("import tableWithColumns", () => {
    const result = testImportPropertyFromXML({
      rule: formAttributesRule,
      path: "tableWithColumns.xml",
      xmlRootTag: "Attribute",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(tableWithColumns)
  })

  it("import treeWithColumn", () => {
    const result = testImportPropertyFromXML({
      rule: formAttributesRule,
      path: "treeWithColumn.xml",
      xmlRootTag: "Attribute",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(treeWithColumn)
  })

  it("import twoTables", () => {
    const result = testImportPropertyFromXML({
      rule: formAttributesRule,
      path: "twoTables.xml",
      xmlRootTag: "Attribute",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(twoTables)
  })

  it("import attributeAnyType", () => {
    const result = testImportPropertyFromXML({
      rule: formAttributesRule,
      path: "attributeAnyType.xml",
      xmlRootTag: "Attribute",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(attributeAnyType)
  })

  it("import columnAnyType", () => {
    const result = testImportPropertyFromXML({
      rule: formAttributesRule,
      path: "columnAnyType.xml",
      xmlRootTag: "Attribute",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(columnAnyType)
  })
```

- [ ] **Step 8: Add local export tests**

Modify `packages/core/metadata/forms/commonObjects/formAttribute/toXML.test.ts`.

Add imports:

```typescript
import { attributeAnyType } from "./__fixtures__/attributeAnyType"
import { columnAnyType } from "./__fixtures__/columnAnyType"
import { tableWithColumns } from "./__fixtures__/tableWithColumns"
import { treeWithColumn } from "./__fixtures__/treeWithColumn"
import { twoTables } from "./__fixtures__/twoTables"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"
```

Add this rule near imports:

```typescript
const formAttributesRule = { type: "FormAttributes", xml: "Attribute" } as const
```

Add these tests inside the existing `describe("exportFormAttributesToXML", () => {` block:

```typescript
  it("export tableWithColumns", () => {
    const { result, expectedResult } = testExportPropertyToXML({
      rule: formAttributesRule,
      value: tableWithColumns,
      xmlRootTag: "Attribute",
      path: "tableWithColumns.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("export treeWithColumn", () => {
    const { result, expectedResult } = testExportPropertyToXML({
      rule: formAttributesRule,
      value: treeWithColumn,
      xmlRootTag: "Attribute",
      path: "treeWithColumn.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("export twoTables", () => {
    const { result, expectedResult } = testExportPropertyToXML({
      rule: formAttributesRule,
      value: twoTables,
      xmlRootTag: "Attribute",
      path: "twoTables.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("export attributeAnyType", () => {
    const { result, expectedResult } = testExportPropertyToXML({
      rule: formAttributesRule,
      value: attributeAnyType,
      xmlRootTag: "Attribute",
      path: "attributeAnyType.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("export columnAnyType", () => {
    const { result, expectedResult } = testExportPropertyToXML({
      rule: formAttributesRule,
      value: columnAnyType,
      xmlRootTag: "Attribute",
      path: "columnAnyType.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })
```

- [ ] **Step 9: Run import tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/commonObjects/formAttribute/fromXML.test.ts -t "import tableWithColumns|import treeWithColumn|import twoTables|import attributeAnyType|import columnAnyType"
```

Expected: PASS. These tests define expected model shape and should not depend on export fixes.

- [ ] **Step 10: Run export tests and capture red failures**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/commonObjects/formAttribute/toXML.test.ts -t "export tableWithColumns|export treeWithColumn|export twoTables|export attributeAnyType|export columnAnyType"
```

Expected: FAIL before implementation. Failures should mention at least one of:

- `Column name="Колонка1" id="2"` or another non-local column id where expected is `id="1"`.
- `<Columns>` before `<Type>` where fixture expects `<Type>` before `<Columns>`.
- Missing `<Type/>` under `Column`.

- [ ] **Step 11: Commit red tests**

```bash
git add packages/core/metadata/forms/commonObjects/formAttribute/fromXML.test.ts \
  packages/core/metadata/forms/commonObjects/formAttribute/toXML.test.ts \
  packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__
git commit -m "test: :white_check_mark: добавить reproducer FormAttribute"
```

### Task 2: Scope-Aware Column Id Numbering

**Files:**
- Modify: `packages/core/metadata/context/types.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/toXML.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/rules.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/fromXML.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/toXML.ts`
- Test: `packages/core/metadata/forms/commonObjects/formAttribute/toXML.test.ts`

- [ ] **Step 1: Add `id` to `FormAttributeColumnRules`**

Modify `packages/core/metadata/forms/commonObjects/formAttribute/rules.ts`.

At the top of `FormAttributeColumnRules.properties`, before `name`, add:

```typescript
    id: {
      xml: "_id",
      type: "string",
      forReferenceOnly: true,
    },
```

Expected: `FormAttributeColumn` reference imports can carry XML `id`.

- [ ] **Step 2: Add numbering scope to context types**

Modify `packages/core/metadata/context/types.ts`.

Change `ToXMLContextElement` to:

```typescript
type ToXMLContextElement<Type extends MetadataItemType> = {
  element: ToMetadata<Type> | undefined
  referenceElement?: ToMetadata<Type> | undefined
  xmlElement: ElementXMLWithoutId
  numberingScope?: unknown
}
```

Expected: existing call sites remain valid because the field is optional.

- [ ] **Step 3: Group `setIdsToElements` by numbering scope**

Modify `packages/core/metadata/forms/clientApplicationForm/toXML.ts`.

Replace `setIdsToElements` with:

```typescript
const globalNumberingScope = Symbol("globalNumberingScope")

export const setIdsToElements = (context: ConfigurationContextWithExportToXML): void => {
  const elementsMap = context.exportToXML?.context?.metadataForNumbering ?? []
  const groups = new Map<unknown, typeof elementsMap>()

  for (const element of elementsMap) {
    const scope = element.numberingScope ?? globalNumberingScope
    const group = groups.get(scope)
    if (group === undefined) {
      groups.set(scope, [element])
    } else {
      group.push(element)
    }
  }

  for (const group of groups.values()) {
    setIdsToElementsGroup(group)
  }
}

const setIdsToElementsGroup = (
  elementsMap: NonNullable<ConfigurationContextWithExportToXML["exportToXML"]["context"]>["metadataForNumbering"]
): void => {
  const occupiedIds = new Set<string>()

  for (const element of elementsMap) {
    const reference = element.referenceElement
    if (reference && typeof reference.id === "string") {
      element.xmlElement._id = reference.id
      occupiedIds.add(reference.id)
    }
  }

  for (const element of elementsMap) {
    if (element.xmlElement._id) continue

    let counter = 1
    while (occupiedIds.has(counter.toString())) {
      counter++
    }
    element.xmlElement._id = counter.toString()
    occupiedIds.add(element.xmlElement._id)
  }
}
```

Expected: entries without `numberingScope` keep the old global behavior; scoped entries get independent counters.

- [ ] **Step 4: Preserve reference ids in `FormAttribute` import**

Modify `packages/core/metadata/forms/commonObjects/formAttribute/fromXML.ts`.

In `importColumnsFromXML`, replace the column construction with:

```typescript
    const column: FormAttributeColumn = context.fromXML.forReference
      ? ({
          itemType: FormAttributeColumnRules.itemType,
          ...properties,
          name: item._name,
        } as FormAttributeColumn)
      : {
          itemType: FormAttributeColumnRules.itemType,
          name: item._name,
          ...properties,
        }
```

Expected: reference imports keep `id` and XML property order from `properties`; normal imports keep the existing public model shape.

- [ ] **Step 5: Convert `FormAttributeColumns` export to new-style params**

Modify `packages/core/metadata/forms/commonObjects/formAttribute/toXML.ts`.

Add `PropertyRule` to imports only if the existing import is removed during refactor. Then replace `exportFormAttributeColumnsToXML` with:

```typescript
const exportFormAttributeColumnsToXML = (params: {
  context: ConfigurationContextWithExportToXML
  value: FormAttributeColumns
  referenceMetadata?: FormAttributeColumns | undefined
  metadataItem?: FormAttribute
}): FormAttributeColumnsXML | undefined => {
  const { context, value: columns, referenceMetadata, metadataItem } = params
  if (columns.length === 0) return undefined

  const isAdditionalColumns = "table" in columns[0]

  if (isAdditionalColumns) {
    return exportAdditionalColumnsToXML(
      context,
      columns as FormAttributeAdditionalColumn[],
      referenceMetadata as FormAttributeAdditionalColumn[] | undefined,
      metadataItem
    )
  }

  return exportColumnsToXML(
    context,
    columns as FormAttributeColumn[],
    referenceMetadata as FormAttributeColumn[] | undefined,
    metadataItem
  )
}
```

Expected: `exportPropertyToXML` calls this function in new-style mode and passes the parent `FormAttribute` as `metadataItem`.

- [ ] **Step 6: Thread numbering scope through column export helpers**

In `packages/core/metadata/forms/commonObjects/formAttribute/toXML.ts`, change `exportColumnsToXML` signature to:

```typescript
const exportColumnsToXML = (
  context: ConfigurationContextWithExportToXML,
  columns: FormAttributeColumn[],
  referenceColumns?: FormAttributeColumn[] | undefined,
  numberingScope?: unknown
): { Column: FormAttributeColumnXML[] } | undefined => {
```

Inside `exportColumnsToXML`, change the `metadataForNumbering.push` call to:

```typescript
    context.exportToXML?.context?.metadataForNumbering.push({
      element: column,
      referenceElement: referenceColumn,
      xmlElement: result,
      numberingScope,
    })
```

Change `exportAdditionalColumnsToXML` signature to:

```typescript
const exportAdditionalColumnsToXML = (
  context: ConfigurationContextWithExportToXML,
  additionalColumns: FormAttributeAdditionalColumn[],
  referenceAdditionalColumns?: FormAttributeAdditionalColumn[] | undefined,
  numberingScope?: unknown
): { AdditionalColumns: FormAttributeAdditionalColumnXML[] } | undefined => {
```

Inside `exportAdditionalColumnsToXML`, change the nested call to:

```typescript
    const columns = exportColumnsToXML(
      context,
      additionalColumn.columns,
      referenceAdditionalColumn?.columns,
      numberingScope
    )
```

Expected: all columns under the same `FormAttribute` share a local id namespace.

- [ ] **Step 7: Run scoped id export tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/commonObjects/formAttribute/toXML.test.ts -t "export tableWithColumns|export treeWithColumn|export twoTables"
```

Expected: id-related failures are gone. If failures remain, they should be about XML field order, not `Column id`.

- [ ] **Step 8: Commit scoped numbering**

```bash
git add packages/core/metadata/context/types.ts \
  packages/core/metadata/forms/clientApplicationForm/toXML.ts \
  packages/core/metadata/forms/commonObjects/formAttribute/rules.ts \
  packages/core/metadata/forms/commonObjects/formAttribute/fromXML.ts \
  packages/core/metadata/forms/commonObjects/formAttribute/toXML.ts
git commit -m "fix: :bug: ограничить нумерацию колонок атрибутом"
```

### Task 3: Preserve `FormAttribute` Reference XML Order

**Files:**
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/fromXML.ts`
- Test: `packages/core/metadata/forms/commonObjects/formAttribute/toXML.test.ts`

- [ ] **Step 1: Preserve `FormAttribute` reference key insertion order**

Modify `packages/core/metadata/forms/commonObjects/formAttribute/fromXML.ts`.

Replace the `result` construction in `importFormAttributeFromXML` with:

```typescript
  if (context.fromXML.forReference) {
    return {
      itemType: FormAttributeRules.itemType,
      ...properties,
      name: xml._name,
    } as FormAttribute
  }

  const result: FormAttribute = {
    itemType: FormAttributeRules.itemType,
    name: xml._name,
    title: properties!.title!,
    columns: [],
    ...properties,
  }
```

Expected: reference import keeps the insertion order returned by `importMetadataItemFromXML`, which follows `getOrderedKeysFromXML`.

- [ ] **Step 2: Run order-sensitive export tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/commonObjects/formAttribute/toXML.test.ts -t "export twoTables|export columnAnyType"
```

Expected: order-related failures for `<Type>` before `<Columns>` are gone. `export columnAnyType` may still fail because the column `<Type/>` is missing.

- [ ] **Step 3: Run existing helper tests for ordering**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/orchestration/property/helpers.test.ts
```

Expected: PASS. This checks the shared ordering helper was not regressed indirectly.

- [ ] **Step 4: Commit reference ordering**

```bash
git add packages/core/metadata/forms/commonObjects/formAttribute/fromXML.ts
git commit -m "fix: :bug: сохранить порядок XML реквизита формы"
```

### Task 4: Empty Column `<Type/>`

**Files:**
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/rules.ts`
- Test: `packages/core/metadata/forms/commonObjects/formAttribute/toXML.test.ts`

- [ ] **Step 1: Add empty raw XML to column type rule**

Modify `packages/core/metadata/forms/commonObjects/formAttribute/rules.ts`.

Change `FormAttributeColumnRules.properties.type` from:

```typescript
    type: {
      yaml: "Тип",
      type: "TypeDescription",
      xml: "Type",
      order: 3,
    },
```

to:

```typescript
    type: {
      yaml: "Тип",
      type: "TypeDescription",
      xml: "Type",
      order: 3,
      defaultValueXMLRaw: {},
    },
```

Expected: a column without `type` exports `<Type/>`.

- [ ] **Step 2: Run empty type tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/commonObjects/formAttribute/toXML.test.ts -t "export attributeAnyType|export columnAnyType"
```

Expected: PASS. `attributeAnyType` confirms existing behavior; `columnAnyType` confirms the new column behavior.

- [ ] **Step 3: Run all local `formAttribute` XML tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/commonObjects/formAttribute/fromXML.test.ts metadata/forms/commonObjects/formAttribute/toXML.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit empty type behavior**

```bash
git add packages/core/metadata/forms/commonObjects/formAttribute/rules.ts
git commit -m "fix: :bug: сохранить пустой тип колонки формы"
```

### Task 5: Fixture Cleanup And Focused Verification

**Files:**
- Delete: `packages/core/tests/fixtures/formAttributes/twoTables.xml`
- Delete: `packages/core/tests/fixtures/formAttributes/attributeAnyType.xml`
- Delete: `packages/core/tests/fixtures/formAttributes/columnAnyType.xml`
- Modify or delete only if superseded by local tests: `packages/core/tests/fixtures/formAttributes/tableWithColumns.xml`
- Modify or delete only if superseded by local tests: `packages/core/tests/fixtures/formAttributes/treeWithColumn.xml`
- Test: `packages/core/metadata/forms/commonObjects/formAttribute/fromXML.test.ts`
- Test: `packages/core/metadata/forms/commonObjects/formAttribute/toXML.test.ts`

- [ ] **Step 1: Remove untracked global reproducer XML**

Run:

```bash
rm packages/core/tests/fixtures/formAttributes/twoTables.xml
rm packages/core/tests/fixtures/formAttributes/attributeAnyType.xml
rm packages/core/tests/fixtures/formAttributes/columnAnyType.xml
```

Expected: these files remain only under `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__`.

- [ ] **Step 2: Restore old global fixtures if local tests replace them**

If `tableWithColumns.xml` and `treeWithColumn.xml` are still needed by the old global tests, keep them and update the old expected data only if those tests fail. If the new local tests fully replace the changed XML expectations, restore the old global files to avoid changing unrelated legacy tests:

```bash
git restore packages/core/tests/fixtures/formAttributes/tableWithColumns.xml
git restore packages/core/tests/fixtures/formAttributes/treeWithColumn.xml
```

Expected: `git status --short packages/core/tests/fixtures/formAttributes` shows no new reproducer files in the global fixture directory.

- [ ] **Step 3: Run focused `formAttribute` tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/commonObjects/formAttribute/fromXML.test.ts metadata/forms/commonObjects/formAttribute/toXML.test.ts
```

Expected: PASS.

- [ ] **Step 4: Run adjacent form XML tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/clientApplicationForm/toXML.test.ts metadata/forms/clientApplicationForm/syncToXML.test.ts
```

Expected: PASS, or existing unrelated failures only. Any failure mentioning changed `id` numbering or `FormAttribute` order belongs to this task and must be fixed before commit.

- [ ] **Step 5: Check working tree scope**

Run:

```bash
git status --short
```

Expected changed paths are limited to:

```text
packages/core/metadata/context/types.ts
packages/core/metadata/forms/clientApplicationForm/toXML.ts
packages/core/metadata/forms/commonObjects/formAttribute/fromXML.ts
packages/core/metadata/forms/commonObjects/formAttribute/fromXML.test.ts
packages/core/metadata/forms/commonObjects/formAttribute/rules.ts
packages/core/metadata/forms/commonObjects/formAttribute/toXML.ts
packages/core/metadata/forms/commonObjects/formAttribute/toXML.test.ts
packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/*
```

- [ ] **Step 6: Commit cleanup and verification**

```bash
git add packages/core/metadata/forms/commonObjects/formAttribute \
  packages/core/metadata/context/types.ts \
  packages/core/metadata/forms/clientApplicationForm/toXML.ts \
  packages/core/tests/fixtures/formAttributes
git commit -m "test: :white_check_mark: перенести fixture FormAttribute"
```

## Self-Review

- Spec coverage: Task 1 covers local fixture structure; Task 2 covers local column ids; Task 3 covers reference XML order; Task 4 covers empty column `<Type/>`; Task 5 covers cleanup and focused verification.
- Marker scan: no open implementation markers remain in code snippets or commands.
- Type consistency: `numberingScope`, `FormAttributeColumnRules.id`, `formAttributesRule`, and fixture export names are used consistently across tasks.
