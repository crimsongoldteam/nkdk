# Document Form Fixture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить отдельные TS/YAML-фикстуры и тесты для `documentFull.xml`, закрыв недостающие поля формы документа в `rules.ts`.

**Architecture:** XML-фикстура остается источником истины. Модель и YAML-представление живут в отдельных файлах рядом с XML и импортируются тестами напрямую. Новые правила добавляются отдельной областью `Document` в `clientApplicationForm/rules.ts`, без изменения существующих XML-фикстур.

**Tech Stack:** TypeScript, Vitest, pnpm, декларативные `MetadataItemRule` правила.

---

## File Structure

- Create: `packages/core/metadata/forms/clientApplicationForm/__fixtures__/documentFull.ts`
  - Экспортирует `documentFullClientApplicationForm`.
  - Хранит модельную фикстуру `ClientApplicationForm` для `documentFull.xml`.
- Create: `packages/core/metadata/forms/clientApplicationForm/__fixtures__/documentFull.yaml.ts`
  - Экспортирует `documentFullClientApplicationFormYAML`.
  - Хранит YAML-представление той же формы.
- Modify: `packages/core/metadata/forms/clientApplicationForm/rules.ts`
  - Добавляет область `// #region Document`.
  - Добавляет поля `autoTime`, `usePostingMode`, `repostOnWrite`.
- Modify: `packages/core/metadata/forms/clientApplicationForm/fromXML.test.ts`
  - Добавляет импорт модели и тест импорта `documentFull.xml`.
- Modify: `packages/core/metadata/forms/clientApplicationForm/toXML.test.ts`
  - Добавляет импорт модели и тест XML round-trip для `documentFull.xml`.
- Modify: `packages/core/metadata/forms/clientApplicationForm/fromYAML.test.ts`
  - Добавляет импорт модели и YAML-фикстуры, тест импорта YAML.
- Modify: `packages/core/metadata/forms/clientApplicationForm/toYAML.test.ts`
  - Добавляет импорт модели и YAML-фикстуры, тест экспорта YAML.

## Task 1: Add Document Fixture Files

**Files:**
- Create: `packages/core/metadata/forms/clientApplicationForm/__fixtures__/documentFull.ts`
- Create: `packages/core/metadata/forms/clientApplicationForm/__fixtures__/documentFull.yaml.ts`

- [ ] **Step 1: Create model fixture**

Create `packages/core/metadata/forms/clientApplicationForm/__fixtures__/documentFull.ts`:

