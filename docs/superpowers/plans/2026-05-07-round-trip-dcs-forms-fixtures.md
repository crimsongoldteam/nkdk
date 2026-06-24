# Round-Trip DCS And Forms Fixtures Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve five short round-trip XML cases for DCS ordering, conditional appearance presentation, empty formatted tooltips, usual group child item width, and empty font face names.

**Architecture:** Keep the fixes local to existing metadata rules and common object serializers. Each task adds or extends the nearest existing fixture first, proves the current behavior fails, then applies the smallest rule or serializer change needed to make that fixture round-trip.

**Tech Stack:** TypeScript, Vitest, `@nakidka/core` metadata rules, XML fixtures, existing orchestration property export/import helpers.

---

## File Structure

- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/order/__fixtures__/full.xml`: add an `OrderItemField` with `<dcsset:use>false</dcsset:use>` before field/order type.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/order/__fixtures__/data.ts`: add the matching model and YAML fixture item.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/orderItemFields/rules.ts`: add explicit XML order for `use`, `field`, and `orderType`.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/conditionalAppearanceItem/__fixtures__/full.xml`: add top-level `dcsset:presentation xsi:type="xs:string"` to a conditional appearance item.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/conditionalAppearanceItem/__fixtures__/data.ts`: add the matching `presentation` model and YAML value.
- Modify `packages/core/metadata/commonObjects/dataCompositionSystem/conditionalAppearanceItem/rules.ts`: use `UserSettingPresentation` for `presentation`.
- Modify `packages/core/metadata/orchestration/metadataCollection/toXML.ts`: for collections without `keyField`, pass `referenceData[index]` to item export.
- Create `packages/core/metadata/forms/elements/extendedTooltip/__fixtures__/formattedEmptyTitle.xml`: isolated empty formatted title fixture.
- Modify `packages/core/metadata/forms/elements/extendedTooltip/__fixtures__/data.ts`: add `formattedEmptyTitleExtendedTooltip`.
- Modify `packages/core/metadata/forms/elements/extendedTooltip/fromXML.test.ts` and `toXML.test.ts`: cover the new fixture.
- Modify `packages/core/metadata/commonObjects/formattedI8nText/fromXML.ts`: preserve `_formatted` even when there are no `v8:item` nodes.
- Modify `packages/core/metadata/forms/elements/usualGroup/__fixtures__/full.xml`: add `<ChildItemsWidth>Equal</ChildItemsWidth>`.
- Modify `packages/core/metadata/forms/elements/usualGroup/__fixtures__/data.ts`: add `slaveItemsWidth` to model, YAML, and enterprise fixture.
- Modify `packages/core/metadata/forms/elements/usualGroup/rules.ts`: add `slaveItemsWidth` mapped to `ChildItemsWidth`.
- Modify `packages/core/tests/fixtures/font/data.ts`: add an empty `faceName` XML/model/YAML fixture.
- Modify `packages/core/metadata/commonObjects/font/fromXML.ts`, `toXML.ts`, and `toYAML.ts`: preserve empty string `faceName`.

---

### Task 1: Preserve `OrderItemField.use` Before Field

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/order/__fixtures__/full.xml`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/order/__fixtures__/data.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/orderItemFields/rules.ts`

- [ ] **Step 1: Add the failing XML fixture item**

In `packages/core/metadata/commonObjects/dataCompositionSystem/order/__fixtures__/full.xml`, add a third item before `dcsset:userSettingID`:

```xml
	<dcsset:item xsi:type="dcsset:OrderItemField">
		<dcsset:use>false</dcsset:use>
		<dcsset:field>Артикул</dcsset:field>
		<dcsset:orderType>Asc</dcsset:orderType>
	</dcsset:item>
