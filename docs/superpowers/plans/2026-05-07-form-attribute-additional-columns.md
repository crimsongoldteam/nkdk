# Form Attribute Additional Columns Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve form attribute XML where one `<Columns>` container contains both direct `<Column>` nodes and `<AdditionalColumns>` groups.

**Architecture:** Split the domain model into two fields: `columns` for direct form attribute columns and `additionalColumns` for additional table-column groups. Keep XML serialization specialized in `formAttribute/fromXML.ts` and `formAttribute/toXML.ts` because column `id` numbering already depends on custom code, while YAML and graph traversal use explicit property types.

**Tech Stack:** TypeScript, Vitest, pnpm workspace filters, existing `metadata/orchestration` property and graph registries.

---

## File Structure

- Modify `packages/core/metadata/forms/commonObjects/formAttribute/types.ts`
  - Owns the `FormAttribute`, XML, and YAML shapes for form attributes.
  - Add `additionalColumns?: FormAttributeAdditionalColumns[]`.
  - Narrow `FormAttributeColumns` to direct columns only.

- Modify `packages/core/metadata/forms/commonObjects/formAttribute/rules.ts`
  - Add a separate `additionalColumns` property with YAML key `ДополнительныеКолонки`.
  - Keep XML handled manually by setting XML import/export off for both column fields.

- Modify `packages/core/metadata/orchestration/property/registry.ts`
  - Register the new property type `FormAttributeAdditionalColumns`.

- Modify `packages/core/metadata/forms/commonObjects/formAttribute/fromXML.ts`
  - Import direct `Column` nodes and `AdditionalColumns` groups independently from the same XML parent.

- Modify `packages/core/metadata/forms/commonObjects/formAttribute/toXML.ts`
  - Export direct `Column` nodes and `AdditionalColumns` groups into one `<Columns>` object.

- Modify `packages/core/metadata/forms/commonObjects/formAttribute/fromYAML.ts`
  - Import direct columns only from `Колонки`.
  - Import additional columns only from `ДополнительныеКолонки`.
  - Do not support the old heuristic where non-table attributes treated `Колонки` as additional columns.

- Modify `packages/core/metadata/forms/commonObjects/formAttribute/toYAML.ts`
  - Export direct columns to `Колонки`.
  - Export additional columns to `ДополнительныеКолонки`.

- Modify `packages/core/metadata/forms/commonObjects/formAttribute/graphFromModel.ts`
  - Split graph handling into direct-column and additional-column builders.

- Modify tests:
  - `packages/core/metadata/forms/commonObjects/formAttribute/fromXML.test.ts`
  - `packages/core/metadata/forms/commonObjects/formAttribute/toXML.test.ts`
  - `packages/core/metadata/forms/commonObjects/formAttribute/fromYAML.test.ts`
  - `packages/core/metadata/forms/commonObjects/formAttribute/toYAML.test.ts`
  - `packages/core/metadata/forms/commonObjects/formAttribute/graphFromModel.test.ts`

- Create fixtures:
  - `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/mixedColumns.xml`
  - `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/mixedColumns.ts`

---

### Task 1: Add Red XML Fixtures And Tests

**Files:**
- Create: `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/mixedColumns.xml`
- Create: `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/mixedColumns.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/fromXML.test.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/toXML.test.ts`

- [ ] **Step 1: Create the mixed XML fixture**

Create `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/mixedColumns.xml`:

```xml
<Attribute name="График" id="1">
	<Columns>
		<Column name="Отступ" id="1">
			<Title>
				<v8:item>
					<v8:lang>ru</v8:lang>
					<v8:content>Отступ</v8:content>
				</v8:item>
			</Title>
			<Type>
				<v8:Type>xs:string</v8:Type>
				<v8:StringQualifiers>
					<v8:Length>0</v8:Length>
					<v8:AllowedLength>Variable</v8:AllowedLength>
				</v8:StringQualifiers>
			</Type>
		</Column>
		<AdditionalColumns table="ГрафикНачислений">
			<Column name="Сумма" id="2">
				<Title>
					<v8:item>
						<v8:lang>ru</v8:lang>
						<v8:content>Сумма</v8:content>
					</v8:item>
				</Title>
				<Type>
					<v8:Type>xs:decimal</v8:Type>
					<v8:NumberQualifiers>
						<v8:Digits>10</v8:Digits>
						<v8:FractionDigits>2</v8:FractionDigits>
						<v8:AllowedSign>Any</v8:AllowedSign>
					</v8:NumberQualifiers>
				</Type>
			</Column>
		</AdditionalColumns>
	</Columns>
	<Type>
		<v8:Type>v8:ValueTable</v8:Type>
	</Type>
</Attribute>
```

