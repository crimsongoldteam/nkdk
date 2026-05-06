# Table RowFilter And Fixtures Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect the refreshed Table XML fixtures to XML/YAML tests and export `RowFilter` only for tables whose `dataPath` points to a `ValueTable` form attribute.

**Architecture:** Keep XML fixtures as the source of truth. Put conditional XML defaults in `TableRules` via `cypherPredicate`, and feed those predicates from the same form-attribute cache in real form export and element tests. Keep `RowFilter`, `Period`, and `TopLevelParent` out of YAML and the explicit TypeScript model.

**Tech Stack:** TypeScript, Vitest, pnpm, `rules.ts`-based metadata orchestration, XML/YAML fixture tests.

---

## Current Context

The user already updated these XML fixtures:

- `packages/core/metadata/forms/elements/table/__fixtures__/full.xml`
- `packages/core/metadata/forms/elements/table/__fixtures__/dynamicList.xml`
- `packages/core/metadata/forms/elements/table/__fixtures__/fullTree.xml`

Do not edit these XML files in this task. They are the source of truth.

Agreed behavior:

- `RowFilter` is emitted as `<RowFilter xsi:nil="true"/>` only when the table `dataPath` starts with the name of a `FormAttribute` whose `type.type` contains `"ValueTable"`.
- `Period` and `TopLevelParent` remain DynamicList-only XML defaults.
- `RowFilter`, `Period`, and `TopLevelParent` are XML-only service defaults: no `fromXML`, no `fromYAML`, no `toYAML`, and no explicit field in fixture models.
- The form-attribute type is read from the `FormAttribute` node property (`p_type_type` in the graph), not from a value-type edge.
- YAML coverage for `dynamicList.xml` and `fullTree.xml` must be full, not minimal.

## File Structure

- Modify `packages/core/metadata/forms/elements/table/rules.ts`
  - Export `valueTableFormAttributeQuery`.
  - Add XML-only `rowFilter`.
  - Add YAML mappings for DynamicList-specific table events.

- Modify `packages/core/metadata/forms/elements/table/cypherPredicate.test.ts`
  - Test DynamicList predicates through exported query constants.
  - Add RowFilter predicate tests for ValueTable, DynamicList, empty cache, and absent cache.

- Modify `packages/core/metadata/forms/clientApplicationForm/toXML.ts`
  - Replace the DynamicList-only cache builder with a table-attribute cache builder that populates both DynamicList and ValueTable query rows.

- Modify `packages/core/tests/element/exportElementToXML.ts`
  - Populate both query rows from `contextAttributes` for element-level XML export tests.

- Modify `packages/core/metadata/forms/elements/table/__fixtures__/data.ts`
  - Sync `fullTable`, `fullTableYAML`, and `fullTableEnterprise` with refreshed `full.xml`.
  - Add `fullTree` and `fullTreeYAML`.

- Modify `packages/core/metadata/forms/elements/table/__fixtures__/dynamicList.ts`
  - Replace the old minimal `dynamicList` model with a full model matching `dynamicList.xml`.
  - Add `dynamicListYAML`.

- Modify `packages/core/metadata/forms/elements/__tests__/fixtures.ts`
  - Import new YAML/model exports.
  - Mark `full.xml` as ValueTable-backed through `contextAttributes`.
  - Update the DynamicList attribute name from `Список` to `ДинамическийСписок`.
  - Add the `fullTree.xml` fixture entry.

## Task 1: Red Tests For Table Cypher Predicates

**Files:**

- Modify: `packages/core/metadata/forms/elements/table/cypherPredicate.test.ts`
- Test: `packages/core/metadata/forms/elements/table/cypherPredicate.test.ts`

- [ ] **Step 1: Replace the local DynamicList query string with imports**

Use this import block:

```ts
import { TableRules, dynamicListFormAttributeQuery, valueTableFormAttributeQuery } from "./rules"
```

Remove the local `dynamicListQuery` constant.

- [ ] **Step 2: Replace the helper with a two-cache-row helper**

Replace `exportTableWithRows` with:

```ts
function exportTableWithRows(
  table: Table,
  rows:
    | {
        dynamicList?: Record<string, unknown>[]
        valueTable?: Record<string, unknown>[]
      }
    | undefined,
): Record<string, unknown> {
  const context = mockContextToXML()

  if (rows !== undefined) {
    const cache = new CypherCache()
    if (rows.dynamicList !== undefined) {
      cache.set(dynamicListFormAttributeQuery, rows.dynamicList)
    }
    if (rows.valueTable !== undefined) {
      cache.set(valueTableFormAttributeQuery, rows.valueTable)
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

- [ ] **Step 3: Update existing DynamicList tests to pass named row sets**

Use these call shapes:

```ts
const result = exportTableWithRows(
  {
    itemType: "Table",
    name: "Таблица",
    dataPath: "Список",
    id: undefined,
  },
  { dynamicList: [{ name: "Список" }] },
)
```

For the negative rows test:

```ts
const result = exportTableWithRows(
  {
    itemType: "Table",
    name: "Таблица",
    dataPath: "Список.Колонка",
    id: undefined,
  },
  { dynamicList: [{ name: "ДругойРеквизит" }] },
)
```

For the empty-cache test:

```ts
const result = exportTableWithRows(
  {
    itemType: "Table",
    name: "Таблица",
    dataPath: "Список.Колонка",
    id: undefined,
  },
  { dynamicList: [] },
)
```

- [ ] **Step 4: Add RowFilter tests**

Add this `describe` block after the DynamicList `describe` block:

```ts
describe("Table CypherPredicate — rowFilter", () => {
  it("экспортирует rowFilter, когда dataPath равен имени ValueTable-реквизита", () => {
    const result = exportTableWithRows(
      {
        itemType: "Table",
        name: "Таблица",
        dataPath: "Таблица",
        id: undefined,
      },
      { valueTable: [{ name: "Таблица" }] },
    )

    expect(result.RowFilter).toEqual({ "_xsi:nil": "true" })
  })

  it("экспортирует rowFilter, когда dataPath начинается с имени ValueTable-реквизита", () => {
    const result = exportTableWithRows(
      {
        itemType: "Table",
        name: "Таблица",
        dataPath: "Таблица.Колонка",
        id: undefined,
      },
      { valueTable: [{ name: "Таблица" }] },
    )

    expect(result.RowFilter).toEqual({ "_xsi:nil": "true" })
  })

  it("НЕ экспортирует rowFilter для DynamicList-реквизита", () => {
    const result = exportTableWithRows(
      {
        itemType: "Table",
        name: "Таблица",
        dataPath: "ДинамическийСписок",
        id: undefined,
      },
      {
        dynamicList: [{ name: "ДинамическийСписок" }],
        valueTable: [],
      },
    )

    expect(result.RowFilter).toBeUndefined()
    expect(result.Period).toBeDefined()
    expect(result.TopLevelParent).toBeDefined()
  })

  it("НЕ экспортирует rowFilter, когда кеш пуст", () => {
    const result = exportTableWithRows(
      {
        itemType: "Table",
        name: "Таблица",
        dataPath: "Таблица",
        id: undefined,
      },
      { valueTable: [] },
    )

    expect(result.RowFilter).toBeUndefined()
  })

  it("НЕ экспортирует rowFilter, когда кеш отсутствует в контексте", () => {
    const result = exportTableWithRows(
      {
        itemType: "Table",
        name: "Таблица",
        dataPath: "Таблица",
        id: undefined,
      },
      undefined,
    )

    expect(result.RowFilter).toBeUndefined()
  })
})
```

- [ ] **Step 5: Run the red test**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/elements/table/cypherPredicate.test.ts
```

Expected: FAIL because `valueTableFormAttributeQuery` and `rowFilter` do not exist yet.

## Task 2: Implement RowFilter Rule

**Files:**

- Modify: `packages/core/metadata/forms/elements/table/rules.ts`
- Test: `packages/core/metadata/forms/elements/table/cypherPredicate.test.ts`

- [ ] **Step 1: Add the ValueTable query constant**

Insert directly after `dynamicListFormAttributeQuery`:

```ts
export const valueTableFormAttributeQuery =
  'MATCH (s {id: $scope})-[:FORM_ATTRIBUTE]->(a:FormAttribute) WHERE "ValueTable" IN a.p_type_type RETURN a.name AS name'
```

- [ ] **Step 2: Add RowFilter as an XML-only predicate**

Insert after `topLevelParent` and before `events`:

```ts
    rowFilter: {
      yaml: "ОтборСтрок",
      type: "boolean",
      fromXML: false,
      toYAML: false,
      fromYAML: false,
      defaultValueXMLRaw: { "_xsi:nil": "true" },
      toXML: cypherPredicate({
        query: valueTableFormAttributeQuery,
        test: (el: any, rows: Record<string, unknown>[]) =>
          rows.some((r) => r.name === el?.dataPath?.split(".")[0]),
      }),
    },
```

