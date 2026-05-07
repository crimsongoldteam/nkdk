# CommandInterface Reference Order Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve `CommandInterfaceItem` XML field order from the reference form when exporting forms.

**Architecture:** Keep the change local to `packages/core/metadata/forms/commonObjects/commandInterface`. `fromXML` must retain source key order for reference items, and `toXML` must find the matching reference item by `Command + CommandGroup` inside the same collection before assigning XML fields.

**Tech Stack:** TypeScript, Vitest, existing `CommandInterface` XML helpers, `xmlExport`.

---

## File Structure

- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/fromXML.ts`
  - Preserve XML key insertion order for `CommandInterfaceItem` only when `context.fromXML.forReference === true`.
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/toXML.ts`
  - Add reference matching by `command + commandGroup`.
  - Assign XML fields in reference key order when there is exactly one match.
- Create: `packages/core/metadata/forms/commonObjects/commandInterface/__fixtures__/commandGroupReferenceOrder.xml`
  - Minimal `CommandInterface` XML where `CommandGroup` appears before `Index` and `DefaultVisible`.
- Create: `packages/core/metadata/forms/commonObjects/commandInterface/__fixtures__/commandGroupReferenceOrder.ts`
  - Expected `CommandInterface` model for the new fixture.
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/fromXML.test.ts`
  - Add import coverage for the fixture.
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/toXML.test.ts`
  - Add red/green export tests for reference order and fallback order.

Do not modify generic orchestration or `ClientApplicationForm` sync code. The existing `referenceMetadata` path is sufficient.

### Task 1: Add Reproducer Fixtures

**Files:**
- Create: `packages/core/metadata/forms/commonObjects/commandInterface/__fixtures__/commandGroupReferenceOrder.xml`
- Create: `packages/core/metadata/forms/commonObjects/commandInterface/__fixtures__/commandGroupReferenceOrder.ts`

- [ ] **Step 1: Create the XML fixture**

Create `packages/core/metadata/forms/commonObjects/commandInterface/__fixtures__/commandGroupReferenceOrder.xml`:

```xml
<CommandInterface>
	<CommandBar>
		<Item>
			<Command>CommonCommand.ДополнительныеСведенияКоманднаяПанель</Command>
			<Type>Auto</Type>
			<CommandGroup>FormCommandBarImportant</CommandGroup>
			<DefaultVisible>false</DefaultVisible>
			<Visible>
				<xr:Common>false</xr:Common>
			</Visible>
		</Item>
		<Item>
			<Command>Catalog.ДоговорыКонтрагентов.Command.ДоговорКонтрагентаВводНаОсновании</Command>
			<Type>Auto</Type>
			<CommandGroup>FormCommandBarCreateBasedOn</CommandGroup>
			<Index>1</Index>
			<DefaultVisible>false</DefaultVisible>
			<Visible>
				<xr:Common>false</xr:Common>
			</Visible>
		</Item>
	</CommandBar>
</CommandInterface>
```

- [ ] **Step 2: Create the TS fixture**

Create `packages/core/metadata/forms/commonObjects/commandInterface/__fixtures__/commandGroupReferenceOrder.ts`:

```typescript
import type { CommandInterface } from "../types"

export const commandGroupReferenceOrder = {
  itemType: "CommandInterface",
  NavigationPanel: [],
  CommandBar: [
    {
      command: "CommonCommand.ДополнительныеСведенияКоманднаяПанель",
      type: "Auto",
      commandGroup: "FormCommandBarImportant",
      defaultVisible: false,
      visible: {
        common: false,
        values: [],
      },
      itemType: "CommandInterfaceItem",
    },
    {
      command: "Catalog.ДоговорыКонтрагентов.Command.ДоговорКонтрагентаВводНаОсновании",
      type: "Auto",
      commandGroup: "FormCommandBarCreateBasedOn",
      index: 1,
      defaultVisible: false,
      visible: {
        common: false,
        values: [],
      },
      itemType: "CommandInterfaceItem",
    },
  ],
} as const satisfies CommandInterface
```

### Task 2: Add Failing Tests

**Files:**
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/fromXML.test.ts`
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/toXML.test.ts`

- [ ] **Step 1: Add fixture import to fromXML test**

In `packages/core/metadata/forms/commonObjects/commandInterface/fromXML.test.ts`, add:

```typescript
import { commandGroupReferenceOrder } from "./__fixtures__/commandGroupReferenceOrder"
```

- [ ] **Step 2: Add import test**

