# Form Round-Trip Order And AutoCellHeight Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve two remaining form XML round-trip cases: duplicate auto `CommandInterface` item order and explicit `AutoCellHeight` on regular form fields.

**Architecture:** Keep `CommandInterface` changes local to its manual XML exporter by refining reference item lookup to include `index`. Move `autoCellHeight` into shared form field rules so ordinary `InputField` and `LabelField` imports can keep the XML node and exports can write it back through the existing reference-aware element test path.

**Tech Stack:** TypeScript, Vitest, existing metadata rules, form element fixture matrix, `xmlExport`.

---

## File Structure

- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/toXML.ts`
  - Match reference items by `command + commandGroup + index`.
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/fromXML.ts`
  - Normalize XML `Command` to a string because `<Command>0</Command>` can be parsed as number `0`.
- Create: `packages/core/metadata/forms/commonObjects/commandInterface/__fixtures__/duplicateAutoCommandOrder.xml`
  - Minimal reference XML with two duplicate auto navigation items.
- Create: `packages/core/metadata/forms/commonObjects/commandInterface/__fixtures__/duplicateAutoCommandOrder.ts`
  - Expected `CommandInterface` model for the XML fixture.
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/fromXML.test.ts`
  - Add import coverage for `duplicateAutoCommandOrder`.
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/toXML.test.ts`
  - Add export coverage with reference data for `duplicateAutoCommandOrder`.
- Modify: `packages/core/metadata/forms/elements/formField/rules.ts`
  - Move `autoCellHeight` from table-related properties to common properties.
- Create: `packages/core/metadata/forms/elements/inputField/__fixtures__/autoCellHeight.ts`
  - Expected regular `InputField` model with `autoCellHeight: true`.
- Create: `packages/core/metadata/forms/elements/inputField/__fixtures__/autoCellHeight.xml`
  - Regular `InputField` XML containing `<AutoCellHeight>true</AutoCellHeight>`.
- Create: `packages/core/metadata/forms/elements/labelField/__fixtures__/autoCellHeight.ts`
  - Expected regular `LabelField` model with `autoCellHeight: true`.
- Create: `packages/core/metadata/forms/elements/labelField/__fixtures__/autoCellHeight.xml`
  - Regular `LabelField` XML containing `<AutoCellHeight>true</AutoCellHeight>`.
- Modify: `packages/core/metadata/forms/elements/__tests__/fixtures.ts`
  - Register both new element fixtures in `ElementFixtures`.

## Task 1: Add CommandInterface Duplicate Reproducer

**Files:**
- Create: `packages/core/metadata/forms/commonObjects/commandInterface/__fixtures__/duplicateAutoCommandOrder.xml`
- Create: `packages/core/metadata/forms/commonObjects/commandInterface/__fixtures__/duplicateAutoCommandOrder.ts`
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/fromXML.test.ts`
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/toXML.test.ts`
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/fromXML.ts`

- [ ] **Step 1: Create the XML fixture**

Create `packages/core/metadata/forms/commonObjects/commandInterface/__fixtures__/duplicateAutoCommandOrder.xml`:

```xml
<CommandInterface>
	<NavigationPanel>
		<Item>
			<Command>0</Command>
			<Type>Auto</Type>
			<CommandGroup>FormNavigationPanelGoTo</CommandGroup>
			<DefaultVisible>false</DefaultVisible>
			<Visible>
				<xr:Common>false</xr:Common>
			</Visible>
		</Item>
		<Item>
			<Command>0</Command>
			<Type>Auto</Type>
			<CommandGroup>FormNavigationPanelGoTo</CommandGroup>
			<Index>1</Index>
			<DefaultVisible>false</DefaultVisible>
			<Visible>
				<xr:Common>false</xr:Common>
			</Visible>
		</Item>
	</NavigationPanel>
</CommandInterface>
```

- [ ] **Step 2: Create the TS fixture**

Create `packages/core/metadata/forms/commonObjects/commandInterface/__fixtures__/duplicateAutoCommandOrder.ts`:

```typescript
import type { CommandInterface } from "../types"

