import { FormAttributes, FormAttributesEnterprise } from "~/metadata/commonObjects/formAttribute/types"
import { fullDynamicList } from "../dynamicList/data"

//#region FullFormAttributes

export const fullFormAttributes: Required<FormAttributes> = [
  {
    name: "Объект",
    title: { items: { ru: "" } },
    valueType: {
      type: ["decimal"],
    },
    mainAttribute: true,
    storedData: true,
    view: {
      common: true,
      values: [
        { name: "Администратор", value: true },
        { name: "Пользователь", value: false },
      ],
    },
    edit: {
      common: true,
      values: [
        { name: "Администратор", value: true },
        { name: "Пользователь", value: false },
      ],
    },
    fillCheck: "ShowError",
    useAlways: ["Список.Ref"],
  },
  {
    name: "ТестовыйАтрибут",
    title: { items: { ru: "Заголовок атрибута" } },
    valueType: {
      type: ["string"],
    },
    storedData: true,
    use: {
      common: true,
      values: [
        { name: "Администратор", value: true },
        { name: "Пользователь", value: false },
      ],
    },
    edit: {
      common: false,
      values: [
        { name: "Администратор", value: true },
        { name: "Пользователь", value: false },
      ],
    },
    fillCheck: "ShowError",
    useAlways: ["Список.Ref"],
  },
]

export const fullFormAttributesEnterprise: FormAttributesEnterprise = {
  Объект: {
    Тип: "Число",
    ОсновнойРеквизит: "Истина",
    СохраняемыеДанные: "Истина",
    РазрешитьИспользование: {
      Администратор: "Истина",
      Пользователь: "Ложь",
    },
  },
  ТестовыйАтрибут: {
    Заголовок: "Заголовок атрибута",
    Тип: "Строка",
    СохраняемыеДанные: "Истина",
    РазрешитьИспользование: {
      Администратор: "Истина",
      Пользователь: "Ложь",
    },
  },
}

//#endregion

//#region Minimal

export const minimalFormAttributes: FormAttributes = [
  {
    name: "ТестовыйАтрибут",
    valueType: {
      type: ["string"],
    },
    title: { items: { ru: "" } },
  },
]

//#endregion

//#region Multiple

export const multipleFormAttributes: FormAttributes = [
  {
    name: "ТестовыйАтрибут1",
    title: { items: { ru: "Атрибут 1" } },
    valueType: {
      type: ["string"],
    },
  },
  {
    name: "ТестовыйАтрибут2",
    title: { items: { ru: "Атрибут 2" } },
    valueType: {
      type: ["string"],
    },
  },
]

//#endregion

//#region Short

export const shortFormAttribute: FormAttributes = [
  {
    name: "ТестовыйАтрибут",
    title: { items: { ru: "Тестовый атрибут" } },
    valueType: {
      type: ["string"],
    },
  },
]

export const shortFormAttributeEnterprise: FormAttributesEnterprise = {
  ТестовыйАтрибут: "Строка",
}

//#endregion

//#region MinimalEnterprise
export const minimalFormAttributesEnterprise: FormAttributesEnterprise = {
  ТестовыйАтрибут: {
    Заголовок: "",
    Тип: "Строка",
  },
}
//#endregion

//#region WithMainAttribute
export const withMainAttributeFormAttribute: FormAttributes = [
  {
    name: "ТестовыйАтрибут",
    title: { items: { ru: "Тестовый атрибут" } },
    valueType: {
      type: ["string"],
      stringQualifiers: { length: 0, allowedLength: "Variable" },
    },
    mainAttribute: true,
  },
]
//#endregion

//#region MainAttributeWithTitleEqualsName

export const mainAttributeTitleEqualsName: FormAttributes = [
  {
    name: "ТестовыйАтрибут",
    title: { items: { ru: "Тестовый атрибут" } },
    valueType: {
      type: ["string"],
    },
    mainAttribute: true,
  },
]

export const mainAttributeTitleEqualsNameEnterprise: FormAttributesEnterprise = {
  ТестовыйАтрибут: {
    Заголовок: "Тестовый атрибут",
    Тип: "Строка",
    ОсновнойРеквизит: "Истина",
  },
}
//#endregion