- [ ] **Step 2: Create the expected TS fixture**

Create `packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/mixedColumns.ts`:

```ts
import type { FormAttributes } from "../types"

export const mixedColumns = [
  {
    name: "График",
    title: { items: { ru: "" } },
    type: { type: ["ValueTable"] },
    columns: [
      {
        name: "Отступ",
        title: { items: { ru: "Отступ" } },
        type: {
          type: ["string"],
          stringQualifiers: { length: 0, allowedLength: "Variable" },
        },
        itemType: "FormAttributeColumn",
      },
    ],
    additionalColumns: [
      {
        table: "ГрафикНачислений",
        columns: [
          {
            name: "Сумма",
            title: { items: { ru: "Сумма" } },
            type: {
              type: ["decimal"],
              numberQualifiers: { digits: 10, fractionDigits: 2, allowedSign: "Any" },
            },
            itemType: "FormAttributeColumn",
          },
        ],
      },
    ],
    itemType: "FormAttribute",
  },
] as const satisfies FormAttributes
```

- [ ] **Step 3: Add the failing XML import test**

In `packages/core/metadata/forms/commonObjects/formAttribute/fromXML.test.ts`, add this import near the existing fixture imports:

```ts
import { mixedColumns } from "./__fixtures__/mixedColumns"
```

Add this test after `it("import twoTables", ...)`:

```ts
  it("import mixedColumns", () => {
    const result = testImportPropertyFromXML({
      rule: formAttributesRule,
      path: "mixedColumns.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(mixedColumns)
  })
```

- [ ] **Step 4: Add the failing XML export test**

In `packages/core/metadata/forms/commonObjects/formAttribute/toXML.test.ts`, add this import near the existing fixture imports:

```ts
import { mixedColumns } from "./__fixtures__/mixedColumns"
```

Add this test after `it("export twoTables", ...)`:

```ts
  it("export mixedColumns", () => {
    const { result, expectedResult } = testExportPropertyToXML({
      rule: formAttributesRule,
      value: mixedColumns,
      xmlRootTag: "Attribute",
      exportXmlDataAsRoot: true,
      path: "mixedColumns.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })
```

- [ ] **Step 5: Run XML tests and verify they fail for the mixed case**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/forms/commonObjects/formAttribute/fromXML.test.ts packages/core/metadata/forms/commonObjects/formAttribute/toXML.test.ts -t "mixedColumns"
```

Expected: FAIL. The import side should miss either `columns` or `additionalColumns`; the export side should omit `<AdditionalColumns>` because the current model only exports one column kind.

- [ ] **Step 6: Keep the red XML changes uncommitted**

Do not commit this red state. Leave the fixture and test edits in the working tree for Task 2, where the implementation will make them pass.

Run:

```bash
git status --short
```

Expected: the new `mixedColumns` fixture files and XML test edits are visible as uncommitted changes.

---

### Task 2: Split The Type Model And XML Serialization

**Files:**
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/types.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/rules.ts`
- Modify: `packages/core/metadata/orchestration/property/registry.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/fromXML.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/toXML.ts`
- Test: XML tests from Task 1

- [ ] **Step 1: Update the form attribute types**

In `packages/core/metadata/forms/commonObjects/formAttribute/types.ts`, replace the column type block with:

```ts
export interface FormAttributeAdditionalColumns {
  table: string
  columns: FormAttributeColumn[]
}

export type FormAttributeColumns = FormAttributeColumn[]

export type FormAttributeAdditionalColumnsCollection = FormAttributeAdditionalColumns[]
```

Update YAML types in the same file:

```ts
export type FormAttributeColumnsYAML = Record<string, FormAttributeColumnYAML>

export interface FormAttributeAdditionalColumnYAML {
  [tableName: string]: Record<string, FormAttributeColumnYAML>
}
```

Add the explicit YAML field to `FormAttributeYAML`:

```ts
  Колонки?: FormAttributeColumnsYAML
  ДополнительныеКолонки?: FormAttributeAdditionalColumnYAML
```

After the generated `FormAttribute` type, add an explicit exported intersection type for places that need to see the new optional field:

```ts
export type FormAttributeWithAdditionalColumns = FormAttribute & {
  additionalColumns?: FormAttributeAdditionalColumns[]
}
```

- [ ] **Step 2: Update rules for direct and additional columns**

In `packages/core/metadata/forms/commonObjects/formAttribute/rules.ts`, change `columns` and add `additionalColumns`:

```ts
    columns: {
      yaml: "Колонки",
      type: "FormAttributeColumns",
      fromXML: false,
      toXML: false,
      fromYAML: false,
      defaultValue: [],
      required: true,
    },
    additionalColumns: {
      yaml: "ДополнительныеКолонки",
      type: "FormAttributeAdditionalColumns",
      fromXML: false,
      toXML: false,
    },
```

- [ ] **Step 3: Register the additional-columns property type**

In `packages/core/metadata/orchestration/property/registry.ts`, extend the form attribute import:

```ts
import {
  FormAttributeAdditionalColumnYAML,
  FormAttributeAdditionalColumnsCollection,
  FormAttributeColumns,
  FormAttributeColumnsYAML,
  FormAttributes,
  FormAttributesYAML,
} from "~/metadata/forms/commonObjects/formAttribute/types"
```

Add this registry entry beside `FormAttributeColumns`:

```ts
  FormAttributeAdditionalColumns: {
    item: FormAttributeAdditionalColumnsCollection
    yaml: FormAttributeAdditionalColumnYAML
  }
```

Add the string literal beside `FormAttributeColumns`:

```ts
  FormAttributeAdditionalColumns: "FormAttributeAdditionalColumns",
```

- [ ] **Step 4: Import direct and additional columns independently from XML**

In `packages/core/metadata/forms/commonObjects/formAttribute/fromXML.ts`, remove `FormAttributeColumns` from imports and add `FormAttributeWithAdditionalColumns`.

Replace `importFormAttributeFromXML` with:

```ts
const importFormAttributeFromXML = (context: ConfigurationContextFromXML, xml: FormAttributeXML): FormAttribute => {
  const properties = importMetadataItemFromXML({
    context: context,
    xml,
    rule: FormAttributeRules,
  })

  if (context.fromXML.forReference) {
    return {
      itemType: FormAttributeRules.itemType,
      ...properties,
      name: xml._name,
    } as FormAttribute
  }

  const columns = importColumnsFromXML(context, xml.Columns?.Column)
  const additionalColumns = importAdditionalColumnsFromXML(context, xml.Columns?.AdditionalColumns)

  const result: FormAttributeWithAdditionalColumns = {
    itemType: FormAttributeRules.itemType,
    name: xml._name,
    title: properties!.title!,
    columns,
    ...properties,
  }

  if (additionalColumns.length > 0) {
    result.additionalColumns = additionalColumns
  }

  return result
}
```

Replace `importFormAttributeColumnsFromXML` with a direct-column-only implementation:

```ts
const importFormAttributeColumnsFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: FormAttributeColumnXML | FormAttributeColumnXML[] | undefined
): FormAttributeColumn[] | undefined => {
  return importColumnsFromXML(context, xml)
}
```

Add a registered importer for additional columns:

```ts
const importFormAttributeAdditionalColumnsFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: FormAttributeAdditionalColumnXML | FormAttributeAdditionalColumnXML[] | undefined
): FormAttributeAdditionalColumns[] | undefined => {
  return importAdditionalColumnsFromXML(context, xml)
}
```

At the bottom, add:

```ts
registerTypeRule("FormAttributeAdditionalColumns", "importFromXML", importFormAttributeAdditionalColumnsFromXML)
```

- [ ] **Step 5: Export direct and additional columns into one XML container**