```ts
import { ClientApplicationForm } from "~/metadata/forms/clientApplicationForm/types"

export const documentFullClientApplicationForm: ClientApplicationForm = {
  itemType: "ClientApplicationForm",
  synonym: { items: {} },
  comment: "",
  includeHelpInContents: false,
  usePurposes: ["PlatformApplication", "MobilePlatformApplication"],
  title: { items: { ru: "Заголовок" } },
  width: 5,
  height: 10,
  formWindowOpeningMode: "LockOwnerWindow",
  enterKeyBehavior: "DefaultButton",
  autoSaveDataInSettings: "Use",
  saveDataInSettings: "UseList",
  saveWindowSettings: false,
  settingsStorage: "SettingsStorage.ХранилищеНастроек",
  autoTitle: false,
  autoURL: false,
  group: "HorizontalIfPossible",
  itemsAndTitlesAlign: "ItemsLeftTitlesLeft",
  horizontalSpacing: "OneAndHalf",
  verticalSpacing: "Double",
  childItemsHorizontalAlign: "Left",
  childItemsVerticalAlign: "Center",
  autoFillCheck: false,
  customizable: false,
  enabled: false,
  commandBarLocation: "None",
  verticalScroll: "use",
  scalingMode: "Compact",
  scale: 96,
  conversationsRepresentation: "Show",
  mobileDeviceCommandBarContent: [{ type: "string", value: "Команда1" }],
  commandSet: ["PostAndClose"],
  showTitle: false,
  showCloseButton: false,
  collapseItemsByImportance: "DontUse",
  autoTime: "Last",
  usePostingMode: "Regular",
  repostOnWrite: false,
  autoCommandBar: {
    itemType: "AutoCommandBar",
    autofill: true,
    childItems: [],
  },
  events: {
    afterWrite: "ПослеЗаписи",
    beforeReopenFromOtherServer: "ПередПереоткрытиемСДругогоСервера",
    valueChoice: "ВыборЗначения",
    onReopenFromOtherServer: "ПриПереоткрытииСДругогоСервера",
    onSaveDataInSettingsAtServer: "ПриСохраненииДанныхВНастройкахНаСервере",
    onClientApplicationSuspend: "ПриЗасыпанииКлиентскогоПриложения",
    choiceProcessing: "ОбработкаВыбора",
    afterWriteAtServer: "ПослеЗаписиНаСервере",
    onPasteFromClipboard: "ПриВставкеИзБуфераОбмена",
    notificationProcessing: "ОбработкаОповещения",
    onReadAtServer: "ПриЧтенииНаСервере",
    newWriteProcessing: "ОбработкаЗаписиНового",
    onOpen: "ПриОткрытии",
    uRLListGetProcessing: "ОбработкаПолученияСпискаНавигационныхСсылок",
    beforeClose: "ПередЗакрытием",
    externalEvent: "ВнешнееСобытие",
    collaborationSystemUsersAutoComplete: "АвтоПодборПользователейСистемыВзаимодействия",
    uRLGetProcessing: "ОбработкаПолученияНавигационнойСсылки",
    onReopen: "ПриПовторномОткрытии",
    onLoadDataFromSettingsAtServer: "ПриЗагрузкеДанныхИзНастроекНаСервере",
    beforeWrite: "ПередЗаписью",
    onClientApplicationResume: "ПриПробужденииКлиентскогоПриложения",
    beforeWriteAtServer: "ПередЗаписьюНаСервере",
    navigationProcessing: "ОбработкаПерехода",
    onCreateAtServer: "ПриСозданииНаСервере",
    collaborationSystemUsersChoiceFormGetProcessing:
      "ОбработкаПолученияФормыВыбораПользователейСистемыВзаимодействия",
    activationProcessing: "ОбработкаАктивизации",
    onChangeDisplaySettings: "ПриИзмененииПараметровЭкрана",
    onWriteAtServer: "ПриЗаписиНаСервере",
    onClose: "ПриЗакрытии",
    onMainServerAvailabilityChange: "ПриИзмененииДоступностиОсновногоСервера",
    uRLProcessing: "ОбработкаНавигационнойСсылки",
    fillCheckProcessingAtServer: "ОбработкаПроверкиЗаполненияНаСервере",
    beforeLoadDataFromSettingsAtServer: "ПередЗагрузкойДанныхИзНастроекНаСервере",
    addInDetachmentOnError: "ОтключениеВнешнейКомпонентыПриОшибке",
  },
  childItems: [
    {
      itemType: "InputField",
      name: "Номер",
      dataPath: "Объект.Number",
      editMode: "EnterOnInput",
      multipleValuesExtendedEdit: true,
      contextMenu: {
        itemType: "ContextMenu",
        name: "НомерКонтекстноеМеню",
        childItems: [],
      },
      extendedTooltip: {
        itemType: "ExtendedTooltip",
        name: "НомерРасширеннаяПодсказка",
      },
    },
    {
      itemType: "Button",
      name: "Команда1",
      type: "UsualButton",
      commandName: "Form.Command.Команда1",
      extendedTooltip: {
        itemType: "ExtendedTooltip",
        name: "Команда1РасширеннаяПодсказка",
      },
    },
  ],
  attributes: [
    {
      itemType: "FormAttribute",
      name: "Объект",
      type: { type: ["DocumentObject.ДокументВсеСвойства"] },
      mainAttribute: true,
      storedData: true,
      fieldsList: ["Объект.RegisterRecords"],
      title: { items: { ru: "" } },
      columns: [],
    },
  ],
  attributesConditionalAppearance: {
    itemType: "ConditionalAppearance",
    conditionalAppearanceItems: [
      {
        itemType: "ConditionalAppearanceItem",
        filter: {
          itemType: "Filter",
          items: [
            {
              itemType: "FilterItemComparison",
              leftValue: { type: "Field", value: "Объект.Номер" },
              comparisonType: "Equal",
              rightValue: { type: "number", value: 34567 },
            },
          ],
        },
        appearance: {
          itemType: "AppearanceFields",
          Отображать: {
            parameter: "Отображать",
            value: { type: "boolean", value: false },
          },
        },
      },
    ],
  },
  commands: [
    {
      itemType: "FormCommand",
      name: "Команда1",
      title: { items: { ru: "" } },
    },
  ],
}
```

