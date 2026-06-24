# Form Round Trip Diffs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Исправить три независимых расхождения short round-trip формы: обязательный `<Presentation/>` у `FormChoiceListDesTimeValue`, обязательный пустой `<Type/>` у `FormAttribute`, сохранение `id` команд формы из reference XML.

**Architecture:** Каждое поведение закрепляется узким тестом рядом с владельцем правила. `ChoiceParameters` остаётся контейнером и делегирует значение в `MetadataValue`; `FormAttribute.Type` получает XML-дефолт через `rules.ts`; `FormCommand` получает явный XML-экспорт коллекции по паттерну `FormAttribute` с поиском reference по `name`.

**Tech Stack:** TypeScript, Vitest, pnpm, `xmlExport`, существующий слой `packages/core/metadata/orchestration`.

---

## Files

- Modify: `packages/core/metadata/commonObjects/metadataValue/formChoiceList/__fixtures__/data.ts`
  - Добавить модель `withoutPresentation` и XML-строку `withoutPresentationXML`.
- Modify: `packages/core/metadata/commonObjects/metadataValue/formChoiceList/toXML.test.ts`
  - Добавить красный export-тест на обязательный пустой `<Presentation/>`.
- Modify: `packages/core/metadata/commonObjects/metadataValue/formChoiceList/toXML.ts`
  - При `presentation === undefined` выгружать `Presentation: {}`.
- Modify: `packages/core/metadata/commonObjects/сhoiceParameters/__fixtures__/form/boolean.xml`
  - Добавить `<Presentation/>` в `FormChoiceListDesTimeValue`.
- Modify: `packages/core/metadata/commonObjects/сhoiceParameters/__fixtures__/form/enum.xml`
  - Добавить `<Presentation/>` в `FormChoiceListDesTimeValue`.
- Modify: `packages/core/tests/fixtures/formAttributes/data.ts`
  - Добавить модель `withoutTypeFormAttribute`.
- Create: `packages/core/tests/fixtures/formAttributes/withoutType.xml`
  - XML-фикстура атрибута без `type` в модели, но с пустым `<Type/>`.
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/fromXML.test.ts`
  - Добавить import-тест, подтверждающий, что `<Type/>` не меняет модель.
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/toXML.test.ts`
  - Добавить красный export-тест, ожидающий `<Type/>`.
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/rules.ts`
  - Добавить `defaultValueXMLRaw: {}` к правилу `type`.
- Modify: `packages/core/metadata/forms/commonObjects/formCommand/__fixtures__/data.ts`
  - Синхронизировать модели и YAML с обновлёнными XML-фикстурами из 1С.
- Modify: `packages/core/metadata/forms/commonObjects/formCommand/types.ts`
  - Передать явные XML import/export функции в существующий `registerMetadataItemCollectionRule`.
- Create: `packages/core/metadata/forms/commonObjects/formCommand/fromXML.ts`
  - Добавить импорт `FormCommands` с локальным алиасом `TextPicture -> PictureAndText`.
- Create: `packages/core/metadata/forms/commonObjects/formCommand/toXML.ts`
  - Добавить экспорт `FormCommands` с локальным алиасом `PictureAndText -> TextPicture`; позже расширить его поиском reference-команды по `name`.
- Modify: `packages/core/metadata/forms/clientApplicationForm/toXML.test.ts`
  - Добавить тест на сохранение `id` команд из `referenceForm.commands`.

## Task 1: FormChoiceListDesTimeValue emits empty Presentation

**Files:**
- Modify: `packages/core/metadata/commonObjects/metadataValue/formChoiceList/__fixtures__/data.ts`
- Modify: `packages/core/metadata/commonObjects/metadataValue/formChoiceList/toXML.test.ts`
- Modify: `packages/core/metadata/commonObjects/metadataValue/formChoiceList/toXML.ts`
- Modify: `packages/core/metadata/commonObjects/сhoiceParameters/__fixtures__/form/boolean.xml`
- Modify: `packages/core/metadata/commonObjects/сhoiceParameters/__fixtures__/form/enum.xml`

- [ ] **Step 1: Add the failing formChoiceList fixture**

In `packages/core/metadata/commonObjects/metadataValue/formChoiceList/__fixtures__/data.ts`, add this block after `withStringValueYAML`:

```ts
export const withoutPresentation: MetadataFormChoiceListValue = {
  type: "formChoiceListDesTimeValue",
  value: { type: "boolean", value: true },
}