```

The resulting `items` block should be:

```xml
	<dcsset:item xsi:type="dcsset:OrderItemField">
		<dcsset:field>Наименование</dcsset:field>
		<dcsset:orderType>Asc</dcsset:orderType>
	</dcsset:item>
	<dcsset:item xsi:type="dcsset:OrderItemField">
		<dcsset:field>Ссылка.Код</dcsset:field>
		<dcsset:orderType>Desc</dcsset:orderType>
	</dcsset:item>
	<dcsset:item xsi:type="dcsset:OrderItemField">
		<dcsset:use>false</dcsset:use>
		<dcsset:field>Артикул</dcsset:field>
		<dcsset:orderType>Asc</dcsset:orderType>
	</dcsset:item>
```

- [ ] **Step 2: Add the matching TS fixture item**

In `packages/core/metadata/commonObjects/dataCompositionSystem/order/__fixtures__/data.ts`, change `orderFixture.items` to:

```ts
  items: [
    { itemType: "OrderItemField", field: "Наименование" },
    { itemType: "OrderItemField", field: "Ссылка.Код", orderType: "Desc" },
    { itemType: "OrderItemField", field: "Артикул", use: false },
  ],
```

Change `fullOrderFixtureYAML.Элементы` to:

```ts
  Элементы: [
    { Поле: "Наименование" },
    { Поле: "Ссылка.Код", ТипУпорядочивания: "Убыв" },
    { Поле: "Артикул", Использование: "Ложь" },
  ],
```

- [ ] **Step 3: Run the focused test and verify red**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/commonObjects/dataCompositionSystem/order
```

Expected: `export Order to XML > exports full to XML` fails because XML output emits `dcsset:use` after `dcsset:orderType`.

- [ ] **Step 4: Add explicit order to `OrderItemFieldRules`**

In `packages/core/metadata/commonObjects/dataCompositionSystem/orderItemFields/rules.ts`, add explicit `order` values:

```ts
  properties: {
    use: {
      type: "boolean",
      xml: "dcsset:use",
      yaml: "Использование",
      implicitValueYAML: true,
      order: 1,
    },
    field: {
      type: "string",
      xml: "dcsset:field",
      yaml: "Поле",
      order: 2,
    },
    orderType: {
      type: "SystemEnumeration",
      typeSE: "DataCompositionSortDirection",
      xml: "dcsset:orderType",
      yaml: "ТипУпорядочивания",
      implicitValueYAML: "Asc",
      defaultValueXML: "Asc",
      order: 3,
    },
    viewMode: {
      type: "SystemEnumeration",
      typeSE: "DataCompositionSettingsItemViewMode",
      xml: "dcsset:viewMode",
      yaml: "РежимОтображения",
      implicitValueYAML: "Auto",
      order: 4,
    },
  },
```

- [ ] **Step 5: Run the focused tests and verify green**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/commonObjects/dataCompositionSystem/order packages/core/metadata/commonObjects/dataCompositionSystem/orderItemFields
```

Expected: all tests in both targets pass.

- [ ] **Step 6: Commit**

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem/order/__fixtures__/full.xml \
  packages/core/metadata/commonObjects/dataCompositionSystem/order/__fixtures__/data.ts \
  packages/core/metadata/commonObjects/dataCompositionSystem/orderItemFields/rules.ts
git commit -m "test: 🧪 сохранить порядок use в OrderItemField"
```

---

### Task 2: Preserve Conditional Appearance `xs:string` Presentation

**Files:**
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/conditionalAppearanceItem/__fixtures__/full.xml`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/conditionalAppearanceItem/__fixtures__/data.ts`
- Modify: `packages/core/metadata/commonObjects/dataCompositionSystem/conditionalAppearanceItem/rules.ts`
- Modify: `packages/core/metadata/orchestration/metadataCollection/toXML.ts`

- [ ] **Step 1: Add `xs:string` presentation to the XML fixture**

In `packages/core/metadata/commonObjects/dataCompositionSystem/conditionalAppearanceItem/__fixtures__/full.xml`, add this node inside the top-level `<dcsset:item>`, immediately after the closing `</dcsset:appearance>` and before `</dcsset:item>`:

```xml
		<dcsset:presentation xsi:type="xs:string">Выделение цветом состояния</dcsset:presentation>
```

