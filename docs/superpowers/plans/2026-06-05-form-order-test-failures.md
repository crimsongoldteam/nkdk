# Form Order Test Failures Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the existing form XML/YAML order contract so the failing form order tests pass without changing XML fixtures.

**Architecture:** Keep the fix local to form rule declarations. `FormAttributeRules` defines XML property order for form attributes, and `ClientApplicationFormRules` defines YAML property order for the form body. Do not change the shared property ordering helpers.

**Tech Stack:** TypeScript, Vitest, pnpm, nkdk metadata rules.

---

## File Structure

- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/rules.ts`
  - Responsibility: declare property rules and XML/YAML order for form attributes.
- Modify: `packages/core/metadata/forms/clientApplicationForm/rules.ts`
  - Responsibility: declare form-level rules and YAML order for managed form sections.
- Test: `packages/core/metadata/forms/commonObjects/formAttribute/toXML.test.ts`
  - Existing failing tests prove `FormAttributeRules` XML order.
- Test: `packages/core/metadata/appliedObjects/__tests__/syncRoundTrip.test.ts`
  - Existing failing `metadataCommonForm` case proves form YAML order.

## Task 1: Restore `FormAttributeRules` XML Order

**Files:**
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/rules.ts`
- Test: `packages/core/metadata/forms/commonObjects/formAttribute/toXML.test.ts`

- [ ] **Step 1: Run the existing failing form attribute test**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/forms/commonObjects/formAttribute/toXML.test.ts
```

Expected before the fix: FAIL in:

```text
exportFormAttributesToXML > should export full
exportFormAttributesToXML > should export choice list
```

The relevant failure shape is order-only:

```text
Expected: Edit -> FillCheck -> MainAttribute -> Save -> SavedData -> Type -> UseAlways -> View
Received: Type -> MainAttribute -> View -> Edit -> UseAlways -> Save -> FillCheck -> SavedData
```

- [ ] **Step 2: Update `FormAttributeRules` order values**

In `packages/core/metadata/forms/commonObjects/formAttribute/rules.ts`, update only the `order` fields in `FormAttributeRules.properties`.

Use these exact order values:

```ts
valueType: {
  yaml: "ТипЗначения",
  type: "TypeDescription",
  xml: "Settings",
  order: 10,
  addTypeDescriptionAttributeToXML: true,
},
title: {
  yaml: "Заголовок",
  type: "I8nText",
  skipEmptyToXML: true,
  defaultValue: ({ context, name, operation }) => {
    if (operation === "importFromXML") {
      return {
        items: { [context.defaultLanguage]: "" },
      }
    }
    if (name === undefined) throw new Error("name is required for title default value")
    return {
      items: { [context.defaultLanguage]: splitPascalCase(name) },
    }
  },

  excludeIfEqualNameYAML: true,
  order: 0,
},
type: {
  yaml: "Тип",
  type: "TypeDescription",
  xml: "Type",
  useAsShortValueYAML: true,
  defaultValueXMLRaw: {},
  order: 6,
},

mainAttribute: {
  yaml: "ОсновнойРеквизит",
  xml: "MainAttribute",
  type: "boolean",
  order: 3,
},
storedData: {
  yaml: "СохраняемыеДанные",
  xml: "SavedData",
  type: "boolean",
  order: 5,
},
view: {
  yaml: "РазрешитьПросмотр",
  yamlDeny: "ЗапретитьПросмотр",
  type: "UserVisible",
  order: 8,
},
edit: {
  yaml: "РазрешитьРедактирование",
  yamlDeny: "ЗапретитьРедактирование",
  type: "UserVisible",
  order: 1,
},
fillCheck: {
  yaml: "ПроверкаЗаполнения",
  type: "SystemEnumeration",
  typeSE: "FillChecking",
  defaultValueYAML: "DontCheck",
  order: 2,
},
```

Also update these existing properties:

```ts
functionalOptions: {
  yaml: "ФункциональныеОпции",
  type: "FunctionalOptionsProperty",
  order: 9,
},
fieldsList: {
  yaml: "ИспользоватьВсегда",
  type: "FieldsList",
  xml: "UseAlways",
  order: 7,
},
save: {
  yaml: "Сохранение",
  type: "FieldsList",
  order: 4,
},
```

Leave all `Settings`-backed properties at `order: 10`:

```ts
valueType.order === 10
dynamicList.order === 10
chart.order === 10
ganttChart.order === 10
flowchartContext.order === 10
spreadsheetDocument.order === 10
planner.order === 10
```

Do not change `FormAttributeColumnRules`.

- [ ] **Step 3: Run the form attribute XML tests**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/forms/commonObjects/formAttribute/toXML.test.ts
```