export const duplicateAutoCommandOrder = {
  itemType: "CommandInterface",
  NavigationPanel: [
    {
      command: "0",
      type: "Auto",
      commandGroup: "FormNavigationPanelGoTo",
      defaultVisible: false,
      visible: {
        common: false,
        values: [],
      },
      itemType: "CommandInterfaceItem",
    },
    {
      command: "0",
      type: "Auto",
      commandGroup: "FormNavigationPanelGoTo",
      index: 1,
      defaultVisible: false,
      visible: {
        common: false,
        values: [],
      },
      itemType: "CommandInterfaceItem",
    },
  ],
  CommandBar: [],
} as const satisfies CommandInterface
```

- [ ] **Step 3: Normalize XML Command values**

In `packages/core/metadata/forms/commonObjects/commandInterface/fromXML.ts`, normalize `Command`:

```typescript
  const values: Partial<CommandInterfaceItem> = {
    command: String(item.Command),
    type: item.Type,
    index: item.Index,
    commandGroup: item.CommandGroup,
    defaultVisible: item.DefaultVisible ?? true,
  }
```

- [ ] **Step 4: Add the fromXML test import**

In `packages/core/metadata/forms/commonObjects/commandInterface/fromXML.test.ts`, add:

```typescript
import { duplicateAutoCommandOrder } from "./__fixtures__/duplicateAutoCommandOrder"
```

- [ ] **Step 5: Add the import test**

Inside `describe("importCommandInterfaceFromXML", () => { ... })`, add:

```typescript
  it("import duplicateAutoCommandOrder", () => {
    const xmlData = readAndParseXMLFile<{ CommandInterface: CommandInterfaceXML }>(
      "duplicateAutoCommandOrder.xml",
      fixturesDir
    )

    const result = importCommandInterfaceFromXML(mockContextFromXML(), mockRule, xmlData.CommandInterface)

    expect(result).toEqual(duplicateAutoCommandOrder)
  })
