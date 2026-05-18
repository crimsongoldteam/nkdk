# Remaining Form Round-Trip Diffs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve the last two XML round-trip diffs in `doc`: `CommandSet` on `GraphicalSchemaField` and the nested Gantt chart table.

**Architecture:** Add the missing `CommandSet` rule directly to `GraphicalSchemaFieldRules`. Model the nested Gantt chart table as a dedicated property type `GanttChartFieldTable` that reuses the existing `Table` element rules without making `Table` a general-purpose property type.

**Tech Stack:** TypeScript, Vitest, metadata `rules.ts`, form element orchestration, property type registry, XML/YAML import/export.

---

## File Structure

- Modify `packages/core/metadata/forms/elements/graphicalSchemaField/rules.ts`: add the `commandSet` property.
- Modify `packages/core/metadata/forms/elements/graphicalSchemaField/__fixtures__/full.xml`: add a small `CommandSet` fixture.
- Modify `packages/core/metadata/forms/elements/graphicalSchemaField/__fixtures__/data.ts`: add `commandSet` to model and YAML fixtures.
- Create `packages/core/metadata/forms/commonObjects/ganttChartFieldTable/types.ts`: define `GanttChartFieldTable`, YAML type, singleton naming style, and register XML/YAML/JSON schema rules.
- Modify `packages/core/metadata/forms/commonObjects/index.ts`: import the new type registration.
- Modify `packages/core/metadata/orchestration/property/registry.ts`: register `GanttChartFieldTable` in `PropertyTypeRegistry` and `PropertyRuleTypeKeys`.
- Modify `packages/core/metadata/forms/elements/ganttChartField/rules.ts`: add the `table` property.
- Modify `packages/core/metadata/forms/elements/ganttChartField/__fixtures__/full.xml`: add a nested `<Table>`.
- Modify `packages/core/metadata/forms/elements/ganttChartField/__fixtures__/data.ts`: add `table` to model and YAML fixtures.
- Modify `packages/core/metadata/forms/elements/singletonNameReference.test.ts`: cover reference-name behavior for `GanttChartFieldTable`.

Before editing `packages/core/metadata/orchestration/**`, read `.agents/architecture-orchestration.md`.

---

### Task 1: Add Failing GraphicalSchemaField CommandSet Fixture

**Files:**
- Modify: `packages/core/metadata/forms/elements/graphicalSchemaField/__fixtures__/full.xml`
- Modify: `packages/core/metadata/forms/elements/graphicalSchemaField/__fixtures__/data.ts`

- [ ] **Step 1: Add CommandSet to the XML fixture**

In `packages/core/metadata/forms/elements/graphicalSchemaField/__fixtures__/full.xml`, insert this block after `<TitleLocation>Left</TitleLocation>` and before `<TitleHeight>20</TitleHeight>`:

```xml
	<CommandSet>
		<ExcludedCommand>AlignBottom</ExcludedCommand>
		<ExcludedCommand>InsertItemActivity</ExcludedCommand>
		<ExcludedCommand>Ungroup</ExcludedCommand>
	</CommandSet>
```

- [ ] **Step 2: Add CommandSet to the model fixture**

In `packages/core/metadata/forms/elements/graphicalSchemaField/__fixtures__/data.ts`, add `commandSet` to `fullGraphicalSchemaField` after `borderColor`:

```ts
  commandSet: ["AlignBottom", "InsertItemActivity", "Ungroup"],
```

Add the YAML field to `fullGraphicalSchemaFieldPartialYAML` after `Высота`:

```ts
  Команда: ["AlignBottom", "InsertItemActivity", "Ungroup"],
```

- [ ] **Step 3: Run focused GraphicalSchemaField tests and verify failure**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate metadata/forms/elements -t "GraphicalSchemaField"
```

Expected: FAIL because `CommandSet` is present in the XML/YAML fixtures but `GraphicalSchemaFieldRules` does not import/export `commandSet` yet.

---

### Task 2: Implement GraphicalSchemaField CommandSet

**Files:**
- Modify: `packages/core/metadata/forms/elements/graphicalSchemaField/rules.ts`

- [ ] **Step 1: Add the rule**

In `packages/core/metadata/forms/elements/graphicalSchemaField/rules.ts`, add this property after `borderColor`:

```ts
    commandSet: { yaml: "Команда", type: "CommandSet", toEnterprise: false },