- [ ] **Step 2: Create YAML fixture**

Create `packages/core/metadata/forms/clientApplicationForm/__fixtures__/documentFull.yaml.ts`:

```ts
import { ClientApplicationFormYAML } from "~/metadata/forms/clientApplicationForm/types"

export const documentFullClientApplicationFormYAML: ClientApplicationFormYAML = {
  НазначенияИспользования: "ПлатформаИМобильноеПриложение",
  Заголовок: "Заголовок",
  Ширина: 5,
  Высота: 10,
  РежимОткрытияОкнаФормы: "БлокироватьОкноВладельца",
  ПоведениеКлавишиEnter: "КнопкаПоУмолчанию",
  АвтоматическоеСохранениеДанныхВНастройках: "Использовать",
  СохранениеДанныхВНастройках: "ИспользоватьСписок",
  СохранятьНастройкиОкна: "Ложь",
  ХранилищеНастроек: "SettingsStorage.ХранилищеНастроек",
  АвтоЗаголовок: "Ложь",
  АвтоНавигационнаяСсылка: "Ложь",
  Группировка: "ГоризонтальнаяЕслиВозможно",
  ВыравниваниеЭлементовИЗаголовков: "ЭлементыЛевоЗаголовкиЛево",
  ГоризонтальныйИнтервал: "Полуторный",
  ВертикальныйИнтервал: "Двойной",
  ГоризонтальноеПоложениеПодчиненных: "Лево",
  ВертикальноеПоложениеПодчиненных: "Центр",
  ПроверятьЗаполнениеАвтоматически: "Ложь",
  РазрешитьИзменятьФорму: "Ложь",
  Доступность: "Ложь",
  ПоложениеКоманднойПанели: "Нет",
  ВертикальнаяПрокрутка: "Использовать",
  ВариантМасштаба: "Компактный",
  Масштаб: 96,
  ОтображениеОбсуждений: "Отображать",
  СоставКоманднойПанелиНаМобильномУстройстве: ["Команда1"],
  СоставКоманд: ["PostAndClose"],
  ОтображатьЗаголовок: "Ложь",
  ОтображатьКнопкуЗакрытия: "Ложь",
  СворачиваниеЭлементовПоВажности: "НеИспользовать",
  АвтоВремя: "Последним",
  РежимПроведения: "Неоперативный",
  ПерепроводитьПриЗаписи: "Ложь",
  События: {
    ПослеЗаписи: "ПослеЗаписи",
    ПередПереоткрытиемСДругогоСервера: "ПередПереоткрытиемСДругогоСервера",
    ВыборЗначения: "ВыборЗначения",
    ПриПереоткрытииСДругогоСервера: "ПриПереоткрытииСДругогоСервера",
    ПриСохраненииДанныхВНастройкахНаСервере: "ПриСохраненииДанныхВНастройкахНаСервере",
    ПриЗасыпанииКлиентскогоПриложения: "ПриЗасыпанииКлиентскогоПриложения",
    ОбработкаВыбора: "ОбработкаВыбора",
    ПослеЗаписиНаСервере: "ПослеЗаписиНаСервере",
    ПриВставкеИзБуфераОбмена: "ПриВставкеИзБуфераОбмена",
    ОбработкаОповещения: "ОбработкаОповещения",
    ПриЧтенииНаСервере: "ПриЧтенииНаСервере",
    ОбработкаЗаписиНового: "ОбработкаЗаписиНового",
    ПриОткрытии: "ПриОткрытии",
    ОбработкаПолученияСпискаНавигационныхСсылок: "ОбработкаПолученияСпискаНавигационныхСсылок",
    ПередЗакрытием: "ПередЗакрытием",
    ВнешнееСобытие: "ВнешнееСобытие",
    АвтоПодборПользователейСистемыВзаимодействия: "АвтоПодборПользователейСистемыВзаимодействия",
    ОбработкаПолученияНавигационнойСсылки: "ОбработкаПолученияНавигационнойСсылки",
    ПриПовторномОткрытии: "ПриПовторномОткрытии",
    ПриЗагрузкеДанныхИзНастроекНаСервере: "ПриЗагрузкеДанныхИзНастроекНаСервере",
    ПередЗаписью: "ПередЗаписью",
    ПриПробужденииКлиентскогоПриложения: "ПриПробужденииКлиентскогоПриложения",
    ПередЗаписьюНаСервере: "ПередЗаписьюНаСервере",
    ОбработкаПерехода: "ОбработкаПерехода",
    ПриСозданииНаСервере: "ПриСозданииНаСервере",
    ОбработкаПолученияФормыВыбораПользователейСистемыВзаимодействия:
      "ОбработкаПолученияФормыВыбораПользователейСистемыВзаимодействия",
    ОбработкаАктивизации: "ОбработкаАктивизации",
    ПриИзмененииПараметровЭкрана: "ПриИзмененииПараметровЭкрана",
    ПриЗаписиНаСервере: "ПриЗаписиНаСервере",
    ПриЗакрытии: "ПриЗакрытии",
    ПриИзмененииДоступностиОсновногоСервера: "ПриИзмененииДоступностиОсновногоСервера",
    ОбработкаНавигационнойСсылки: "ОбработкаНавигационнойСсылки",
    ОбработкаПроверкиЗаполненияНаСервере: "ОбработкаПроверкиЗаполненияНаСервере",
    ПередЗагрузкойДанныхИзНастроекНаСервере: "ПередЗагрузкойДанныхИзНастроекНаСервере",
    ОтключениеВнешнейКомпонентыПриОшибке: "ОтключениеВнешнейКомпонентыПриОшибке",
  },
  Элементы: {
    Номер: {
      Данные: "Объект.Number",
      РежимРедактирования: "ВводПриВводе",
      РасширенноеРедактированиеМножественныхЗначений: "Истина",
      КонтекстноеМеню: {},
      РасширеннаяПодсказка: {},
    },
    Команда1: {
      Вид: "ОбычнаяКнопка",
      ИмяКоманды: "Form.Command.Команда1",
      РасширеннаяПодсказка: {},
    },
  },
  Реквизиты: {
    Объект: {
      Тип: "ДокументОбъект.ДокументВсеСвойства",
      ОсновнойРеквизит: "Истина",
      СохраняемыеДанные: "Истина",
      Заголовок: "",
      ИспользоватьВсегда: ["Объект.RegisterRecords"],
    },
  },
  УсловноеОформлениеРеквизитов: {
    Элементы: [
      {
        Отбор: {
          Элементы: [
            {
              ЛевоеЗначение: ".Объект.Номер",
              ВидСравнения: "Равно",
              ПравоеЗначение: "34567",
            },
          ],
        },
        Оформление: {
          Отображать: "Ложь",
        },
      },
    ],
  },
  Команды: {
    Команда1: {
      Заголовок: "",
    },
  },
}
```