In `packages/core/metadata/forms/commonObjects/formAttribute/toXML.ts`, remove `ExportToXMLFunctionNew` and `FormAttributeColumns` imports. Add `FormAttributeWithAdditionalColumns`.

After `Object.assign(result, properties)` in `exportFormAttributeToXML`, add:

```ts
  const columns = exportColumnsToXML(context, data.columns, referenceData?.columns, data)
  const additionalColumns = exportAdditionalColumnsToXML(
    context,
    (data as FormAttributeWithAdditionalColumns).additionalColumns ?? [],
    (referenceData as FormAttributeWithAdditionalColumns | undefined)?.additionalColumns,
    data
  )

  if (columns || additionalColumns) {
    result.Columns = {
      ...(columns ? { Column: columns.Column } : {}),
      ...(additionalColumns ? { AdditionalColumns: additionalColumns.AdditionalColumns } : {}),
    }
  }
```

Replace `exportFormAttributeColumnsToXML` with:

```ts
const exportFormAttributeColumnsToXML = (
  context: ConfigurationContextWithExportToXML,
  _rule: PropertyRule | undefined,
  columns: FormAttributeColumn[] | undefined,
  referenceColumns?: FormAttributeColumn[] | undefined
): { Column: FormAttributeColumnXML[] } | undefined => {
  return exportColumnsToXML(context, columns ?? [], referenceColumns)
}
```

Add:

```ts
const exportFormAttributeAdditionalColumnsToXML = (
  context: ConfigurationContextWithExportToXML,
  _rule: PropertyRule | undefined,
  additionalColumns: FormAttributeAdditionalColumn[] | undefined,
  referenceAdditionalColumns?: FormAttributeAdditionalColumn[] | undefined
): { AdditionalColumns: FormAttributeAdditionalColumnXML[] } | undefined => {
  return exportAdditionalColumnsToXML(context, additionalColumns ?? [], referenceAdditionalColumns)
}
```

At the bottom, add:

```ts
registerTypeRule("FormAttributeAdditionalColumns", "exportToXML", exportFormAttributeAdditionalColumnsToXML)
```

- [ ] **Step 6: Run XML tests and verify they pass**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/forms/commonObjects/formAttribute/fromXML.test.ts packages/core/metadata/forms/commonObjects/formAttribute/toXML.test.ts -t "mixedColumns"
```

Expected: PASS for `import mixedColumns` and `export mixedColumns`.

- [ ] **Step 7: Run the existing form attribute XML suite**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/forms/commonObjects/formAttribute/fromXML.test.ts packages/core/metadata/forms/commonObjects/formAttribute/toXML.test.ts
```

Expected: PASS. Existing fixtures `tableWithColumns`, `treeWithColumn`, `twoTables`, and `additionalColumn` must remain green.

- [ ] **Step 8: Commit the XML implementation**

Run:

```bash
git add packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/mixedColumns.xml packages/core/metadata/forms/commonObjects/formAttribute/__fixtures__/mixedColumns.ts packages/core/metadata/forms/commonObjects/formAttribute/fromXML.test.ts packages/core/metadata/forms/commonObjects/formAttribute/toXML.test.ts packages/core/metadata/forms/commonObjects/formAttribute/types.ts packages/core/metadata/forms/commonObjects/formAttribute/rules.ts packages/core/metadata/orchestration/property/registry.ts packages/core/metadata/forms/commonObjects/formAttribute/fromXML.ts packages/core/metadata/forms/commonObjects/formAttribute/toXML.ts
git commit -m "fix: :bug: сохранить смешанные колонки формы в XML"
```

---

### Task 3: Make YAML Explicit

**Files:**
- Modify: `packages/core/tests/fixtures/formAttributes/data.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/fromYAML.test.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/toYAML.test.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/fromYAML.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/toYAML.ts`

- [ ] **Step 1: Add explicit YAML fixtures**

In `packages/core/tests/fixtures/formAttributes/data.ts`, change `withAdditionalColumnFormAttribute` so the attribute has empty direct columns and explicit additional columns:

```ts
export const withAdditionalColumnFormAttribute: FormAttributes = [
  {
    name: "Объект",
    type: { type: ["string"] },
    title: { items: { ru: "" } },
    columns: [],
    additionalColumns: [
      {
        table: "КакаяТоТаблица",
        columns: [
          {
            name: "КолонкаТаблицы",
            title: { items: { ru: "Описание колонки" } },
            type: { type: ["string"] },
            itemType: "FormAttributeColumn",
          },
        ],
      },
    ],
    itemType: "FormAttribute",
  },
]
```

Change `withAdditionalColumnFormAttributeYAML` to use the new key:

```ts
export const withAdditionalColumnFormAttributeYAML: FormAttributesYAML = {
  Объект: {
    Заголовок: "",
    Тип: "Строка",
    ДополнительныеКолонки: {
      КакаяТоТаблица: {
        КолонкаТаблицы: {
          Заголовок: "Описание колонки",
          Тип: "Строка",
        },
      },
    },
  },
}
```

- [ ] **Step 2: Add a mixed YAML fixture in the same file**

Append this fixture block to `packages/core/tests/fixtures/formAttributes/data.ts`:

```ts
//#region MixedColumns

export const mixedColumnsFormAttribute: FormAttributes = [
  {
    name: "График",
    title: { items: { ru: "" } },
    type: { type: ["ValueTable"] },
    columns: [
      {
        name: "Отступ",
        type: { type: ["string"] },
        itemType: "FormAttributeColumn",
      },
    ],
    additionalColumns: [
      {
        table: "Объект.ГрафикНачислений",
        columns: [
          {
            name: "Сумма",
            type: { type: ["decimal"] },
            itemType: "FormAttributeColumn",
          },
        ],
      },
    ],
    itemType: "FormAttribute",
  },
]

export const mixedColumnsFormAttributeYAML: FormAttributesYAML = {
  График: {
    Заголовок: "",
    Тип: "ТаблицаЗначений",
    Колонки: {
      Отступ: {
        Тип: "Строка",
      },
    },
    ДополнительныеКолонки: {
      "Объект.ГрафикНачислений": {
        Сумма: {
          Тип: "Число",
        },
      },
    },
  },
}

//#endregion
```

- [ ] **Step 3: Add failing YAML import/export tests**

In `packages/core/metadata/forms/commonObjects/formAttribute/fromYAML.test.ts`, add imports:

```ts
  mixedColumnsFormAttribute,
  mixedColumnsFormAttributeYAML,
```

Add this test after the additional-column test:

```ts
  it("should import mixed columns", () => {
    const result = importFormAttributesFromYAML(mockContext, mockRule, mixedColumnsFormAttributeYAML)

    expect(result).toEqual(mixedColumnsFormAttribute)
  })
```

In `packages/core/metadata/forms/commonObjects/formAttribute/toYAML.test.ts`, add the same imports and this test after the additional-column test:

```ts
  it("should export mixed columns", () => {
    const result = exportFormAttributesToYAML(context, mockRule, mixedColumnsFormAttribute)

    expect(result).toEqual(mixedColumnsFormAttributeYAML)
  })
```

- [ ] **Step 4: Run YAML tests and verify they fail**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/forms/commonObjects/formAttribute/fromYAML.test.ts packages/core/metadata/forms/commonObjects/formAttribute/toYAML.test.ts -t "mixed columns|additional column"
```

Expected: FAIL before implementation because `ДополнительныеКолонки` is not imported or exported.

- [ ] **Step 5: Implement YAML import**

In `packages/core/metadata/forms/commonObjects/formAttribute/fromYAML.ts`, remove the `formAttribute` parameter from `importFormAttributeColumnsFromYAML`. Replace the call site in `importFormAttributeFromYAML` with:

```ts
  const columns = importFormAttributeColumnsFromYAML(context, yaml)
  const additionalColumns = importFormAttributeAdditionalColumnsFromYAML(context, yaml)
```

Return both fields:

```ts
  return {
    ...attribute,
    columns,
    ...(additionalColumns.length > 0 ? { additionalColumns } : {}),
    itemType: "FormAttribute",
  }