export const withoutPresentationXML = `<Value xsi:type="FormChoiceListDesTimeValue">
	<Presentation/>
	<Value xsi:type="xs:boolean">true</Value>
</Value>`
```

- [ ] **Step 2: Write the failing export test**

In `packages/core/metadata/commonObjects/metadataValue/formChoiceList/toXML.test.ts`, update imports to include the new fixture and `xmlExport`:

```ts
import { xmlExport } from "~/xml/export/exporter"
import {
  withMultiLangPresentation,
  withStringValue,
  withoutPresentation,
  withoutPresentationXML,
} from "./__fixtures__/data"
```

Then add this test inside `describe("exportFormChoiceListToXML", ...)`:

```ts
it("should export empty presentation when presentation is undefined", () => {
  const xmlNode = exportFormChoiceListToXML(mockContext, withoutPresentation)
  const result = xmlExport({ Value: xmlNode }, false)

  expect(result).toEqual(withoutPresentationXML)
})
```

- [ ] **Step 3: Update ChoiceParameters XML expectations**

Replace `packages/core/metadata/commonObjects/сhoiceParameters/__fixtures__/form/boolean.xml` with:

```xml
<ChoiceParameters>
	<app:item name="БезПроизводныхЗначений">
		<app:value xsi:type="FormChoiceListDesTimeValue">
			<Presentation/>
			<Value xsi:type="xs:boolean">true</Value>
		</app:value>
	</app:item>
</ChoiceParameters>
```

Replace `packages/core/metadata/commonObjects/сhoiceParameters/__fixtures__/form/enum.xml` with:

```xml
<ChoiceParameters>
	<app:item name="Отбор.ТипСчета">
		<app:value xsi:type="FormChoiceListDesTimeValue">
			<Presentation/>
			<Value xsi:type="xr:DesignTimeRef">Enum.ТипыСчетов.EnumValue.НераспределеннаяПрибыль</Value>
		</app:value>
	</app:item>
</ChoiceParameters>
```

- [ ] **Step 4: Run tests and verify they fail**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run \
  packages/core/metadata/commonObjects/metadataValue/formChoiceList/toXML.test.ts \
  packages/core/metadata/commonObjects/сhoiceParameters/toXML.test.ts \
  -t "empty presentation|form boolean|form enum"
```

Expected:

- `should export empty presentation when presentation is undefined` fails because `Presentation` is missing.
- `should export choice parameters with form boolean value correctly` fails because `Presentation` is missing.
- `should export choice parameters with form enum value correctly` fails because `Presentation` is missing.

- [ ] **Step 5: Implement minimal formChoiceList export change**

In `packages/core/metadata/commonObjects/metadataValue/formChoiceList/toXML.ts`, replace the return block with:

```ts
  return {
    "_xsi:type": "FormChoiceListDesTimeValue",
    Presentation: exportI8nTextToXML(context, { type: "I8nText" }, data.presentation) ?? {},
    Value: valueXML,
  } as MetadataFormChoiceListValueXML
```

- [ ] **Step 6: Run focused tests and verify they pass**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run \
  packages/core/metadata/commonObjects/metadataValue/formChoiceList/toXML.test.ts \
  packages/core/metadata/commonObjects/сhoiceParameters/toXML.test.ts \
  -t "empty presentation|form boolean|form enum"
```

Expected: all selected tests pass.

- [ ] **Step 7: Commit Task 1**

Run:

```bash
git add \
  packages/core/metadata/commonObjects/metadataValue/formChoiceList/__fixtures__/data.ts \
  packages/core/metadata/commonObjects/metadataValue/formChoiceList/toXML.test.ts \
  packages/core/metadata/commonObjects/metadataValue/formChoiceList/toXML.ts \
  packages/core/metadata/commonObjects/сhoiceParameters/__fixtures__/form/boolean.xml \
  packages/core/metadata/commonObjects/сhoiceParameters/__fixtures__/form/enum.xml