- [ ] **Step 3: Run fixture type check through targeted tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms/clientApplicationForm/fromYAML.test.ts --runInBand
```

Expected: the command may fail because tests do not import the new fixtures yet, but TypeScript must not report syntax errors in the new fixture files once they are imported in Task 2.

- [ ] **Step 4: Commit fixture files**

```bash
git add packages/core/metadata/forms/clientApplicationForm/__fixtures__/documentFull.ts packages/core/metadata/forms/clientApplicationForm/__fixtures__/documentFull.yaml.ts
git commit -m "test: :white_check_mark: добавить фикстуры формы документа"
```

## Task 2: Add Import Tests First

**Files:**
- Modify: `packages/core/metadata/forms/clientApplicationForm/fromXML.test.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/fromYAML.test.ts`

- [ ] **Step 1: Add failing XML import test**

In `fromXML.test.ts`, add this import after the existing fixture imports:

```ts
import { documentFullClientApplicationForm } from "./__fixtures__/documentFull"
```

Add this test as a new `it` block inside `describe("importClientApplicationFormFromXML", () => { })`:

```ts
  it("imports document full form from XML", () => {
    const xmlData = readAndParseXMLFixture<{ Form: ClientApplicationFormXML }>(import.meta.url, "documentFull.xml")
    const xmlMetadata = readAndParseXMLFixture<{ MetaDataObject: FormMetadataXML }>(
      import.meta.url,
      "minimalMetadata.xml"
    )
    const result = importClientApplicationFormFromXML({
      context: mockContextFromXML(),
      xml: xmlData.Form,
      xmlMetadata: xmlMetadata.MetaDataObject,
    })

    expect(result).toEqual(documentFullClientApplicationForm)
  })