```

Replace `importFormAttributeColumnsFromYAML` with:

```ts
const importFormAttributeColumnsFromYAML = (
  context: ConfigurationContext,
  yamlWithColumns: FormAttributeYAML | TypeDescriptionYAML
): FormAttributeColumn[] => {
  if (
    typeof yamlWithColumns !== "object" ||
    yamlWithColumns === null ||
    Array.isArray(yamlWithColumns) ||
    !("Колонки" in yamlWithColumns)
  ) {
    return []
  }

  return importColumnsFromYAML(context, (yamlWithColumns as FormAttributeYAML).Колонки)
}
```

Add:

```ts
const importFormAttributeAdditionalColumnsFromYAML = (
  context: ConfigurationContext,
  yamlWithColumns: FormAttributeYAML | TypeDescriptionYAML
): FormAttributeAdditionalColumn[] => {
  if (
    typeof yamlWithColumns !== "object" ||
    yamlWithColumns === null ||
    Array.isArray(yamlWithColumns) ||
    !("ДополнительныеКолонки" in yamlWithColumns)
  ) {
    return []
  }

  const data = (yamlWithColumns as FormAttributeYAML).ДополнительныеКолонки
  return importAdditionalColumnsFromYAML(context, data ?? {})
}
```

Change `importColumnsFromYAML` return type to direct columns:

```ts
const importColumnsFromYAML = (
  context: ConfigurationContext,
  data: FormAttributeColumnsYAML | undefined
): FormAttributeColumn[] => {
  if (!data) return []

  return Object.entries(data).map(([name, value]) => importColumnFromYAML(context, undefined, value, name))
}
```

Remove the `formObjectTypes` heuristic entirely.

- [ ] **Step 6: Implement YAML export**

In `packages/core/metadata/forms/commonObjects/formAttribute/toYAML.ts`, remove `isAdditionalColumns`.

Change `exportFormAttributeColumnsToYAML` to direct columns only:

```ts
const exportFormAttributeColumnsToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  columns: FormAttributeColumn[]
): FormAttributeColumnsYAML | undefined => {
  if (columns.length === 0) return undefined

  return exportColumnsToYAML(context, undefined, columns)
}
```

Add an exporter for additional columns:

```ts
const exportFormAttributeAdditionalColumnsToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  additionalColumns: FormAttributeAdditionalColumns[]
): FormAttributeAdditionalColumnYAML | undefined => {
  if (additionalColumns.length === 0) return undefined

  return exportAdditionalColumnsToYAML(context, undefined, additionalColumns)
}
```

Change `exportAdditionalColumnsToYAML` so it preserves the full table path instead of `split(".").pop()`:

```ts
const exportAdditionalColumnsToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  additionalColumns: FormAttributeAdditionalColumns[]
): FormAttributeAdditionalColumnYAML => {
  return Object.fromEntries(
    additionalColumns.map((additionalColumn) => [
      additionalColumn.table,
      exportColumnsToYAML(context, undefined, additionalColumn.columns),
    ])
  )
}
```

At the bottom, add:

```ts
registerTypeRule("FormAttributeAdditionalColumns", "exportToYAML", exportFormAttributeAdditionalColumnsToYAML)
```

- [ ] **Step 7: Run YAML tests and verify they pass**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/forms/commonObjects/formAttribute/fromYAML.test.ts packages/core/metadata/forms/commonObjects/formAttribute/toYAML.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit YAML changes**

Run:

```bash
git add packages/core/tests/fixtures/formAttributes/data.ts packages/core/metadata/forms/commonObjects/formAttribute/fromYAML.test.ts packages/core/metadata/forms/commonObjects/formAttribute/toYAML.test.ts packages/core/metadata/forms/commonObjects/formAttribute/fromYAML.ts packages/core/metadata/forms/commonObjects/formAttribute/toYAML.ts
git commit -m "feat: :sparkles: разделить колонки формы в YAML"
```

---

### Task 4: Split Graph Handling

**Files:**
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/graphFromModel.test.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/graphFromModel.ts`
- Test: `packages/core/metadata/orchestration/importMetadataFileWithGraph.test.ts`

- [ ] **Step 1: Add the failing mixed graph unit test**

In `packages/core/metadata/forms/commonObjects/formAttribute/graphFromModel.test.ts`, add:

```ts
  it("mixed columns → direct column and additional-column proxy are both created", () => {
    const graph = makeGraph()
    graph.ensureNode(ATTR_NODE_ID, { name: "График" })

    buildGraphFromModel({
      model: {
        name: "График",
        columns: [{ name: "Отступ", itemType: "FormAttributeColumn" }],
        additionalColumns: [
          {
            table: "Объект.ГрафикНачислений",
            columns: [{ name: "Сумма", itemType: "FormAttributeColumn" }],
          },
        ],
        itemType: "FormAttribute",
      },
      yamlMap: undefined,
      rule: FormAttributeRules,
      graph,
      parentNodeId: ATTR_NODE_ID,
      filePath: FILE_PATH,
    })

    const directColumnNodeId = `${ATTR_NODE_ID}.Отступ`
    const proxyNodeId = `${ATTR_NODE_ID}.ГрафикНачислений`
    const additionalColumnNodeId = `${proxyNodeId}.Сумма`

    expect(graph.hasNode(directColumnNodeId)).toBe(true)
    expect(graph.hasNode(proxyNodeId)).toBe(true)
    expect(graph.hasNode(additionalColumnNodeId)).toBe(true)

    expect([...graph.outEdgeEntries(ATTR_NODE_ID)].filter((e) => e.attributes.kind === "FORM_COLUMN")).toHaveLength(1)
    expect([...graph.outEdgeEntries(ATTR_NODE_ID)].filter((e) => e.attributes.kind === "TABLE_EXTENSION")).toHaveLength(1)
    expect([...graph.outEdgeEntries(proxyNodeId)].filter((e) => e.attributes.kind === "ADDITIONAL_COLUMN")).toHaveLength(1)
  })
```

- [ ] **Step 2: Run the graph unit test and verify it fails**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/forms/commonObjects/formAttribute/graphFromModel.test.ts -t "mixed columns"
```

Expected: FAIL because `additionalColumns` is ignored by graph traversal.

- [ ] **Step 3: Split graph builders**

In `packages/core/metadata/forms/commonObjects/formAttribute/graphFromModel.ts`, replace the current `buildFormAttributeColumnsGraph` with a direct-only version:

```ts
const buildFormAttributeColumnsGraph: BuildGraphFromModelFunction = ({
  model,
  parentNodeId,
  yamlMap,
  propRule,
}): GraphOps[] | undefined => {
  if (!Array.isArray(model) || model.length === 0) return undefined

  const columnsKey = propRule.yaml
  const columnsYamlMap = columnsKey && yamlMap ? findSubmap(yamlMap, columnsKey) : undefined

  const children: GraphOpsChild[] = []
  const recurses: GraphOpsRecurse[] = []
  for (const raw of model) {
    const column = raw as FormAttributeColumn
    const columnName = column.name
    if (!columnName) continue

    children.push({
      idSuffix: columnName,
      name: columnName,
      item: column as unknown as Record<string, unknown>,
    })
    recurses.push({
      model: column as unknown as Record<string, unknown>,
      yamlMap: columnsYamlMap ? findSubmap(columnsYamlMap, columnName) : undefined,
      rule: FormAttributeColumnRules,
      parentNodeId: `${parentNodeId}.${columnName}`,
    })
  }

  if (children.length === 0) return undefined

  return [{
    children,
    recurse: recurses,
    edgeKind: COLUMN_EDGE_KIND,
    edgeYaml: COLUMN_EDGE_YAML,
  }]
}
```

Add a new additional-only builder:

```ts
const buildFormAttributeAdditionalColumnsGraph: BuildGraphFromModelFunction = ({
  model,
  parentNodeId,
}): GraphOps[] | undefined => {
  if (!Array.isArray(model) || model.length === 0) return undefined

  const formNodeId = parentNodeId.split(".").slice(0, -2).join(".")
  const sections: GraphOps[] = []

  for (const raw of model) {
    const group = raw as FormAttributeAdditionalColumns
    const tablePath = group.table
    const lastSegment = tablePath.split(".").pop()
    if (!lastSegment) continue

    const proxyNodeId = `${parentNodeId}.${lastSegment}`

    sections.push({
      children: [{
        idSuffix: lastSegment,
        name: lastSegment,
        item: { itemType: "AdditionalColumnsProxy", table: tablePath },
      }],
      edgeKind: ADDITION_EDGE_KIND,
      edgeYaml: ADDITION_EDGE_YAML,
    })

    sections.push({
      formLocalReferences: [{
        formLocalPath: tablePath,
        formNodeId,
        parentOverride: proxyNodeId,
      }],
      edgeKind: TABLE_EDGE_KIND,
      edgeYaml: TABLE_EDGE_YAML,
    })

    const columnChildren: GraphOpsChild[] = []
    const columnRecurses: GraphOpsRecurse[] = []
    for (const column of group.columns) {
      const columnName = column.name
      if (!columnName) continue
      columnChildren.push({
        idSuffix: columnName,
        name: columnName,
        item: column as unknown as Record<string, unknown>,
        parentOverride: proxyNodeId,
      })
      columnRecurses.push({
        model: column as unknown as Record<string, unknown>,
        rule: FormAttributeColumnRules,
        parentNodeId: `${proxyNodeId}.${columnName}`,
      })
    }

    if (columnChildren.length > 0) {
      sections.push({
        children: columnChildren,
        recurse: columnRecurses,
        edgeKind: ADDITIONAL_COLUMN_EDGE_KIND,
        edgeYaml: ADDITIONAL_COLUMN_EDGE_YAML,
      })
    }
  }

  return sections.length > 0 ? sections : undefined
}
```

At the bottom, register both:

```ts
registerTypeRule("FormAttributeColumns", "buildGraphFromModel", buildFormAttributeColumnsGraph)
registerTypeRule("FormAttributeAdditionalColumns", "buildGraphFromModel", buildFormAttributeAdditionalColumnsGraph)
```

- [ ] **Step 4: Run graph tests and verify they pass**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/forms/commonObjects/formAttribute/graphFromModel.test.ts packages/core/metadata/orchestration/importMetadataFileWithGraph.test.ts -t "FormAttributeColumns|FormAttributeAdditionalColumns|mixed columns"
```