git commit -m "fix: :bug: выгружать Presentation в FormChoiceList"
```

## Task 2: FormAttribute emits empty Type

**Files:**
- Modify: `packages/core/tests/fixtures/formAttributes/data.ts`
- Create: `packages/core/tests/fixtures/formAttributes/withoutType.xml`
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/fromXML.test.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/toXML.test.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formAttribute/rules.ts`

- [ ] **Step 1: Add the FormAttribute model fixture**

In `packages/core/tests/fixtures/formAttributes/data.ts`, add this block after the `//#endregion` for `WithEmptySettings`:

```ts
//#region WithoutType

export const withoutTypeFormAttribute: FormAttributes = [
  {
    name: "СтруктураБыстрогоОтбора",
    title: { items: { ru: "Структура быстрого отбора" } },
    itemType: "FormAttribute",
    columns: [],
  },
]

//#endregion
```

- [ ] **Step 2: Add the XML fixture with empty Type**

Create `packages/core/tests/fixtures/formAttributes/withoutType.xml`:

```xml
<Attribute name="СтруктураБыстрогоОтбора" id="1">
	<Title>
		<v8:item>
			<v8:lang>ru</v8:lang>
			<v8:content>Структура быстрого отбора</v8:content>
		</v8:item>
	</Title>
	<Type/>
</Attribute>
```

- [ ] **Step 3: Write the import test**

In `packages/core/metadata/forms/commonObjects/formAttribute/fromXML.test.ts`, add `withoutTypeFormAttribute` to the fixture import:

```ts
  withoutTypeFormAttribute,
```

Then add this test inside `describe("importFormAttributesFromXML", ...)`:

```ts
it("should import without type", () => {
  const xmlData = readAndParseXMLFile<{ Attribute: FormAttributesXML }>("formAttributes/withoutType.xml")

  const result = importFormAttributesFromXML(mockContextFromXML(), mockRule, xmlData)

  expect(result).toEqual(withoutTypeFormAttribute)
})
```

- [ ] **Step 4: Write the failing export test**

In `packages/core/metadata/forms/commonObjects/formAttribute/toXML.test.ts`, add `withoutTypeFormAttribute` to the fixture import:

```ts
  withoutTypeFormAttribute,
```

Then add this test inside `describe("exportFormAttributesToXML", ...)`:

```ts
it("should export without type", () => {
  const expectedResult = readXMLFileAsString("formAttributes/withoutType.xml")

  const context = mockContextToXML()
  const xmlData = exportFormAttributesToXML(context, mockRule, withoutTypeFormAttribute)

  setIdsToElements(context)

  const result = xmlExport(xmlData!, false)

  expect(result).toEqual(expectedResult)
})
```

- [ ] **Step 5: Run tests and verify the export test fails**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run \
  packages/core/metadata/forms/commonObjects/formAttribute/fromXML.test.ts \
  packages/core/metadata/forms/commonObjects/formAttribute/toXML.test.ts \
  -t "without type"
```

Expected:

- `should import without type` passes.
- `should export without type` fails because `<Type/>` is missing.

- [ ] **Step 6: Add the XML default in rules.ts**

In `packages/core/metadata/forms/commonObjects/formAttribute/rules.ts`, update the `type` rule:

```ts
    type: {
      yaml: "Тип",
      type: "TypeDescription",
      xml: "Type",
      useAsShortValueYAML: true,
      defaultValueXMLRaw: {},
    },
```

- [ ] **Step 7: Run focused tests and verify they pass**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run \
  packages/core/metadata/forms/commonObjects/formAttribute/fromXML.test.ts \
  packages/core/metadata/forms/commonObjects/formAttribute/toXML.test.ts \
  -t "without type"
```

Expected: both selected tests pass.

- [ ] **Step 8: Commit Task 2**

Run:

```bash
git add \
  packages/core/tests/fixtures/formAttributes/data.ts \
  packages/core/tests/fixtures/formAttributes/withoutType.xml \
  packages/core/metadata/forms/commonObjects/formAttribute/fromXML.test.ts \
  packages/core/metadata/forms/commonObjects/formAttribute/toXML.test.ts \
  packages/core/metadata/forms/commonObjects/formAttribute/rules.ts
git commit -m "fix: :bug: выгружать пустой Type реквизита формы"
```

## Task 3: FormCommand fixtures and local TextPicture alias

**Files:**
- Modify: `packages/core/metadata/forms/commonObjects/formCommand/__fixtures__/data.ts`
- Create: `packages/core/metadata/forms/commonObjects/formCommand/fromXML.ts`
- Create: `packages/core/metadata/forms/commonObjects/formCommand/toXML.ts`
- Modify: `packages/core/metadata/forms/commonObjects/formCommand/types.ts`

- [ ] **Step 1: Update FormCommand data fixtures from XML**

In `packages/core/metadata/forms/commonObjects/formCommand/__fixtures__/data.ts`, replace the full and minimal fixture exports with:

```ts
export const fullFormCommands: Omit<Required<FormCommand>, "id">[] = [
  {
    itemType: "FormCommand",
    name: "СоставКомплектаПодобратьФайлы",
    title: { items: { ru: "Заголовок" } },
    toolTip: { items: { ru: "Подсказка" } },
    use: {
      common: true,
      values: [{ name: "Администратор", value: false }],
    },
    shortcut: "S",
    picture: {
      ref: "Properties",
      type: "StandardPicture",
      loadTransparent: true,
      transparentPixel: undefined,
    },
    action: "Действие",
    representation: "PictureAndText",
    currentRowUse: "DontUse",
    modifiesSavedData: true,
    table: { type: "string" as const, value: "Таблица" },
  },
]

export const fullFormCommandsYAML: FormCommandsYAML = {
  СоставКомплектаПодобратьФайлы: {
    Заголовок: "Заголовок",
    Подсказка: "Подсказка",
    Действие: "Действие",
    СочетаниеКлавиш: "S",
    ОтображениеКнопки: "КартинкаИТекст",
    ИзменяемыеДанные: "Истина",
    Картинка: "Свойства",
    ИспользованиеТекущейСтроки: "НеИспользует",
    РазрешитьИспользование: { Администратор: "Ложь" },
    Таблица: "Таблица",
  },
}

export const minimalFormCommands: FormCommand[] = [
  {
    itemType: "FormCommand",
    name: "ПоУмолчанию",
    title: { items: { ru: "По умолчанию" } },
  },
]

export const minimalFormCommandsFromXML: FormCommand[] = [
  {
    itemType: "FormCommand",
    name: "ПоУмолчанию",
    title: { items: { ru: "По умолчанию" } },
  },
]

export const minimalFormCommandsImportedFromYAML: FormCommand[] = [
  {
    itemType: "FormCommand",
    name: "ПоУмолчанию",
    title: { items: { ru: "По умолчанию" } },
  },
]

export const minimalFormCommandYAML: FormCommandsYAML = {
  ПоУмолчанию: {
    Заголовок: "По умолчанию",
  },
}
```

- [ ] **Step 2: Add FormCommands import with local representation alias**

Create `packages/core/metadata/forms/commonObjects/formCommand/fromXML.ts`:

```ts
import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { importMetadataItemCollectionFromXML } from "~/metadata/orchestration/metadataCollection/fromXML"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { FormCommandRules } from "./rules"
import { FormCommandsXML } from "./types"

const importFormCommandsDefaultFromXML = importMetadataItemCollectionFromXML(FormCommandRules, "Command")

export const importFormCommandsFromXML = (
  context: ConfigurationContextFromXML,
  rule: PropertyRule,
  xml: { Command: FormCommandsXML } | undefined
) => {
  const result = importFormCommandsDefaultFromXML(context, rule, xml)

  return result?.map((command) => ({
    ...command,
    representation: command.representation === "TextPicture" ? "PictureAndText" : command.representation,
  }))
}
```

- [ ] **Step 3: Add FormCommands export with local representation alias**

Create `packages/core/metadata/forms/commonObjects/formCommand/toXML.ts`:

```ts
import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { ExportToXMLFunctionNew, exportPropertiesToXML } from "~/metadata/orchestration"
import { FormCommandRules } from "./rules"
import type { FormCommand, FormCommands, FormCommandXML } from "./types"

export const exportFormCommandsToXML: ExportToXMLFunctionNew = (params): { Command: FormCommandXML[] } | undefined => {
  const context = params.context as ConfigurationContextWithExportToXML
  const data = params.value as FormCommands | undefined

  if (data === undefined || data === null) return undefined
  if (data.length === 0) return { Command: [] }

  const result = data.map((command) => exportFormCommandToXML(context, command))

  return { Command: result }
}

const exportFormCommandToXML = (
  context: ConfigurationContextWithExportToXML,
  data: FormCommand,
  referenceData?: FormCommand
): FormCommandXML => {
  const result: FormCommandXML = {
    _name: data.name,
    _id: "",
  }

  const properties = exportPropertiesToXML({
    context,
    metadata: data,
    referenceMetadata: referenceData,
    rule: FormCommandRules,
  })

  Object.assign(result, properties)

  if (result.Representation === "PictureAndText") {
    result.Representation = "TextPicture" as typeof result.Representation
  }

  return result
}

```

- [ ] **Step 4: Register explicit FormCommands XML import/export**

In `packages/core/metadata/forms/commonObjects/formCommand/types.ts`, add imports:

```ts
import { importFormCommandsFromXML } from "./fromXML"
import { exportFormCommandsToXML } from "./toXML"
```

Then update the existing `registerMetadataItemCollectionRule` call:

```ts
registerMetadataItemCollectionRule({
  propertyType: "FormCommands",
  itemRule: FormCommandRules,
  xmlElement: "Command",
  keyField: "name",
  fromXML: importFormCommandsFromXML,
  toXML: exportFormCommandsToXML,
})
```

- [ ] **Step 5: Run formCommand tests and verify they pass**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run \
  packages/core/metadata/forms/commonObjects/formCommand/fromXML.test.ts \
  packages/core/metadata/forms/commonObjects/formCommand/toXML.test.ts \
  packages/core/metadata/forms/commonObjects/formCommand/fromYAML.test.ts \
  packages/core/metadata/forms/commonObjects/formCommand/toYAML.test.ts
```

Expected: all tests in all four files pass.

- [ ] **Step 6: Commit Task 3**

Run:

```bash
git add \
  packages/core/metadata/forms/commonObjects/formCommand/__fixtures__/data.ts \
  packages/core/metadata/forms/commonObjects/formCommand/fromXML.ts \
  packages/core/metadata/forms/commonObjects/formCommand/toXML.ts \
  packages/core/metadata/forms/commonObjects/formCommand/types.ts
git commit -m "fix: :bug: синхронизировать фикстуры команд формы"
```

## Task 4: FormCommand preserves reference ids

**Files:**
- Modify: `packages/core/metadata/forms/commonObjects/formCommand/toXML.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/toXML.test.ts`

- [ ] **Step 1: Write the failing clientApplicationForm export test**

In `packages/core/metadata/forms/clientApplicationForm/toXML.test.ts`, add this test inside `describe("exportClientApplicationFormToXML", ...)`:

```ts
it("preserves command ids from reference form by name", () => {
  const xmlData = exportClientApplicationFormToXML({
    context: mockContextToXML(),
    form: {
      ...minimalClientApplicationForm,
      commands: [
        {
          itemType: "FormCommand",
          name: "Команда1",
          title: { items: { ru: "Команда один" } },
        },
        {
          itemType: "FormCommand",
          name: "Команда2",
          title: { items: { ru: "Команда два" } },
        },
      ],
    },
    referenceForm: {
      ...minimalClientApplicationForm,
      commands: [
        {
          itemType: "FormCommand",
          name: "Команда1",
          id: "7",
          title: { items: { ru: "Старое имя один" } },
        },
        {
          itemType: "FormCommand",
          name: "Команда2",
          id: "9",
          title: { items: { ru: "Старое имя два" } },
        },
      ],
    },
  })

  expect(xmlData.Commands?.Command).toEqual([
    {
      _name: "Команда1",
      _id: "7",
      Title: {
        "v8:item": [{ "v8:lang": "ru", "v8:content": "Команда один" }],
      },
    },
    {
      _name: "Команда2",
      _id: "9",
      Title: {
        "v8:item": [{ "v8:lang": "ru", "v8:content": "Команда два" }],
      },
    },
  ])
})
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run \
  packages/core/metadata/forms/clientApplicationForm/toXML.test.ts \
  -t "preserves command ids"