- [ ] **Step 2: Add the matching model and YAML value**

In `packages/core/metadata/commonObjects/dataCompositionSystem/conditionalAppearanceItem/__fixtures__/data.ts`, update `fullConditionalAppearanceItems[0]`:

```ts
export const fullConditionalAppearanceItems: ConditionalAppearanceItem[] = [
  {
    itemType: "ConditionalAppearanceItem",
    fields: ["Реквизит2", "Реквизит2РасширеннаяПодсказка"],
    filter: fullFixtureFilter,
    appearance: fixtureAppearanceFields,
    presentation: { items: { ru: "Выделение цветом состояния" } },
  },
]
```

Update `fullConditionalAppearanceItemsYAML[0]`:

```ts
    Представление: "Выделение цветом состояния",
```

Place it next to `Оформление: fixtureAppearanceFieldsYAML`.

- [ ] **Step 3: Run the focused test and verify red**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/commonObjects/dataCompositionSystem/conditionalAppearanceItem
```

Expected: import/export tests fail because `presentation` typed as `I8nText` cannot import `xsi:type="xs:string"`.

- [ ] **Step 4: Change the rule type**

In `packages/core/metadata/commonObjects/dataCompositionSystem/conditionalAppearanceItem/rules.ts`, change:

```ts
    presentation: {
      type: "I8nText",
      xml: "dcsset:presentation",
      yaml: "Представление",
    },
```

to:

```ts
    presentation: {
      type: "UserSettingPresentation",
      xml: "dcsset:presentation",
      yaml: "Представление",
    },
```

- [ ] **Step 5: Pass reference metadata by index for keyless collections**

In `packages/core/metadata/orchestration/metadataCollection/toXML.ts`, update `result` construction so collections without `keyField` pass the reference item by index:

```ts
  const result = inputData.map((item, index) => {
    const referenceItem = keyField
      ? findReferenceByKey<Item>(item, referenceData, keyField as keyof Item)
      : referenceData?.[index]

    const exported = exportMetadataItemToXML({
      context,
      data: item,
      rule: itemRule,
      referenceData: referenceItem,
    })

    // Элемент коллекции без собственных свойств всё равно должен сохранить тег-обёртку.
    return exported ?? ({} as NamedElementXML)
  })
```

This is the accepted design for keyless XML collections: when no stable key exists, XML order is the reference identity.

- [ ] **Step 6: Run the focused tests and verify green**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run metadata/commonObjects/dataCompositionSystem/conditionalAppearanceItem metadata/commonObjects/dataCompositionSystem/userSettingPresentation metadata/orchestration/metadataCollection
```

Expected: all tests in all targets pass.

- [ ] **Step 7: Commit**

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem/conditionalAppearanceItem/__fixtures__/full.xml \
  packages/core/metadata/commonObjects/dataCompositionSystem/conditionalAppearanceItem/__fixtures__/data.ts \
  packages/core/metadata/commonObjects/dataCompositionSystem/conditionalAppearanceItem/rules.ts \
  packages/core/metadata/orchestration/metadataCollection/toXML.ts
git commit -m "fix: 🐛 сохранить строковое представление условного оформления"
```

---

### Task 3: Preserve Empty Formatted Extended Tooltip Title

**Files:**
- Create: `packages/core/metadata/forms/elements/extendedTooltip/__fixtures__/formattedEmptyTitle.xml`
- Modify: `packages/core/metadata/forms/elements/extendedTooltip/__fixtures__/data.ts`
- Modify: `packages/core/metadata/forms/elements/extendedTooltip/fromXML.test.ts`
- Modify: `packages/core/metadata/forms/elements/extendedTooltip/toXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/formattedI8nText/fromXML.ts`

- [ ] **Step 1: Create the XML fixture**

Create `packages/core/metadata/forms/elements/extendedTooltip/__fixtures__/formattedEmptyTitle.xml`:

```xml
<ExtendedTooltip name="ПолеВводаРасширеннаяПодсказка" id="1">
	<Width>14</Width>
	<Title formatted="true"/>
