# CommandInterface Index Field Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add explicit `index` support to `CommandInterfaceItem` so XML/YAML preserve `<Index>` only when it is present in the model.

**Architecture:** Treat `Index` as an optional value carried by the model, not as a value derived from array position. Keep the current `fromXML` sorting behavior unchanged; this plan only adds field preservation across XML and YAML.

**Tech Stack:** TypeScript, TypeBox JSON schemas, Vitest, existing `commandInterface` XML/YAML helpers.

---

## File Structure

- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/types.ts`
  - Add `index?: number` to `CommandInterfaceItem`.
  - Add optional YAML field `Индекс`.
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/fromXML.ts`
  - Read `CommandInterfaceItemXML.Index` into `CommandInterfaceItem.index`.
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/toXML.ts`
  - Stop deriving `Index` from array position.
  - Export `Index` only when `item.index !== undefined`.
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/fromYAML.ts`
  - Read `Индекс` into `index`.
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/toYAML.ts`
  - Export `Индекс` only when `item.index !== undefined`.
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/__fixtures__/full.ts`
  - Add `index` to TS fixture where `full.xml` has `<Index>`.
  - Add `Индекс` to YAML fixture.
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/__fixtures__/commandBarIndexInsertion.ts`
  - Leave without `index`; this verifies absent XML index remains absent in the model.
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/fromXML.test.ts`
  - Existing tests should assert updated fixtures.
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/toXML.test.ts`
  - Existing `export commandBarIndexInsertion` should become green.
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/fromYAML.test.ts`
  - Existing full YAML import should assert `index`.
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/toYAML.test.ts`
  - Existing full YAML export should assert `Индекс`.

Do not change the `fromXML` sorting algorithm in this plan. Do not infer `index` from array position, `CommandGroup`, or XML physical order.

Before running tests in a fresh worktree, ensure Langium files exist:

```bash
pnpm --filter nkdk-language langium:generate
```

Expected: `Langium generator finished successfully`.

### Task 1: Add Index To Types And Fixtures

**Files:**
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/types.ts`
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/__fixtures__/full.ts`
- Inspect: `packages/core/metadata/forms/commonObjects/commandInterface/__fixtures__/full.xml`
- Inspect: `packages/core/metadata/forms/commonObjects/commandInterface/__fixtures__/commandBarIndexInsertion.ts`

- [ ] **Step 1: Write the type changes**

In `packages/core/metadata/forms/commonObjects/commandInterface/types.ts`, add `index?: number` to `CommandInterfaceItem` immediately after `type?: string`:

```typescript
export interface CommandInterfaceItem extends MetadataItem {
  itemType: "CommandInterfaceItem"
  command: string
  type?: string
  index?: number
  commandGroup?: SE.StandardCommandsGroup
  defaultVisible: boolean
  visible?: UserVisible
}
```

In the same file, add optional `Индекс` to `CommandInterfaceItemJSONSchema` immediately after `Тип`:

```typescript
export const CommandInterfaceItemJSONSchema = Type.Object({
  Команда: Type.String(),
  Тип: Type.Optional(Type.String()),
  Индекс: Type.Optional(Type.Number()),
  ГруппаКоманд: Type.Optional(Type.Union(standardCommandsGroups)),
  Автовидимость: BooleanJSONSchema,
  РазрешитьИспользование: Type.Optional(UserVisibleJSONSchema),
  ЗапретитьИспользование: Type.Optional(UserVisibleJSONSchema),
})
```

- [ ] **Step 2: Update `fullCommandInterface` fixture with XML indexes**

In `packages/core/metadata/forms/commonObjects/commandInterface/__fixtures__/full.ts`, add `index` to each object that corresponds to an `<Index>` in `full.xml`.

The `NavigationPanel` entries must become:

```typescript
  NavigationPanel: [
    {
      command: "Catalog.ПодчиненныйСправочник.StandardCommand.OpenByValue",
      type: "Auto",
      index: 0,
      commandGroup: "FormNavigationPanelGoTo",
      defaultVisible: true,
      itemType: "CommandInterfaceItem",
    },
    {
      command: "Catalog.ПримерСправочник.Command.КомандаСправочник2",
      type: "Auto",
      index: 1,
      commandGroup: "FormNavigationPanelGoTo",
      defaultVisible: false,
      itemType: "CommandInterfaceItem",
    },
    {
      command: "Catalog.ПримерСправочник.Command.КомандаСправоник",
      type: "Auto",
      index: 2,
      commandGroup: "FormNavigationPanelGoTo",
      defaultVisible: false,
      visible: {
        common: true,
        values: [
          {
            name: "Администратор",
            value: true,
          },
        ],
      },
      itemType: "CommandInterfaceItem",
    },
  ],