```

- [ ] **Step 2: Run focused GraphicalSchemaField tests and verify pass**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate metadata/forms/elements -t "GraphicalSchemaField"
```

Expected: PASS.

- [ ] **Step 3: Commit**

Run:

```bash
git add packages/core/metadata/forms/elements/graphicalSchemaField/rules.ts packages/core/metadata/forms/elements/graphicalSchemaField/__fixtures__/full.xml packages/core/metadata/forms/elements/graphicalSchemaField/__fixtures__/data.ts
git commit -m "fix: :bug: сохранить CommandSet графической схемы"
```

---

### Task 3: Add Failing GanttChartField Table Fixture

**Files:**
- Modify: `packages/core/metadata/forms/elements/ganttChartField/__fixtures__/full.xml`
- Modify: `packages/core/metadata/forms/elements/ganttChartField/__fixtures__/data.ts`

- [ ] **Step 1: Add nested Table to the XML fixture**

In `packages/core/metadata/forms/elements/ganttChartField/__fixtures__/full.xml`, insert this block after `<ExtendedTooltip name="ЭлементФормыРасширеннаяПодсказка" id="5">...</ExtendedTooltip>` and before `<Events>`:

```xml
	<Table name="ЭлементФормыТаблица" id="6">
		<Representation>Tree</Representation>
		<Visible>false</Visible>
		<Height>10</Height>
		<HeightControlVariant>UseHeightInFormRows</HeightControlVariant>
		<VerticalScrollBar>DontUse</VerticalScrollBar>
		<DataPath>Реквизит</DataPath>
		<SearchStringLocation>None</SearchStringLocation>
		<ViewStatusLocation>None</ViewStatusLocation>
		<SearchControlLocation>None</SearchControlLocation>
		<ContextMenu name="ЭлементФормыТаблицаКонтекстноеМеню" id="7"/>
		<AutoCommandBar name="ЭлементФормыТаблицаКоманднаяПанель" id="8"/>
		<ExtendedTooltip name="ЭлементФормыТаблицаРасширеннаяПодсказка" id="9"/>
		<ChildItems>
			<InputField name="ЭлементФормыТаблицаТочка" id="10">
				<DataPath>Реквизит.Point</DataPath>
				<ContextMenu name="ЭлементФормыТаблицаТочкаКонтекстноеМеню" id="11"/>
				<ExtendedTooltip name="ЭлементФормыТаблицаТочкаРасширеннаяПодсказка" id="12"/>
			</InputField>
		</ChildItems>
	</Table>
```

- [ ] **Step 2: Add nested Table to the model fixture**

In `packages/core/metadata/forms/elements/ganttChartField/__fixtures__/data.ts`, import `Table`:

```ts
import { Table } from "~/metadata/forms/elements/table/types"
```

Add this constant before `fullGanttChartField`:

```ts
const fullGanttChartFieldTable = {
  itemType: "Table",
  name: "ЭлементФормыТаблица",
  representation: "Tree",
  visible: false,
  height: 10,
  heightControlVariant: "UseHeightInFormRows",
  verticalScrollBar: "DontUse",
  dataPath: {
    path: "Реквизит",
    type: "ValueTable",
  },
  searchStringLocation: "None",
  viewStatusLocation: "None",
  searchControlLocation: "None",
  contextMenu: {
    itemType: "ContextMenu",
    childItems: [],
  },
  autoCommandBar: {
    itemType: "AutoCommandBar",
    childItems: [],
  },
  extendedTooltip: {
    itemType: "ExtendedTooltip",
  },
  childItems: [
    {
      itemType: "TableInputField",
      name: "ЭлементФормыТаблицаТочка",
      dataPath: {
        path: "Реквизит.Point",
        type: "string",
      },
      contextMenu: {
        itemType: "ContextMenu",
        childItems: [],
      },
      extendedTooltip: {
        itemType: "ExtendedTooltip",
      },
    },
  ],
} satisfies Table
```

Add this constant before `fullGanttChartFieldPartialYAML`:

```ts
const fullGanttChartFieldTablePartialYAML = {
  РежимОтображения: "Дерево",
  Видимость: "Ложь",
  Высота: 10,
  ВариантУправленияВысотой: "ИспользоватьВысотуВСтрокахФормы",
  ВертикальнаяПолосаПрокрутки: "НеИспользовать",
  ПутьКДанным: "Реквизит",
  ПоложениеСтрокиПоиска: "Нет",
  ПоложениеСостоянияПросмотра: "Нет",
  ПоложениеУправленияПоиском: "Нет",
  КонтекстноеМеню: {},
  КоманднаяПанель: {},
  РасширеннаяПодсказка: {},
  Элементы: {
    ЭлементФормыТаблицаТочка: {
      Тип: "ПолеВвода",
      ПутьКДанным: "Реквизит.Point",
      КонтекстноеМеню: {},
      РасширеннаяПодсказка: {},
    },
  },
}
```

Add `table` to `fullGanttChartField` after `verticalStretch`:

```ts
  table: fullGanttChartFieldTable,
```

Add `Таблица` to `fullGanttChartFieldPartialYAML` after `Ширина`:

```ts
  Таблица: fullGanttChartFieldTablePartialYAML,
```

- [ ] **Step 3: Run focused GanttChartField tests and verify failure**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate metadata/forms/elements -t "GanttChartField"
```

Expected: FAIL at compile time or assertion time because `GanttChartFieldTable` is not registered and `GanttChartFieldRules` has no `table` property yet.

---

### Task 4: Implement GanttChartFieldTable Property Type

**Files:**
- Create: `packages/core/metadata/forms/commonObjects/ganttChartFieldTable/types.ts`
- Modify: `packages/core/metadata/forms/commonObjects/index.ts`
- Modify: `packages/core/metadata/orchestration/property/registry.ts`
- Modify: `packages/core/metadata/forms/elements/singletonNameReference.test.ts`

- [ ] **Step 1: Read orchestration architecture notes**

Run:

```bash
sed -n '1,220p' .agents/architecture-orchestration.md
```

Expected: file is read before changing `packages/core/metadata/orchestration/property/registry.ts`.

- [ ] **Step 2: Create the property type implementation**

Create `packages/core/metadata/forms/commonObjects/ganttChartFieldTable/types.ts`:

```ts
import { TSchema } from "@sinclair/typebox"
import { getParentFromContext } from "~/metadata/context/helpers"
import { ConfigurationContext, ConfigurationContextFromXML, ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { Table, TablePartialYAML } from "~/metadata/forms/elements/table/types"
import { exportElementToJSONSchema } from "~/metadata/orchestration/formElement/toJSONSchema"
import { getElementRule } from "~/metadata/orchestration/formElement/ruleFactory"
import { importElementFromPartialYAML } from "~/metadata/orchestration/formElement/fromYAML"
import { importElementFromXML } from "~/metadata/orchestration/formElement/fromXML"
import { exportSingleElementToXML } from "~/metadata/orchestration/formElement/toXML"
import { exportElementToPartialYAML } from "~/metadata/orchestration/formElement/toYAML"
import { attachReferenceNameMode, applyReferenceNameMode, SingletonNameStyle } from "~/metadata/orchestration/formElement/singletonName"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { PropertyRule } from "~/metadata/orchestration/property/types"

export type GanttChartFieldTable = Table
export type GanttChartFieldTableYAML = TablePartialYAML

const nameStyle: SingletonNameStyle = {
  canonicalSuffix: "Таблица",
  referenceSuffixes: ["Таблица", "Table"],
}

const tableRule = getElementRule("Table")

const getGeneratedName = (context: ConfigurationContextWithExportToXML, table: Table | undefined): string => {
  const parent = getParentFromContext(context, ["GanttChartField"])
  const parentName = parent?.name ?? table?.name ?? "ДиаграммаГанта"
  return `${parentName}Таблица`
}

export const importGanttChartFieldTableFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule,
  xml: any,
  ownerXmlName?: string
): GanttChartFieldTable | undefined => {
  const table = importElementFromXML({
    context,
    itemType: "Table",
    xml,
  })
  if (table === undefined) return undefined
  if (!context.fromXML.forReference) return table

  return attachReferenceNameMode({
    model: table,
    xmlName: xml?._name,
    ownerXmlName,
    nameStyle,
  })
}

