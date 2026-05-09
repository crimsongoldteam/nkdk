# Basic Form Round-Trip Losses Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix three independent form XML round-trip losses: button `Parameter`, root form `ChildItemsWidth`, and `CommandInterface` order for duplicate items.

**Architecture:** Keep the first two fixes declarative in existing `rules.ts` files. Keep `CommandInterface` fallback order unchanged and only relax reference matching so the first matching duplicate item can provide reference XML order.

**Tech Stack:** TypeScript, Vitest, existing metadata orchestration rules, XML/YAML fixture tests, `pnpm --filter '@nakidka/core' exec vitest`.

---

## File Structure

- Modify `packages/core/metadata/forms/elements/button/rules.ts`
  - Add `parameter` to `commonButtonProperties`.
- Modify `packages/core/metadata/forms/elements/button/__fixtures__/data.ts`
  - Add `commandBarButtonWithParameter`, partial YAML, and typed YAML fixtures.
- Create `packages/core/metadata/forms/elements/button/__fixtures__/parameterCommandBarButton.xml`
  - XML source for a command-bar button with `Parameter xsi:type="xr:MDObjectRef"`.
- Modify `packages/core/metadata/forms/elements/__tests__/fixtures.ts`
  - Register the button fixture for existing XML/YAML element tests.
- Modify `packages/core/metadata/forms/clientApplicationForm/rules.ts`
  - Add `xml: "ChildItemsWidth"` to root `slaveItemsWidth`.
- Modify `packages/core/metadata/forms/clientApplicationForm/__fixtures__/data.ts`
  - Add a small form model with `slaveItemsWidth: "LeftWide"`.
- Create `packages/core/metadata/forms/clientApplicationForm/__fixtures__/childItemsWidth.xml`
  - Minimal form XML with root `<ChildItemsWidth>LeftWide</ChildItemsWidth>`.
- Modify `packages/core/metadata/forms/clientApplicationForm/fromXML.test.ts`
  - Add import test for the new form fixture.
- Modify `packages/core/metadata/forms/clientApplicationForm/toXML.test.ts`
  - Add export test with reference XML for the new form fixture.
- Modify `packages/core/metadata/forms/commonObjects/commandInterface/toXML.ts`
  - Return the first matching reference item for duplicate `CommandInterface.Item` entries.
- Create:
  - `packages/core/metadata/forms/commonObjects/commandInterface/__fixtures__/duplicateCommandGroupReferenceOrder.xml`
  - `packages/core/metadata/forms/commonObjects/commandInterface/__fixtures__/duplicateCommandGroupReferenceOrder.ts`
- Modify:
  - `packages/core/metadata/forms/commonObjects/commandInterface/fromXML.test.ts`
  - `packages/core/metadata/forms/commonObjects/commandInterface/toXML.test.ts`

## Task 1: Button Parameter

**Files:**
- Modify: `packages/core/metadata/forms/elements/button/rules.ts`
- Modify: `packages/core/metadata/forms/elements/button/__fixtures__/data.ts`
- Create: `packages/core/metadata/forms/elements/button/__fixtures__/parameterCommandBarButton.xml`
- Modify: `packages/core/metadata/forms/elements/__tests__/fixtures.ts`

- [ ] **Step 1: Add the failing fixture data**

In `packages/core/metadata/forms/elements/button/__fixtures__/data.ts`, add these exports after `commandBarButtonWithDataPathTypedYAML`:

```ts
export const commandBarButtonWithParameter = {
  itemType: "CommandBarButton",
  name: "ФормаПоказатьВСписке",
  type: "CommandBarButton",
  visible: false,
  commandName: "Form.StandardCommand.ShowInList",
  parameter: "Document.Встреча",
} satisfies CommandBarButton

export const commandBarButtonWithParameterPartialYAML = {
  Вид: "КнопкаКоманднойПанели",
  Видимость: "Ложь",
  ИмяКоманды: "Form.StandardCommand.ShowInList",
  Параметр: "Document.Встреча",
} satisfies CommandBarButtonPartialYAML

export const commandBarButtonWithParameterTypedYAML: CommandBarButtonTypedYAML = {
  ...commandBarButtonWithParameterPartialYAML,
  Тип: "КнопкаКоманднойПанели",
}
```

- [ ] **Step 2: Add the XML fixture**

Create `packages/core/metadata/forms/elements/button/__fixtures__/parameterCommandBarButton.xml`:

```xml
<Button name="ФормаПоказатьВСписке" id="1">
	<Type>CommandBarButton</Type>
	<Visible>false</Visible>
	<CommandName>Form.StandardCommand.ShowInList</CommandName>
	<Parameter xsi:type="xr:MDObjectRef">Document.Встреча</Parameter>
</Button>
```