```

The `CommandBar` entry must become:

```typescript
  CommandBar: [
    {
      command: "Catalog.ПодчиненныйСправочник.StandardCommand.CreateBasedOn",
      type: "Auto",
      index: 0,
      defaultVisible: false,
      itemType: "CommandInterfaceItem",
    },
  ],
```

- [ ] **Step 3: Update `fullCommandInterfaceYAML` fixture with `Индекс`**

In the same `full.ts`, add `Индекс` to each YAML item that corresponds to an indexed model item.

The YAML `ПанельНавигации` entries must include:

```typescript
      Индекс: 0,
```

```typescript
      Индекс: 1,
```

```typescript
      Индекс: 2,
```

The YAML `КоманднаяПанель` entry must include:

```typescript
      Индекс: 0,
```

- [ ] **Step 4: Verify the absent-index reproducer stays absent**

Open `packages/core/metadata/forms/commonObjects/commandInterface/__fixtures__/commandBarIndexInsertion.ts` and confirm no object has an `index` property.

Run:

```bash
rg "index:" packages/core/metadata/forms/commonObjects/commandInterface/__fixtures__/commandBarIndexInsertion.ts
```

Expected: no output and exit code `1`.

- [ ] **Step 5: Run typecheck-oriented tests to see expected failures**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/commonObjects/commandInterface
```

Expected before converter changes: failures are acceptable. The useful expected failures are mismatches where `fromXML` / `fromYAML` do not yet populate `index`, and `toYAML` / `toXML` do not yet preserve the explicit fixture shape correctly. Continue to Task 2.

### Task 2: Preserve Index In XML Import And Export

**Files:**
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/fromXML.ts`
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/toXML.ts`
- Test: `packages/core/metadata/forms/commonObjects/commandInterface/fromXML.test.ts`
- Test: `packages/core/metadata/forms/commonObjects/commandInterface/toXML.test.ts`

- [ ] **Step 1: Read `Index` in `fromXML`**

In `packages/core/metadata/forms/commonObjects/commandInterface/fromXML.ts`, inside `importCommandInterfaceItemFromXML`, add this block after the initial `result` object and before `if (item.CommandGroup)`:

```typescript
  if (item.Index !== undefined) {
    result.index = item.Index
  }
```

The function body must read like:

```typescript
const importCommandInterfaceItemFromXML = (
  context: ConfigurationContextFromXML,
  item: CommandInterfaceItemXML
): CommandInterfaceItem => {
  const result: CommandInterfaceItem = {
    command: item.Command,
    type: item.Type,
    defaultVisible: item.DefaultVisible ?? true,
    itemType: "CommandInterfaceItem",
  }

  if (item.Index !== undefined) {
    result.index = item.Index
  }

  if (item.CommandGroup) {
    result.commandGroup = item.CommandGroup
  }

  if (item.Visible) {
    const visible = importUserVisibleFromXML(context, undefined, item.Visible)
    if (visible) {
      result.visible = visible
    }
  }

  return result
}
```

- [ ] **Step 2: Stop deriving XML `Index` from array position**

In `packages/core/metadata/forms/commonObjects/commandInterface/toXML.ts`, change `exportCommandInterfaceItemsToXML` so it no longer passes an array index:

```typescript
const exportCommandInterfaceItemsToXML = (
  context: ConfigurationContext,
  items: CommandInterfaceItem[]
): CommandInterfaceItemXML[] => {
  return items.map((item) => exportCommandInterfaceItemToXML(context, item))
}
```

Change `exportCommandInterfaceItemToXML` signature to remove `index`:

```typescript
const exportCommandInterfaceItemToXML = (
  context: ConfigurationContext,
  item: CommandInterfaceItem
): CommandInterfaceItemXML => {
```

Initialize `result` without `Index`:

```typescript
  const result: CommandInterfaceItemXML = {
    Command: item.command,
    Type: item.type ?? "Auto",
    DefaultVisible: item.defaultVisible,
  }
```

Then add `Index` only when present, before `CommandGroup`:

```typescript
  if (item.index !== undefined) {
    result.Index = item.index
  }
```

- [ ] **Step 3: Run XML import test**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run -t "should import full command interface"
```

Expected: `PASS`. This proves `fromXML` reads `Index` into `fullCommandInterface`.

- [ ] **Step 4: Run XML export reproducer**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run -t "export commandBarIndexInsertion"
```

Expected: `PASS`. This proves `toXML` no longer invents `<Index>` for items without `index`.

- [ ] **Step 5: Run full XML commandInterface tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/commonObjects/commandInterface/fromXML.test.ts metadata/forms/commonObjects/commandInterface/toXML.test.ts
```

Expected: all XML commandInterface tests pass.

### Task 3: Preserve Index In YAML Import And Export

**Files:**
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/fromYAML.ts`
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/toYAML.ts`
- Test: `packages/core/metadata/forms/commonObjects/commandInterface/fromYAML.test.ts`
- Test: `packages/core/metadata/forms/commonObjects/commandInterface/toYAML.test.ts`

- [ ] **Step 1: Read `Индекс` in `fromYAML`**

In `packages/core/metadata/forms/commonObjects/commandInterface/fromYAML.ts`, inside `importCommandInterfaceItemFromYAML`, add this block after the initial `result` object and before `if (item.ГруппаКоманд)`:

```typescript
  if (item.Индекс !== undefined) {
    result.index = item.Индекс
  }
```

The function body must read like:

```typescript
const importCommandInterfaceItemFromYAML = (
  context: ConfigurationContext,
  item: CommandInterfaceItemYAML
): CommandInterfaceItem => {
  const result: CommandInterfaceItem = {
    command: item.Команда,
    type: item.Тип,
    defaultVisible: importBooleanFromYAML(context, undefined, item.Автовидимость)!,
    itemType: "CommandInterfaceItem",
  }

  if (item.Индекс !== undefined) {
    result.index = item.Индекс
  }

  if (item.ГруппаКоманд) {
    result.commandGroup = StandardCommandsGroupFromYAML[item.ГруппаКоманд]
  }

  const visible = importUserVisibleFromYAML({
    context,
    rule: { type: "UserVisible", yaml: UserVisibleKeysYAML.Allow, yamlDeny: UserVisibleKeysYAML.Deny },
    value: item[UserVisibleKeysYAML.Allow],
    yaml: item,
  })
  if (visible) {
    result.visible = visible
  }

  return result
}
```

- [ ] **Step 2: Write `Индекс` in `toYAML`**

In `packages/core/metadata/forms/commonObjects/commandInterface/toYAML.ts`, inside `exportCommandInterfaceItemToYAML`, add this block after `result` initialization and before `if (item.commandGroup)`:

```typescript
  if (item.index !== undefined) {
    result.Индекс = item.index
  }