</ExtendedTooltip>
```

- [ ] **Step 2: Add the TS fixture**

In `packages/core/metadata/forms/elements/extendedTooltip/__fixtures__/data.ts`, add:

```ts
export const formattedEmptyTitleExtendedTooltip: ExtendedTooltip = {
  itemType: "ExtendedTooltip",
  width: 14,
  title: {
    formatted: true,
    items: {},
  },
}
```

- [ ] **Step 3: Add the import test**

In `packages/core/metadata/forms/elements/extendedTooltip/fromXML.test.ts`, extend the import:

```ts
import { formattedEmptyTitleExtendedTooltip, fullExtendedTooltip } from "./__fixtures__/data"
```

Add this `it` block:

```ts
  it("imports empty formatted title", () => {
    const xmlData = readAndParseXMLFile<{ ExtendedTooltip: unknown }>("formattedEmptyTitle.xml", fixturesDir)

    const result = importPropertyFromXML({
      context: mockContextFromXML(),
      rule,
      value: xmlData.ExtendedTooltip,
    })

    expect(result).toEqual(formattedEmptyTitleExtendedTooltip)
  })
```

- [ ] **Step 4: Add the export test**

In `packages/core/metadata/forms/elements/extendedTooltip/toXML.test.ts`, extend the import:

```ts
import { formattedEmptyTitleExtendedTooltip, fullExtendedTooltip, minimalExtendedTooltip } from "./__fixtures__/data"
```

Add this `it` block:

```ts
  it("exports empty formatted title", () => {
    const result = exportTooltip("ПолеВвода", formattedEmptyTitleExtendedTooltip)
    const expected = readXMLFileAsString("formattedEmptyTitle.xml", fixturesDir)

    expect(result).toEqual(expected)
  })
```

- [ ] **Step 5: Run the focused test and verify red**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/forms/elements/extendedTooltip
```

Expected: import test fails because `FormattedI8nText.fromXML` returns `undefined` for `<Title formatted="true"/>`.

- [ ] **Step 6: Preserve formatted flag without text items**

In `packages/core/metadata/commonObjects/formattedI8nText/fromXML.ts`, replace the body after the `xml === undefined` guard with:

```ts
  const formatted = importBooleanFromXML(context, undefined, xml._formatted) ?? false
  const resultI8nText = importI8nTextFromXML(context, rule, xml)

  if (resultI8nText === undefined) {
    if (xml._formatted === undefined) return undefined
    return {
      formatted,
      items: {},
    }
  }

  return {
    formatted,
    items: resultI8nText.items,
  }
```

- [ ] **Step 7: Run the focused tests and verify green**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/forms/elements/extendedTooltip packages/core/metadata/commonObjects/formattedI8nText
```

Expected: all tests in both targets pass.

- [ ] **Step 8: Commit**

```bash
git add packages/core/metadata/forms/elements/extendedTooltip/__fixtures__/formattedEmptyTitle.xml \
  packages/core/metadata/forms/elements/extendedTooltip/__fixtures__/data.ts \
  packages/core/metadata/forms/elements/extendedTooltip/fromXML.test.ts \
  packages/core/metadata/forms/elements/extendedTooltip/toXML.test.ts \
  packages/core/metadata/commonObjects/formattedI8nText/fromXML.ts
git commit -m "fix: 🐛 сохранить пустой форматированный заголовок подсказки"
```

---

### Task 4: Preserve `UsualGroup.ChildItemsWidth`

**Files:**
- Modify: `packages/core/metadata/forms/elements/usualGroup/__fixtures__/full.xml`
- Modify: `packages/core/metadata/forms/elements/usualGroup/__fixtures__/data.ts`
- Modify: `packages/core/metadata/forms/elements/usualGroup/rules.ts`

- [ ] **Step 1: Add `ChildItemsWidth` to the XML fixture**

In `packages/core/metadata/forms/elements/usualGroup/__fixtures__/full.xml`, add:

```xml
	<ChildItemsWidth>Equal</ChildItemsWidth>