Do not add `order`.

- [ ] **Step 3: Run predicate tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/elements/table/cypherPredicate.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit the predicate rule**

Run:

```bash
git add packages/core/metadata/forms/elements/table/rules.ts packages/core/metadata/forms/elements/table/cypherPredicate.test.ts
git commit -m "test: 🧪 добавить условный RowFilter для таблицы"
```

## Task 3: Populate Table Attribute Predicate Caches

**Files:**

- Modify: `packages/core/metadata/forms/clientApplicationForm/toXML.ts`
- Modify: `packages/core/tests/element/exportElementToXML.ts`
- Test: `packages/core/metadata/forms/elements/table/cypherPredicate.test.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/toXML.test.ts`

- [ ] **Step 1: Update imports in form XML export**

In `packages/core/metadata/forms/clientApplicationForm/toXML.ts`, replace:

```ts
import { dynamicListFormAttributeQuery } from "~/metadata/forms/elements/table/rules"
```

with:

```ts
import { dynamicListFormAttributeQuery, valueTableFormAttributeQuery } from "~/metadata/forms/elements/table/rules"
```

- [ ] **Step 2: Rename the cache builder call**

Replace:

```ts
  ensureDynamicListCypherCache(context, form)
```

with:

```ts
  ensureTableFormAttributeCypherCache(context, form)
```

- [ ] **Step 3: Replace the cache builder implementation**

Replace `ensureDynamicListCypherCache` with:

```ts
const ensureTableFormAttributeCypherCache = (
  context: ConfigurationContextWithExportToXML,
  form: ClientApplicationForm
): void => {
  const existingCache = context.exportToXML.cypherCache
  const hasDynamicListRows = existingCache?.get(dynamicListFormAttributeQuery) !== undefined
  const hasValueTableRows = existingCache?.get(valueTableFormAttributeQuery) !== undefined

  if (hasDynamicListRows && hasValueTableRows) return

  const cache = existingCache ?? new CypherCache()

  if (!hasDynamicListRows) {
    cache.set(dynamicListFormAttributeQuery, getFormAttributeRowsByType(form, "DynamicList"))
  }

  if (!hasValueTableRows) {
    cache.set(valueTableFormAttributeQuery, getFormAttributeRowsByType(form, "ValueTable"))
  }

  context.exportToXML.cypherCache = cache
}

const getFormAttributeRowsByType = (
  form: ClientApplicationForm,
  typeName: "DynamicList" | "ValueTable",
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
```

- [ ] **Step 4: Update imports in element XML test helper**

In `packages/core/tests/element/exportElementToXML.ts`, add:

```ts
import { dynamicListFormAttributeQuery, valueTableFormAttributeQuery } from "~/metadata/forms/elements/table/rules"
```

- [ ] **Step 5: Replace the contextAttributes cache block**

Replace the full `if (contextAttributes) { ... }` block with:

```ts
  if (contextAttributes) {
    const cache = new CypherCache()

    const dynamicListRows = getContextAttributeRowsByType(contextAttributes, "DynamicList")
    if (dynamicListRows.length > 0) {
      cache.set(dynamicListFormAttributeQuery, dynamicListRows)
    }

    const valueTableRows = getContextAttributeRowsByType(contextAttributes, "ValueTable")
    if (valueTableRows.length > 0) {
      cache.set(valueTableFormAttributeQuery, valueTableRows)
    }

    context.exportToXML!.cypherCache = cache
  }
```

Add this helper below `testExportElementToXML`:

```ts
function getContextAttributeRowsByType(
  contextAttributes: FormAttribute[],
  typeName: "DynamicList" | "ValueTable",
): Record<string, unknown>[] {
  return contextAttributes
    .filter(
      (attr) =>
        attr.itemType === "FormAttribute" &&
        Array.isArray(attr.type?.type) &&
        attr.type.type.includes(typeName)
    )
    .map((attr) => ({ name: attr.name }))
}
```

- [ ] **Step 6: Run targeted checks**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/elements/table/cypherPredicate.test.ts
```

Expected: PASS.

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/elements/__tests__/toXML.test.ts -t "Table"
```

Expected: still FAIL until fixture models are synchronized. The `full.xml` failure should no longer be missing `RowFilter` once `contextAttributes` is added in Task 6.

- [ ] **Step 7: Commit cache wiring**

Run:

```bash
git add packages/core/metadata/forms/clientApplicationForm/toXML.ts packages/core/tests/element/exportElementToXML.ts
git commit -m "fix: 🐛 учитывать тип ValueTable в XML-экспорте таблиц"
```

## Task 4: Add DynamicList Event YAML Mappings

**Files:**

- Modify: `packages/core/metadata/forms/elements/table/rules.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/fromYAML.test.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/toYAML.test.ts`

- [ ] **Step 1: Add missing event mappings**

In `TableRules.properties.events.items`, add these keys near the existing user-settings and URL-adjacent events:

```ts
        onLoadUserSettingsAtServer: "ПриЗагрузкеПользовательскихНастроекНаСервере",
        uRLListGetProcessing: "ОбработкаПолученияСпискаНавигационныхСсылок",
        uRLGetProcessing: "ОбработкаПолученияНавигационнойСсылки",
        onGetDataAtServer: "ПриПолученииДанныхНаСервере",
        onSaveUserSettingsAtServer: "ПриСохраненииПользовательскихНастроекНаСервере",
        onUpdateUserSettingSetAtServer: "ПриОбновленииСоставаПользовательскихНастроекНаСервере",
```

Keep `beforeLoadUserSettingsAtServer` unchanged:

```ts
        beforeLoadUserSettingsAtServer: "ПередЗагрузкойПользовательскихНастроекНаСервере",
```

The key spellings `uRLListGetProcessing` and `uRLGetProcessing` match current XML import behavior: the first character of `URLListGetProcessing`/`URLGetProcessing` is lowercased.

- [ ] **Step 2: Run YAML table tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/elements/__tests__/fromYAML.test.ts metadata/forms/elements/__tests__/toYAML.test.ts -t "Table"
```

Expected: current tests PASS before new YAML fixtures are connected; after Task 7 this same command must also cover DynamicList and fullTree YAML.

- [ ] **Step 3: Commit event mappings**

Run:

```bash
git add packages/core/metadata/forms/elements/table/rules.ts
git commit -m "feat: ✨ добавить YAML-события динамического списка"
```

## Task 5: Sync The Full ValueTable Fixture

**Files:**

- Modify: `packages/core/metadata/forms/elements/table/__fixtures__/data.ts`
- Modify: `packages/core/metadata/forms/elements/__tests__/fixtures.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/fromXML.test.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/toXML.test.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/fromYAML.test.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/toYAML.test.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/toEnterprise.test.ts`

- [ ] **Step 1: Remove fields that are no longer in `full.xml` from `fullTable`**

In `fullTable`, delete these properties:

```ts
allowGettingCurrentRowURL
allowRootChoice
autoRefresh
autoRefreshPeriod
choiceFoldersAndItems
restoreCurrentRow
enableStartDrag
showRoot
updateOnDataChange
userSettingsGroup
```

Inside `fullTable.events`, delete:

```ts
beforeLoadUserSettingsAtServer
```

Inside `fullTable.rowsPicture`, delete:

```ts
transparentPixel
```

- [ ] **Step 2: Update `fullTable.childItems`**

In the existing `TableCheckBoxField` child, replace:

```ts
      name: "ТаблицаФлажок",
      title: { items: { ru: "Поле флажка" } },
```

with:

```ts
      name: "ТаблицаФлажок123",
```

Append this child after the `TablePictureField` child:

```ts
    {
      childItems: [],
      group: "Vertical",
      itemType: "ColumnGroup",
      name: "ТаблицаГруппаКолонок",
      title: { items: { ru: "Группа колонок" } },
      toolTip: { items: { ru: "Таблица группа колонок" } },
    },
```

- [ ] **Step 3: Update `fullTableYAML`**

Delete these keys from `fullTableYAML`:

```ts
АвтоОбновление
ВосстанавливатьТекущуюСтроку
ВыборГруппИЭлементов
ГруппаПользовательскихНастроек
ОбновлениеПриИзмененииДанных
ОтображатьКорень
ПериодАвтоОбновления
РазрешитьВыборКорня
РазрешитьНачалоПеретаскивания
РазрешитьПолучатьНавигационнуюСсылкуТекущейСтроки
```

Inside `fullTableYAML.События`, delete:

```ts
ПередЗагрузкойПользовательскихНастроекНаСервере
```

`RowFilter` must not appear in `fullTableYAML`.

- [ ] **Step 4: Update `fullTableEnterprise` without dropping enterprise coverage**

Delete these keys from `fullTableEnterprise`:

```ts
EnableStartDrag
AutoRefresh
RestoreCurrentRow
ChoiceFoldersAndItems
UpdateOnDataChange
ShowRoot
AutoRefreshPeriod
AllowRootChoice
AllowGettingCurrentRowURL
UserSettingsGroup
```

Inside the CheckBox child, replace:

```ts
      Title: "Поле флажка",
      Name: "prefix_ТаблицаФлажок",