Expected: PASS. Existing PRD #115 and PRD #116 graph behavior must remain green.

- [ ] **Step 5: Commit graph changes**

Run:

```bash
git add packages/core/metadata/forms/commonObjects/formAttribute/graphFromModel.test.ts packages/core/metadata/forms/commonObjects/formAttribute/graphFromModel.ts
git commit -m "fix: :bug: построить граф смешанных колонок формы"
```

---

### Task 5: Run Focused Verification

**Files:**
- No source edits expected.
- Verify all changed behavior in the form attribute module.

- [ ] **Step 1: Run all form attribute tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/forms/commonObjects/formAttribute
```

Expected: PASS.

- [ ] **Step 2: Run graph integration tests touched by this change**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/orchestration/importMetadataFileWithGraph.test.ts -t "FormAttributeColumns|FormAttributeAdditionalColumns"
```

Expected: PASS.

- [ ] **Step 3: Run TypeScript checks through the core test runner if available**

Run:

```bash
pnpm --filter '@nakidka/core' test
```

Expected: PASS for `@nakidka/core`. If this command runs more than the package-local tests, keep the output and report the exact failing suite instead of hiding it.

- [ ] **Step 4: Check git status**

Run:

```bash
git status --short
```

Expected: clean working tree after the previous task commits.

---

## Self-Review

Spec coverage:

- XML mixed `Column + AdditionalColumns`: Task 1 and Task 2.
- Explicit model field `additionalColumns`: Task 2.
- Explicit YAML key `ДополнительныеКолонки`: Task 3.
- No old YAML heuristic: Task 3 removes `formObjectTypes` guessing.
- Graph builds both direct and additional subtrees: Task 4.
- Focused tests and XML fixtures: Tasks 1, 3, 4, and 5.

Placeholder scan:

- No placeholder text is present.
- Every code-changing step names exact files and gives concrete code.

Type consistency:

- The plan uses `additionalColumns` for the model field everywhere.
- The plan uses `FormAttributeAdditionalColumns` for one additional-columns group and `FormAttributeAdditionalColumnsCollection` for the property registry array type.
- YAML uses `ДополнительныеКолонки` consistently.
