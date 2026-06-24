# Group Addition Elements In NKDK Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Support `SearchStringAddition`, `SearchControlAddition`, and `ViewStatusAddition` as ordinary group child elements in the form model and `.nkdk`.

**Architecture:** Make the supported-container contract explicit in three places: TypeScript child item unions, NKDK export dispatch, and Langium grammar. Keep command bar behavior unchanged and avoid fallback lookup between unrelated export maps.

**Tech Stack:** TypeScript, Langium grammar, Vitest, pnpm workspace.

---

## File Structure

- Modify `packages/core/metadata/forms/commonObjects/childItems/types.ts`: extend group child item unions to include the three addition element types.
- Modify `packages/core/metadata/orchestration/formElement/toNKDK/types.ts`: register addition element exporters for ordinary group export.
- Modify `packages/language/src/nkdk.langium`: allow `CommandAdditionField` in ordinary child items and one-line groups.
- Modify `packages/language/test/parsing.fixtures.ts`: add parser fixtures for group additions.
- Modify `packages/core/metadata/forms/elements/baseElement/fromNKDK.test.ts`: add NKDK import coverage for additions inside a regular group.
- Modify `packages/core/metadata/forms/elements/usualGroup/__fixtures__/data.ts`: add NKDK export fixture for group additions.

## Task 1: Add Failing Parser Fixtures

**Files:**
- Modify: `packages/language/test/parsing.fixtures.ts`
- Test: `packages/language/test/parsing.test.ts`

- [ ] **Step 1: Add parser fixtures**

Append these entries near the existing group fixtures in `packages/language/test/parsing.fixtures.ts`:

```ts
  {
    name: "vertical group with search string addition",
    input: `+Группа
*Ё?ОтображениеСтрокиПоиска СтрокаПоиска
*ё`,
    expected: {
      $type: "Group",
      group: "+",
      isMainAttribute: false,
      elementName: "Группа",
      childItems: [
        {
          $type: "CommandAdditionField",
          type: "?ОтображениеСтрокиПоиска",
          isMainAttribute: false,
          elementName: "СтрокаПоиска",
        },
      ],
    },
  },
  {
    name: "one-line group with search control addition",
    input: `=Группа ?УправлениеПоиском УправлениеПоиском`,
    expected: {
      $type: "Group",
      group: "=",
      isMainAttribute: false,
      elementName: "Группа",
      childItems: [
        {
          $type: "CommandAdditionField",
          type: "?УправлениеПоиском",
          isMainAttribute: false,
          elementName: "УправлениеПоиском",
        },
      ],
    },
  },
```

- [ ] **Step 2: Run parser tests and confirm failure**

Run:

```bash
pnpm --filter nkdk-language test -- parsing.test.ts
```

Expected: tests fail with parser errors for `CommandAdditionField` in a group.

## Task 2: Extend Langium Grammar

**Files:**
- Modify: `packages/language/src/nkdk.langium`
- Test: `packages/language/test/parsing.test.ts`

- [ ] **Step 1: Update grammar**

In `packages/language/src/nkdk.langium`, add `CommandAdditionField` to both ordinary child productions:

```langium
ChildItem:
     Group
    | Pages
    | ((PictureField
    | InputField
    | LabelField
    | OtherField
    | CommandAdditionField
    | LabelDecoration
    | PictureDecoration
    | CheckBoxField
    | CheckBoxFieldRightTitled
    | CheckBoxFieldSwitch
    | CheckBoxFieldSwitchRightTitled
    | CheckBoxFieldTumbler
    | CheckBoxFieldTumblerRightTitled
    | CommandBar
    | Button
    | Table)(NEWLINE | EOF)?);

OneLineGroupField:
    PictureField
    | InputField
    | LabelField
    | OtherField
    | CommandAdditionField
    | LabelDecoration
    | PictureDecoration
    | CheckBoxField
    | CheckBoxFieldRightTitled
    | CheckBoxFieldSwitch
    | CheckBoxFieldSwitchRightTitled
    | CheckBoxFieldTumbler
    | CheckBoxFieldTumblerRightTitled
    | Button
    | CommandBar;
```

- [ ] **Step 2: Regenerate Langium output**

