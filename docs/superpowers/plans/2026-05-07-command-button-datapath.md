# Command Button DataPath Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve the `DataPath` XML node for command bar buttons during form element XML and YAML round-trips.

**Architecture:** Button form elements are rule-driven. Add `dataPath` to shared button rules so `Button` and `CommandBarButton` use the same import/export pipeline, then register the provided `withDataPath.xml` fixture in the existing centralized element fixture table.

**Tech Stack:** TypeScript, Vitest, rule-driven metadata orchestration, `DataPath` common object type, pnpm workspace.

---

## File Structure

- Modify `packages/core/metadata/forms/elements/button/rules.ts`
  - Owns button element rule definitions.
  - Add `dataPath` to `commonButtonProperties` near `commandName`.
- Modify `packages/core/metadata/forms/elements/button/__fixtures__/data.ts`
  - Owns expected model/YAML/enterprise fixtures for button tests.
  - Add model and YAML constants for the existing `withDataPath.xml`.
- Modify `packages/core/metadata/forms/elements/__tests__/fixtures.ts`
  - Owns the shared fixture registry used by form element XML/YAML tests.
  - Import and register the new `with data path` fixture.
- Use existing `packages/core/metadata/forms/elements/button/__fixtures__/withDataPath.xml`
  - User-provided XML source fixture.
  - Do not rewrite it unless formatting fails in `toXML`.

## Task 1: Register Failing DataPath Fixture

**Files:**
- Modify: `packages/core/metadata/forms/elements/button/__fixtures__/data.ts`
- Modify: `packages/core/metadata/forms/elements/__tests__/fixtures.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/fromXML.test.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/toXML.test.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/fromYAML.test.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/toYAML.test.ts`

- [ ] **Step 1: Add expected model and YAML fixtures**

In `packages/core/metadata/forms/elements/button/__fixtures__/data.ts`, insert this block after `fullCommandBarButtonEnterprise` and before `//#endregion` for `CommandBarButton / CommandBarButton`:

```ts
export const commandBarButtonWithDataPath = {
  itemType: "CommandBarButton",
  name: "ОбщаяКомандаКомандаСПараметром",
  type: "CommandBarButton",
  commandName: "CommonCommand.КомандаСПараметром",
  dataPath: "Items.ДинамическийСписок.CurrentData.Ref",
  extendedTooltip: {
    itemType: "ExtendedTooltip",
    name: "ОбщаяКомандаКомандаСПараметромРасширеннаяПодсказка",
  },
} satisfies CommandBarButton

export const commandBarButtonWithDataPathPartialYAML = {
  Вид: "КнопкаКоманднойПанели",
  ИмяКоманды: "CommonCommand.КомандаСПараметром",
  Данные: "Items.ДинамическийСписок.CurrentData.Ref",
  РасширеннаяПодсказка: {},
} satisfies CommandBarButtonPartialYAML

export const commandBarButtonWithDataPathTypedYAML: CommandBarButtonTypedYAML = {
  ...commandBarButtonWithDataPathPartialYAML,
  Тип: "КнопкаКоманднойПанели",
}
```

- [ ] **Step 2: Import new fixtures in the shared element registry**

In `packages/core/metadata/forms/elements/__tests__/fixtures.ts`, extend the import from `../button/__fixtures__/data`:

```ts
  commandBarButtonWithDataPath,
  commandBarButtonWithDataPathPartialYAML,
  commandBarButtonWithDataPathTypedYAML,
```

Keep the imported names sorted with the nearby button fixture imports if the file already follows that style.

- [ ] **Step 3: Register the XML fixture**

In `packages/core/metadata/forms/elements/__tests__/fixtures.ts`, add this entry in the `CommandBarButton` region after the existing `"command bar button"` fixture:

```ts
  {
    group: "CommandBarButton",
    name: "with data path",
    element: CommandBarButton,
    xml: "withDataPath.xml",
    xmlFolder: "button",
    model: commandBarButtonWithDataPath,
    yaml: commandBarButtonWithDataPathPartialYAML,
    typedYAML: commandBarButtonWithDataPathTypedYAML,
    enterprise: undefined,
  },
```

