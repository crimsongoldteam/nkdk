# CommandInterface Attribute DataPath Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve `CommandInterface.Item.Attribute` as a `DataPath` in XML, TS model, and YAML.

**Architecture:** Extend the existing hand-written `CommandInterface` import/export module. Keep reference-order logic intact by adding `Attribute` to the XML-model key maps and fallback order.

**Tech Stack:** TypeScript, Vitest, existing command interface fixtures, existing `DataPath` type aliases.

---

## File Structure

- Modify `packages/core/metadata/forms/commonObjects/commandInterface/types.ts`: add `attribute?: DataPath`, `Attribute?: DataPathXML`, and `Реквизит`.
- Modify `packages/core/metadata/forms/commonObjects/commandInterface/fromXML.ts`: import XML `Attribute` into model `attribute` and include it in ordering maps.
- Modify `packages/core/metadata/forms/commonObjects/commandInterface/toXML.ts`: export model `attribute` into XML `Attribute` and place it after `Type` in fallback order.
- Modify `packages/core/metadata/forms/commonObjects/commandInterface/fromYAML.ts`: import `Реквизит`.
- Modify `packages/core/metadata/forms/commonObjects/commandInterface/toYAML.ts`: export `Реквизит`.
- Modify `packages/core/metadata/forms/commonObjects/commandInterface/__fixtures__/full.xml`: add `Attribute` to one navigation item.
- Modify `packages/core/metadata/forms/commonObjects/commandInterface/__fixtures__/full.ts`: add `attribute` and `Реквизит` to the matching TS/YAML fixtures.
- Modify `packages/core/metadata/forms/commonObjects/commandInterface/toXML.test.ts`: extend fallback-order assertion.

## Task 1: Extend Fixtures First

**Files:**
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/__fixtures__/full.xml`
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/__fixtures__/full.ts`

- [ ] **Step 1: Add Attribute to full XML**

In `packages/core/metadata/forms/commonObjects/commandInterface/__fixtures__/full.xml`, update the fourth `NavigationPanel` item:

```xml
		<Item>
			<Command>InformationRegister.РегистрСведенийКомандныйИнтерфейс1.StandardCommand.OpenByValue.Измерение1</Command>
			<Type>Auto</Type>
			<Attribute>Объект.Ref</Attribute>
			<CommandGroup>FormNavigationPanelGoTo</CommandGroup>
		</Item>
```

- [ ] **Step 2: Add attribute to the TS model fixture**

In `packages/core/metadata/forms/commonObjects/commandInterface/__fixtures__/full.ts`, update the matching fourth `NavigationPanel` item:

```ts
    {
      command: "InformationRegister.РегистрСведенийКомандныйИнтерфейс1.StandardCommand.OpenByValue.Измерение1",
      type: "Auto",
      attribute: "Объект.Ref",
      commandGroup: "FormNavigationPanelGoTo",
      itemType: "CommandInterfaceItem",
    },
```

- [ ] **Step 3: Add Реквизит to the YAML fixture**

In the matching fourth `ПанельНавигации` item inside `fullCommandInterfaceYAML`, use this shape:

```ts
    {
      Команда: "InformationRegister.РегистрСведенийКомандныйИнтерфейс1.StandardCommand.OpenByValue.Измерение1",
      Тип: "Auto",
      Реквизит: "Объект.Ref",
      ГруппаКоманд: "ПанельНавигацииФормыПерейти",
    },
```

- [ ] **Step 4: Run existing full fixture tests and confirm the failure**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/forms/commonObjects/commandInterface/fromXML.test.ts packages/core/metadata/forms/commonObjects/commandInterface/toXML.test.ts packages/core/metadata/forms/commonObjects/commandInterface/fromYAML.test.ts packages/core/metadata/forms/commonObjects/commandInterface/toYAML.test.ts -t "full command interface"
```

Expected: FAIL because `Attribute` and `Реквизит` are not part of the model yet.

## Task 2: Add Types And XML Import

**Files:**
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/types.ts`
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/fromXML.ts`

- [ ] **Step 1: Extend command interface types**

In `packages/core/metadata/forms/commonObjects/commandInterface/types.ts`, add:

```ts
import { DataPath, DataPathXML, DataPathYAML } from "~/metadata/forms/commonObjects/dataPath/types"
```

Update `CommandInterfaceItem`:

```ts
  attribute?: DataPath
```

Update `CommandInterfaceItemXML`:

```ts
  Attribute?: DataPathXML
```

Update `CommandInterfaceItemJSONSchema`:

```ts
  Реквизит: Type.Optional(Type.String()),
```

If the inferred `CommandInterfaceItemYAML` type does not preserve the alias, replace it with this exported type after the schema declaration:

```ts
export type CommandInterfaceItemYAML = Static<typeof CommandInterfaceItemJSONSchema> & {
  Реквизит?: DataPathYAML
}
```

- [ ] **Step 2: Import XML Attribute**

In `packages/core/metadata/forms/commonObjects/commandInterface/fromXML.ts`, update `values`:

```ts
  const values: Partial<CommandInterfaceItem> = {
    command: String(item.Command),
    type: item.Type,
    attribute: item.Attribute,
    index: importNumberFromXML(context, undefined, item.Index),
    commandGroup: item.CommandGroup,
  }
```

Add the key mapping:

```ts
  Attribute: "attribute",