export const exportGanttChartFieldTableToXML = (params: {
  context: ConfigurationContextWithExportToXML
  value: GanttChartFieldTable | undefined
  referenceMetadata?: GanttChartFieldTable
}): any => {
  const { context, value, referenceMetadata } = params
  if (value === undefined) return undefined

  const generatedName = getGeneratedName(context, value)
  const name = applyReferenceNameMode({
    generatedName,
    referenceElement: referenceMetadata,
    nameStyle,
  })
  const table = { ...value, name }
  const referenceTable = referenceMetadata === undefined ? undefined : { ...referenceMetadata, name }

  return exportSingleElementToXML({
    context,
    element: table,
    referenceElement: referenceTable,
    rule: tableRule,
    additionalParams: { name },
  })
}

export const exportGanttChartFieldTableToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule,
  data: GanttChartFieldTable | undefined
): GanttChartFieldTableYAML | undefined => {
  return exportElementToPartialYAML({ context, element: data })
}

export const importGanttChartFieldTableFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule,
  yaml: GanttChartFieldTableYAML | undefined,
  source?: GanttChartFieldTable
): GanttChartFieldTable | undefined => {
  if (yaml === undefined && source === undefined) return undefined
  const result = importElementFromPartialYAML({
    context,
    itemType: "Table",
    yaml,
    source,
  }) as GanttChartFieldTable | undefined
  if (result === undefined) return undefined
  return {
    ...result,
    name: result.name ?? source?.name ?? "Таблица",
  }
}

export const exportGanttChartFieldTableToJSONSchema = (params: {
  context: ConfigurationContext
  value: GanttChartFieldTable | undefined
}): TSchema => {
  const value = params.value ?? { itemType: "Table", name: "Таблица", childItems: [] }
  return exportElementToJSONSchema({
    context: params.context,
    value,
  })
}

registerTypeRule("GanttChartFieldTable", "importFromXML", importGanttChartFieldTableFromXML)
registerTypeRule("GanttChartFieldTable", "exportToXML", exportGanttChartFieldTableToXML)
registerTypeRule("GanttChartFieldTable", "exportToYAML", exportGanttChartFieldTableToYAML)
registerTypeRule("GanttChartFieldTable", "importFromYAML", importGanttChartFieldTableFromYAML)
registerTypeRule("GanttChartFieldTable", "exportToJSONSchema", exportGanttChartFieldTableToJSONSchema)
```

- [ ] **Step 3: Register common object side-effect import**

In `packages/core/metadata/forms/commonObjects/index.ts`, add this near the other form common object type imports:

```ts
import "./ganttChartFieldTable/types"
```

- [ ] **Step 4: Register the property type**

In `packages/core/metadata/orchestration/property/registry.ts`, add this import near `CommandSet` and form element imports:

```ts
import { GanttChartFieldTable, GanttChartFieldTableYAML } from "~/metadata/forms/commonObjects/ganttChartFieldTable/types"
```

Add this entry in `PropertyTypeRegistry` in the single form elements region after `TableAutoCommandBar`:

```ts
  GanttChartFieldTable: {
    item: GanttChartFieldTable
    yaml: GanttChartFieldTableYAML
  }
```

Add this key in `PropertyRuleTypeKeys` after `TableAutoCommandBar`:

```ts
  GanttChartFieldTable: "GanttChartFieldTable",
```

- [ ] **Step 5: Add singleton-name regression test**

In `packages/core/metadata/forms/elements/singletonNameReference.test.ts`, add this test after the `TableAutoCommandBar` test:

```ts
  it("keeps GanttChartFieldTable reference suffix and current parent name", () => {
    const rule = { type: "GanttChartFieldTable" } satisfies PropertyRule
    const reference = importPropertyFromXML({
      context: mockContextFromXML({ forReference: true }),
      rule,
      value: {
        _name: "СтараяДиаграммаTable",
        _id: "496",
        ChildItems: [],
      },
      ownerXmlName: "СтараяДиаграмма",
    })

    const result = exportWithReference({
      context: withParent({ itemType: "GanttChartField", name: "НоваяДиаграмма" }),
      rule,
      value: {
        itemType: "Table",
        name: "СтараяДиаграммаTable",
        childItems: [],
      },
      reference,
    }) as SingletonReferenceXML

    expect(result._name).toBe("НоваяДиаграммаTable")
  })