```

- [ ] **Step 6: Add the toXML test import**

In `packages/core/metadata/forms/commonObjects/commandInterface/toXML.test.ts`, add:

```typescript
import { duplicateAutoCommandOrder } from "./__fixtures__/duplicateAutoCommandOrder"
```

- [ ] **Step 7: Add the export test**

Inside `describe("exportCommandInterfaceToXML", () => { ... })`, add:

```typescript
  it("export duplicateAutoCommandOrder with reference order", () => {
    const expectedResult = readXMLFileAsString("duplicateAutoCommandOrder.xml", fixturesDir).trimEnd()
    const referenceXML = readAndParseXMLFile<{ CommandInterface: CommandInterfaceXML }>(
      "duplicateAutoCommandOrder.xml",
      fixturesDir
    )
    const referenceData = importCommandInterfaceFromXML(
      mockContextFromXML({ forReference: true }),
      mockRule,
      referenceXML.CommandInterface
    )
    const xmlData = exportCommandInterfaceToXML(mockContext, mockRule, duplicateAutoCommandOrder, referenceData)

    const result = xmlExport({ CommandInterface: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
```

- [ ] **Step 8: Run the focused CommandInterface test and verify failure**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/commonObjects/commandInterface/fromXML.test.ts metadata/forms/commonObjects/commandInterface/toXML.test.ts -t "duplicateAutoCommandOrder"
```

Expected before implementation: import passes; export fails because `CommandGroup` is emitted after `DefaultVisible`.

## Task 2: Fix CommandInterface Reference Matching

**Files:**
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/toXML.ts`

- [ ] **Step 1: Replace the reference matcher**

In `packages/core/metadata/forms/commonObjects/commandInterface/toXML.ts`, replace `findReferenceCommandInterfaceItem` with:

```typescript
const findReferenceCommandInterfaceItem = (
  item: CommandInterfaceItem,
  referenceItems: CommandInterfaceItem[] | undefined
): CommandInterfaceItem | undefined => {
  if (!referenceItems) return undefined

  const matches = referenceItems.filter(
    (referenceItem) =>
      referenceItem.command === item.command &&
      referenceItem.commandGroup === item.commandGroup &&
      referenceItem.index === item.index
  )

  return matches.length === 1 ? matches[0] : undefined
}
```

This keeps `undefined` strict: an item without `index` only matches a reference item without `index`.

- [ ] **Step 2: Run focused CommandInterface tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/commonObjects/commandInterface/fromXML.test.ts metadata/forms/commonObjects/commandInterface/toXML.test.ts -t "duplicateAutoCommandOrder|commandGroupReferenceOrder|indexedItemOrderSwap"
```

Expected: all selected tests pass.

- [ ] **Step 3: Commit the CommandInterface change**

```bash
git add packages/core/metadata/forms/commonObjects/commandInterface/toXML.ts \
  packages/core/metadata/forms/commonObjects/commandInterface/fromXML.ts \
  packages/core/metadata/forms/commonObjects/commandInterface/fromXML.test.ts \
  packages/core/metadata/forms/commonObjects/commandInterface/toXML.test.ts \
  packages/core/metadata/forms/commonObjects/commandInterface/__fixtures__/duplicateAutoCommandOrder.xml \
  packages/core/metadata/forms/commonObjects/commandInterface/__fixtures__/duplicateAutoCommandOrder.ts
git commit -m "fix: :bug: сохранить порядок duplicate CommandInterface"
```

## Task 3: Add AutoCellHeight Element Reproducers

**Files:**
- Create: `packages/core/metadata/forms/elements/inputField/__fixtures__/autoCellHeight.xml`
- Create: `packages/core/metadata/forms/elements/inputField/__fixtures__/autoCellHeight.ts`
- Create: `packages/core/metadata/forms/elements/labelField/__fixtures__/autoCellHeight.xml`
- Create: `packages/core/metadata/forms/elements/labelField/__fixtures__/autoCellHeight.ts`
- Modify: `packages/core/metadata/forms/elements/__tests__/fixtures.ts`

- [ ] **Step 1: Create the InputField XML fixture**

Create `packages/core/metadata/forms/elements/inputField/__fixtures__/autoCellHeight.xml`:

```xml
<InputField name="ПолеАвтоВысотаЯчейки" id="1">
	<AutoCellHeight>true</AutoCellHeight>
	<ContextMenu name="ПолеАвтоВысотаЯчейкиКонтекстноеМеню" id="2"/>
	<ExtendedTooltip name="ПолеАвтоВысотаЯчейкиРасширеннаяПодсказка" id="3"/>
</InputField>
```

- [ ] **Step 2: Create the InputField TS fixture**

Create `packages/core/metadata/forms/elements/inputField/__fixtures__/autoCellHeight.ts`:

```typescript
import type { InputField } from "../types"

export const autoCellHeightInputField = {
  itemType: "InputField",
  name: "ПолеАвтоВысотаЯчейки",
  autoCellHeight: true,
} as const satisfies InputField
```

- [ ] **Step 3: Create the LabelField XML fixture**

Create `packages/core/metadata/forms/elements/labelField/__fixtures__/autoCellHeight.xml`:

```xml
<LabelField name="НадписьАвтоВысотаЯчейки" id="1">
	<AutoCellHeight>true</AutoCellHeight>
	<ContextMenu name="НадписьАвтоВысотаЯчейкиКонтекстноеМеню" id="2"/>
	<ExtendedTooltip name="НадписьАвтоВысотаЯчейкиРасширеннаяПодсказка" id="3"/>
</LabelField>
```

- [ ] **Step 4: Create the LabelField TS fixture**

Create `packages/core/metadata/forms/elements/labelField/__fixtures__/autoCellHeight.ts`:

```typescript
import type { LabelField } from "../types"

export const autoCellHeightLabelField = {
  itemType: "LabelField",
  name: "НадписьАвтоВысотаЯчейки",
  autoCellHeight: true,
} as const satisfies LabelField
```

- [ ] **Step 5: Import the new fixtures**

In `packages/core/metadata/forms/elements/__tests__/fixtures.ts`, add imports near the existing input and label imports:

```typescript
import { autoCellHeightInputField } from "../inputField/__fixtures__/autoCellHeight"
import { autoCellHeightLabelField } from "../labelField/__fixtures__/autoCellHeight"
```

- [ ] **Step 6: Register the InputField fixture**

Inside the `//#region InputField` block in `packages/core/metadata/forms/elements/__tests__/fixtures.ts`, add:

```typescript
  {
    group: "InputField",
    name: "autoCellHeight InputField",
    element: InputField,
    xml: "autoCellHeight.xml",
    xmlFolder: undefined,
    model: autoCellHeightInputField,
    yaml: { АвтоВысотаЯчейки: "Истина" },
    enterprise: undefined,
  },
```

- [ ] **Step 7: Register the LabelField fixture**

Inside the `//#region LabelField` block in `packages/core/metadata/forms/elements/__tests__/fixtures.ts`, add:

```typescript
  {
    group: "LabelField",
    name: "autoCellHeight LabelField",
    element: LabelField,
    xml: "autoCellHeight.xml",
    xmlFolder: undefined,
    model: autoCellHeightLabelField,
    yaml: { АвтоВысотаЯчейки: "Истина" },
    enterprise: undefined,
  },
```

- [ ] **Step 8: Run the focused element tests and verify failure**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/elements/__tests__/fromXML.test.ts metadata/forms/elements/__tests__/toXML.test.ts -t "autoCellHeight"
```

Expected before implementation: import and export tests fail because `autoCellHeight` is not part of regular `InputField` / `LabelField` rules.

## Task 4: Move AutoCellHeight To Common Form Field Rules

**Files:**
- Modify: `packages/core/metadata/forms/elements/formField/rules.ts`

- [ ] **Step 1: Remove `autoCellHeight` from table-related properties**

In `packages/core/metadata/forms/elements/formField/rules.ts`, remove this property from `formFieldTableRelatedProperties`:

```typescript
  autoCellHeight: {
    yaml: "АвтоВысотаЯчейки",
    type: "boolean",
    defaultValueYAML: true,
  },
```

- [ ] **Step 2: Add `autoCellHeight` to common properties**

In the same file, add the property to `formFieldCommonProperties` near `cellHyperlink`:

```typescript
  cellHyperlink: { yaml: "ГиперссылкаЯчейки", type: "boolean", defaultValueYAML: false },
  autoCellHeight: {
    yaml: "АвтоВысотаЯчейки",
    type: "boolean",
    defaultValueYAML: true,
  },
  horizontalAlign: {
```

- [ ] **Step 3: Run focused element tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/elements/__tests__/fromXML.test.ts metadata/forms/elements/__tests__/toXML.test.ts -t "autoCellHeight|TableInputField|TableLabelField"
```

Expected: selected tests pass. Existing table variants still import/export `autoCellHeight`.

- [ ] **Step 4: Run YAML focused tests for the new fixtures**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/elements/__tests__/fromYAML.test.ts metadata/forms/elements/__tests__/toYAML.test.ts -t "autoCellHeight"
```

Expected: selected YAML tests pass with `АвтоВысотаЯчейки: "Истина"` as the partial YAML expectation.

- [ ] **Step 5: Commit the AutoCellHeight change**

```bash
git add packages/core/metadata/forms/elements/formField/rules.ts \
  packages/core/metadata/forms/elements/__tests__/fixtures.ts \
  packages/core/metadata/forms/elements/inputField/__fixtures__/autoCellHeight.xml \
  packages/core/metadata/forms/elements/inputField/__fixtures__/autoCellHeight.ts \
  packages/core/metadata/forms/elements/labelField/__fixtures__/autoCellHeight.xml \
  packages/core/metadata/forms/elements/labelField/__fixtures__/autoCellHeight.ts
git commit -m "fix: :bug: сохранить AutoCellHeight полей формы"
```

## Task 5: Run Final Focused Verification

**Files:**
- No file changes.

- [ ] **Step 1: Run combined focused verification**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/commonObjects/commandInterface/fromXML.test.ts metadata/forms/commonObjects/commandInterface/toXML.test.ts metadata/forms/elements/__tests__/fromXML.test.ts metadata/forms/elements/__tests__/toXML.test.ts -t "duplicateAutoCommandOrder|commandGroupReferenceOrder|indexedItemOrderSwap|autoCellHeight"
```

Expected: all selected tests pass.

- [ ] **Step 2: Run full package test if the session owner asks for final verification**

Run only when full verification is requested:

```bash
pnpm --filter '@nakidka/core' test
```

Expected: `@nakidka/core` tests pass. Full root `pnpm test` is left to the user unless they explicitly ask to run it.