```

with:

```ts
      Name: "prefix_ТаблицаФлажок123",
```

Append this enterprise child after the PictureField child:

```ts
    {
      ElementType: "FormGroup",
      Name: "prefix_ТаблицаГруппаКолонок",
      Type: { Type: "SystemEnumeration", Value: "FormGroupType.ColumnGroup" },
      ChildItems: [],
      Group: { Type: "SystemEnumeration", Value: "ColumnsGroup.Vertical" },
      Title: "Группа колонок",
      ToolTip: "Таблица группа колонок",
    },
```

Update the `satisfies` type to exclude XML-only predicate fields:

```ts
} satisfies Omit<Required<TableEnterprise>, "Period" | "TopLevelParent" | "RowFilter">
```

- [ ] **Step 5: Mark `full.xml` as ValueTable-backed in the fixture registry**

In `packages/core/metadata/forms/elements/__tests__/fixtures.ts`, add `contextAttributes` to the `Table` / `all fields` fixture:

```ts
    contextAttributes: [
      { itemType: "FormAttribute", name: "Таблица", type: { type: ["ValueTable"] }, columns: [] },
    ],
```

- [ ] **Step 6: Run full-table checks**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/elements/__tests__/fromXML.test.ts metadata/forms/elements/__tests__/toXML.test.ts -t "Table.*all fields|Table all fields|all fields"
```

If the test name filter does not match Vitest's generated name, run the broader command:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/elements/__tests__/fromXML.test.ts metadata/forms/elements/__tests__/toXML.test.ts -t "Table"
```

Expected: `Table all fields` XML tests PASS. DynamicList may still fail until Task 6.

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/elements/__tests__/fromYAML.test.ts metadata/forms/elements/__tests__/toYAML.test.ts metadata/forms/elements/__tests__/toEnterprise.test.ts -t "Table"
```

Expected: `Table all fields` YAML and enterprise checks PASS. DynamicList and fullTree YAML checks are not connected until later tasks.

- [ ] **Step 7: Commit full-table fixture sync**

Run:

```bash
git add packages/core/metadata/forms/elements/table/__fixtures__/data.ts packages/core/metadata/forms/elements/__tests__/fixtures.ts
git commit -m "test: 🧪 синхронизировать фикстуру таблицы значений"
```

## Task 6: Expand The DynamicList Fixture With Full YAML Coverage

**Files:**

- Modify: `packages/core/metadata/forms/elements/table/__fixtures__/dynamicList.ts`
- Modify: `packages/core/metadata/forms/elements/__tests__/fixtures.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/fromXML.test.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/toXML.test.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/fromYAML.test.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/toYAML.test.ts`

- [ ] **Step 1: Update imports in `dynamicList.ts`**

Replace the file header with:

```ts
import type { Table, TablePartialYAML } from "../types"
```

- [ ] **Step 2: Replace the old minimal model**

Replace the existing `dynamicList` export with a full object based on `dynamicList.xml`.

The model must include these exact identity and path fields:

```ts
export const dynamicList: Table = {
  itemType: "Table",
  name: "ДинамическийСписок",
  dataPath: "ДинамическийСписок",
```

The model must include these DynamicList-only non-service fields and values:

```ts
  autoRefresh: false,
  autoRefreshPeriod: 60,
  choiceFoldersAndItems: "Items",
  restoreCurrentRow: false,
  showRoot: false,
  allowRootChoice: true,
  updateOnDataChange: "Auto",
  userSettingsGroup: "ГруппаПользовательскихНастроек",
  allowGettingCurrentRowURL: false,
```

The model must not include:

```ts
period
topLevelParent
rowFilter
```

The model must include these four child items:

```ts
  childItems: [
    {
      itemType: "TableLabelField",
      name: "ДинамическийСписокВвод",
      dataPath: "ДинамическийСписок.Ввод",
    },
    {
      itemType: "TableLabelField",
      name: "ДинамическийСписокКартинка",
      dataPath: "ДинамическийСписок.Картинка",
    },
    {
      itemType: "TableLabelField",
      name: "ДинамическийСписокНадпись",
      dataPath: "ДинамическийСписок.Надпись",
    },
    {
      itemType: "TableCheckBoxField",
      name: "ДинамическийСписокФлажок",
      dataPath: "ДинамическийСписок.Флажок",
      checkBoxType: "Auto",
    },
  ],
```

