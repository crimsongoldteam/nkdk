# Round-trip XML Diffs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Убрать 4 actionable расхождения short round-trip XML без изменения XML-фикстур и YAML-контрактов: известная аномалия `CommandBarButton` ids, сохранение XML-лексемы `MinMaxValue`, короткая форма `dcsset:userSettingPresentation xsi:type="xs:string"`.

**Architecture:** Изолировать path-based исключения форм в `packages/core/metadata/forms/knownAnomalies.ts`; для общих сериализаторов хранить скрытые reference-маркеры на границе XML import/export; не менять публичную модель и YAML.

**Tech Stack:** TypeScript, Vitest, pnpm, существующие helpers `testImportPropertyFromXML`, `testExportPropertyToXML`, `mockContextToXML`, `xmlExport`, `round-trip-xml`.

---

## File Structure Map

Новые файлы:

```text
packages/core/metadata/forms/knownAnomalies.ts
packages/core/metadata/forms/knownAnomalies.test.ts
packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/userSettingPresentationXML.ts
packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/userSettingPresentationXML.test.ts
```

Изменяемые файлы:

```text
packages/core/metadata/forms/commonObjects/formAttribute/toXML.ts
packages/core/metadata/forms/commonObjects/formAttribute/toXML.test.ts
packages/core/metadata/forms/commonObjects/childItems/toXML.ts
packages/core/metadata/forms/commonObjects/childItems/toXML.test.ts
packages/core/metadata/commonObjects/minMaxValue/types.ts
packages/core/metadata/commonObjects/minMaxValue/fromXML.ts
packages/core/metadata/commonObjects/minMaxValue/fromXML.test.ts
packages/core/metadata/commonObjects/minMaxValue/toXML.ts
packages/core/metadata/commonObjects/minMaxValue/toXML.test.ts
packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/types.ts
packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromXML.ts
packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromXML.test.ts
packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toXML.ts
packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toXML.test.ts
```

Перед изменениями в `packages/core/metadata/**` выполнить:

```bash
sed -n '1,220p' .agents/knowledge/metadata/INDEX.md
```

Ожидаемо: документ прочитан; если он указывает на дополнительные документы для форм, XML или DCS, прочитать только релевантные разделы и учесть их в реализации.

---

## Task 1: Вынести известные аномалии форм в отдельный модуль

**Files:**

```text
packages/core/metadata/forms/knownAnomalies.ts
packages/core/metadata/forms/knownAnomalies.test.ts
packages/core/metadata/forms/commonObjects/formAttribute/toXML.ts
packages/core/metadata/forms/commonObjects/formAttribute/toXML.test.ts
```

### Red

- [ ] Создать `packages/core/metadata/forms/knownAnomalies.test.ts` с тестами helper-API:

```ts
import { describe, expect, it } from "vitest"
import {
  ERP_DUPLICATE_ADDITIONAL_COLUMNS_FORM,
  MASTER_SIMPLIFIED_CONNECTION_FORM,
  restoreKnownDuplicateCommandBarButtonIds,
  restoreKnownDuplicateErpAdditionalColumns,
} from "./knownAnomalies"

describe("known form XML anomalies", () => {
  it("restores ERP duplicate AdditionalColumns only for the known path/table/name", () => {
    const column = { _name: "Реквизит1", _id: "", Title: "Реквизит1" }

    expect(
      restoreKnownDuplicateErpAdditionalColumns({
        currentXMLPath: ERP_DUPLICATE_ADDITIONAL_COLUMNS_FORM,
        table: "Список.Способы",
        columnName: "Реквизит1",
        column,
      })
    ).toEqual([
      { _name: "Реквизит1", _id: "1", Title: "Реквизит1" },
      { _name: "Реквизит1", _id: "2", Title: "Реквизит1" },
      { _name: "Реквизит1", _id: "3", Title: "Реквизит1" },
      { _name: "Реквизит1", _id: "4", Title: "Реквизит1" },
      { _name: "Реквизит1", _id: "5", Title: "Реквизит1" },
    ])
  })

  it("does not restore ERP AdditionalColumns for another path", () => {
    const column = { _name: "Реквизит1", _id: "" }

    expect(
      restoreKnownDuplicateErpAdditionalColumns({
        currentXMLPath: "Catalogs/Другой/Forms/ФормаСписка/Ext/Form.xml",
        table: "Список.Способы",
        columnName: "Реквизит1",
        column,
      })
    ).toBeUndefined()
  })

  it("restores duplicate CommandBarButton ids only for the known master form sequence", () => {
    const items = [
      { CommandBarButton: { _name: "ЕстьКЭП", _id: "", ExtendedTooltip: { _name: "ЕстьКЭПРасширеннаяПодсказка", _id: "" } } },
      { CommandBarButton: { _name: "НетКЭП", _id: "", ExtendedTooltip: { _name: "НетКЭПРасширеннаяПодсказка", _id: "" } } },
      { CommandBarButton: { _name: "ЕстьКЭП", _id: "", ExtendedTooltip: { _name: "ЕстьКЭПРасширеннаяПодсказка", _id: "" } } },
      { CommandBarButton: { _name: "НетКЭП", _id: "", ExtendedTooltip: { _name: "НетКЭПРасширеннаяПодсказка", _id: "" } } },
    ]

    expect(
      restoreKnownDuplicateCommandBarButtonIds({
        currentXMLPath: MASTER_SIMPLIFIED_CONNECTION_FORM,
        items,
      })
    ).toEqual([
      { CommandBarButton: { _name: "ЕстьКЭП", _id: "1823", ExtendedTooltip: { _name: "ЕстьКЭПРасширеннаяПодсказка", _id: "1825" } } },
      { CommandBarButton: { _name: "НетКЭП", _id: "1824", ExtendedTooltip: { _name: "НетКЭПРасширеннаяПодсказка", _id: "1826" } } },
      { CommandBarButton: { _name: "ЕстьКЭП", _id: "1314", ExtendedTooltip: { _name: "ЕстьКЭПРасширеннаяПодсказка", _id: "1315" } } },
      { CommandBarButton: { _name: "НетКЭП", _id: "1316", ExtendedTooltip: { _name: "НетКЭПРасширеннаяПодсказка", _id: "1317" } } },
    ])
  })

  it("does not restore duplicate CommandBarButton ids for another path", () => {
    const items = [
      { CommandBarButton: { _name: "ЕстьКЭП", _id: "", ExtendedTooltip: { _id: "" } } },
      { CommandBarButton: { _name: "НетКЭП", _id: "", ExtendedTooltip: { _id: "" } } },
      { CommandBarButton: { _name: "ЕстьКЭП", _id: "", ExtendedTooltip: { _id: "" } } },
      { CommandBarButton: { _name: "НетКЭП", _id: "", ExtendedTooltip: { _id: "" } } },
    ]

    expect(
      restoreKnownDuplicateCommandBarButtonIds({
        currentXMLPath: "DataProcessors/Другой/Forms/Форма/Ext/Form.xml",
        items,
      })
    ).toEqual(items)
  })
})
```

- [ ] Запустить focused red:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/forms/knownAnomalies.test.ts
```

Ожидаемо до реализации:

```text
FAIL packages/core/metadata/forms/knownAnomalies.test.ts
Cannot find module './knownAnomalies'
```

### Green

- [ ] Создать `packages/core/metadata/forms/knownAnomalies.ts`:

```ts
type XMLObject = Record<string, unknown>

export const ERP_DUPLICATE_ADDITIONAL_COLUMNS_FORM =
  "Catalogs/СпособыОтраженияРасходовПоАмортизацииМСФО/Forms/ФормаСписка/Ext/Form.xml"

export const MASTER_SIMPLIFIED_CONNECTION_FORM =
  "DataProcessors/ДокументооборотСКонтролирующимиОрганами/Forms/МастерФормированияЗаявкиНаПодключениеУпрощенное/Ext/Form.xml"

export const restoreKnownDuplicateErpAdditionalColumns = <ColumnXML extends XMLObject>(params: {
  currentXMLPath: string | undefined
  table: string
  columnName: string | undefined
  column: ColumnXML | undefined
}): ColumnXML[] | undefined => {
  const { currentXMLPath, table, columnName, column } = params
  if (column === undefined) return undefined
  if (currentXMLPath !== ERP_DUPLICATE_ADDITIONAL_COLUMNS_FORM) return undefined
  if (table !== "Список.Способы") return undefined
  if (columnName !== "Реквизит1") return undefined

  return ["1", "2", "3", "4", "5"].map((id) => ({
    ...column,
    _id: id,
  }))
}

const KNOWN_MASTER_BUTTON_IDS = [
  { name: "ЕстьКЭП", buttonId: "1823", tooltipId: "1825" },
  { name: "НетКЭП", buttonId: "1824", tooltipId: "1826" },
  { name: "ЕстьКЭП", buttonId: "1314", tooltipId: "1315" },
  { name: "НетКЭП", buttonId: "1316", tooltipId: "1317" },
] as const