//#region WithStoredData
export const withStoredDataFormAttribute: FormAttributes = [
  {
    name: "ТестовыйАтрибут",
    title: { items: { ru: "Тестовый атрибут" } },
    valueType: {
      type: ["string"],
      stringQualifiers: { length: 0, allowedLength: "Variable" },
    },
    storedData: true,
  },
]
//#endregion

//#region ChoiceList
export const choiceListFormAttribute: FormAttributes = [
  {
    settings: {
      type: ["CatalogRef.ДоговорыКонтрагентов"],
    },
    name: "ВыбранныеЗначения",
    title: { items: { ru: "Выбранные значения" } },
    valueType: {
      type: ["ValueListType"],
    },
  },
]

export const choiceListFormAttributeEnterprise: FormAttributesEnterprise = {
  ВыбранныеЗначения: {
    Тип: "СписокЗначений",
    ТипЗначения: "Справочник.ДоговорыКонтрагентов",
  },
}

//#endregion

//#region WithEmptySettings

export const withEmptySettingsFormAttribute: FormAttributes = [
  {
    name: "ВыбранныеЗначения",
    title: { items: { ru: "Выбранные значения" } },
    valueType: { type: ["ValueListType"] },
  },
]

export const withEmptySettingsFormAttributeEnterprise: FormAttributesEnterprise = {
  ВыбранныеЗначения: "СписокЗначений",
}
//#endregion

//#region WithDynamicList
export const withDynamicListFormAttribute: FormAttributes = [
  {
    name: "ВыбранныеЗначения",
    title: { items: { ru: "Выбранные значения" } },
    valueType: { type: ["DynamicList"] },
    settings: fullDynamicList,
  },
]

export const withDynamicListFormAttributeEnterprise: FormAttributesEnterprise = {
  ВыбранныеЗначения: {
    Тип: "ДинамическийСписок",
    ДинамическийСписок: fullDynamicList,
  },
}
//#endregion

//#region TableWithColumns

export const tableWithColumnsFormAttribute: FormAttributes = [
  {
    name: "Таблица",
    title: { items: { ru: "" } },
    valueType: { type: ["ValueTable"] },
    columns: [
      {
        name: "Колонка1",
        id: "2",
        type: { type: ["boolean"] },
      },
      {
        name: "Колонка2",
        id: "3",
        type: { type: ["boolean"] },
      },
    ],
  },
]

export const tableWithColumnsFormAttributeEnterprise: FormAttributesEnterprise = {
  Таблица: {
    Заголовок: "",
    Тип: "ТаблицаЗначений",
    Колонки: {
      Колонка1: {
        Тип: "Булево",
      },
      Колонка2: {
        Тип: "Булево",
      },
    },
  },
}

//#endregion

//#region TreeWithColumn

export const treeWithColumnFormAttribute: FormAttributes = [
  {
    name: "Дерево",
    title: { items: { ru: "" } },
    valueType: { type: ["ValueTree"] },
    columns: [
      {
        name: "Колонка1",
        id: "2",
        title: { items: { ru: "abc" } },
        type: { type: ["string"] },
        view: { common: false, values: [] },
        edit: { common: false, values: [] },
        fillCheck: "ShowError",
      },
    ],
  },
]

export const treeWithColumnFormAttributeEnterprise: FormAttributesEnterprise = {
  Дерево: {
    Заголовок: "",
    Тип: "ДеревоЗначений",
    Колонки: {
      Колонка1: {
        Заголовок: "abc",
        Тип: "Строка",
        ПроверкаЗаполнения: "ВыдаватьОшибку",
        ЗапретитьПросмотр: {},
        ЗапретитьРедактирование: {},
      },
    },
  },
}

//#endregion

//#region WithFunctionalOptions

export const withFunctionalOptionsFormAttribute: FormAttributes = [
  {
    name: "ТестовыйАтрибут",
    title: { items: { ru: "Заголовок" } },
    valueType: { type: ["string"] },
    functionalOptions: ["FunctionalOption.ФункциональнаяОпция1"],
  },
]

export const withFunctionalOptionsFormAttributeEnterprise: FormAttributesEnterprise = {
  ТестовыйАтрибут: {
    Заголовок: "Заголовок",
    Тип: "Строка",
    ФункциональныеОпции: ["FunctionalOption.ФункциональнаяОпция1"],
  },
}

//#endregion