Inside `describe("importCommandInterfaceFromXML", () => { ... })`, after `it("import indexedItemOrderSwap", ...)`, add:

```typescript
  it("import commandGroupReferenceOrder", () => {
    const xmlData = readAndParseXMLFile<{ CommandInterface: CommandInterfaceXML }>(
      "commandGroupReferenceOrder.xml",
      fixturesDir
    )

    const result = importCommandInterfaceFromXML(mockContextFromXML(), mockRule, xmlData.CommandInterface)

    expect(result).toEqual(commandGroupReferenceOrder)
  })
```

- [ ] **Step 3: Add fixture import to toXML test**

In `packages/core/metadata/forms/commonObjects/commandInterface/toXML.test.ts`, add:

```typescript
import { commandGroupReferenceOrder } from "./__fixtures__/commandGroupReferenceOrder"
```

- [ ] **Step 4: Add reference-order export test**

Inside `describe("exportCommandInterfaceToXML", () => { ... })`, after `it("export indexedItemOrderSwap", ...)`, add:

```typescript
  it("export commandGroupReferenceOrder with reference order", () => {
    const expectedResult = readXMLFileAsString("commandGroupReferenceOrder.xml", fixturesDir).trimEnd()
    const referenceXML = readAndParseXMLFile<{ CommandInterface: CommandInterfaceXML }>(
      "commandGroupReferenceOrder.xml",
      fixturesDir
    )
    const referenceData = importCommandInterfaceFromXML(
      mockContextFromXML({ forReference: true }),
      mockRule,
      referenceXML.CommandInterface
    )
    const xmlData = exportCommandInterfaceToXML(mockContext, mockRule, commandGroupReferenceOrder, referenceData)

    const result = xmlExport({ CommandInterface: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
```

Also update imports at the top of `toXML.test.ts`:

```typescript
import { mockContext, mockContextFromXML, mockRule } from "~/tests/mockContext"
import { readAndParseXMLFile, readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { importCommandInterfaceFromXML } from "./fromXML"
import { CommandInterfaceXML } from "./types"
```

- [ ] **Step 5: Add fallback export test**

Inside the same `describe`, add:

```typescript
  it("export commandGroupReferenceOrder without reference uses fallback order", () => {
    const xmlData = exportCommandInterfaceToXML(mockContext, mockRule, commandGroupReferenceOrder)

    const result = xmlExport({ CommandInterface: xmlData }, false)

    expect(result).toContain(
      [
        "\t\t\t<Command>Catalog.ДоговорыКонтрагентов.Command.ДоговорКонтрагентаВводНаОсновании</Command>",
        "\t\t\t<Type>Auto</Type>",
        "\t\t\t<Index>1</Index>",
        "\t\t\t<DefaultVisible>false</DefaultVisible>",
        "\t\t\t<CommandGroup>FormCommandBarCreateBasedOn</CommandGroup>",
      ].join("\n")
    )
  })
```

- [ ] **Step 6: Run focused tests and verify the intended failure**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/commonObjects/commandInterface/fromXML.test.ts metadata/forms/commonObjects/commandInterface/toXML.test.ts -t "commandGroupReferenceOrder"
```

Expected: `import commandGroupReferenceOrder` passes, `export commandGroupReferenceOrder without reference uses fallback order` passes, and `export commandGroupReferenceOrder with reference order` fails because current export writes `CommandGroup` after `DefaultVisible`.

### Task 3: Preserve Reference Key Order In fromXML

**Files:**
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/fromXML.ts`

- [ ] **Step 1: Replace fixed item construction with order-aware construction**

In `packages/core/metadata/forms/commonObjects/commandInterface/fromXML.ts`, replace the body of `importCommandInterfaceItemFromXML` with:

```typescript
const importCommandInterfaceItemFromXML = (
  context: ConfigurationContextFromXML,
  item: CommandInterfaceItemXML
): CommandInterfaceItem => {
  const values: Partial<CommandInterfaceItem> = {
    command: item.Command,
    type: item.Type,
    index: item.Index,
    commandGroup: item.CommandGroup,
    defaultVisible: item.DefaultVisible ?? true,
  }

  if (item.Visible) {
    const visible = importUserVisibleFromXML(context, undefined, item.Visible)
    if (visible) {
      values.visible = visible
    }
  }

  const orderedKeys = context.fromXML.forReference
    ? getOrderedCommandInterfaceItemKeysFromXML(item)
    : ["command", "type", "defaultVisible", "index", "commandGroup", "visible"]

  const result = {} as CommandInterfaceItem
  for (const key of orderedKeys) {
    const value = values[key]
    if (value !== undefined) {
      ;(result as Record<string, unknown>)[key] = value
    }
  }
  result.itemType = "CommandInterfaceItem"

  return result
}
```

