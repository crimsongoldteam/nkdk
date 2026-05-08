# CommandInterface Index Order Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve physical XML order for `CommandInterface.NavigationPanel.Item` and `CommandInterface.CommandBar.Item` while keeping `Index` as an explicit optional field.

**Architecture:** This is a local temporary measure for `CommandInterface`: `fromXML` must stop deriving item order from `Index` and must keep the XML item order. `Index` remains an ordinary optional value imported into `item.index` and exported only when present; broader domain semantics are documented as deferred in `.agents/architecture-orchestration.md`.

**Tech Stack:** TypeScript, Vitest, existing `commandInterface` XML helpers, `xmlExport`.

---

## File Structure

- Create: `packages/core/metadata/forms/commonObjects/commandInterface/__fixtures__/indexedItemOrderSwap.xml`
  - Minimal `CommandInterface` XML with two `NavigationPanel.Item` nodes in source order: first with `Index`, second without `Index`.
- Create: `packages/core/metadata/forms/commonObjects/commandInterface/__fixtures__/indexedItemOrderSwap.ts`
  - Expected `CommandInterface` model in XML order.
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/fromXML.test.ts`
  - Add a focused import test for `indexedItemOrderSwap`.
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/toXML.test.ts`
  - Add a focused export test for `indexedItemOrderSwap`.
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/fromXML.ts`
  - Remove sorting by `(Index ?? 0)` for both `NavigationPanel` and `CommandBar`.

Do not modify YAML files, `types.ts`, `toXML.ts`, or generic orchestration code.

Before running tests in a fresh worktree, ensure Langium files exist:

```bash
pnpm --filter nkdk-language langium:generate
```

Expected: `Langium generator finished successfully`.

### Task 1: Add The Failing Reproducer

**Files:**
- Create: `packages/core/metadata/forms/commonObjects/commandInterface/__fixtures__/indexedItemOrderSwap.xml`
- Create: `packages/core/metadata/forms/commonObjects/commandInterface/__fixtures__/indexedItemOrderSwap.ts`
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/fromXML.test.ts`
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/toXML.test.ts`

- [ ] **Step 1: Create the XML fixture**

Create `packages/core/metadata/forms/commonObjects/commandInterface/__fixtures__/indexedItemOrderSwap.xml` with exactly:

```xml
<CommandInterface>
	<NavigationPanel>
		<Item>
			<Command>DataProcessor.ЗагрузкаКурсовВалютЕЦБ.Command.ЗагрузитьКурсыВалютЕЦБ</Command>
			<Type>Added</Type>
			<Index>1</Index>
			<DefaultVisible>false</DefaultVisible>
			<CommandGroup>FormNavigationPanelGoTo</CommandGroup>
			<Visible>
				<xr:Common>false</xr:Common>
			</Visible>
		</Item>
		<Item>
			<Command>InformationRegister.ОтносительныеКурсыВалют.Command.ЗагрузитьКурсыИзТаблицы</Command>
			<Type>Added</Type>
			<DefaultVisible>false</DefaultVisible>
			<CommandGroup>FormNavigationPanelGoTo</CommandGroup>
			<Visible>
				<xr:Common>false</xr:Common>
			</Visible>
		</Item>
	</NavigationPanel>
</CommandInterface>
```

- [ ] **Step 2: Create the TS fixture**

Create `packages/core/metadata/forms/commonObjects/commandInterface/__fixtures__/indexedItemOrderSwap.ts` with exactly:

```typescript
import type { CommandInterface } from "../types"