- [ ] **Step 3: Register the fixture in element tests**

In `packages/core/metadata/forms/elements/__tests__/fixtures.ts`, extend the import from `../button/__fixtures__/data` with:

```ts
commandBarButtonWithParameter,
commandBarButtonWithParameterPartialYAML,
commandBarButtonWithParameterTypedYAML,
```

Add a fixture entry in the `CommandBarButton` region:

```ts
{
  group: "CommandBarButton",
  name: "with Parameter",
  element: CommandBarButton,
  xml: "parameterCommandBarButton.xml",
  xmlFolder: "button",
  model: commandBarButtonWithParameter,
  yaml: commandBarButtonWithParameterPartialYAML,
  typedYAML: commandBarButtonWithParameterTypedYAML,
  enterprise: undefined,
},
```

- [ ] **Step 4: Run the focused tests and verify they fail**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/elements/__tests__ -t "with Parameter"
```

Expected: FAIL because `parameter` is not imported/exported and YAML key `Параметр` is unknown to the rule.

- [ ] **Step 5: Add the rules.ts property**

In `packages/core/metadata/forms/elements/button/rules.ts`, add this property after `commandName`:

```ts
parameter: {
  yaml: "Параметр",
  xml: "Parameter",
  type: "MetadataItemLink",
  toEnterprise: false,
},
```

- [ ] **Step 6: Verify generated YAML types**

No manual edit is expected in `packages/core/metadata/forms/elements/button/types.ts`: `CommandBarButtonPartialYAML` is generated through `YAMLTypeByRule<typeof CommandBarButtonRules>`. Verify the fixture type-checks after the rule change.

Run:

```bash
pnpm --filter '@nakidka/core' exec tsc --noEmit
```

Expected: PASS, and no explicit YAML interface field is needed.

- [ ] **Step 7: Run the focused tests and verify they pass**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/elements/__tests__ -t "with Parameter"
```

Expected: PASS for XML import/export and YAML import/export of the fixture.

- [ ] **Step 8: Commit**

Run:

```bash
git add packages/core/metadata/forms/elements/button packages/core/metadata/forms/elements/__tests__/fixtures.ts
git commit -m "fix: :bug: сохранить Parameter кнопок формы"
```

## Task 2: Root Form ChildItemsWidth

**Files:**
- Modify: `packages/core/metadata/forms/clientApplicationForm/rules.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/__fixtures__/data.ts`
- Create: `packages/core/metadata/forms/clientApplicationForm/__fixtures__/childItemsWidth.xml`
- Modify: `packages/core/metadata/forms/clientApplicationForm/fromXML.test.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/toXML.test.ts`

- [ ] **Step 1: Add the form fixture model**

In `packages/core/metadata/forms/clientApplicationForm/__fixtures__/data.ts`, add:

```ts
export const childItemsWidthClientApplicationForm = {
  ...minimalClientApplicationForm,
  slaveItemsWidth: "LeftWide",
}
```

- [ ] **Step 2: Add the XML fixture**

Create `packages/core/metadata/forms/clientApplicationForm/__fixtures__/childItemsWidth.xml`:

```xml
﻿<?xml version="1.0" encoding="UTF-8"?>
<Form xmlns="http://v8.1c.ru/8.3/xcf/logform" xmlns:app="http://v8.1c.ru/8.2/managed-application/core" xmlns:cfg="http://v8.1c.ru/8.1/data/enterprise/current-config" xmlns:dcscor="http://v8.1c.ru/8.1/data-composition-system/core" xmlns:dcssch="http://v8.1c.ru/8.1/data-composition-system/schema" xmlns:dcsset="http://v8.1c.ru/8.1/data-composition-system/settings" xmlns:ent="http://v8.1c.ru/8.1/data/enterprise" xmlns:lf="http://v8.1c.ru/8.2/managed-application/logform" xmlns:style="http://v8.1c.ru/8.1/data/ui/style" xmlns:sys="http://v8.1c.ru/8.1/data/ui/fonts/system" xmlns:v8="http://v8.1c.ru/8.1/data/core" xmlns:v8ui="http://v8.1c.ru/8.1/data/ui" xmlns:web="http://v8.1c.ru/8.1/data/ui/colors/web" xmlns:win="http://v8.1c.ru/8.1/data/ui/colors/windows" xmlns:xr="http://v8.1c.ru/8.3/xcf/readable" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="2.20">
	<AutoCommandBar name="ФормаКоманднаяПанель" id="-1"/>
	<ChildItemsWidth>LeftWide</ChildItemsWidth>
</Form>
```