Expected after the fix:

```text
Test Files  1 passed (1)
Tests  32 passed (32)
```

- [ ] **Step 4: Commit Task 1**

Run:

```bash
git add packages/core/metadata/forms/commonObjects/formAttribute/rules.ts
git commit -m "fix: :bug: восстановить порядок XML реквизитов формы"
```

## Task 2: Restore Form YAML Section Order

**Files:**
- Modify: `packages/core/metadata/forms/clientApplicationForm/rules.ts`
- Test: `packages/core/metadata/appliedObjects/__tests__/syncRoundTrip.test.ts`

- [ ] **Step 1: Run the existing failing `metadataCommonForm` sync test**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/appliedObjects/__tests__/syncRoundTrip.test.ts -t metadataCommonForm
```

Expected before the fix: FAIL in the `XML -> YAML sync` case for `metadataCommonForm`.

The relevant failure shape is order-only:

```text
Expected: Форма -> Реквизиты -> Элементы
Received: Форма -> Элементы -> Реквизиты
```

- [ ] **Step 2: Swap form-level `order` values for attributes and child items**

In `packages/core/metadata/forms/clientApplicationForm/rules.ts`, change only `childItems.order` and `attributes.order`.

Use this exact code for `childItems`:

```ts
childItems: {
  yaml: "Элементы",
  type: "GroupChildItems",
  tag: FormRulesTags.Form,
  defaultValue: [],
  required: true,
  order: 3,
},
```

Use this exact code for `attributes`:

```ts
attributes: {
  yaml: "Реквизиты",
  type: "FormAttributes",
  tag: FormRulesTags.Form,
  defaultValueXMLEmpty: [],
  order: 2,
},
```

Do not change `autoCommandBar.order`. It remains `order: 1`.

- [ ] **Step 3: Run the focused sync test**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/appliedObjects/__tests__/syncRoundTrip.test.ts -t metadataCommonForm
```

Expected after the fix:

```text
Test Files  1 passed (1)
Tests  2 passed | 36 skipped (38)
```

- [ ] **Step 4: Commit Task 2**

Run:

```bash
git add packages/core/metadata/forms/clientApplicationForm/rules.ts
git commit -m "fix: :bug: восстановить порядок YAML формы"
```

## Task 3: Final Verification

**Files:**
- No code changes.

- [ ] **Step 1: Run both focused checks together**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/forms/commonObjects/formAttribute/toXML.test.ts metadata/appliedObjects/__tests__/syncRoundTrip.test.ts -t "metadataCommonForm|exportFormAttributesToXML"
```

Expected:

```text
Test Files  2 passed (2)
```

If the `-t` filter excludes one file unexpectedly, run the two focused commands from Tasks 1 and 2 separately instead.

- [ ] **Step 2: Run full project tests**

Run from `/home/nikita/git/nkdk`:

```bash
pnpm test
```

Expected:

```text
Test Files ... passed
Tests ... passed
```

No failures in:

```text
metadata/forms/commonObjects/formAttribute/toXML.test.ts
metadata/appliedObjects/__tests__/syncRoundTrip.test.ts
metadata/forms/clientApplicationForm/convertFromXML.test.ts
```

- [ ] **Step 3: Check git status**

Run:

```bash
git status --short
```

Expected:

```text

```

The output should be empty after Task 1 and Task 2 commits.

## Self-Review

- Spec coverage: Task 1 covers `FormAttributeRules` XML order; Task 2 covers `ClientApplicationFormRules` YAML order; Task 3 covers focused and full verification.
- Scope: the plan changes only form rule files and does not modify XML fixtures or shared ordering helpers.
- Placeholder scan: no placeholders or deferred implementation steps remain.
- Type consistency: property names match the existing rule files: `valueType`, `title`, `type`, `mainAttribute`, `storedData`, `view`, `edit`, `fillCheck`, `functionalOptions`, `fieldsList`, `save`, `childItems`, `attributes`.