export const indexedItemOrderSwap = {
  itemType: "CommandInterface",
  NavigationPanel: [
    {
      command: "DataProcessor.ЗагрузкаКурсовВалютЕЦБ.Command.ЗагрузитьКурсыВалютЕЦБ",
      type: "Added",
      index: 1,
      defaultVisible: false,
      commandGroup: "FormNavigationPanelGoTo",
      visible: {
        common: false,
        values: [],
      },
      itemType: "CommandInterfaceItem",
    },
    {
      command: "InformationRegister.ОтносительныеКурсыВалют.Command.ЗагрузитьКурсыИзТаблицы",
      type: "Added",
      defaultVisible: false,
      commandGroup: "FormNavigationPanelGoTo",
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

- [ ] **Step 3: Add the import test**

In `packages/core/metadata/forms/commonObjects/commandInterface/fromXML.test.ts`, add this import after the existing `commandBarIndexInsertion` import:

```typescript
import { indexedItemOrderSwap } from "./__fixtures__/indexedItemOrderSwap"
```

Inside `describe("importCommandInterfaceFromXML", () => { ... })`, after `it("import commandBarIndexInsertion", ...)`, add:

```typescript
  it("import indexedItemOrderSwap", () => {
    const xmlData = readAndParseXMLFile<{ CommandInterface: CommandInterfaceXML }>(
      "indexedItemOrderSwap.xml",
      fixturesDir
    )

    const result = importCommandInterfaceFromXML(mockContextFromXML(), mockRule, xmlData.CommandInterface)

    expect(result).toEqual(indexedItemOrderSwap)
  })
```

- [ ] **Step 4: Add the export test**

In `packages/core/metadata/forms/commonObjects/commandInterface/toXML.test.ts`, add this import after the existing `commandBarIndexInsertion` import:

```typescript
import { indexedItemOrderSwap } from "./__fixtures__/indexedItemOrderSwap"
```

Inside `describe("exportCommandInterfaceToXML", () => { ... })`, after `it("export commandBarIndexInsertion", ...)`, add:

```typescript
  it("export indexedItemOrderSwap", () => {
    const expectedResult = readXMLFileAsString("indexedItemOrderSwap.xml", fixturesDir).trimEnd()
    const xmlData = exportCommandInterfaceToXML(mockContext, mockRule, indexedItemOrderSwap)

    const result = xmlExport({ CommandInterface: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
```

- [ ] **Step 5: Run the focused import test and verify it fails**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/commonObjects/commandInterface/fromXML.test.ts -t "import indexedItemOrderSwap"
```

Expected: FAIL. The diff must show `NavigationPanel` items in the wrong order: current sorting moves the unindexed item with command `InformationRegister.ОтносительныеКурсыВалют.Command.ЗагрузитьКурсыИзТаблицы` before the indexed item with command `DataProcessor.ЗагрузкаКурсовВалютЕЦБ.Command.ЗагрузитьКурсыВалютЕЦБ`.

- [ ] **Step 6: Run the focused export test and verify it passes**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/commonObjects/commandInterface/toXML.test.ts -t "export indexedItemOrderSwap"
```

Expected: PASS. If it fails only because of whitespace or final newline, adjust only `indexedItemOrderSwap.xml` formatting to match existing `commandInterface` fixtures and rerun this step.

### Task 2: Preserve XML Item Order In Import

**Files:**
- Modify: `packages/core/metadata/forms/commonObjects/commandInterface/fromXML.ts`
- Test: `packages/core/metadata/forms/commonObjects/commandInterface/fromXML.test.ts`
- Test: `packages/core/metadata/forms/commonObjects/commandInterface/toXML.test.ts`

- [ ] **Step 1: Remove sorting from `NavigationPanel` import**

In `packages/core/metadata/forms/commonObjects/commandInterface/fromXML.ts`, replace:

```typescript
    result.NavigationPanel = items
      .sort((a, b) => (a.Index ?? 0) - (b.Index ?? 0))
      .map((item) => importCommandInterfaceItemFromXML(context, item))
```

with:

```typescript
    result.NavigationPanel = items.map((item) => importCommandInterfaceItemFromXML(context, item))
```

- [ ] **Step 2: Remove sorting from `CommandBar` import**

In the same file, replace:

```typescript
    result.CommandBar = items
      .sort((a, b) => (a.Index ?? 0) - (b.Index ?? 0))
      .map((item) => importCommandInterfaceItemFromXML(context, item))
```

with:

```typescript
    result.CommandBar = items.map((item) => importCommandInterfaceItemFromXML(context, item))
```

- [ ] **Step 3: Run the reproducer import test and verify it passes**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/commonObjects/commandInterface/fromXML.test.ts -t "import indexedItemOrderSwap"
```

Expected: PASS.

- [ ] **Step 4: Run all `commandInterface` tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/commonObjects/commandInterface
```

Expected: PASS for `fromXML.test.ts`, `toXML.test.ts`, `fromYAML.test.ts`, and `toYAML.test.ts`.

- [ ] **Step 5: Verify architecture documentation still states the temporary boundary**

Run:

```bash
rg -n "Текущая временная норма|fromXML.*не должен сортировать элементы по `Index`|Это временная мера" .agents/architecture-orchestration.md
```

Expected: matches in the `Порядок элементов CommandInterface` section.

- [ ] **Step 6: Commit**

Run:

```bash
git status --short
git add packages/core/metadata/forms/commonObjects/commandInterface/__fixtures__/indexedItemOrderSwap.xml \
  packages/core/metadata/forms/commonObjects/commandInterface/__fixtures__/indexedItemOrderSwap.ts \
  packages/core/metadata/forms/commonObjects/commandInterface/fromXML.test.ts \
  packages/core/metadata/forms/commonObjects/commandInterface/toXML.test.ts \
  packages/core/metadata/forms/commonObjects/commandInterface/fromXML.ts
git commit -m "fix: :bug: сохранить порядок CommandInterface"
```

Expected: commit succeeds. The status before `git add` should include only the files from this plan, unless the worker intentionally has unrelated local work that must not be staged.

## Self-Review

- Spec coverage: the plan creates the reproducer, keeps `Index` as an explicit field, removes `fromXML` sorting by `Index`, leaves `toXML` and YAML unchanged, and checks the architecture note.
- Placeholder scan: no placeholder steps remain; every code change includes exact code.
- Type consistency: the fixture uses existing `CommandInterface`, `CommandInterfaceItem`, `visible`, `commandGroup`, and `index` names from `types.ts`.