- [ ] **Step 2: Add local order helper**

In the same file, below `importCommandInterfaceItemFromXML`, add:

```typescript
const commandInterfaceItemXmlToModelKeys = {
  Command: "command",
  Type: "type",
  Index: "index",
  CommandGroup: "commandGroup",
  DefaultVisible: "defaultVisible",
  Visible: "visible",
} as const

const fallbackCommandInterfaceItemKeys = [
  "command",
  "type",
  "index",
  "commandGroup",
  "defaultVisible",
  "visible",
] as const satisfies readonly (keyof CommandInterfaceItem)[]

const getOrderedCommandInterfaceItemKeysFromXML = (item: CommandInterfaceItemXML): (keyof CommandInterfaceItem)[] => {
  const result: (keyof CommandInterfaceItem)[] = []
  const added = new Set<keyof CommandInterfaceItem>()

  for (const xmlKey of Object.keys(item)) {
    const key = commandInterfaceItemXmlToModelKeys[xmlKey as keyof typeof commandInterfaceItemXmlToModelKeys]
    if (key !== undefined && !added.has(key)) {
      result.push(key)
      added.add(key)
    }
  }

  for (const key of fallbackCommandInterfaceItemKeys) {
    if (!added.has(key)) {
      result.push(key)
      added.add(key)
    }
  }

  return result
}
```

- [ ] **Step 3: Fix imports**

Ensure `fromXML.ts` imports `ConfigurationContextFromXML` before it is used and does not have duplicate imports:

```typescript
import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/fromXML"
import { registerTypeRule } from "~/metadata/orchestration"
import { PropertyRule } from "../../elements/calendarField/rules"
import { CommandInterface, CommandInterfaceItem, CommandInterfaceItemXML, CommandInterfaceXML } from "./types"
```

- [ ] **Step 4: Run import test**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/commonObjects/commandInterface/fromXML.test.ts -t "import commandGroupReferenceOrder"
```

Expected: PASS.

### Task 4: Use Reference Order In toXML

**Files:**
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/toXML.ts`

- [ ] **Step 1: Accept reference data in export function**

In `packages/core/metadata/forms/commonObjects/commandInterface/toXML.ts`, update `exportCommandInterfaceToXML` signature:

```typescript
export const exportCommandInterfaceToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule,
  data: CommandInterface | undefined,
  referenceData?: CommandInterface | undefined
): CommandInterfaceXML | undefined => {
```

- [ ] **Step 2: Pass collection-specific reference items**

In `exportCommandInterfaceToXML`, replace both collection exports with:

```typescript
  if (data.NavigationPanel && data.NavigationPanel.length > 0) {
    result.NavigationPanel = {
      Item: exportCommandInterfaceItemsToXML(context, data.NavigationPanel, referenceData?.NavigationPanel),
    }
  }

  if (data.CommandBar && data.CommandBar.length > 0) {
    result.CommandBar = {
      Item: exportCommandInterfaceItemsToXML(context, data.CommandBar, referenceData?.CommandBar),
    }
  }
```

- [ ] **Step 3: Thread reference item into item export**

Replace `exportCommandInterfaceItemsToXML` with:

```typescript
const exportCommandInterfaceItemsToXML = (
  context: ConfigurationContext,
  items: CommandInterfaceItem[],
  referenceItems?: CommandInterfaceItem[] | undefined
): CommandInterfaceItemXML[] => {
  return items.map((item) =>
    exportCommandInterfaceItemToXML(context, item, findReferenceCommandInterfaceItem(item, referenceItems))
  )
}
```

- [ ] **Step 4: Use ordered XML assignment**

Replace `exportCommandInterfaceItemToXML` with:

```typescript
const exportCommandInterfaceItemToXML = (
  context: ConfigurationContext,
  item: CommandInterfaceItem,
  referenceItem?: CommandInterfaceItem | undefined
): CommandInterfaceItemXML => {
  const values: Partial<CommandInterfaceItemXML> = {
    Command: item.command,
    Type: item.type ?? "Auto",
    Index: item.index,
    DefaultVisible: item.defaultVisible,
    CommandGroup: item.commandGroup,
  }

  if (item.visible) {
    const visibleXML = exportUserVisibleToXML(
      context,
      { type: "UserVisible", yaml: "РазрешитьИспользование", yamlDeny: "ЗапретитьИспользование" },
      item.visible
    )
    if (visibleXML) {
      values.Visible = visibleXML
    }
  }

  const orderedKeys = getOrderedCommandInterfaceItemXMLKeys(referenceItem)
  const result = {} as CommandInterfaceItemXML
  for (const key of orderedKeys) {
    const value = values[key]
    if (value !== undefined) {
      ;(result as Record<string, unknown>)[key] = value
    }
  }

  return result
}
```

- [ ] **Step 5: Add reference matcher and order helper**

Below `exportCommandInterfaceItemToXML`, add:

```typescript
const commandInterfaceItemModelToXmlKeys = {
  command: "Command",
  type: "Type",
  index: "Index",
  commandGroup: "CommandGroup",
  defaultVisible: "DefaultVisible",
  visible: "Visible",
} as const

const fallbackCommandInterfaceItemXMLKeys = [
  "Command",
  "Type",
  "Index",
  "DefaultVisible",
  "CommandGroup",
  "Visible",
] as const satisfies readonly (keyof CommandInterfaceItemXML)[]

const findReferenceCommandInterfaceItem = (
  item: CommandInterfaceItem,
  referenceItems: CommandInterfaceItem[] | undefined
): CommandInterfaceItem | undefined => {
  if (!referenceItems) return undefined

  const matches = referenceItems.filter(
    (referenceItem) => referenceItem.command === item.command && referenceItem.commandGroup === item.commandGroup
  )

  return matches.length === 1 ? matches[0] : undefined
}

const getOrderedCommandInterfaceItemXMLKeys = (
  referenceItem: CommandInterfaceItem | undefined
): (keyof CommandInterfaceItemXML)[] => {
  if (!referenceItem) return [...fallbackCommandInterfaceItemXMLKeys]

  const result: (keyof CommandInterfaceItemXML)[] = []
  const added = new Set<keyof CommandInterfaceItemXML>()

  for (const modelKey of Object.keys(referenceItem)) {
    const xmlKey = commandInterfaceItemModelToXmlKeys[modelKey as keyof typeof commandInterfaceItemModelToXmlKeys]
    if (xmlKey !== undefined && !added.has(xmlKey)) {
      result.push(xmlKey)
      added.add(xmlKey)
    }
  }

  for (const xmlKey of fallbackCommandInterfaceItemXMLKeys) {
    if (!added.has(xmlKey)) {
      result.push(xmlKey)
      added.add(xmlKey)
    }
  }

  return result
}
```

- [ ] **Step 6: Run reference-order export test**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/commonObjects/commandInterface/toXML.test.ts -t "export commandGroupReferenceOrder with reference order"
```

Expected: PASS.

- [ ] **Step 7: Run fallback export test**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/commonObjects/commandInterface/toXML.test.ts -t "export commandGroupReferenceOrder without reference uses fallback order"
```

Expected: PASS.

### Task 5: Verify Existing CommandInterface Behavior

**Files:**
- Test: `packages/core/metadata/forms/commonObjects/commandInterface/fromXML.test.ts`
- Test: `packages/core/metadata/forms/commonObjects/commandInterface/toXML.test.ts`

- [ ] **Step 1: Run all CommandInterface XML tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/commonObjects/commandInterface/fromXML.test.ts metadata/forms/commonObjects/commandInterface/toXML.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run focused round-trip reproducer command**

Run:

```bash
./.agents/skills/round-trip-xml/round-trip.sh
```

Expected: the first diff no longer reports `Catalogs/СоглашенияСПоставщиками/Forms/ФормаСписка/Ext/Form.xml` with `CommandGroup` moving after `DefaultVisible`. The command may still report other diffs.

- [ ] **Step 3: Commit implementation**

Use this commit message:

```bash
git add packages/core/metadata/forms/commonObjects/commandInterface docs/superpowers/plans/2026-05-07-command-interface-reference-order.md
git commit -m "fix: :bug: сохранить reference-порядок CommandInterface"
```

## Self-Review

- Spec coverage: the plan uses existing `referenceMetadata`, searches by `Command + CommandGroup` within the same collection, preserves fallback order without reference, and keeps the change local to `commandInterface`.
- Placeholder scan: no placeholder tasks remain; every code-changing step includes exact code.
- Type consistency: helper names and type names match the existing `CommandInterface`, `CommandInterfaceItem`, and `CommandInterfaceItemXML` types.