export const restoreKnownDuplicateCommandBarButtonIds = <ItemXML extends XMLObject>(params: {
  currentXMLPath: string | undefined
  items: ItemXML[]
}): ItemXML[] => {
  const { currentXMLPath, items } = params
  if (currentXMLPath !== MASTER_SIMPLIFIED_CONNECTION_FORM) return items
  if (!isKnownMasterButtonSequence(items)) return items

  return items.map((item, index) => {
    const commandBarButton = (item as XMLObject).CommandBarButton
    if (!isXMLObject(commandBarButton)) return item

    const ids = KNOWN_MASTER_BUTTON_IDS[index]
    const nextButton: XMLObject = {
      ...commandBarButton,
      _id: ids.buttonId,
    }

    if (isXMLObject(commandBarButton.ExtendedTooltip)) {
      nextButton.ExtendedTooltip = {
        ...commandBarButton.ExtendedTooltip,
        _id: ids.tooltipId,
      }
    }

    return {
      ...item,
      CommandBarButton: nextButton,
    }
  }) as ItemXML[]
}

const isKnownMasterButtonSequence = (items: XMLObject[]): boolean => {
  if (items.length !== KNOWN_MASTER_BUTTON_IDS.length) return false

  return items.every((item, index) => {
    const commandBarButton = item.CommandBarButton
    if (!isXMLObject(commandBarButton)) return false
    if (commandBarButton._name !== KNOWN_MASTER_BUTTON_IDS[index].name) return false
    return isXMLObject(commandBarButton.ExtendedTooltip)
  })
}

