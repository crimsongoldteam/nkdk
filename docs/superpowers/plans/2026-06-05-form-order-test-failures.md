# Form Order Test Failures Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align form XML/YAML order with real `/home/nikita/git/round-trip` exports and update stale unit fixtures.

**Architecture:** Keep the fix local to form attribute rule declarations and test fixtures. `FormAttributeRules` defines XML property order for form attributes; unit XML fixtures under `packages/core/tests/fixtures/formAttributes` and the `metadataCommonForm` sync YAML fixture must match real XML order. Do not change the shared property ordering helpers.

**Tech Stack:** TypeScript, Vitest, pnpm, nkdk metadata rules.

---

## File Structure

- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/rules.ts`
  - Responsibility: declare property rules and XML/YAML order for form attributes.
- Modify: `packages/core/tests/fixtures/formAttributes/full.xml`
  - Responsibility: expected XML for full form attribute export.
- Modify: `packages/core/tests/fixtures/formAttributes/choiceList.xml`
  - Responsibility: expected XML for ValueList form attribute export.
- Modify: `packages/core/metadata/appliedObjects/metadataCommonForm/__fixtures__/sync/yaml/КонстантаВсеСвойства/Свойства.yaml`
  - Responsibility: expected YAML for common form sync.
- Modify: `packages/core/metadata/appliedObjects/metadataCommonForm/__fixtures__/sync/data.ts`
  - Responsibility: string snapshot of the same expected YAML.
- Test: `packages/core/metadata/forms/commonObjects/formAttribute/toXML.test.ts`
  - Existing failing tests prove `FormAttributeRules` XML order.
- Test: `packages/core/metadata/appliedObjects/__tests__/syncRoundTrip.test.ts`
  - Existing failing `metadataCommonForm` case proves form YAML order.

## Task 1: Align `FormAttributeRules` and XML Fixtures with Real Order

**Files:**
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/rules.ts`
- Modify: `packages/core/tests/fixtures/formAttributes/full.xml`
- Modify: `packages/core/tests/fixtures/formAttributes/choiceList.xml`
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

The relevant failure shape is order-only. Current stale fixtures expect orders that do not occur in `/home/nikita/git/round-trip`:

```text
Settings -> Title -> Type
Edit -> FillCheck -> MainAttribute -> Save -> SavedData -> Type -> UseAlways -> View
```

- [ ] **Step 2: Update `FormAttributeRules` order values**

In `packages/core/metadata/forms/commonObjects/formAttribute/rules.ts`, update only the `order` fields in `FormAttributeRules.properties`.

Use these exact order values:

```ts
valueType: {
  yaml: "ТипЗначения",
  type: "TypeDescription",
  xml: "Settings",
  order: 99,
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
  order: 1,
},
type: {
  yaml: "Тип",
  type: "TypeDescription",
  xml: "Type",
  useAsShortValueYAML: true,
  defaultValueXMLRaw: {},
  order: 2,
},

mainAttribute: {
  yaml: "ОсновнойРеквизит",
  xml: "MainAttribute",
  type: "boolean",
  order: 5,
},
storedData: {
  yaml: "СохраняемыеДанные",
  xml: "SavedData",
  type: "boolean",
  order: 6,
},
view: {
  yaml: "РазрешитьПросмотр",
  yamlDeny: "ЗапретитьПросмотр",
  type: "UserVisible",
  order: 3,
},
edit: {
  yaml: "РазрешитьРедактирование",
  yamlDeny: "ЗапретитьРедактирование",
  type: "UserVisible",
  order: 4,
},
fillCheck: {
  yaml: "ПроверкаЗаполнения",
  type: "SystemEnumeration",
  typeSE: "FillChecking",
  defaultValueYAML: "DontCheck",
  order: 7,
},
```

Also update these existing properties:

```ts
functionalOptions: {
  yaml: "ФункциональныеОпции",
  type: "FunctionalOptionsProperty",
  order: 10,
},
fieldsList: {
  yaml: "ИспользоватьВсегда",
  type: "FieldsList",
  xml: "UseAlways",
  order: 8,
},
save: {
  yaml: "Сохранение",
  type: "FieldsList",
  order: 9,
},
```

Set all `Settings`-backed properties to `order: 99`:

```ts
valueType.order === 99
dynamicList.order === 99
chart.order === 99
ganttChart.order === 99
flowchartContext.order === 99
spreadsheetDocument.order === 99
planner.order === 99
```