- [ ] **Step 4: Run the focused tests and verify the expected failure**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/elements/__tests__/fromXML.test.ts metadata/forms/elements/__tests__/toXML.test.ts metadata/forms/elements/__tests__/fromYAML.test.ts metadata/forms/elements/__tests__/toYAML.test.ts -t "with data path"
```

Expected before the implementation:

- `fromXML` fails because imported model does not include `dataPath`.
- `toXML` fails because exported XML does not include `<DataPath>Items.ДинамическийСписок.CurrentData.Ref</DataPath>`.
- `fromYAML` / `toYAML` may fail on unknown or missing YAML field `Данные`.

The exact assertion format may differ, but at least one failure must show `dataPath` / `DataPath` / `Данные` is not round-tripping.

- [ ] **Step 5: Commit the failing fixture**

Run:

```bash
git add packages/core/metadata/forms/elements/button/__fixtures__/withDataPath.xml packages/core/metadata/forms/elements/button/__fixtures__/data.ts packages/core/metadata/forms/elements/__tests__/fixtures.ts
git commit -m "test: :white_check_mark: покрыть DataPath командной кнопки"
```

## Task 2: Implement DataPath Rule

**Files:**
- Modify: `packages/core/metadata/forms/elements/button/rules.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/fromXML.test.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/toXML.test.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/fromYAML.test.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/toYAML.test.ts`

- [ ] **Step 1: Add the `dataPath` property rule**

In `packages/core/metadata/forms/elements/button/rules.ts`, change the area around `commandName` to:

```ts
  check: { yaml: "Пометка", type: "boolean" },
  commandName: { yaml: "ИмяКоманды", type: "CommandName" },
  dataPath: { yaml: "Данные", xml: "DataPath", type: "DataPath" },
  textColor: { yaml: "ЦветТекста", type: "Color" },
```

Do not add custom `fromXML`, `toXML`, `fromYAML`, or `toYAML` handlers. The existing rule pipeline should handle `DataPath`.

- [ ] **Step 2: Run the focused tests and verify they pass**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/elements/__tests__/fromXML.test.ts metadata/forms/elements/__tests__/toXML.test.ts metadata/forms/elements/__tests__/fromYAML.test.ts metadata/forms/elements/__tests__/toYAML.test.ts -t "with data path"
```

Expected:

```text
Test Files  4 passed
```

Vitest may report skipped unrelated cases, but the `with data path` cases must pass.

- [ ] **Step 3: Commit the implementation**

Run:

```bash
git add packages/core/metadata/forms/elements/button/rules.ts
git commit -m "fix: :bug: сохранять DataPath командных кнопок"
```

## Task 3: Verify Package Baseline

**Files:**
- No source edits expected.
- Test: all `@nakidka/core` tests.

- [ ] **Step 1: Run the core package test suite**

Run:

```bash
pnpm --filter '@nakidka/core' test
```

Expected:

```text
Test Files  391 passed | 9 skipped (400)
Tests       2640 passed | 13 skipped (2653)
```

The exact duration can differ. If new tests increase the count, accept the increased passing total if there are no failures.

- [ ] **Step 2: Check worktree status**

Run:

```bash
git status --short
```

Expected:

```text
```

No output means the implementation and test commits captured all intended changes. If generated files changed unexpectedly, inspect them before committing.

## Self-Review

- Spec coverage: Task 1 covers the provided XML fixture and shared test registration. Task 2 covers the `dataPath` rule with YAML `Данные`, XML `DataPath`, and type `DataPath`. Task 3 covers package verification.
- Scope check: The plan does not include `MobileDeviceCommandBarContent`, `CommandInterface` ordering, DCS `xsi:type`, chart settings, or form attribute columns.
- Placeholder scan: No placeholders remain; each code-editing step includes concrete code and exact commands.
- Type consistency: The property is consistently named `dataPath` in TS, `DataPath` in XML, and `Данные` in YAML.