```

Place it after `<Representation>StrongSeparation</Representation>` and before `<ShowTitle>false</ShowTitle>`.

- [ ] **Step 2: Add the model property**

In `packages/core/metadata/forms/elements/usualGroup/__fixtures__/data.ts`, add this property to `fullUsualGroup`:

```ts
  slaveItemsWidth: "Equal",
```

Place it near `representation` and `showTitle`.

- [ ] **Step 3: Add the YAML fixture property**

In `fullUsualGroupPartialYAML`, add:

```ts
  ШиринаПодчиненныхЭлементов: "Одинаковая",
```

- [ ] **Step 4: Add the enterprise fixture property**

In `fullUsualGroupEnterprise`, add:

```ts
  SlaveItemsWidth: { Type: "SystemEnumeration", Value: "ChildFormItemsWidth.Equal" },
```

Place it near `Representation` and `ShowTitle`. This fixture uses `satisfies Required<UsualGroupEnterprise>`, so the enterprise field must be present after `UsualGroupRules` gains `slaveItemsWidth`.

- [ ] **Step 5: Run the focused test and verify red**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/forms/elements/__tests__/fromXML.test.ts packages/core/metadata/forms/elements/__tests__/toXML.test.ts -t UsualGroup
```

Expected: import/export XML tests for `UsualGroup` fail because `ChildItemsWidth` is not described in `UsualGroupRules`.

- [ ] **Step 6: Add `slaveItemsWidth` to `UsualGroupRules`**

In `packages/core/metadata/forms/elements/usualGroup/rules.ts`, add this property after `representation`:

```ts
    slaveItemsWidth: {
      yaml: "ШиринаПодчиненныхЭлементов",
      xml: "ChildItemsWidth",
      type: "SystemEnumeration",
      typeSE: "ChildFormItemsWidth",
    },
```

- [ ] **Step 7: Run focused XML/YAML tests and verify green**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/forms/elements/__tests__/fromXML.test.ts packages/core/metadata/forms/elements/__tests__/toXML.test.ts packages/core/metadata/forms/elements/__tests__/fromYAML.test.ts packages/core/metadata/forms/elements/__tests__/toYAML.test.ts -t UsualGroup
```

Expected: all `UsualGroup` tests in these targets pass.

- [ ] **Step 8: Commit**

```bash
git add packages/core/metadata/forms/elements/usualGroup/__fixtures__/full.xml \
  packages/core/metadata/forms/elements/usualGroup/__fixtures__/data.ts \
  packages/core/metadata/forms/elements/usualGroup/rules.ts
git commit -m "fix: 🐛 сохранить ширину подчиненных элементов группы"
```

---

### Task 5: Preserve Empty `Font.faceName`

**Files:**
- Modify: `packages/core/tests/fixtures/font/data.ts`
- Modify: `packages/core/metadata/commonObjects/font/fromXML.ts`
- Modify: `packages/core/metadata/commonObjects/font/toXML.ts`
- Modify: `packages/core/metadata/commonObjects/font/toYAML.ts`

- [ ] **Step 1: Add the empty faceName fixture**

In `packages/core/tests/fixtures/font/data.ts`, add before `fontYAMLFixtures`:

```ts
// #region emptyFaceNameFullFont

export const emptyFaceNameFullFont: Font = {
  faceName: "",
  kind: "Absolute",
  height: 12,
  bold: false,
  italic: false,
  underline: false,
  strikeout: false,
  scale: 100,
}

export const emptyFaceNameFullFontYAML: FontYAML = {
  Имя: "",
  Размер: 12,
  Масштаб: 100,
  Наклонный: "Ложь",
  Подчеркивание: "Ложь",
  Полужирный: "Ложь",
  Зачеркивание: "Ложь",
}

// #endregion
```

Then add this fixture object to `fontYAMLFixtures`:

```ts
  {
    name: "empty faceName full",
    xml: `<Font faceName="" height="12" bold="false" italic="false" underline="false" strikeout="false" kind="Absolute" scale="100"/>`,
    font: emptyFaceNameFullFont,
    yaml: emptyFaceNameFullFontYAML,
    preview: {
      Type: "Font",
      Name: "",
      Scale: 100,
      Height: 12,
      Bold: false,
      Italic: false,
      Underline: false,
      Strikeout: false,
    },
  },
