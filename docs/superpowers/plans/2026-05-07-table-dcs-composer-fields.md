# Table DCS Composer Fields Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add focused Table element fixtures for DCS composer tables and preserve their DCS-specific XML/YAML fields through the shared form-element test mechanism.

**Architecture:** The behavior belongs in `TableRules`, because form elements derive XML, YAML, and TS shapes from metadata rules. The two DCS composer tables become normal element fixtures registered in `ElementFixtures`; no local `fromXML.test.ts` or `toXML.test.ts` files are added for `table`.

**Tech Stack:** TypeScript, Vitest, `pnpm`, Nakidka metadata rules, shared form-element test harness.

---

## File Structure

- Modify `packages/core/metadata/forms/elements/table/rules.ts`: add three optional Table properties.
- Modify `packages/core/metadata/forms/elements/table/__fixtures__/data.ts`: keep `fullTable` from becoming responsible for the new DCS-specific fields by excluding them from the required-field assertion only.
- Create `packages/core/metadata/forms/elements/table/__fixtures__/dcsComposerFilter.ts`: TS and YAML expectations for `dcsComposerFilter.xml`.
- Create `packages/core/metadata/forms/elements/table/__fixtures__/dcsComposerSettings.ts`: TS and YAML expectations for `dcsComposerSettings.xml`.
- Modify `packages/core/metadata/forms/elements/__tests__/fixtures.ts`: import and register both new fixtures in the `Table` region.

## Task 1: Register Focused DCS Composer Fixtures

**Files:**
- Create: `packages/core/metadata/forms/elements/table/__fixtures__/dcsComposerFilter.ts`
- Create: `packages/core/metadata/forms/elements/table/__fixtures__/dcsComposerSettings.ts`
- Modify: `packages/core/metadata/forms/elements/__tests__/fixtures.ts`

- [ ] **Step 1: Create `dcsComposerFilter.ts` with expected model and YAML**

Create `packages/core/metadata/forms/elements/table/__fixtures__/dcsComposerFilter.ts`:

```typescript
import type { Table, TablePartialYAML } from "../types"

export const dcsComposerFilter: Table = {
  itemType: "Table",
  name: "КомпоновщикНастроекКомпоновкиДанныхНастройкиОтбор",
  representation: "Tree",
  autofill: true,
  width: 60,
  initialTreeView: "ExpandAllLevels",
  enableStartDrag: true,
  enableDrag: true,
  dataPath: "КомпоновщикНастроекКомпоновкиДанных.Settings.Filter",
  viewMode: "QuickAccess",
  settingsNamedItemDetailedRepresentation: false,
  contextMenu: {
    itemType: "ContextMenu",
    childItems: [],
  },
  autoCommandBar: {
    itemType: "AutoCommandBar",
    autofill: true,
    childItems: [],
  },
  extendedTooltip: {
    itemType: "ExtendedTooltip",
  },
  searchStringRepresentation: {
    itemType: "SingleSearchStringAddition",
    contextMenu: {
      itemType: "ContextMenu",
      childItems: [],
    },
    extendedTooltip: {
      itemType: "ExtendedTooltip",
    },
  },
  viewStatusRepresentation: {
    itemType: "ViewStatusAddition",
    contextMenu: {
      itemType: "ContextMenu",
      childItems: [],
    },
    extendedTooltip: {
      itemType: "ExtendedTooltip",
    },
  },
  searchControl: {
    itemType: "SingleSearchControlAddition",
    childItems: [],
    contextMenu: {
      itemType: "ContextMenu",
      childItems: [],
    },
    extendedTooltip: {
      itemType: "ExtendedTooltip",
    },
  },
  childItems: [
    {
      itemType: "TableCheckBoxField",
      name: "КомпоновщикНастроекКомпоновкиДанныхНастройкиОтборИспользование",
      dataPath: "КомпоновщикНастроекКомпоновкиДанных.Settings.Filter.Use",
      editMode: "EnterOnInput",
      checkBoxType: "Auto",
      contextMenu: {
        itemType: "ContextMenu",
        childItems: [],
      },
      extendedTooltip: {
        itemType: "ExtendedTooltip",
      },
    },
  ],
}

export const dcsComposerFilterYAML: TablePartialYAML = {
  АвтозаполнениеКолонок: "Истина",
  НачальноеОтображениеДерева: "РаскрыватьВсеУровни",
  Отображение: "Дерево",
  ПодробноеОтображениеИменованныхЭлементовНастройки: "Ложь",
  РазрешитьНачалоПеретаскивания: "Истина",
  РазрешитьПеретаскивание: "Истина",
  РежимОтображения: "БыстрыйДоступ",
  Ширина: 60,
}
```

- [ ] **Step 2: Create `dcsComposerSettings.ts` with expected model and YAML**

Create `packages/core/metadata/forms/elements/table/__fixtures__/dcsComposerSettings.ts`:

```typescript
import type { Table, TablePartialYAML } from "../types"

export const dcsComposerSettings: Table = {
  itemType: "Table",
  name: "КомпоновщикНастроекКомпоновкиДанныхНастройки",
  representation: "Tree",
  horizontalLines: false,
  useAlternationRowColor: true,
  initialTreeView: "ExpandAllLevels",
  enableStartDrag: true,
  enableDrag: true,
  dataPath: "КомпоновщикНастроекКомпоновкиДанных.Settings",
  contextMenu: {
    itemType: "ContextMenu",
    childItems: [],
  },
  autoCommandBar: {
    itemType: "AutoCommandBar",
    autofill: true,
    childItems: [],
  },
  extendedTooltip: {
    itemType: "ExtendedTooltip",
  },
  searchStringRepresentation: {
    itemType: "SingleSearchStringAddition",
    contextMenu: {
      itemType: "ContextMenu",
      childItems: [],
    },
    extendedTooltip: {
      itemType: "ExtendedTooltip",
    },
  },
  viewStatusRepresentation: {
    itemType: "ViewStatusAddition",
    contextMenu: {
      itemType: "ContextMenu",
      childItems: [],
    },
    extendedTooltip: {
      itemType: "ExtendedTooltip",
    },
  },
  searchControl: {
    itemType: "SingleSearchControlAddition",
    childItems: [],
    contextMenu: {
      itemType: "ContextMenu",
      childItems: [],
    },
    extendedTooltip: {
      itemType: "ExtendedTooltip",
    },
  },
  childItems: [
    {
      itemType: "TableCheckBoxField",
      name: "КомпоновщикНастроекКомпоновкиДанныхНастройкиИспользование",
      dataPath: "КомпоновщикНастроекКомпоновкиДанных.Settings.Use",
      editMode: "EnterOnInput",
      checkBoxType: "Auto",
      contextMenu: {
        itemType: "ContextMenu",
        childItems: [],
      },
      extendedTooltip: {
        itemType: "ExtendedTooltip",
      },
    },
  ],
}

export const dcsComposerSettingsYAML: TablePartialYAML = {
  ГоризонтальныеЛинии: "Ложь",
  НачальноеОтображениеДерева: "РаскрыватьВсеУровни",
  Отображение: "Дерево",
  РазрешитьНачалоПеретаскивания: "Истина",
  РазрешитьПеретаскивание: "Истина",
  ЧередованиеЦветовСтрок: "Истина",
}
```

- [ ] **Step 3: Register the fixtures in `ElementFixtures`**

Modify the table imports in `packages/core/metadata/forms/elements/__tests__/fixtures.ts` from:

```typescript
import { dynamicList } from "../table/__fixtures__/dynamicList"
import { fullTable, fullTableEnterprise, fullTableYAML, minimalTable } from "../table/__fixtures__/data"
```

to:

```typescript
import { dynamicList } from "../table/__fixtures__/dynamicList"
import { dcsComposerFilter, dcsComposerFilterYAML } from "../table/__fixtures__/dcsComposerFilter"
import { dcsComposerSettings, dcsComposerSettingsYAML } from "../table/__fixtures__/dcsComposerSettings"
import { fullTable, fullTableEnterprise, fullTableYAML, minimalTable } from "../table/__fixtures__/data"
```

Add these entries in the `//#region Table` block after `dynamicList`:

```typescript
  {
    group: "Table",
    name: "dcsComposerFilter",
    element: Table,
    xml: "dcsComposerFilter.xml",
    xmlFolder: undefined,
    model: dcsComposerFilter,
    yaml: dcsComposerFilterYAML,
    enterprise: undefined,
  },
  {
    group: "Table",
    name: "dcsComposerSettings",
    element: Table,
    xml: "dcsComposerSettings.xml",
    xmlFolder: undefined,
    model: dcsComposerSettings,
    yaml: dcsComposerSettingsYAML,
    enterprise: undefined,
  },
```

- [ ] **Step 4: Run the focused tests and verify they fail for the missing rules**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/elements/__tests__/fromXML.test.ts metadata/forms/elements/__tests__/toXML.test.ts metadata/forms/elements/__tests__/fromYAML.test.ts metadata/forms/elements/__tests__/toYAML.test.ts -t "dcsComposer"
```

Expected: FAIL before `TableRules` is updated. The failures should mention missing or unexpected `autofill`, `viewMode`, and `settingsNamedItemDetailedRepresentation` model/YAML properties for `dcsComposerFilter`; `dcsComposerSettings` may also fail if YAML expectations for empty nested elements need calibration.

## Task 2: Add Table Rules for DCS Composer Fields

**Files:**
- Modify: `packages/core/metadata/forms/elements/table/rules.ts`
- Modify: `packages/core/metadata/forms/elements/table/__fixtures__/data.ts`

- [ ] **Step 1: Add the three properties to `TableRules`**

In `packages/core/metadata/forms/elements/table/rules.ts`, add these properties after `autoCommandBar` and before `autoInsertNewRow`:

```typescript
    autofill: { yaml: "АвтозаполнениеКолонок", type: "boolean" },
    viewMode: {
      yaml: "РежимОтображения",
      type: "SystemEnumeration",
      typeSE: "DataCompositionSettingsViewMode",
    },
    settingsNamedItemDetailedRepresentation: {
      yaml: "ПодробноеОтображениеИменованныхЭлементовНастройки",
      xml: "SettingsNamedItemDetailedRepresentation",
      type: "boolean",
    },