```

Widen the `withParent` helper type at the top of the file:

```ts
const withParent = (parent: { itemType: "Button" | "Table" | "PDFDocumentField" | "GanttChartField"; name: string }) => {
```

- [ ] **Step 6: Run registry-level tests and verify the expected remaining failure**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate metadata/forms/elements/singletonNameReference.test.ts metadata/forms/elements -t "GanttChartField"
```

Expected: `singletonNameReference.test.ts` passes or fails only on the new implementation details; `GanttChartField` fixture still fails until `GanttChartFieldRules.table` is added in the next task.

---

### Task 5: Wire GanttChartField.table

**Files:**
- Modify: `packages/core/metadata/forms/elements/ganttChartField/rules.ts`

- [ ] **Step 1: Add the rule**

In `packages/core/metadata/forms/elements/ganttChartField/rules.ts`, add this property after `tableLocation`:

```ts
    table: {
      yaml: "Таблица",
      xml: "Table",
      type: "GanttChartFieldTable",
      toEnterprise: false,
    },
```

- [ ] **Step 2: Run focused GanttChartField tests and verify pass**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run --no-isolate metadata/forms/elements -t "GanttChartField"
```

Expected: PASS.

- [ ] **Step 3: Run singleton-name regression test**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms/elements/singletonNameReference.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit**

Run:

```bash
git add packages/core/metadata/forms/commonObjects/ganttChartFieldTable/types.ts packages/core/metadata/forms/commonObjects/index.ts packages/core/metadata/orchestration/property/registry.ts packages/core/metadata/forms/elements/ganttChartField/rules.ts packages/core/metadata/forms/elements/ganttChartField/__fixtures__/full.xml packages/core/metadata/forms/elements/ganttChartField/__fixtures__/data.ts packages/core/metadata/forms/elements/singletonNameReference.test.ts
git commit -m "fix: :bug: сохранить таблицу поля диаграммы Ганта"
```

---

### Task 6: Verify External Round-Trip And Full Test Suite

**Files:**
- No source edits expected.

- [ ] **Step 1: Generate Langium files if needed**

Run from the worktree root:

```bash
pnpm --filter nkdk-language langium:generate
```

Expected: PASS.

- [ ] **Step 2: Run all form element tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms/elements
```

Expected: PASS.

- [ ] **Step 3: Run external round-trip triage**

Run:

```bash
env NKDK_XML_REPO=/Users/nikita/git/round-trip-source NKDK_XML_DIR=/Users/nikita/git/round-trip-source/doc ./.agents/skills/round-trip-xml/round-trip.sh --triage --batch-size 5 --start-index 1
```

Expected: `=== Round-trip чистый ===` or no diffs for:

- `Catalogs/ПроектныеЗадачи/Forms/ФормаПланаПроекта/Ext/Form.xml`
- `DataProcessors/КартаМаршрутаБизнесПроцесса/Forms/Форма/Ext/Form.xml`

- [ ] **Step 4: Clean the external XML repository after triage**

Run:

```bash
git -C /Users/nikita/git/round-trip-source restore .
```

Expected:

```bash
git -C /Users/nikita/git/round-trip-source status --short
```

prints no files.

- [ ] **Step 5: Run the full project test suite**

Run from the worktree root:

```bash
pnpm test
```

Expected: PASS across `packages/*`.

- [ ] **Step 6: Commit final verification note if docs changed**

If only source/test code changed after Task 5, do not create another commit. If the plan or spec is updated with verification results, commit that documentation update:

```bash
git add docs/superpowers/specs/2026-05-18-round-trip-next-diffs-design.md docs/superpowers/plans/2026-05-18-round-trip-remaining-form-diffs.md
git commit -m "docs: :memo: обновить проверку оставшихся round-trip расхождений"
```

---

## Self-Review

- Spec coverage: Task 1-2 cover `GraphicalSchemaField.CommandSet`; Task 3-5 cover `GanttChartFieldTable` XML/YAML/model behavior; Task 6 covers external round-trip and full tests.
- Placeholder scan: no `TODO`, `TBD`, or vague implementation-only steps remain.
- Type consistency: the property type is consistently named `GanttChartFieldTable`; the model type is `Table`; YAML type is `TablePartialYAML`; the rule key is `table` with YAML key `Таблица`.