```

- [ ] **Step 2: Add failing YAML import test**

In `fromYAML.test.ts`, add imports:

```ts
import { documentFullClientApplicationForm } from "./__fixtures__/documentFull"
import { documentFullClientApplicationFormYAML } from "./__fixtures__/documentFull.yaml"
```

Add this test as a new `it` block inside `describe("importClientApplicationFormFromYAML", () => { })`:

```ts
  it("imports document full YAML", () => {
    const result = importClientApplicationFormFromYAML(mockContext, documentFullClientApplicationFormYAML, {
      itemType: "ClientApplicationForm",
      synonym: { items: {} },
      comment: "",
      includeHelpInContents: false,
      commands: [],
      childItems: [
        {
          itemType: "InputField",
          name: "Номер",
          contextMenu: {
            itemType: "ContextMenu",
            name: "НомерКонтекстноеМеню",
            childItems: [],
          },
          extendedTooltip: {
            itemType: "ExtendedTooltip",
            name: "НомерРасширеннаяПодсказка",
          },
        },
        {
          itemType: "Button",
          name: "Команда1",
          extendedTooltip: {
            itemType: "ExtendedTooltip",
            name: "Команда1РасширеннаяПодсказка",
          },
        },
      ],
      autoCommandBar: {
        itemType: "AutoCommandBar",
        autofill: true,
        childItems: [],
      },
    })

    expect(result).toEqual(documentFullClientApplicationForm)
  })
```

- [ ] **Step 3: Run tests and verify they fail for missing document rules**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms/clientApplicationForm/fromXML.test.ts metadata/forms/clientApplicationForm/fromYAML.test.ts --runInBand
```

Expected: FAIL. The diff should show that `autoTime`, `usePostingMode`, and `repostOnWrite` are missing from imported results, or that YAML keys for these fields are not recognized.

- [ ] **Step 4: Commit failing tests if the team workflow allows red commits; otherwise keep unstaged**

Default for this repository: do not commit red tests. Leave changes unstaged until Task 3 passes.

## Task 3: Add Document Rules

**Files:**
- Modify: `packages/core/metadata/forms/clientApplicationForm/rules.ts`

- [ ] **Step 1: Add the Document region**

In `ClientApplicationFormRules.properties`, after the Catalog region and before `events`, add:

```ts
    // #region Document
    autoTime: {
      yaml: "АвтоВремя",
      type: "SystemEnumeration",
      typeSE: "AutoTimeMode",
      tag: FormRulesTags.Form,
    },
    usePostingMode: {
      yaml: "РежимПроведения",
      xml: "UsePostingMode",
      type: "SystemEnumeration",
      typeSE: "DocumentPostingMode",
      tag: FormRulesTags.Form,
    },
    repostOnWrite: {
      yaml: "ПерепроводитьПриЗаписи",
      type: "boolean",
      tag: FormRulesTags.Form,
    },
    // #endregion
```

- [ ] **Step 2: Run import tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms/clientApplicationForm/fromXML.test.ts metadata/forms/clientApplicationForm/fromYAML.test.ts --runInBand
```

Expected: PASS. If only fixture shape differs, update the new `documentFull.ts` or `documentFull.yaml.ts` fixture to match actual import behavior; do not change `documentFull.xml`.

- [ ] **Step 3: Commit import coverage and rules**

```bash
git add packages/core/metadata/forms/clientApplicationForm/rules.ts packages/core/metadata/forms/clientApplicationForm/fromXML.test.ts packages/core/metadata/forms/clientApplicationForm/fromYAML.test.ts packages/core/metadata/forms/clientApplicationForm/__fixtures__/documentFull.ts packages/core/metadata/forms/clientApplicationForm/__fixtures__/documentFull.yaml.ts
git commit -m "test: :white_check_mark: покрыть импорт формы документа"
```

## Task 4: Add Export Tests

**Files:**
- Modify: `packages/core/metadata/forms/clientApplicationForm/toXML.test.ts`
- Modify: `packages/core/metadata/forms/clientApplicationForm/toYAML.test.ts`

- [ ] **Step 1: Add XML export test**

In `toXML.test.ts`, add:

```ts
import { documentFullClientApplicationForm } from "./__fixtures__/documentFull"
```

Inside `describe("exportClientApplicationFormToXML", () => { })`, add:

```ts
    it("exports document full form to XML", () => {
      const expectedResult = readXMLFixtureAsString(import.meta.url, "documentFull.xml")
      const referenceFormXML = readAndParseXMLFixture<{ Form: ClientApplicationFormXML }>(
        import.meta.url,
        "documentFull.xml"
      )
      const referenceMetadataXML = readAndParseXMLFixture<{ MetaDataObject: FormMetadataXML }>(
        import.meta.url,
        "minimalMetadata.xml"
      )
      const referenceForm = importClientApplicationFormFromXML({
        context: mockContextFromXML({ forReference: true }),
        xml: referenceFormXML.Form,
        xmlMetadata: referenceMetadataXML.MetaDataObject,
      })
      const xmlData = exportClientApplicationFormToXML({
        context: mockContextToXML(),
        form: documentFullClientApplicationForm,
        referenceForm,
      })

      const result = xmlExport({ Form: xmlData })

      expect(result).toEqual(expectedResult)
    })