```

Expected: test fails because command `_id` values are generated as `1` and `2` instead of copied from reference as `7` and `9`.

- [ ] **Step 3: Preserve reference command ids in FormCommands export**

In `packages/core/metadata/forms/commonObjects/formCommand/toXML.ts`, replace `exportFormCommandsToXML` and add `findReferenceCommand`:

```ts
export const exportFormCommandsToXML: ExportToXMLFunctionNew = (params): { Command: FormCommandXML[] } | undefined => {
  const context = params.context as ConfigurationContextWithExportToXML
  const data = params.value as FormCommands | undefined
  const referenceData = params.referenceMetadata as FormCommands | undefined

  if (data === undefined || data === null) return undefined
  if (data.length === 0) return { Command: [] }

  const result = data.map((command) => exportFormCommandToXML(context, command, findReferenceCommand(command, referenceData)))

  return { Command: result }
}

const exportFormCommandToXML = (
  context: ConfigurationContextWithExportToXML,
  data: FormCommand,
  referenceData?: FormCommand
): FormCommandXML => {
  const result: FormCommandXML = {
    _name: data.name,
    _id: "",
  }

  const properties = exportPropertiesToXML({
    context,
    metadata: data,
    referenceMetadata: referenceData,
    rule: FormCommandRules,
  })

  Object.assign(result, properties)

  return result
}

const findReferenceCommand = (data: FormCommand, referenceData: FormCommands | undefined): FormCommand | undefined => {
  if (!referenceData) return undefined
  return referenceData.find((referenceItem) => referenceItem.name === data.name)
}
```

- [ ] **Step 4: Run the test and verify it passes**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run \
  packages/core/metadata/forms/clientApplicationForm/toXML.test.ts \
  -t "preserves command ids"
```

Expected: selected test passes.

- [ ] **Step 5: Run existing FormCommands XML tests**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run \
  packages/core/metadata/forms/commonObjects/formCommand/fromXML.test.ts \
  packages/core/metadata/forms/commonObjects/formCommand/toXML.test.ts
```

Expected: all tests in both files pass.

- [ ] **Step 6: Commit Task 4**

Run:

```bash
git add \
  packages/core/metadata/forms/commonObjects/formCommand/toXML.ts \
  packages/core/metadata/forms/clientApplicationForm/toXML.test.ts
git commit -m "fix: :bug: сохранять id команд формы"
```

## Task 5: Integration verification

**Files:**
- No source edits expected.

- [ ] **Step 1: Run focused metadata tests for all changed areas**

Run:

```bash
pnpm --filter '@nakidka/core' exec vitest run \
  packages/core/metadata/commonObjects/metadataValue/formChoiceList/toXML.test.ts \
  packages/core/metadata/commonObjects/сhoiceParameters/fromXML.test.ts \
  packages/core/metadata/commonObjects/сhoiceParameters/toXML.test.ts \
  packages/core/metadata/forms/commonObjects/formAttribute/fromXML.test.ts \
  packages/core/metadata/forms/commonObjects/formAttribute/toXML.test.ts \
  packages/core/metadata/forms/commonObjects/formCommand/fromXML.test.ts \
  packages/core/metadata/forms/commonObjects/formCommand/toXML.test.ts \
  packages/core/metadata/forms/clientApplicationForm/fromXML.test.ts \
  packages/core/metadata/forms/clientApplicationForm/toXML.test.ts
```

Expected: all listed tests pass.

- [ ] **Step 2: Run the full project test suite**

Run from repository root:

```bash
pnpm test
```

Expected: all package test suites pass.

- [ ] **Step 3: Check git status**

Run:

```bash
git status --short
```

Expected: no unstaged or untracked files.