```

The start of the function must read like:

```typescript
const exportCommandInterfaceItemToYAML = (
  context: ConfigurationContext,
  item: CommandInterfaceItem
): CommandInterfaceItemYAML => {
  const result: CommandInterfaceItemYAML = {
    Команда: item.command,
    Тип: item.type,
    Автовидимость: exportBooleanToYAML(context, undefined, item.defaultVisible)!,
  }

  if (item.index !== undefined) {
    result.Индекс = item.index
  }

  if (item.commandGroup) {
    result.ГруппаКоманд = StandardCommandsGroupToYAML[item.commandGroup]
  }
```

- [ ] **Step 3: Run YAML import test**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/commonObjects/commandInterface/fromYAML.test.ts
```

Expected: all `fromYAML` commandInterface tests pass.

- [ ] **Step 4: Run YAML export test**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/commonObjects/commandInterface/toYAML.test.ts
```

Expected: all `toYAML` commandInterface tests pass.

### Task 4: Final Verification And Handoff

**Files:**
- Inspect: `packages/core/metadata/forms/commonObjects/commandInterface/types.ts`
- Inspect: `packages/core/metadata/forms/commonObjects/commandInterface/fromXML.ts`
- Inspect: `packages/core/metadata/forms/commonObjects/commandInterface/toXML.ts`
- Inspect: `packages/core/metadata/forms/commonObjects/commandInterface/fromYAML.ts`
- Inspect: `packages/core/metadata/forms/commonObjects/commandInterface/toYAML.ts`
- Inspect: `packages/core/metadata/forms/commonObjects/commandInterface/__fixtures__/full.ts`
- Inspect: `packages/core/metadata/forms/commonObjects/commandInterface/__fixtures__/commandBarIndexInsertion.ts`

- [ ] **Step 1: Run all commandInterface tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/commonObjects/commandInterface
```

Expected: all commandInterface tests pass, including `export commandBarIndexInsertion`.

- [ ] **Step 2: Verify `toXML` does not derive `Index` from array position**

Run:

```bash
rg "Index: index|map\\(\\(item, index\\)|exportCommandInterfaceItemToXML\\(context, item, index\\)" packages/core/metadata/forms/commonObjects/commandInterface/toXML.ts
```

Expected: no output and exit code `1`.

- [ ] **Step 3: Verify absent-index reproducer still has no model index**

Run:

```bash
rg "index:" packages/core/metadata/forms/commonObjects/commandInterface/__fixtures__/commandBarIndexInsertion.ts
```

Expected: no output and exit code `1`.

- [ ] **Step 4: Verify explicit index exists in full fixtures**

Run:

```bash
rg "index:|Индекс:" packages/core/metadata/forms/commonObjects/commandInterface/__fixtures__/full.ts
```

Expected: output includes `index: 0`, `index: 1`, `index: 2`, and `Индекс: 0`, `Индекс: 1`, `Индекс: 2`.

- [ ] **Step 5: Run round-trip check for first diff**

Run:

```bash
env NKDK_XML_REPO=/Users/nikita/git/round-trip-source NKDK_XML_DIR=/Users/nikita/git/round-trip-source/trade ./.agents/skills/round-trip-xml/round-trip.sh
```

Expected: the previous first diff in `Catalogs/БанковскиеСчетаКонтрагентов/Forms/ФормаСписка/Ext/Form.xml` no longer shows added `<Index>0</Index>`, `<Index>1</Index>`, `<Index>2</Index>`. Other unrelated round-trip errors, such as unsupported `MetadataValue` XML types, may still appear.

- [ ] **Step 6: Commit**

Use the project commit convention:

```bash
git add packages/core/metadata/forms/commonObjects/commandInterface
git commit -m "fix: :bug: сохранить index CommandInterface"
```

Expected: commit succeeds.

Do not run full `pnpm test` unless explicitly requested; the earlier `round-trip-xml` workflow leaves full-project verification to the user.

## Self-Review

- Spec coverage: covered model field, YAML field, XML/YAML import/export, fixture updates, the formerly red `commandBarIndexInsertion` export, and the explicit boundary not to change sorting.
- Placeholder scan: no placeholder tasks or vague "write tests" instructions remain.
- Type consistency: the plan consistently uses `index?: number` in TS and `Индекс` in YAML, with XML field `Index`.