Use existing `minimalMetadata.xml` as metadata reference in tests.

- [ ] **Step 3: Add import and export tests**

In `fromXML.test.ts`, import `childItemsWidthClientApplicationForm` and add:

```ts
it("imports root ChildItemsWidth", () => {
  const xmlData = readAndParseXMLFixture<{ Form: ClientApplicationFormXML }>(import.meta.url, "childItemsWidth.xml")
  const xmlMetadata = readAndParseXMLFixture<{ MetaDataObject: FormMetadataXML }>(
    import.meta.url,
    "minimalMetadata.xml"
  )
  const result = importClientApplicationFormFromXML({
    context: mockContextFromXML(),
    xml: xmlData.Form,
    xmlMetadata: xmlMetadata.MetaDataObject,
  })

  expect(result).toEqual(childItemsWidthClientApplicationForm)
})
```

In `toXML.test.ts`, import the same fixture and add:

```ts
it("exports root ChildItemsWidth", () => {
  const expectedResult = readXMLFixtureAsString(import.meta.url, "childItemsWidth.xml")
  const referenceFormXML = readAndParseXMLFixture<{ Form: ClientApplicationFormXML }>(
    import.meta.url,
    "childItemsWidth.xml"
  )
  const referenceMetadataXML = readAndParseXMLFixture<{ MetaDataObject: FormMetadataXML }>(
    import.meta.url,
    "minimalMetadata.xml"
  )
  const referenceForm = importClientApplicationFormFromXML({
    context: mockContextFromXML({ forReference: true }),
    xml: referenceFormXML.Form,
    xmlMetadata: referenceMetadataXML.MetaDataObject,
  })
  const xmlData = exportClientApplicationFormToXML({
    context: mockContextToXML(),
    form: childItemsWidthClientApplicationForm,
    referenceForm,
  })

  const result = xmlExport({ Form: xmlData })

  expect(result).toEqual(expectedResult)
})
```

- [ ] **Step 4: Run the focused tests and verify they fail**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/clientApplicationForm/fromXML.test.ts metadata/forms/clientApplicationForm/toXML.test.ts -t "ChildItemsWidth"
```

Expected: FAIL because `slaveItemsWidth` is not connected to `ChildItemsWidth`.

- [ ] **Step 5: Add the XML mapping**

In `packages/core/metadata/forms/clientApplicationForm/rules.ts`, update `slaveItemsWidth`:

```ts
slaveItemsWidth: {
  yaml: "ШиринаПодчиненныхЭлементов",
  xml: "ChildItemsWidth",
  type: "SystemEnumeration",
  typeSE: "ChildFormItemsWidth",
  tag: FormRulesTags.Form,
  defaultValueYAML: "Auto",
},
```

- [ ] **Step 6: Run the focused tests and verify they pass**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/clientApplicationForm/fromXML.test.ts metadata/forms/clientApplicationForm/toXML.test.ts -t "ChildItemsWidth"
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```bash
git add packages/core/metadata/forms/clientApplicationForm
git commit -m "fix: :bug: сохранить ChildItemsWidth формы"
```

## Task 3: CommandInterface Duplicate Item Order

**Files:**
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/toXML.ts`
- Create: `packages/core/metadata/forms/commonObjects/commandInterface/__fixtures__/duplicateCommandGroupReferenceOrder.xml`
- Create: `packages/core/metadata/forms/commonObjects/commandInterface/__fixtures__/duplicateCommandGroupReferenceOrder.ts`
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/fromXML.test.ts`
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/toXML.test.ts`

- [ ] **Step 1: Add duplicate CommandInterface fixture**

Create `packages/core/metadata/forms/commonObjects/commandInterface/__fixtures__/duplicateCommandGroupReferenceOrder.xml`:

```xml
<CommandInterface>
	<CommandBar>
		<Item>
			<Command>Form.Command.Обновить</Command>
			<Type>Auto</Type>
			<CommandGroup>FormCommandBarImportant</CommandGroup>
			<DefaultVisible>false</DefaultVisible>
		</Item>
		<Item>
			<Command>Form.Command.Обновить</Command>
			<Type>Auto</Type>
			<CommandGroup>FormCommandBarImportant</CommandGroup>
			<DefaultVisible>false</DefaultVisible>
		</Item>
		<Item>
			<Command>Form.Command.Обновить</Command>
			<Type>Auto</Type>
			<CommandGroup>FormCommandBarImportant</CommandGroup>
			<DefaultVisible>false</DefaultVisible>
		</Item>
	</CommandBar>
</CommandInterface>
```