```

- [ ] **Step 2: Run the focused test and verify red**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/commonObjects/font
```

Expected: XML import/export and YAML export tests fail because empty `faceName` is dropped.

- [ ] **Step 3: Preserve empty faceName on XML import**

In `packages/core/metadata/commonObjects/font/fromXML.ts`, replace:

```ts
  if (xml._faceName) result.faceName = xml._faceName
```

with:

```ts
  if (xml._faceName !== undefined) result.faceName = xml._faceName
```

- [ ] **Step 4: Preserve empty faceName on XML export**

In `packages/core/metadata/commonObjects/font/toXML.ts`, replace:

```ts
  if (font.faceName) result._faceName = font.faceName
```

with:

```ts
  if (font.faceName !== undefined) result._faceName = font.faceName
```

- [ ] **Step 5: Preserve empty faceName on YAML export**

In `packages/core/metadata/commonObjects/font/toYAML.ts`, replace:

```ts
    if (font.faceName) result.Имя = font.faceName
```

with:

```ts
    if (font.faceName !== undefined) result.Имя = font.faceName
```

Replace:

```ts
  return font.faceName || convertRefToYAML(_context, font.ref, font.kind)
```

with:

```ts
  return font.faceName !== undefined ? font.faceName : convertRefToYAML(_context, font.ref, font.kind)
```

- [ ] **Step 6: Run the focused tests and verify green**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run packages/core/metadata/commonObjects/font
```

Expected: all font tests pass.

- [ ] **Step 7: Commit**

```bash
git add packages/core/tests/fixtures/font/data.ts \
  packages/core/metadata/commonObjects/font/fromXML.ts \
  packages/core/metadata/commonObjects/font/toXML.ts \
  packages/core/metadata/commonObjects/font/toYAML.ts
git commit -m "fix: 🐛 сохранить пустое имя шрифта"
```

---

### Task 6: Final Focused Verification

**Files:**
- No file edits expected.

- [ ] **Step 1: Run all focused tests touched by the plan**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run \
  packages/core/metadata/commonObjects/dataCompositionSystem/order \
  packages/core/metadata/commonObjects/dataCompositionSystem/orderItemFields \
  packages/core/metadata/commonObjects/dataCompositionSystem/conditionalAppearanceItem \
  packages/core/metadata/commonObjects/dataCompositionSystem/userSettingPresentation \
  packages/core/metadata/forms/elements/extendedTooltip \
  packages/core/metadata/commonObjects/formattedI8nText \
  packages/core/metadata/forms/elements/__tests__/fromXML.test.ts \
  packages/core/metadata/forms/elements/__tests__/toXML.test.ts \
  packages/core/metadata/forms/elements/__tests__/fromYAML.test.ts \
  packages/core/metadata/forms/elements/__tests__/toYAML.test.ts \
  packages/core/metadata/commonObjects/font
```

Expected: all listed tests pass.

- [ ] **Step 2: Check git status**

Run:

```bash
git status --short
```

Expected: clean working tree after task commits.

- [ ] **Step 3: Report handoff**

Report:

```text
Implemented five round-trip fixture fixes on branch codex/round-trip-issues-2-5.
Focused tests passed.
Full pnpm test was not run; run it from the repository root before merging.
```

---

## Self-Review

- Spec coverage: tasks cover OrderItemField ordering, ConditionalAppearanceItem presentation, ExtendedTooltip empty formatted title, UsualGroup ChildItemsWidth, and Font empty faceName.
- Placeholder scan: no TBD/TODO/fill-in-later steps remain. Each code-changing step includes concrete snippets and exact paths.
- Type consistency: property names match existing code style: `use`, `field`, `orderType`, `presentation`, `title`, `slaveItemsWidth`, `faceName`.