The model must include the same common table fields as `fullTable`, except:

```ts
name: "ДинамическийСписок"
dataPath: "ДинамическийСписок"
enableDrag: absent
enableStartDrag: true
commandSet: ["CancelSearch", "ListSettings"]
rowPictureDataPath: "ДинамическийСписок.Картинка"
```

The model must include these additional DynamicList event keys:

```ts
    onLoadUserSettingsAtServer: "ДинамическийСписокПриЗагрузкеПользовательскихНастроекНаСервере",
    uRLListGetProcessing: "ДинамическийСписокОбработкаПолученияСпискаНавигационныхСсылок",
    uRLGetProcessing: "ДинамическийСписокОбработкаПолученияНавигационнойСсылки",
    onGetDataAtServer: "ДинамическийСписокПриПолученииДанныхНаСервере",
    onSaveUserSettingsAtServer: "ДинамическийСписокПриСохраненииПользовательскихНастроекНаСервере",
    beforeLoadUserSettingsAtServer: "ДинамическийСписокПередЗагрузкойПользовательскихНастроекНаСервере",
    onUpdateUserSettingSetAtServer: "ДинамическийСписокПриОбновленииСоставаПользовательскихНастроекНаСервере",
```

- [ ] **Step 3: Add `dynamicListYAML`**

Add this export after `dynamicList`:

```ts
export const dynamicListYAML: TablePartialYAML = {
  АвтоОбновление: "Ложь",
  ПериодАвтоОбновления: 60,
  ВыборГруппИЭлементов: "Элементы",
  ВосстанавливатьТекущуюСтроку: "Ложь",
  ОтображатьКорень: "Ложь",
  РазрешитьВыборКорня: "Истина",
  ОбновлениеПриИзмененииДанных: "Авто",
  ГруппаПользовательскихНастроек: "ГруппаПользовательскихНастроек",
  РазрешитьПолучатьНавигационнуюСсылкуТекущейСтроки: "Ложь",
  События: {
    ПриЗагрузкеПользовательскихНастроекНаСервере:
      "ДинамическийСписокПриЗагрузкеПользовательскихНастроекНаСервере",
    ОбработкаПолученияСпискаНавигационныхСсылок:
      "ДинамическийСписокОбработкаПолученияСпискаНавигационныхСсылок",
    ОбработкаПолученияНавигационнойСсылки:
      "ДинамическийСписокОбработкаПолученияНавигационнойСсылки",
    ПриПолученииДанныхНаСервере: "ДинамическийСписокПриПолученииДанныхНаСервере",
    ПриСохраненииПользовательскихНастроекНаСервере:
      "ДинамическийСписокПриСохраненииПользовательскихНастроекНаСервере",
    ПередЗагрузкойПользовательскихНастроекНаСервере:
      "ДинамическийСписокПередЗагрузкойПользовательскихНастроекНаСервере",
    ПриОбновленииСоставаПользовательскихНастроекНаСервере:
      "ДинамическийСписокПриОбновленииСоставаПользовательскихНастроекНаСервере",
  },
}
```

Then extend this YAML object with the common non-default table YAML fields that are present in `dynamicList` and already represented in `fullTableYAML`: visibility, user visibility, title, dimensions, colors, search additions, command set, common events, and child items if `toYAML.test.ts` reports them. The final object must equal `exportElementToPartialYAML(dynamicList)` for the connected fixture.

- [ ] **Step 4: Connect DynamicList YAML and context attribute**

In `packages/core/metadata/forms/elements/__tests__/fixtures.ts`, replace:

```ts
import { dynamicList } from "../table/__fixtures__/dynamicList"
```

with:

```ts
import { dynamicList, dynamicListYAML } from "../table/__fixtures__/dynamicList"
```

In the `Table` / `dynamicList` fixture, replace:

```ts
    yaml: undefined,
```

with:

```ts
    yaml: dynamicListYAML,
```

Replace the context attribute:

```ts
      { itemType: "FormAttribute", name: "Список", type: { type: ["DynamicList"] }, columns: [] },
```

with:

```ts
      { itemType: "FormAttribute", name: "ДинамическийСписок", type: { type: ["DynamicList"] }, columns: [] },
```