```

The `autofill` property does not need `xml: "Autofill"` because the rule engine maps camelCase `autofill` to `Autofill` by default. `viewMode` similarly maps to `ViewMode`.

- [ ] **Step 2: Keep `fullTable` out of the DCS-specific coverage**

In `packages/core/metadata/forms/elements/table/__fixtures__/data.ts`, change the `fullTable` assertion from:

```typescript
} satisfies Omit<RequiredFieldsElement<Table>, "period" | "topLevelParent">
```

to:

```typescript
} satisfies Omit<
  RequiredFieldsElement<Table>,
  "autofill" | "period" | "settingsNamedItemDetailedRepresentation" | "topLevelParent" | "viewMode"
>
```

Do not add the new fields to `fullTable` or `fullTableYAML`; the focused DCS composer fixtures cover them.

- [ ] **Step 3: Run the focused XML/YAML tests again**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/elements/__tests__/fromXML.test.ts metadata/forms/elements/__tests__/toXML.test.ts metadata/forms/elements/__tests__/fromYAML.test.ts metadata/forms/elements/__tests__/toYAML.test.ts -t "dcsComposer"
```

Expected: PASS. If only YAML assertions fail because the shared exporter includes empty nested elements, update the YAML objects in `dcsComposerFilter.ts` and `dcsComposerSettings.ts` to exactly match the received `TablePartialYAML`, then rerun the same command until it passes.

## Task 3: Verify Table Regression Surface

**Files:**
- Test: `packages/core/metadata/forms/elements/__tests__/fromXML.test.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/toXML.test.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/fromYAML.test.ts`
- Test: `packages/core/metadata/forms/elements/__tests__/toYAML.test.ts`

- [ ] **Step 1: Run all shared element tests for `Table`**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/forms/elements/__tests__/fromXML.test.ts metadata/forms/elements/__tests__/toXML.test.ts metadata/forms/elements/__tests__/fromYAML.test.ts metadata/forms/elements/__tests__/toYAML.test.ts -t "Table"
```

Expected: PASS. This confirms existing `all fields`, `minimal fields`, and `dynamicList` fixtures still work with the new optional rules.

- [ ] **Step 2: Run the full core test package**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run
```

Expected: PASS with the normal skipped tests unchanged.

- [ ] **Step 3: Check worktree status**

Run:

```bash
git status --short
```

Expected: changed files include only:

```text
M  packages/core/metadata/forms/elements/__tests__/fixtures.ts
M  packages/core/metadata/forms/elements/table/__fixtures__/data.ts
A  packages/core/metadata/forms/elements/table/__fixtures__/dcsComposerFilter.ts
?? packages/core/metadata/forms/elements/table/__fixtures__/dcsComposerFilter.xml
A  packages/core/metadata/forms/elements/table/__fixtures__/dcsComposerSettings.ts
?? packages/core/metadata/forms/elements/table/__fixtures__/dcsComposerSettings.xml
M  packages/core/metadata/forms/elements/table/rules.ts
```

The two XML files may show as `??` if the user-created fixture files have not been staged yet.

## Task 4: Commit the Implementation

**Files:**
- Commit all implementation files from Tasks 1-3, including both XML fixtures.

- [ ] **Step 1: Stage the implementation files**

Run:

```bash
git add packages/core/metadata/forms/elements/table/rules.ts \
  packages/core/metadata/forms/elements/table/__fixtures__/data.ts \
  packages/core/metadata/forms/elements/table/__fixtures__/dcsComposerFilter.ts \
  packages/core/metadata/forms/elements/table/__fixtures__/dcsComposerFilter.xml \
  packages/core/metadata/forms/elements/table/__fixtures__/dcsComposerSettings.ts \
  packages/core/metadata/forms/elements/table/__fixtures__/dcsComposerSettings.xml \
  packages/core/metadata/forms/elements/__tests__/fixtures.ts
```

- [ ] **Step 2: Commit**

Run:

```bash
git commit -m "fix: :bug: сохранить поля таблиц DCS"
```

Expected: commit succeeds. Do not amend the prior docs commit unless the user explicitly asks.

## Self-Review Notes

- Spec coverage: rules for all three fields are in Task 2; both fixture pairs and `ElementFixtures` registration are in Task 1; shared XML/YAML tests are in Tasks 1 and 3; existing `fullTable` behavior is handled in Task 2.
- Placeholder scan: no `TBD`, `TODO`, or undefined implementation steps remain.
- Type consistency: field names are `autofill`, `viewMode`, and `settingsNamedItemDetailedRepresentation` throughout; YAML names match the approved spec.