const isXMLObject = (value: unknown): value is XMLObject => {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
```

- [ ] В `packages/core/metadata/forms/commonObjects/formAttribute/toXML.ts` удалить локальный блок от комментария `// ERP 2.x содержит один известный XML-аномальный Form.xml` до конца функции `restoreErpDuplicateAdditionalColumns`.

- [ ] В начало `formAttribute/toXML.ts` добавить импорт:

```ts
import { restoreKnownDuplicateErpAdditionalColumns } from "~/metadata/forms/knownAnomalies"
```

- [ ] В `exportAdditionalColumnsToXML` заменить вычисление `columnNodes`:

```ts
    const restoredColumnNodes = restoreKnownDuplicateErpAdditionalColumns({
      currentXMLPath: context.exportToXML.context?.currentXMLPath,
      table: additionalColumn.table,
      columnName: additionalColumn.columns[0]?.name,
      column: columns?.Column?.[0],
    })
    const columnNodes = restoredColumnNodes ?? columns?.Column
```

- [ ] В `formAttribute/toXML.test.ts` заменить локальный `erpDuplicateAdditionalColumnsFormPath` импортом:

```ts
import { ERP_DUPLICATE_ADDITIONAL_COLUMNS_FORM } from "~/metadata/forms/knownAnomalies"
```

и заменить обращения:

```ts
context.exportToXML.context!.currentXMLPath = ERP_DUPLICATE_ADDITIONAL_COLUMNS_FORM
```

- [ ] Запустить focused green:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/forms/knownAnomalies.test.ts packages/core/metadata/forms/commonObjects/formAttribute/toXML.test.ts -t "known form XML anomalies|ERP duplicate AdditionalColumns|AdditionalColumns"
```

Ожидаемо:

```text
Test Files  2 passed
Tests       1 or more passed
```

### Commit

- [ ] Сделать коммит:

```bash
git add packages/core/metadata/forms/knownAnomalies.ts packages/core/metadata/forms/knownAnomalies.test.ts packages/core/metadata/forms/commonObjects/formAttribute/toXML.ts packages/core/metadata/forms/commonObjects/formAttribute/toXML.test.ts
git commit -m "fix: :bug: вынести XML-аномалии форм"
```

---

## Task 2: Применить карантинную аномалию к duplicate CommandBarButton ids

**Files:**

```text
packages/core/metadata/forms/commonObjects/childItems/toXML.ts
packages/core/metadata/forms/commonObjects/childItems/toXML.test.ts
```

### Red

- [ ] В `childItems/toXML.test.ts` добавить импорт:

```ts
import { MASTER_SIMPLIFIED_CONNECTION_FORM } from "~/metadata/forms/knownAnomalies"
```

- [ ] Внутрь существующего блока `describe("exportChildItemsToXML")` добавить тест из следующего блока:

```ts
  it("restores known duplicate CommandBarButton ids for simplified connection master form", () => {
    const context = mockContextToXML()
    context.exportToXML.context!.currentXMLPath = MASTER_SIMPLIFIED_CONNECTION_FORM

    const result = exportChildItemsToXML(context, mockRule, [
      {
        itemType: "CommandBarButton",
        name: "ЕстьКЭП",
        title: { items: { ru: "Есть КЭП" } },
        extendedTooltip: { name: "ЕстьКЭПРасширеннаяПодсказка", title: { items: { ru: "Есть КЭП" } } },
      },
      {
        itemType: "CommandBarButton",
        name: "НетКЭП",
        title: { items: { ru: "Нет КЭП" } },
        extendedTooltip: { name: "НетКЭПРасширеннаяПодсказка", title: { items: { ru: "Нет КЭП" } } },
      },
      {
        itemType: "CommandBarButton",
        name: "ЕстьКЭП",
        title: { items: { ru: "Есть КЭП" } },
        extendedTooltip: { name: "ЕстьКЭПРасширеннаяПодсказка", title: { items: { ru: "Есть КЭП" } } },
      },
      {
        itemType: "CommandBarButton",
        name: "НетКЭП",
        title: { items: { ru: "Нет КЭП" } },
        extendedTooltip: { name: "НетКЭПРасширеннаяПодсказка", title: { items: { ru: "Нет КЭП" } } },
      },
    ])

    setIdsToElements(context)

    const xml = xmlExport({ ChildItems: result }, false)

    expect(xml).toContain('<CommandBarButton name="ЕстьКЭП" id="1823">')
    expect(xml).toContain('<ExtendedTooltip name="ЕстьКЭПРасширеннаяПодсказка" id="1825">')
    expect(xml).toContain('<CommandBarButton name="НетКЭП" id="1824">')
    expect(xml).toContain('<ExtendedTooltip name="НетКЭПРасширеннаяПодсказка" id="1826">')
    expect(xml).toContain('<CommandBarButton name="ЕстьКЭП" id="1314">')
    expect(xml).toContain('<ExtendedTooltip name="ЕстьКЭПРасширеннаяПодсказка" id="1315">')
    expect(xml).toContain('<CommandBarButton name="НетКЭП" id="1316">')
    expect(xml).toContain('<ExtendedTooltip name="НетКЭПРасширеннаяПодсказка" id="1317">')
  })
```

- [ ] Запустить red:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/forms/commonObjects/childItems/toXML.test.ts -t "restores known duplicate CommandBarButton ids"
```

Ожидаемо до подключения helper:

```text
FAIL packages/core/metadata/forms/commonObjects/childItems/toXML.test.ts
expected exported XML to contain '<CommandBarButton name="ЕстьКЭП" id="1823">'
```

### Green

- [ ] В `childItems/toXML.ts` добавить импорт:

```ts
import { restoreKnownDuplicateCommandBarButtonIds } from "~/metadata/forms/knownAnomalies"
```

- [ ] Заменить возврат `result`:

```ts
  return restoreKnownDuplicateCommandBarButtonIds({
    currentXMLPath: context.exportToXML.context?.currentXMLPath,
    items: result,
  }) as Record<From["itemType"], ElementXML>[]
```

- [ ] Запустить focused green:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/forms/knownAnomalies.test.ts packages/core/metadata/forms/commonObjects/childItems/toXML.test.ts -t "known form XML anomalies|restores known duplicate CommandBarButton ids"
```

Ожидаемо:

```text
Test Files  2 passed
Tests       1 or more passed
```

### Commit

- [ ] Сделать коммит:

```bash
git add packages/core/metadata/forms/commonObjects/childItems/toXML.ts packages/core/metadata/forms/commonObjects/childItems/toXML.test.ts
git commit -m "fix: :bug: сохранять ids известных duplicate кнопок формы"
```

---

## Task 3: Сохранить исходную XML-лексему MinMaxValue в reference

**Files:**

```text
packages/core/metadata/commonObjects/minMaxValue/types.ts
packages/core/metadata/commonObjects/minMaxValue/fromXML.ts
packages/core/metadata/commonObjects/minMaxValue/fromXML.test.ts
packages/core/metadata/commonObjects/minMaxValue/toXML.ts
packages/core/metadata/commonObjects/minMaxValue/toXML.test.ts
```

### Red

- [ ] В `minMaxValue/fromXML.test.ts` добавить импорт:

```ts
import { getMinMaxValueXMLText } from "./types"
```

- [ ] В существующий блок `describe("importMinMaxValueFromXML")` добавить тест из следующего блока:

```ts
  it("keeps original XML text for reference import", () => {
    const result = testImportPropertyFromXML({
      rule,
      xmlString: '<MinValue xsi:type="xs:string">0,00</MinValue>',
      xmlRootTag: "MinValue",
      forReference: true,
    })

    expect(Number(result)).toBe(0)
    expect(getMinMaxValueXMLText(result)).toBe("0,00")
  })
```

- [ ] В `minMaxValue/toXML.test.ts` добавить тесты:

```ts
  it("preserves xs:string integer decimal comma from reference", () => {
    const { result } = testExportPropertyToXML({
      rule,
      value: 0,
      referenceMetadata: testImportReference('<MinValue xsi:type="xs:string">0,00</MinValue>'),
      xmlRootTag: "MinValue",
    })

    expect(result).toBe('<MinValue xsi:type="xs:string">0,00</MinValue>')
  })

  it("formats changed value instead of stale reference XML text", () => {
    const { result } = testExportPropertyToXML({
      rule,
      value: 1,
      referenceMetadata: testImportReference('<MinValue xsi:type="xs:string">0,00</MinValue>'),
      xmlRootTag: "MinValue",
    })

    expect(result).toBe('<MinValue xsi:type="xs:string">1</MinValue>')
  })
```

- [ ] Запустить red:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/commonObjects/minMaxValue/fromXML.test.ts packages/core/metadata/commonObjects/minMaxValue/toXML.test.ts -t "original XML text|integer decimal comma|stale reference XML text"
```

Ожидаемо до реализации:

```text
FAIL packages/core/metadata/commonObjects/minMaxValue/fromXML.test.ts
No export is defined for getMinMaxValueXMLText
```

### Green

- [ ] В `minMaxValue/types.ts` заменить содержимое на версию с двумя скрытыми символами:

```ts
const MIN_MAX_VALUE_XSI_TYPE: unique symbol = Symbol("minMaxValueXsiType")
const MIN_MAX_VALUE_XML_TEXT: unique symbol = Symbol("minMaxValueXMLText")

export type MinMaxValueXsiType = "xs:string" | "xs:decimal"

export type MinMaxValueReference = Number & {
  [MIN_MAX_VALUE_XSI_TYPE]?: MinMaxValueXsiType
  [MIN_MAX_VALUE_XML_TEXT]?: string
}

export const attachMinMaxValueXsiType = (
  value: number,
  xsiType: MinMaxValueXsiType,
  xmlText?: string
): MinMaxValueReference => {
  const referenceValue = new Number(value) as MinMaxValueReference

  Object.defineProperty(referenceValue, MIN_MAX_VALUE_XSI_TYPE, {
    value: xsiType,
    enumerable: false,
  })

  if (xmlText !== undefined) {
    Object.defineProperty(referenceValue, MIN_MAX_VALUE_XML_TEXT, {
      value: xmlText,
      enumerable: false,
    })
  }

  return referenceValue
}

export const getMinMaxValueXsiType = (value: unknown): MinMaxValueXsiType | undefined => {
  if (!isMinMaxValueReferenceObject(value)) return undefined

  return (value as MinMaxValueReference)[MIN_MAX_VALUE_XSI_TYPE]
}

export const getMinMaxValueXMLText = (value: unknown): string | undefined => {
  if (!isMinMaxValueReferenceObject(value)) return undefined

  return (value as MinMaxValueReference)[MIN_MAX_VALUE_XML_TEXT]
}

const isMinMaxValueReferenceObject = (value: unknown): value is object => {
  return typeof value === "object" && value !== null
}
```

- [ ] В `minMaxValue/fromXML.ts` заменить reference attach:

```ts
  if (context.fromXML.forReference && isMinMaxValueXsiType(xsiType)) {
    return attachMinMaxValueXsiType(result, xsiType, String(rawValue))
  }
```

- [ ] В `minMaxValue/toXML.ts` обновить импорт:

```ts
import { getMinMaxValueXMLText, getMinMaxValueXsiType, MinMaxValueXsiType } from "./types"
```

- [ ] В `exportMinMaxValueToXML` заменить формирование `#text`:

```ts
  const referenceXMLText = getReusableReferenceXMLText(value, referenceValue)

  return {
    "_xsi:type": xsiType,
    "#text": referenceXMLText ?? formatMinMaxValueText(value, xsiType),
  }
```

- [ ] В `minMaxValue/toXML.ts` добавить helper:

```ts
const getReusableReferenceXMLText = (value: number | Number, referenceValue: unknown): string | undefined => {
  const referenceXMLText = getMinMaxValueXMLText(referenceValue)
  if (referenceXMLText === undefined) return undefined
  if (referenceValue === undefined || referenceValue === null) return undefined
  if (Number(value) !== Number(referenceValue)) return undefined

  return referenceXMLText
}
```

- [ ] Запустить focused green:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/commonObjects/minMaxValue/fromXML.test.ts packages/core/metadata/commonObjects/minMaxValue/toXML.test.ts
```

Ожидаемо:

```text
Test Files  2 passed
Tests       1 or more passed
```

### Commit

- [ ] Сделать коммит:

```bash
git add packages/core/metadata/commonObjects/minMaxValue/types.ts packages/core/metadata/commonObjects/minMaxValue/fromXML.ts packages/core/metadata/commonObjects/minMaxValue/fromXML.test.ts packages/core/metadata/commonObjects/minMaxValue/toXML.ts packages/core/metadata/commonObjects/minMaxValue/toXML.test.ts
git commit -m "fix: :bug: сохранять XML-лексему MinMaxValue"
```

---

## Task 4: Поддержать короткую XML-форму DCS userSettingPresentation

**Files:**

```text
packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/userSettingPresentationXML.ts
packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/userSettingPresentationXML.test.ts
packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/types.ts
packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromXML.ts
packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromXML.test.ts
packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toXML.ts
packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toXML.test.ts
```

### Red

- [ ] Создать `userSettingPresentationXML.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { mockContextFromXML, mockContextToXML } from "~/tests/mockContext"
import {
  exportUserSettingPresentationToXML,
  importUserSettingPresentationFromXML,
} from "./userSettingPresentationXML"

describe("userSettingPresentation XML helpers", () => {
  it("imports xs:string as I8nText", () => {
    expect(
      importUserSettingPresentationFromXML(mockContextFromXML(), {
        "_xsi:type": "xs:string",
        "#text": "Период с",
      })
    ).toEqual({ items: { ru: "Период с" } })
  })

  it("preserves xs:string short form for unchanged reference", () => {
    const reference = importUserSettingPresentationFromXML(
      mockContextFromXML({ forReference: true }),
      {
        "_xsi:type": "xs:string",
        "#text": "по",
      }
    )

    expect(
      exportUserSettingPresentationToXML({
        context: mockContextToXML(),
        data: { items: { ru: "по" } },
        referenceData: reference,
      })
    ).toEqual({ "_xsi:type": "xs:string", "#text": "по" })
  })

  it("uses regular I8nText XML when value changed", () => {
    const reference = importUserSettingPresentationFromXML(
      mockContextFromXML({ forReference: true }),
      {
        "_xsi:type": "xs:string",
        "#text": "по",
      }
    )

    expect(
      exportUserSettingPresentationToXML({
        context: mockContextToXML(),
        data: { items: { ru: "после" } },
        referenceData: reference,
      })
    ).toEqual({ "v8:item": { "v8:lang": "ru", "v8:content": "после" } })
  })
})
```

- [ ] В `fromXML.test.ts` добавить тест:

```ts
  it("imports userSettingPresentation xs:string as I8nText", () => {
    expect(
      testImportPropertyFromXML({
        rule: { type: "SettingsParameterValue", valueType: "Date" },
        xmlRootTag: "dcscor:item",
        xmlString:
          '<dcscor:item xsi:type="dcsset:SettingsParameterValue"><dcscor:use>false</dcscor:use><dcscor:parameter>НачалоПериода</dcscor:parameter><dcscor:value xsi:type="xs:dateTime">0001-01-01T00:00:00</dcscor:value><dcsset:userSettingPresentation xsi:type="xs:string">Период с</dcsset:userSettingPresentation></dcscor:item>',
      })
    ).toMatchObject({
      parameter: "НачалоПериода",
      use: false,
      userSettingPresentation: { items: { ru: "Период с" } },
    })
  })
```

- [ ] В `toXML.test.ts` добавить тесты:

```ts
  it("restores userSettingPresentation xs:string from reference when unchanged", () => {
    const rule = { type: "SettingsParameterValue", valueType: "Date" } as PropertyRule
    const reference = testImportPropertyFromXML({
      rule,
      xmlRootTag: "dcscor:item",
      xmlString:
        '<dcscor:item xsi:type="dcsset:SettingsParameterValue"><dcscor:use>false</dcscor:use><dcscor:parameter>КонецПериода</dcscor:parameter><dcscor:value xsi:type="xs:dateTime">0001-01-01T00:00:00</dcscor:value><dcsset:userSettingPresentation xsi:type="xs:string">по</dcsset:userSettingPresentation></dcscor:item>',
      forReference: true,
    })

    const { result } = testExportPropertyToXML({
      rule,
      value: {
        parameter: "КонецПериода",
        use: false,
        value: { type: "dateTime", value: "0001-01-01T00:00:00" },
        userSettingPresentation: { items: { ru: "по" } },
      },
      referenceMetadata: reference,
      xmlRootTag: "dcscor:item",
    })

    expect(result).toContain('<dcsset:userSettingPresentation xsi:type="xs:string">по</dcsset:userSettingPresentation>')
  })

  it("exports regular userSettingPresentation I8nText when changed from xs:string reference", () => {
    const rule = { type: "SettingsParameterValue", valueType: "Date" } as PropertyRule
    const reference = testImportPropertyFromXML({
      rule,
      xmlRootTag: "dcscor:item",
      xmlString:
        '<dcscor:item xsi:type="dcsset:SettingsParameterValue"><dcscor:use>false</dcscor:use><dcscor:parameter>КонецПериода</dcscor:parameter><dcscor:value xsi:type="xs:dateTime">0001-01-01T00:00:00</dcscor:value><dcsset:userSettingPresentation xsi:type="xs:string">по</dcsset:userSettingPresentation></dcscor:item>',
      forReference: true,
    })

    const { result } = testExportPropertyToXML({
      rule,
      value: {
        parameter: "КонецПериода",
        use: false,
        value: { type: "dateTime", value: "0001-01-01T00:00:00" },
        userSettingPresentation: { items: { ru: "после" } },
      },
      referenceMetadata: reference,
      xmlRootTag: "dcscor:item",
    })

    expect(result).toContain("<v8:content>после</v8:content>")
    expect(result).not.toContain('dcsset:userSettingPresentation xsi:type="xs:string"')
  })
```

- [ ] Запустить red:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/userSettingPresentationXML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromXML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toXML.test.ts -t "userSettingPresentation|presentation XML helpers"
```

Ожидаемо до реализации:

```text
FAIL packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/userSettingPresentationXML.test.ts
Cannot find module './userSettingPresentationXML'
```

### Green

- [ ] В `parameterValue/types.ts` расширить XML-тип поля:

```ts
export type UserSettingPresentationShortXML = {
  "_xsi:type": "xs:string"
  "#text"?: string
}
```

и заменить поле:

```ts
  "dcsset:userSettingPresentation"?: I8nTextXML | UserSettingPresentationShortXML
```

- [ ] Создать `userSettingPresentationXML.ts`:

```ts
import type { ConfigurationContext, ConfigurationContextFromXML } from "~/metadata/context/types"
import { importI8nTextFromXML } from "~/metadata/commonObjects/i8nText/fromXML"
import { exportI8nTextToXML } from "~/metadata/commonObjects/i8nText/toXML"
import type { I8nText, I8nTextXML } from "~/metadata/commonObjects/i8nText/types"
import type { UserSettingPresentationShortXML } from "./types"

const USER_SETTING_PRESENTATION_XML_KIND: unique symbol = Symbol("userSettingPresentationXMLKind")

type UserSettingPresentationReference = I8nText & {
  [USER_SETTING_PRESENTATION_XML_KIND]?: "xs:string"
}

type UserSettingPresentationXML = I8nTextXML | UserSettingPresentationShortXML | string

export const importUserSettingPresentationFromXML = (
  context: ConfigurationContextFromXML,
  xml: UserSettingPresentationXML | undefined
): I8nText | undefined => {
  if (xml === undefined) return undefined

  if (isShortStringPresentationXML(xml)) {
    const text = getShortStringPresentationText(xml)
    const result = { items: { [context.defaultLanguage]: text } }
    return context.fromXML.forReference ? attachShortStringXMLKind(result) : result
  }

  return importI8nTextFromXML(context, { type: "I8nText" }, xml as I8nTextXML)
}

export const exportUserSettingPresentationToXML = (params: {
  context: ConfigurationContext
  data: I8nText
  referenceData?: I8nText | undefined
}): I8nTextXML | UserSettingPresentationShortXML | undefined => {
  const { context, data, referenceData } = params
  if (isShortStringReference(referenceData) && isSameI8nText(data, referenceData)) {
    return {
      "_xsi:type": "xs:string",
      "#text": getSingleLanguageText(referenceData) ?? "",
    }
  }

  return exportI8nTextToXML(context, { type: "I8nText" }, data)
}

const attachShortStringXMLKind = (value: I8nText): UserSettingPresentationReference => {
  Object.defineProperty(value, USER_SETTING_PRESENTATION_XML_KIND, {
    value: "xs:string",
    enumerable: false,
  })

  return value as UserSettingPresentationReference
}

const isShortStringReference = (value: I8nText | undefined): value is UserSettingPresentationReference => {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as UserSettingPresentationReference)[USER_SETTING_PRESENTATION_XML_KIND] === "xs:string"
  )
}

const isShortStringPresentationXML = (xml: UserSettingPresentationXML): xml is UserSettingPresentationShortXML | string => {
  if (typeof xml === "string") return true
  return typeof xml === "object" && xml !== null && !Array.isArray(xml) && xml["_xsi:type"] === "xs:string"
}

const getShortStringPresentationText = (xml: UserSettingPresentationShortXML | string): string => {
  return typeof xml === "string" ? xml : xml["#text"] ?? ""
}

const isSameI8nText = (left: I8nText, right: I8nText): boolean => {
  return JSON.stringify(left.items) === JSON.stringify(right.items)
}

const getSingleLanguageText = (value: I8nText): string | undefined => {
  const entries = Object.entries(value.items)
  if (entries.length === 0) return undefined
  return entries[0][1]
}
```

- [ ] В `fromXML.ts` удалить импорт `importI8nTextFromXML` и добавить:

```ts
import { importUserSettingPresentationFromXML } from "./userSettingPresentationXML"
```

- [ ] В `fromXML.ts` заменить импорт поля:

```ts
            userSettingPresentation: importUserSettingPresentationFromXML(
              context,
              sx["dcsset:userSettingPresentation"]
            ),
```

- [ ] В `toXML.ts` удалить импорт `exportI8nTextToXML` и добавить:

```ts
import { exportUserSettingPresentationToXML } from "./userSettingPresentationXML"
```

- [ ] В `toXML.ts` заменить export поля:

```ts
            "dcsset:userSettingPresentation": exportUserSettingPresentationToXML({
              context,
              data: sd.userSettingPresentation,
              referenceData: (referenceData as SettingsParameterValue | undefined)?.userSettingPresentation,
            }),
```

- [ ] Запустить focused green:

```bash
pnpm --filter @nakidka/core exec vitest run packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/userSettingPresentationXML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromXML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toXML.test.ts
```

Ожидаемо:

```text
Test Files  3 passed
Tests       1 or more passed
```

### Commit

- [ ] Сделать коммит:

```bash
git add packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/userSettingPresentationXML.ts packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/userSettingPresentationXML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/types.ts packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromXML.ts packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromXML.test.ts packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toXML.ts packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toXML.test.ts
git commit -m "fix: :bug: сохранять короткое DCS представление настройки"
```

---

## Task 5: Проверить round-trip XML и полный набор тестов

**Files:**

```text
packages/core/metadata/forms/knownAnomalies.ts
packages/core/metadata/forms/commonObjects/childItems/toXML.ts
packages/core/metadata/commonObjects/minMaxValue/toXML.ts
packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toXML.ts
```

### Focused Verification

- [ ] Запустить все изменённые тесты:

```bash
pnpm --filter @nakidka/core exec vitest run \
  packages/core/metadata/forms/knownAnomalies.test.ts \
  packages/core/metadata/forms/commonObjects/formAttribute/toXML.test.ts \
  packages/core/metadata/forms/commonObjects/childItems/toXML.test.ts \
  packages/core/metadata/commonObjects/minMaxValue/fromXML.test.ts \
  packages/core/metadata/commonObjects/minMaxValue/toXML.test.ts \
  packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/userSettingPresentationXML.test.ts \
  packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/fromXML.test.ts \
  packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/toXML.test.ts
```

Ожидаемо:

```text
Test Files  8 passed
Tests       1 or more passed
```

### Round-trip XML Verification

- [ ] Запустить полный triage по всем конфигурациям:

```bash
./.agents/skills/round-trip-xml/round-trip.sh --triage --all-configs --batch-size 5
```

Ожидаемо:

```text
Round-trip actionable diff'ов нет
```

В выводе может остаться известный skipped invalid diff:

```text
erp/Catalogs/СпособыОтраженияРасходовПоАмортизацииМСФО/Forms/ФормаСписка/Ext/Form.xml
```

Он не считается actionable в рамках этой задачи, потому что это невалидный XML с duplicate `FormAttribute AdditionalColumns name="Реквизит1"`, уже вынесенный в карантин.

### Full Verification

- [ ] Запустить полный набор тестов из корня worktree:

```bash
pnpm test
```

Ожидаемо:

```text
packages/graph test: 89 passed
packages/core test: 3906 passed
packages/cli test: 49 passed
```

Числа могут увеличиться на новые тесты; важно, чтобы не было failed tests.

### Final Commit

- [ ] Если после проверок появились мелкие правки, сделать финальный коммит:

```bash
git add packages/core/metadata
git commit -m "test: :white_check_mark: проверить round-trip XML исправления"
```

Если новых правок после предыдущих коммитов нет, финальный коммит не нужен.

---

## Self-review

- [ ] Spec coverage: покрыты все три решения из `docs/superpowers/specs/2026-05-27-round-trip-xml-diffs-design.md`.
- [ ] Known anomalies: path-based логика форм находится только в `packages/core/metadata/forms/knownAnomalies.ts`.
- [ ] Public contracts: YAML-форматы `ChildItems`, `MinMaxValue`, `SettingsParameterValue.userSettingPresentation` не меняются.
- [ ] XML fixtures: существующие XML-фикстуры не изменяются.
- [ ] Type safety: скрытые reference-маркеры спрятаны за именованными helpers; приведения типов остаются на границе XML helpers.
- [ ] Verification: focused tests, `round-trip-xml --triage --all-configs --batch-size 5`, `pnpm test`.