- [ ] **Step 5: Run DynamicList checks**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/elements/__tests__/fromXML.test.ts metadata/forms/elements/__tests__/toXML.test.ts -t "dynamicList|Table"
```

Expected: DynamicList XML tests PASS and `RowFilter` is absent from `dynamicList.xml` output.

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/elements/__tests__/fromYAML.test.ts metadata/forms/elements/__tests__/toYAML.test.ts -t "dynamicList|Table"
```

Expected: DynamicList YAML tests PASS with full YAML coverage.

- [ ] **Step 6: Commit DynamicList fixture coverage**

Run:

```bash
git add packages/core/metadata/forms/elements/table/__fixtures__/dynamicList.ts packages/core/metadata/forms/elements/__tests__/fixtures.ts
git commit -m "test: 🧪 расширить фикстуру динамического списка"
```

## Task 7: Add The FullTree Fixture With Full YAML Coverage

**Files:**

- Modify: `packages/core/metadata/forms/elements/table/__fixtures__/data.ts`
- Modify: `packages/core/metadata/forms/elements/__tests__/fixtures.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/fromXML.test.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/toXML.test.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/fromYAML.test.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/toYAML.test.ts`

- [ ] **Step 1: Add `fullTree` to `data.ts`**

Add a `fullTree` export near `fullTable`:

```ts
export const fullTree = {
  ...fullTable,
  name: "Дерево",
  dataPath: "Дерево",
  defaultItem: undefined,
  autoInsertNewRow: undefined,
  enableDrag: undefined,
  title: { items: { ru: "Заголовок дерева" } },
  rowPictureDataPath: "Дерево.Картинка",
  contextMenu: {
    itemType: "ContextMenu",
    childItems: [],
  },
  extendedTooltip: {
    itemType: "ExtendedTooltip",
  },
  searchStringRepresentation: {
    itemType: "SingleSearchStringAddition",
  },
  viewStatusRepresentation: {
    itemType: "ViewStatusAddition",
  },
  searchControl: {
    childItems: [],
    itemType: "SingleSearchControlAddition",
  },
  childItems: [
    {
      dataPath: "Дерево.Ввод",
      editMode: "EnterOnInput",
      multipleValuesExtendedEdit: true,
      itemType: "TableInputField",
      name: "ДеревоВвод",
    },
    {
      dataPath: "Дерево.Надпись",
      editMode: "EnterOnInput",
      itemType: "TableLabelField",
      name: "ДеревоНадпись",
    },
    {
      checkBoxType: "Auto",
      dataPath: "Дерево.Флажок",
      editMode: "EnterOnInput",
      itemType: "TableCheckBoxField",
      name: "ДеревоФлажок",
    },
    {
      dataPath: "Дерево.Картинка",
      editMode: "EnterOnInput",
      itemType: "TablePictureField",
      name: "ДеревоКартинка",
    },
  ],
} satisfies Table
```

After adding this, replace the `undefined` properties with actual omissions if TypeScript or YAML export keeps them as keys. The final `fullTree` object must not contain these properties:

```ts
defaultItem
autoInsertNewRow
enableDrag
enableStartDrag
rowFilter
period
topLevelParent
```

- [ ] **Step 2: Add `fullTreeYAML`**

Add a `fullTreeYAML` export near `fullTableYAML`:

```ts
export const fullTreeYAML: TablePartialYAML = {
  ...fullTableYAML,
  Заголовок: "Заголовок дерева",
  ПутьКДаннымКартинкиСтроки: "Дерево.Картинка",
}
```

Then remove these keys from `fullTreeYAML`:

```ts
АктивизироватьПоУмолчанию
АвтоВводНовойСтроки
РазрешитьПеретаскивание
```

The final `fullTreeYAML` must not contain `ОтборСтрок`, `Период`, or `РодительВерхнегоУровня`.

- [ ] **Step 3: Connect `fullTree.xml` in the fixture registry**

In `packages/core/metadata/forms/elements/__tests__/fixtures.ts`, update the table data import:

```ts
import { fullTable, fullTableEnterprise, fullTableYAML, fullTree, fullTreeYAML, minimalTable } from "../table/__fixtures__/data"
```

Add this fixture entry after `dynamicList`:

```ts
  {
    group: "Table",
    name: "full tree",
    element: Table,
    xml: "fullTree.xml",
    xmlFolder: undefined,
    model: fullTree,
    yaml: fullTreeYAML,
    enterprise: undefined,
  },
```