Do not change `FormAttributeColumnRules`.

- [ ] **Step 3: Update stale expected XML fixtures**

Update `packages/core/tests/fixtures/formAttributes/choiceList.xml` to:

```xml
<Attribute name="ВыбранныеЗначения" id="1">
	<Title>
		<v8:item>
			<v8:lang>ru</v8:lang>
			<v8:content>Выбранные значения</v8:content>
		</v8:item>
	</Title>
	<Type>
		<v8:Type>v8:ValueListType</v8:Type>
	</Type>
	<Settings xsi:type="v8:TypeDescription">
		<v8:Type>cfg:CatalogRef.ДоговорыКонтрагентов</v8:Type>
	</Settings>
</Attribute>
```

Update `packages/core/tests/fixtures/formAttributes/full.xml` so the first attribute order is:

```text
Type -> View -> Edit -> MainAttribute -> SavedData -> FillCheck -> UseAlways -> Save
```

and the second attribute order is:

```text
Title -> Type -> View -> Edit -> SavedData -> FillCheck -> UseAlways -> FunctionalOptions
```

Keep both XML files without a trailing newline, matching the existing fixture reader expectations.

- [ ] **Step 4: Run the form attribute XML tests**

Run:

```bash
pnpm --dir packages/core exec vitest run metadata/forms/commonObjects/formAttribute/toXML.test.ts
```

Expected after the fix:

```text
Test Files  1 passed (1)
Tests  32 passed (32)
```

- [ ] **Step 5: Commit Task 1**

Run:

```bash
git add packages/core/metadata/forms/commonObjects/formAttribute/rules.ts packages/core/tests/fixtures/formAttributes/full.xml packages/core/tests/fixtures/formAttributes/choiceList.xml
git commit -m "fix: :bug: привести порядок XML реквизитов формы к выгрузке"
```

## Task 2: Align `metadataCommonForm` YAML Fixture with Real Section Order

**Files:**
- Modify: `packages/core/metadata/appliedObjects/metadataCommonForm/__fixtures__/sync/yaml/КонстантаВсеСвойства/Свойства.yaml`
- Modify: `packages/core/metadata/appliedObjects/metadataCommonForm/__fixtures__/sync/data.ts`
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

- [ ] **Step 2: Update YAML fixture order**

Real XML in `/home/nikita/git/round-trip` has `ChildItems` before `Attributes` in every checked form where both containers exist. Therefore keep `ClientApplicationFormRules` unchanged and update expected YAML fixtures.

In `packages/core/metadata/appliedObjects/metadataCommonForm/__fixtures__/sync/yaml/КонстантаВсеСвойства/Свойства.yaml`, move `Реквизиты` below `Элементы`:

```yaml
Форма:
  Элементы:
    КонстантаВсеСвойства:
      Вид: ПолеВвода
      РасширенноеРедактированиеМножественныхЗначений: Истина
      ПутьКДанным: НаборКонстант.КонстантаВсеСвойства
      РежимРедактирования: ВходПриВводе
  Реквизиты:
    НаборКонстант:
      Заголовок: ""
      Тип: КонстантыНабор
      ОсновнойРеквизит: Истина
      СохраняемыеДанные: Истина
```

Apply the same section order to `packages/core/metadata/appliedObjects/metadataCommonForm/__fixtures__/sync/data.ts`.

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
git add packages/core/metadata/appliedObjects/metadataCommonForm/__fixtures__/sync/yaml/КонстантаВсеСвойства/Свойства.yaml packages/core/metadata/appliedObjects/metadataCommonForm/__fixtures__/sync/data.ts
git commit -m "test: :white_check_mark: обновить порядок YAML общей формы"
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

- Spec coverage: Task 1 covers `FormAttributeRules` XML order and stale XML unit fixtures; Task 2 covers `metadataCommonForm` YAML fixture order; Task 3 covers focused and full verification.
- Scope: the plan changes only form rules and test fixtures under `packages/core`; it does not modify `/home/nikita/git/round-trip` XML sources or shared ordering helpers.
- Placeholder scan: no placeholders or deferred implementation steps remain.
- Type consistency: property names match the existing rule files and fixtures: `valueType`, `title`, `type`, `mainAttribute`, `storedData`, `view`, `edit`, `fillCheck`, `functionalOptions`, `fieldsList`, `save`, `Элементы`, `Реквизиты`.