Create `packages/core/metadata/forms/commonObjects/commandInterface/__fixtures__/duplicateCommandGroupReferenceOrder.ts`:

```ts
import { CommandInterface } from "../types"

export const duplicateCommandGroupReferenceOrder: CommandInterface = {
  itemType: "CommandInterface",
  NavigationPanel: [],
  CommandBar: [
    {
      itemType: "CommandInterfaceItem",
      command: "Form.Command.Обновить",
      type: "Auto",
      commandGroup: "FormCommandBarImportant",
      defaultVisible: false,
    },
    {
      itemType: "CommandInterfaceItem",
      command: "Form.Command.Обновить",
      type: "Auto",
      commandGroup: "FormCommandBarImportant",
      defaultVisible: false,
    },
    {
      itemType: "CommandInterfaceItem",
      command: "Form.Command.Обновить",
      type: "Auto",
      commandGroup: "FormCommandBarImportant",
      defaultVisible: false,
    },
  ],
}
```

- [ ] **Step 2: Add import/export tests**

In `fromXML.test.ts`, import `duplicateCommandGroupReferenceOrder` and add:

```ts
it("import duplicateCommandGroupReferenceOrder", () => {
  const xmlData = readAndParseXMLFile<{ CommandInterface: CommandInterfaceXML }>(
    "duplicateCommandGroupReferenceOrder.xml",
    fixturesDir
  )

  const result = importCommandInterfaceFromXML(mockContextFromXML(), mockRule, xmlData.CommandInterface)

  expect(result).toEqual(duplicateCommandGroupReferenceOrder)
})
```

In `toXML.test.ts`, import the fixture and add:

```ts
it("export duplicateCommandGroupReferenceOrder with reference order", () => {
  const expectedResult = readXMLFileAsString("duplicateCommandGroupReferenceOrder.xml", fixturesDir).trimEnd()
  const referenceXML = readAndParseXMLFile<{ CommandInterface: CommandInterfaceXML }>(
    "duplicateCommandGroupReferenceOrder.xml",
    fixturesDir
  )
  const referenceData = importCommandInterfaceFromXML(
    mockContextFromXML({ forReference: true }),
    mockRule,
    referenceXML.CommandInterface
  )
  const xmlData = exportCommandInterfaceToXML(
    mockContext,
    mockRule,
    duplicateCommandGroupReferenceOrder,
    referenceData
  )

  const result = xmlExport({ CommandInterface: xmlData }, false)

  expect(result).toEqual(expectedResult)
})
```

- [ ] **Step 3: Run the focused tests and verify export fails**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/commonObjects/commandInterface -t "duplicateCommandGroupReferenceOrder"
```

Expected: import PASS, export FAIL because fallback order writes `DefaultVisible` before `CommandGroup`.

- [ ] **Step 4: Use the first matching reference item**

In `packages/core/metadata/forms/commonObjects/commandInterface/toXML.ts`, replace `findReferenceCommandInterfaceItem` with:

```ts
const findReferenceCommandInterfaceItem = (
  item: CommandInterfaceItem,
  referenceItems: CommandInterfaceItem[] | undefined
): CommandInterfaceItem | undefined => {
  if (!referenceItems) return undefined

  return referenceItems.find(
    (referenceItem) =>
      referenceItem.command === item.command &&
      referenceItem.commandGroup === item.commandGroup &&
      referenceItem.index === item.index
  )
}
```

- [ ] **Step 5: Run the focused tests and verify they pass**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/commonObjects/commandInterface -t "duplicateCommandGroupReferenceOrder"
```

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```bash
git add packages/core/metadata/forms/commonObjects/commandInterface
git commit -m "fix: :bug: сохранить порядок дублей CommandInterface"
```

## Task 4: Final Verification

**Files:**
- No new files.

- [ ] **Step 1: Generate Langium files in a fresh worktree**

Run:

```bash
pnpm --filter nkdk-language langium:generate
```

Expected: command exits with code 0.

- [ ] **Step 2: Run focused regression tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/elements/__tests__ metadata/forms/clientApplicationForm metadata/forms/commonObjects/commandInterface
```

Expected: PASS.

- [ ] **Step 3: Run full project tests**

Run:

```bash
pnpm test
```

Expected: PASS across all packages.

- [ ] **Step 4: Commit generated files only if they changed**

Run:

```bash
git status --short
```

Expected: no unexpected changes after planned commits. Generated Langium files should not change for this plan; leave the tree clean before handoff.