- [ ] **Step 4: Run fullTree checks**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/elements/__tests__/fromXML.test.ts metadata/forms/elements/__tests__/toXML.test.ts -t "full tree|Table"
```

Expected: `full tree` XML tests PASS and no `RowFilter` is exported.

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/elements/__tests__/fromYAML.test.ts metadata/forms/elements/__tests__/toYAML.test.ts -t "full tree|Table"
```

Expected: `full tree` YAML tests PASS with full YAML coverage.

- [ ] **Step 5: Commit fullTree fixture coverage**

Run:

```bash
git add packages/core/metadata/forms/elements/table/__fixtures__/data.ts packages/core/metadata/forms/elements/__tests__/fixtures.ts packages/core/metadata/forms/elements/table/__fixtures__/fullTree.xml
git commit -m "test: 🧪 добавить фикстуру дерева таблицы"
```

## Task 8: Final Verification

**Files:**

- Test: `packages/core/metadata/forms/elements/__tests__/fromXML.test.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/toXML.test.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/fromYAML.test.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/toYAML.test.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/toEnterprise.test.ts`
- Test: `packages/core/metadata/forms/elements/table/cypherPredicate.test.ts`

- [ ] **Step 1: Run focused table verification**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/elements/table/cypherPredicate.test.ts metadata/forms/elements/__tests__/fromXML.test.ts metadata/forms/elements/__tests__/toXML.test.ts metadata/forms/elements/__tests__/fromYAML.test.ts metadata/forms/elements/__tests__/toYAML.test.ts metadata/forms/elements/__tests__/toEnterprise.test.ts -t "Table"
```

Expected: PASS.

- [ ] **Step 2: Run adjacent child-item fixture verification**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/elements/__tests__/fromXML.test.ts metadata/forms/elements/__tests__/toXML.test.ts metadata/forms/elements/__tests__/fromYAML.test.ts metadata/forms/elements/__tests__/toYAML.test.ts -t "TableInputField|TableCheckBoxField|TableLabelField|TablePictureField|ColumnGroup"
```

Expected: PASS. This protects the table child item serializers used by `full.xml`, `dynamicList.xml`, and `fullTree.xml`.

- [ ] **Step 3: Inspect git diff**

Run:

```bash
git diff --stat
git diff -- packages/core/metadata/forms/elements/table/rules.ts packages/core/metadata/forms/clientApplicationForm/toXML.ts packages/core/tests/element/exportElementToXML.ts packages/core/metadata/forms/elements/table/__fixtures__/data.ts packages/core/metadata/forms/elements/table/__fixtures__/dynamicList.ts packages/core/metadata/forms/elements/__tests__/fixtures.ts
```

Expected:

- No edits to existing XML fixtures.
- `fullTree.xml` is added to git.
- `RowFilter` exists only as XML-only rule/default and fixture XML output.
- DynamicList-specific fields stay on `dynamicList`, not on `fullTable` or `fullTree`.
- ValueTable-specific `RowFilter` is driven by `ValueTable` rows, not by DynamicList rows.

- [ ] **Step 4: Commit final adjustments if needed**

If verification required follow-up edits, run:

```bash
git add packages/core/metadata/forms/elements/table/rules.ts packages/core/metadata/forms/clientApplicationForm/toXML.ts packages/core/tests/element/exportElementToXML.ts packages/core/metadata/forms/elements/table/__fixtures__/data.ts packages/core/metadata/forms/elements/table/__fixtures__/dynamicList.ts packages/core/metadata/forms/elements/__tests__/fixtures.ts packages/core/metadata/forms/elements/table/__fixtures__/fullTree.xml
git commit -m "test: 🧪 включить новые XML и YAML фикстуры таблиц"
```

If no follow-up edits were needed, do not create an empty commit.

## Self-Review

- Spec coverage: the plan covers `RowFilter` ValueTable behavior, DynamicList predicate behavior, three updated XML fixtures, new `fullTree.xml`, and full YAML coverage for DynamicList/fullTree.
- XML source of truth: the plan explicitly forbids editing the existing XML fixtures.
- Type consistency: `valueTableFormAttributeQuery`, `dynamicListFormAttributeQuery`, `rowFilter`, `uRLListGetProcessing`, and `uRLGetProcessing` names are consistent across tests, rules, and cache builders.
- Test coverage: predicate tests isolate conditional XML defaults; element XML/YAML tests cover round-trip fixtures; enterprise coverage remains for `fullTable`.