```

Update `nonReferenceCommandInterfaceItemKeys`:

```ts
const nonReferenceCommandInterfaceItemKeys = [
  "command",
  "type",
  "attribute",
  "defaultVisible",
  "index",
  "commandGroup",
  "visible",
] as const satisfies readonly (keyof CommandInterfaceItem)[]
```

Update `fallbackCommandInterfaceItemKeys`:

```ts
const fallbackCommandInterfaceItemKeys = [
  "command",
  "type",
  "attribute",
  "index",
  "commandGroup",
  "defaultVisible",
  "visible",
] as const satisfies readonly (keyof CommandInterfaceItem)[]
```

- [ ] **Step 3: Run XML import test**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/forms/commonObjects/commandInterface/fromXML.test.ts -t "full command interface"
```

Expected: PASS.

- [ ] **Step 4: Commit XML import slice**

```bash
git add packages/core/metadata/forms/commonObjects/commandInterface/types.ts packages/core/metadata/forms/commonObjects/commandInterface/fromXML.ts packages/core/metadata/forms/commonObjects/commandInterface/__fixtures__/full.xml packages/core/metadata/forms/commonObjects/commandInterface/__fixtures__/full.ts
git commit -m "feat: :sparkles: добавить Attribute в CommandInterface"
```

## Task 3: Add XML Export And Fallback Order

**Files:**
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/toXML.ts`
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/toXML.test.ts`

- [ ] **Step 1: Export Attribute to XML**

In `packages/core/metadata/forms/commonObjects/commandInterface/toXML.ts`, update `values`:

```ts
  const values: Partial<CommandInterfaceItemXML> = {
    Command: item.command,
    Type: item.type ?? "Auto",
    Attribute: item.attribute,
    Index: item.index,
    DefaultVisible: item.defaultVisible,
    CommandGroup: item.commandGroup,
  }
```

Add the model-to-XML mapping:

```ts
  attribute: "Attribute",
```

Update fallback order:

```ts
const fallbackCommandInterfaceItemXMLKeys = [
  "Command",
  "Type",
  "Attribute",
  "Index",
  "DefaultVisible",
  "CommandGroup",
  "Visible",
] as const satisfies readonly (keyof CommandInterfaceItemXML)[]
```

- [ ] **Step 2: Extend fallback-order test**

In `packages/core/metadata/forms/commonObjects/commandInterface/toXML.test.ts`, add `attribute` to the in-memory fixture used by `export commandGroupReferenceOrder without reference uses fallback order`, or create a local value in that test:

```ts
    const data = {
      ...commandGroupReferenceOrder,
      CommandBar: commandGroupReferenceOrder.CommandBar.map((item, index) =>
        index === 0 ? { ...item, attribute: "Объект.Ref" } : item
      ),
    }
    const xmlData = exportCommandInterfaceToXML(mockContext, mockRule, data)
```

Update the expected fragment:

```ts
    expect(result).toContain(
      [
        "\t\t\t<Command>Catalog.ДоговорыКонтрагентов.Command.ДоговорКонтрагентаВводНаОсновании</Command>",
        "\t\t\t<Type>Auto</Type>",
        "\t\t\t<Attribute>Объект.Ref</Attribute>",
        "\t\t\t<Index>1</Index>",
        "\t\t\t<DefaultVisible>false</DefaultVisible>",
        "\t\t\t<CommandGroup>FormCommandBarCreateBasedOn</CommandGroup>",
      ].join("\n")
    )
```

- [ ] **Step 3: Run XML export tests**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/forms/commonObjects/commandInterface/toXML.test.ts
```

Expected: PASS, including full fixture export and fallback order.

- [ ] **Step 4: Commit XML export slice**

```bash
git add packages/core/metadata/forms/commonObjects/commandInterface/toXML.ts packages/core/metadata/forms/commonObjects/commandInterface/toXML.test.ts
git commit -m "fix: :bug: сохранять Attribute в XML CommandInterface"
```

## Task 4: Add YAML Import And Export

**Files:**
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/fromYAML.ts`
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/toYAML.ts`

- [ ] **Step 1: Import YAML Реквизит**

In `packages/core/metadata/forms/commonObjects/commandInterface/fromYAML.ts`, update the initial result:

```ts
  const result: CommandInterfaceItem = {
    command: item.Команда,
    type: item.Тип,
    attribute: item.Реквизит,
    itemType: "CommandInterfaceItem",
  }
```

- [ ] **Step 2: Export YAML Реквизит in the right order**

In `packages/core/metadata/forms/commonObjects/commandInterface/toYAML.ts`, start with:

```ts
  const result: CommandInterfaceItemYAML = {
    Команда: item.command,
    Тип: item.type,
  }

  if (item.attribute !== undefined) {
    result.Реквизит = item.attribute
  }
```

Keep `Индекс`, `ГруппаКоманд`, `Автовидимость`, and visibility fields after this block.

- [ ] **Step 3: Run YAML tests**

Run:

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/forms/commonObjects/commandInterface/fromYAML.test.ts packages/core/metadata/forms/commonObjects/commandInterface/toYAML.test.ts -t "full command interface"
```

Expected: PASS.

- [ ] **Step 4: Commit YAML slice**

```bash
git add packages/core/metadata/forms/commonObjects/commandInterface/fromYAML.ts packages/core/metadata/forms/commonObjects/commandInterface/toYAML.ts
git commit -m "fix: :bug: сохранять Реквизит в YAML CommandInterface"
```

## Task 5: Verification

**Files:**
- No file changes.

- [ ] **Step 1: Run all command interface tests**

```bash
pnpm --filter @nakidka/core test -- packages/core/metadata/forms/commonObjects/commandInterface
```

Expected: all command interface tests PASS.

- [ ] **Step 2: Run the full test suite**

```bash
pnpm --filter nkdk-language langium:generate
pnpm test
```

Expected: all package test suites PASS.