Run:

```bash
pnpm --filter nkdk-language langium:generate
```

Expected: `Langium generator finished successfully`.

- [ ] **Step 3: Run parser tests**

Run:

```bash
pnpm --filter nkdk-language test -- parsing.test.ts
```

Expected: parser tests pass.

- [ ] **Step 4: Commit grammar changes**

Run:

```bash
git add packages/language/src/nkdk.langium packages/language/src/generated packages/language/syntaxes/nkdk.tmLanguage.json packages/language/test/parsing.fixtures.ts
git commit -m "✅ test: разрешить addition-элементы в nkdk-группах"
```

## Task 3: Add Failing NKDK Import Test

**Files:**
- Modify: `packages/core/metadata/forms/elements/baseElement/fromNKDK.test.ts`
- Test: `packages/core/metadata/forms/elements/baseElement/fromNKDK.test.ts`

- [ ] **Step 1: Add import test**

Add this test to `describe("import other field from structure", ...)`:

```ts
  it("should import command addition fields inside ordinary group", async () => {
    const form = await importFormFromNKDK(mockContext, [
      "+Группа",
      "*Ё?ОтображениеСтрокиПоиска СтрокаПоиска",
      "?УправлениеПоиском УправлениеПоиском",
      "?ОтображениеСостоянияПросмотра СостояниеПросмотра",
      "*ё",
    ])
    const group = form?.childItems[0]

    if (group?.itemType !== "UsualGroup") {
      throw new Error("Expected UsualGroup")
    }

    expect(group.childItems).toEqual([
      {
        itemType: "SearchStringAddition",
        name: "СтрокаПоиска",
      },
      {
        itemType: "SearchControlAddition",
        name: "УправлениеПоиском",
      },
      {
        itemType: "ViewStatusAddition",
        name: "СостояниеПросмотра",
      },
    ])
  })
```

- [ ] **Step 2: Run import test and confirm failure**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/forms/elements/baseElement/fromNKDK.test.ts
```

Expected: TypeScript or assertion failure because group child item unions do not yet include addition elements.

## Task 4: Extend Form Child Item Types

**Files:**
- Modify: `packages/core/metadata/forms/commonObjects/childItems/types.ts`
- Test: `packages/core/metadata/forms/elements/baseElement/fromNKDK.test.ts`

- [ ] **Step 1: Update child item unions**

In `packages/core/metadata/forms/commonObjects/childItems/types.ts`, add the additions to `GroupChildItem`:

```ts
export type GroupChildItem =
  | Button
  | CalendarField
  | ChartField
  | CheckBoxField
  | CommandBar
  | DendrogramField
  | FormattedDocumentField
  | GanttChartField
  | GeographicalSchemaField
  | GraphicalSchemaField
  | HTMLDocumentField
  | InputField
  | LabelDecoration
  | LabelField
  | Pages
  | PDFDocumentField
  | PeriodField
  | PictureDecoration
  | PictureField
  | PlannerField
  | ProgressBarField
  | RadioButtonField
  | SearchControlAddition
  | SearchStringAddition
  | SpreadSheetDocumentField
  | Table
  | TextDocumentField
  | TrackBarField
  | UsualGroup
  | ViewStatusAddition
```

Also add the same three entries to `GenerateChildItem`:

```ts
export type GenerateChildItem =
  | Button
  | CheckBoxField
  | CommandBar
  | InputField
  | LabelDecoration
  | LabelField
  | Page
  | Pages
  | PictureDecoration
  | SearchControlAddition
  | SearchStringAddition
  | Table
  | UsualGroup
  | ViewStatusAddition
  | OtherElement
```

- [ ] **Step 2: Run import test**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/forms/elements/baseElement/fromNKDK.test.ts
```

Expected: test passes.

## Task 5: Add Failing NKDK Export Fixture

**Files:**
- Modify: `packages/core/metadata/forms/elements/usualGroup/__fixtures__/data.ts`
- Test: `packages/core/metadata/forms/elements/usualGroup/toNKDK.test.ts`

- [ ] **Step 1: Add export fixture**

Append this object to `usualGroupStructureFixtures`:

```ts
  {
    name: "vertical group with addition elements",
    element: {
      name: "Группа",
      itemType: "UsualGroup",
      group: "Vertical",
      showTitle: false,
      childItems: [
        {
          name: "СтрокаПоиска",
          itemType: "SearchStringAddition",
        },
        {
          name: "УправлениеПоиском",
          itemType: "SearchControlAddition",
        },
        {
          name: "СостояниеПросмотра",
          itemType: "ViewStatusAddition",
        },
      ],
    },
    structured: {
      strings: [
        "+Группа",
        "  ?ОтображениеСтрокиПоиска СтрокаПоиска",
        "  ?УправлениеПоиском УправлениеПоиском",
        "  ?ОтображениеСостоянияПросмотра СостояниеПросмотра",
      ],
      toOneLineGroup: false,
    },
  },
```

- [ ] **Step 2: Run export test and confirm failure**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/forms/elements/usualGroup/toNKDK.test.ts
```

Expected: test fails with `exportFunction is not a function`.

## Task 6: Register Group Addition Exporters

**Files:**
- Modify: `packages/core/metadata/orchestration/formElement/toNKDK/types.ts`
- Test: `packages/core/metadata/forms/elements/usualGroup/toNKDK.test.ts`

- [ ] **Step 1: Add export map entries**

In `ExportToNKDKGeneratorFn`, add:

```ts
  SearchControlAddition: exportOtherElementToNKDK,
  SearchStringAddition: exportOtherElementToNKDK,
  ViewStatusAddition: exportOtherElementToNKDK,
```

Place them near `RadioButtonField` and the other `exportOtherElementToNKDK` entries.

- [ ] **Step 2: Run export test**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/forms/elements/usualGroup/toNKDK.test.ts
```

Expected: test passes.

- [ ] **Step 3: Run targeted core tests**

Run:

```bash
pnpm --filter @nakidka/core test -- metadata/forms/elements/baseElement/fromNKDK.test.ts metadata/forms/elements/usualGroup/toNKDK.test.ts
```

Expected: both test files pass.

- [ ] **Step 4: Commit core changes**

Run:

```bash
git add packages/core/metadata/forms/commonObjects/childItems/types.ts packages/core/metadata/orchestration/formElement/toNKDK/types.ts packages/core/metadata/forms/elements/baseElement/fromNKDK.test.ts packages/core/metadata/forms/elements/usualGroup/__fixtures__/data.ts
git commit -m "🐛 fix: поддержать addition-элементы в группах формы"
```

## Task 7: Verify Round-trip Representative And Full Test Suite

**Files:**
- No code changes expected.

- [ ] **Step 1: Verify representative form import**

Run:

```bash
pnpm --filter @nakidka/core exec tsx -e 'import "./metadata/forms/commonObjects/index"; import "./metadata/forms/elements"; import { convertFormFromXML } from "./metadata/forms/clientApplicationForm/convertFromXML"; void (async()=>{ const context={ defaultLanguage:"ru", version:"2.20", exportToYAML:{toTyped:false}, fromXML:{forReference:false} } as any; await convertFormFromXML({ context, inputDir:"/Users/nikita/git/round-trip-source/acc/Catalogs/КонтактныеЛица/Forms", formName:"ФормаВыбораЛидов", outputDir:"/private/tmp/nkdk-rt-debug/forms" }); console.log("ok") })()'
```

Expected: no `exportFunction is not a function`. If it fails with `Cannot read properties of undefined (reading 'ru')`, record that as the next independent error and do not broaden this fix.

- [ ] **Step 2: Regenerate Langium files**

Run:

```bash
pnpm --filter nkdk-language langium:generate
```

Expected: `Langium generator finished successfully`.

- [ ] **Step 3: Run full test suite**

Run:

```bash
pnpm test
```

Expected: all project tests pass.

- [ ] **Step 4: Commit generated files if needed**

Run:

```bash
git status --short
```

If Langium generated files changed and are not already committed, run:

```bash
git add packages/language/src/generated packages/language/syntaxes/nkdk.tmLanguage.json
git commit -m "🔧 chore: обновить сгенерированные nkdk-файлы"
```

If there are no changes, do not create an empty commit.
