# TableRules XML Order Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Исправить порядок XML-свойств таблиц формы, чтобы YAML→XML без reference проходил загрузку 1С для `acc`.

**Architecture:** Экспорт без reference сортирует свойства без `referenceMetadata` и без `order` по XML-имени. Фикс ограничен точечным `order` на критичных свойствах `TableRules`; поведение типов `CommandSet`, `TableAutoCommandBar`, `TableChildItems` и orchestration не меняется.

**Tech Stack:** TypeScript, Vitest, `pnpm`, `ibcmd`, существующий metadata orchestration.

---

## File Structure

- Modify: `packages/core/metadata/forms/elements/table/preserveFromReferenceXML.test.ts`
  - Добавить regression-test на относительный порядок XML-тегов, экспортируемых из `TableRules` без reference.
- Modify: `packages/core/metadata/forms/elements/table/rules.ts`
  - Добавить `order` на критичные свойства таблицы, чтобы они экспортировались в порядке XML 1С.
- No changes: XML-фикстуры и `/home/nikita/git/round-trip/acc`
  - Они остаются источником истины.

---

### Task 1: Regression Test For Table XML Order

**Files:**
- Modify: `packages/core/metadata/forms/elements/table/preserveFromReferenceXML.test.ts`

- [ ] **Step 1: Add fixture import**

Add this import near existing imports:

```ts
import { fullTable } from "./__fixtures__/data"
```

- [ ] **Step 2: Add helper for XML key positions**

Add this helper below `exportTable`:

```ts
function expectXmlKeyOrder(xml: Record<string, unknown>, expectedOrder: string[]): void {
  const keys = Object.keys(xml)
  const positions = new Map(keys.map((key, index) => [key, index]))

  for (let i = 1; i < expectedOrder.length; i++) {
    const previous = expectedOrder[i - 1]!
    const current = expectedOrder[i]!
    expect(positions.get(previous), previous).toBeDefined()
    expect(positions.get(current), current).toBeDefined()
    expect(positions.get(previous)!).toBeLessThan(positions.get(current)!)
  }
}
```

- [ ] **Step 3: Write the failing test**

Add this test inside `describe("Table preserveFromReferenceXML", () => { ... })`:

```ts
  it("экспортирует критичные XML-свойства таблицы в порядке 1С без reference", () => {
    const result = exportTable({ table: fullTable })

    expectXmlKeyOrder(result, [
      "Representation",
      "ChangeRowSet",
      "ChangeRowOrder",
      "AutoInsertNewRow",
      "EnableStartDrag",
      "EnableDrag",
      "DataPath",
      "RowPictureDataPath",
      "RowsPicture",
      "CommandSet",
      "ContextMenu",
      "AutoCommandBar",
      "ExtendedTooltip",
      "SearchStringAddition",
      "ViewStatusAddition",
      "SearchControlAddition",
      "Events",
      "ChildItems",
    ])
  })
```

- [ ] **Step 4: Run the focused test and verify it fails**

Run:

```bash
pnpm --dir packages/core exec vitest run src/metadata/forms/elements/table/preserveFromReferenceXML.test.ts
```

Expected: FAIL. The failure should show that `AutoCommandBar` or `ChildItems` appears before `CommandSet` / earlier table context fields.

- [ ] **Step 5: Commit the failing test**

```bash
git add packages/core/metadata/forms/elements/table/preserveFromReferenceXML.test.ts
git commit -m "test: :white_check_mark: зафиксировать порядок XML таблицы"
```

---

### Task 2: Order TableRules Properties

**Files:**
- Modify: `packages/core/metadata/forms/elements/table/rules.ts`

- [ ] **Step 1: Add explicit order to critical table properties**

In `TableRules.properties`, add `order` to the critical keys in this relative order. Keep all other existing table properties present exactly once and do not add `order` to unrelated properties.

```text
name: 0
representation: 10
changeRowSet: 20
changeRowOrder: 30
autoInsertNewRow: 40
enableStartDrag: 50
enableDrag: 60
dataPath: 70
rowPictureDataPath: 80
rowsPicture: 90
commandSet: 100
contextMenu: 110
autoCommandBar: 120
extendedTooltip: 130
searchStringRepresentation: 140
viewStatusRepresentation: 150
searchControl: 160
events: 170
childItems: 180
```

The XML order must be:

```ts
    representation: {
      yaml: "Отображение",
      type: "SystemEnumeration",
      typeSE: "TableRepresentation",
    },
    changeRowSet: { yaml: "ИзменятьСоставСтрок", type: "boolean" },
    changeRowOrder: { yaml: "ИзменятьПорядокСтрок", type: "boolean" },
    autoInsertNewRow: { yaml: "АвтоВводНовойСтроки", type: "boolean" },
    enableStartDrag: { yaml: "РазрешитьНачалоПеретаскивания", type: "boolean" },
    enableDrag: { yaml: "РазрешитьПеретаскивание", type: "boolean" },
    dataPath: { yaml: "ПутьКДанным", type: "DataPath", defaultType: "ValueTable" },
    rowPictureDataPath: { yaml: "ПутьКДаннымКартинкиСтроки", type: "DataPath", defaultType: "Picture" },
    rowsPicture: { yaml: "КартинкаСтрок", type: "Picture" },
    commandSet: { yaml: "Команда", type: "CommandSet", toEnterprise: false },
    contextMenu: { yaml: "КонтекстноеМеню", type: "ContextMenu", toEnterprise: false },
    autoCommandBar: { yaml: "КоманднаяПанель", type: "TableAutoCommandBar", toEnterprise: false },
    extendedTooltip: { yaml: "РасширеннаяПодсказка", type: "ExtendedTooltip", toEnterprise: false },
    searchStringRepresentation: {
      yaml: "ОтображениеСтрокиПоиска",
      type: "SingleSearchStringAddition",
      toEnterprise: false,
      xml: "SearchStringAddition",
    },
    viewStatusRepresentation: {
      yaml: "ОтображениеСостоянияПросмотра",
      type: "SingleViewStatusAddition",
      xml: "ViewStatusAddition",
      toEnterprise: false,
    },
    searchControl: {
      yaml: "УправлениеПоиском",
      type: "SingleSearchControlAddition",
      xml: "SearchControlAddition",
      toEnterprise: false,
    },
    events: {
      type: "Events",
      yaml: "События",
      toEnterprise: false,
      items: {
        selection: "Выбор",
        valueChoice: "ВыборЗначения",
        dragStart: "НачалоПеретаскивания",
        choiceProcessing: "ОбработкаВыбора",
        newWriteProcessing: "ОбработкаЗаписиНового",
        refreshRequestProcessing: "ОбработкаЗапросаОбновления",
        dragEnd: "ОкончаниеПеретаскивания",
        onLoadUserSettingsAtServer: "ПриЗагрузкеПользовательскихНастроекНаСервере",
        uRLListGetProcessing: "ОбработкаПолученияСпискаНавигационныхСсылок",
        uRLGetProcessing: "ОбработкаПолученияНавигационнойСсылки",
        onGetDataAtServer: "ПриПолученииДанныхНаСервере",
        onSaveUserSettingsAtServer: "ПриСохраненииПользовательскихНастроекНаСервере",
        onUpdateUserSettingSetAtServer: "ПриОбновленииСоставаПользовательскихНастроекНаСервере",
        beforeLoadUserSettingsAtServer: "ПередЗагрузкойПользовательскихНастроекНаСервере",
        beforeAddRow: "ПередНачаломДобавления",
        beforeRowChange: "ПередНачаломИзменения",
        beforeEditEnd: "ПередОкончаниемРедактирования",
        beforeExpand: "ПередРазворачиванием",
        beforeCollapse: "ПередСворачиванием",
        beforeDeleteRow: "ПередУдалением",
        drag: "Перетаскивание",
        afterDeleteRow: "ПослеУдаления",
        onActivateField: "ПриАктивизацииПоля",
        onActivateRow: "ПриАктивизацииСтроки",
        onActivateCell: "ПриАктивизацииЯчейки",
        onChange: "ПриИзменении",
        onStartEdit: "ПриНачалеРедактирования",
        onEditEnd: "ПриОкончанииРедактирования",
        onCurrentParentChange: "ПриСменеТекущегоРодителя",
        dragCheck: "ПроверкаПеретаскивания",
      },
    },
    childItems: { yaml: "Элементы", type: "TableChildItems", defaultValue: [] },
```

Keep all other existing table properties present exactly once.

- [ ] **Step 2: Run the focused test and verify it passes**

Run:

```bash
pnpm --dir packages/core exec vitest run src/metadata/forms/elements/table/preserveFromReferenceXML.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run existing form element XML tests**

Run:

```bash
pnpm --dir packages/core exec vitest run src/metadata/forms/elements/__tests__/toXML.test.ts
```

Expected: PASS. If snapshots/object comparisons fail only because table XML order changed to the 1C order, inspect the diff before updating expectations; do not change XML fixtures.

- [ ] **Step 4: Run type-check**

Run:

```bash
pnpm --dir packages/core run type-check
```

Expected: PASS or only pre-existing unrelated errors. If it fails on edited files, fix before continuing.

- [ ] **Step 5: Commit implementation**

```bash
git add packages/core/metadata/forms/elements/table/rules.ts packages/core/metadata/forms/elements/table/preserveFromReferenceXML.test.ts
git commit -m "fix: :bug: исправить порядок XML таблиц формы"
```

---

### Task 3: Verify acc Import Through 1C

**Files:**
- No source edits.

- [ ] **Step 1: Run the YAML -> XML -> 1C cycle for acc**

Run the same steps as `round-trip-yaml-1c`, but point the XML source to `/home/nikita/git/round-trip/acc` and use fresh temporary YAML/XML directories.

Expected: generated XML loads into 1C without `Invalid name of form item command`. Help-link warnings are acceptable.

- [ ] **Step 2: Check worktree**

Run:

```bash
git status --short
```

Expected: `.env` is not modified. Temporary directories under `/tmp` and `/home/nikita/git/temp-yaml` are not part of git status.

- [ ] **Step 3: Commit verification note only if source changed after Task 2**

If no source files changed during verification, do not create a commit. If a small source fix was needed, commit it:

```bash
git add packages/core/metadata/forms/elements/table/rules.ts packages/core/metadata/forms/elements/table/preserveFromReferenceXML.test.ts
git commit -m "fix: :bug: довести порядок XML таблиц формы"
```

---

### Task 4: Final Project Verification

**Files:**
- No planned source edits.

- [ ] **Step 1: Run full test suite if closing the issue**

Run from repo root:

```bash
pnpm test
```

Expected: PASS.

- [ ] **Step 2: Inspect git status**

Run:

```bash
git status --short
```

Expected: only intentional source changes remain, already committed by earlier tasks.

- [ ] **Step 3: Report final evidence**

Include these facts in the final handoff:

```text
Focused table order test: PASS
Form element toXML tests: PASS
Core type-check: PASS or pre-existing unrelated failures listed
round-trip-yaml-1c acc: PASS, no Invalid name of form item command
pnpm test: PASS
```

---

## Self-Review

- Spec coverage: covered the chosen `order` fix in `TableRules`, no YAML format changes, no XML fixture changes, no new orchestration ordering mechanism.
- Placeholder scan: no placeholder markers.
- Type consistency: property names match `TableRules` keys and generated XML tags.