```

- [ ] **Step 2: Add YAML export test**

In `toYAML.test.ts`, add:

```ts
import { documentFullClientApplicationForm } from "./__fixtures__/documentFull"
import { documentFullClientApplicationFormYAML } from "./__fixtures__/documentFull.yaml"
```

Inside `describe("exportClientApplicationFormToYAML", () => { })`, add:

```ts
  it("exports document full YAML", () => {
    const { yaml } = exportClientApplicationFormToYAML(mockContextToYAML, documentFullClientApplicationForm)

    expect(yaml).toEqual(documentFullClientApplicationFormYAML)
  })
```

- [ ] **Step 3: Run export tests and verify failures or passes**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms/clientApplicationForm/toXML.test.ts metadata/forms/clientApplicationForm/toYAML.test.ts --runInBand
```

Expected: PASS. If XML export differs only in ordering, first inspect whether the reference-based exporter should preserve XML order. Add `order` to new document rules only if the exporter cannot place `AutoTime`, `UsePostingMode`, and `RepostOnWrite` correctly from `referenceForm`.

- [ ] **Step 4: Commit export coverage**

```bash
git add packages/core/metadata/forms/clientApplicationForm/toXML.test.ts packages/core/metadata/forms/clientApplicationForm/toYAML.test.ts packages/core/metadata/forms/clientApplicationForm/__fixtures__/documentFull.ts packages/core/metadata/forms/clientApplicationForm/__fixtures__/documentFull.yaml.ts packages/core/metadata/forms/clientApplicationForm/rules.ts
git commit -m "test: :white_check_mark: покрыть экспорт формы документа"
```

## Task 5: Final Verification

**Files:**
- Verify: `packages/core/metadata/forms/clientApplicationForm/*`
- Verify: `packages/core/metadata/forms/clientApplicationForm/__fixtures__/documentFull.xml`

- [ ] **Step 1: Run all clientApplicationForm tests**

Run:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/forms/clientApplicationForm --runInBand
```

Expected: PASS for all `clientApplicationForm` tests.

- [ ] **Step 2: Run full project test suite**

Run from repository root:

```bash
pnpm test
```

Expected: PASS for all packages.

- [ ] **Step 3: Check git status**

Run:

```bash
git status --short
```

Expected: only intentional changes remain. `documentFull.xml`, the new fixture files, the four test files, and `rules.ts` should be tracked or staged according to the commits above.

- [ ] **Step 4: Final commit if any verified changes remain uncommitted**

If `git status --short` shows intentional uncommitted files, run:

```bash
git add packages/core/metadata/forms/clientApplicationForm/rules.ts packages/core/metadata/forms/clientApplicationForm/fromXML.test.ts packages/core/metadata/forms/clientApplicationForm/toXML.test.ts packages/core/metadata/forms/clientApplicationForm/fromYAML.test.ts packages/core/metadata/forms/clientApplicationForm/toYAML.test.ts packages/core/metadata/forms/clientApplicationForm/__fixtures__/documentFull.xml packages/core/metadata/forms/clientApplicationForm/__fixtures__/documentFull.ts packages/core/metadata/forms/clientApplicationForm/__fixtures__/documentFull.yaml.ts
git commit -m "test: :white_check_mark: покрыть форму документа"
```

## Self-Review

- Spec coverage: covered separate fixture files, XML/YAML tests, `rules.ts` Document region, and no changes to XML fixture.
- Placeholder scan: no open implementation gaps.
- Type consistency: model fixture uses `ClientApplicationForm`; YAML fixture uses `ClientApplicationFormYAML`; rules use existing system enumerations `AutoTimeMode` and `DocumentPostingMode`.
