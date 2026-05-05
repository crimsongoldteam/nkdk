import { FormAttributes, FormAttributesYAML } from "~/metadata/forms/commonObjects/formAttribute/types"

//#region FullFormAttributes

export const fullFormAttributes: Required<FormAttributes> = [
  {
    name: "Объект",
    title: { items: { ru: "" } },
    type: {
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
    fieldsList: ["Список.Ref"],
    save: ["Объект"],
    itemType: "FormAttribute",
    columns: [],
  },
  {
    name: "ТестовыйАтрибут",
    title: { items: { ru: "Заголовок атрибута" } },
    type: {
      type: ["string"],
    },
    storedData: true,
    view: {
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
    functionalOptions: ["FunctionalOption.ФункциональнаяОпция1"],
    fieldsList: ["Список.Ref"],
    itemType: "FormAttribute",
    columns: [],
  },
]

export const fullFormAttributesYAML: FormAttributesYAML = {
  Объект: {
    Тип: "Число",
    Заголовок: "",
    ОсновнойРеквизит: "Истина",
    СохраняемыеДанные: "Истина",
    РазрешитьРедактирование: {
      Администратор: "Истина",
      Пользователь: "Ложь",
    },
    РазрешитьПросмотр: {
      Администратор: "Истина",
      Пользователь: "Ложь",
    },
    ПроверкаЗаполнения: "ВыдаватьОшибку",
    ИспользоватьВсегда: ["Список.Ref"],
    Сохранение: ["Объект"],
  },
  ТестовыйАтрибут: {
    Заголовок: "Заголовок атрибута",
    Тип: "Строка",
    СохраняемыеДанные: "Истина",
    ЗапретитьРедактирование: {
      Администратор: "Истина",
      Пользователь: "Ложь",
    },
    РазрешитьПросмотр: {
      Администратор: "Истина",
      Пользователь: "Ложь",
    },
    ПроверкаЗаполнения: "ВыдаватьОшибку",
    ФункциональныеОпции: ["FunctionalOption.ФункциональнаяОпция1"],
    ИспользоватьВсегда: ["Список.Ref"],
  },
}

//#endregion

//#region Minimal

export const minimalFormAttributes: FormAttributes = [
  {
    name: "ТестовыйАтрибут",
    type: {
      type: ["string"],
    },
    title: { items: { ru: "" } },
    itemType: "FormAttribute",
    columns: [],
  },
]

//#endregion

//#region Multiple

export const multipleFormAttributes: FormAttributes = [
  {
    name: "ТестовыйАтрибут1",
    title: { items: { ru: "Атрибут 1" } },
    type: {
      type: ["string"],
    },
    itemType: "FormAttribute",
    columns: [],
  },
  {
    name: "ТестовыйАтрибут2",
    title: { items: { ru: "Атрибут 2" } },
    type: {
      type: ["string"],
    },
    itemType: "FormAttribute",
    columns: [],
  },
]

//#endregion

//#region Short

export const shortFormAttribute: FormAttributes = [
  {
    name: "ТестовыйАтрибут",
    title: { items: { ru: "Тестовый атрибут" } },
    type: {
      type: ["string"],
    },
    itemType: "FormAttribute",
    columns: [],
  },
]

export const shortFormAttributeYAML: FormAttributesYAML = {
  ТестовыйАтрибут: "Строка",
}

//#endregion

//#region MinimalYAML
export const minimalFormAttributesYAML: FormAttributesYAML = {
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
    itemType: "FormAttribute",
    columns: [],
  },
]
//#endregion

//#region MainAttributeWithTitleEqualsName

export const mainAttributeTitleEqualsName: FormAttributes = [
  {
    name: "ТестовыйАтрибут",
    title: { items: { ru: "Тестовый атрибут" } },
    type: {
      type: ["string"],
    },
    mainAttribute: true,
    itemType: "FormAttribute",
    columns: [],
  },
]

export const mainAttributeTitleEqualsNameYAML: FormAttributesYAML = {
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
    type: {
      type: ["string"],
      stringQualifiers: { length: 0, allowedLength: "Variable" },
    },
    storedData: true,
    itemType: "FormAttribute",
    columns: [],
  },
]
//#endregion

//#region ChoiceList
export const choiceListFormAttribute: FormAttributes = [
  {
    valueType: {
      type: ["CatalogRef.ДоговорыКонтрагентов"],
    },
    name: "ВыбранныеЗначения",
    title: { items: { ru: "Выбранные значения" } },
    type: {
      type: ["ValueListType"],
    },
    itemType: "FormAttribute",
    columns: [],
  },
]

export const choiceListFormAttributeYAML: FormAttributesYAML = {
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
    type: { type: ["ValueListType"] },
    itemType: "FormAttribute",
    columns: [],
  },
]

export const withEmptySettingsFormAttributeYAML: FormAttributesYAML = {
  ВыбранныеЗначения: "СписокЗначений",
}
//#endregion

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

//#region WithDynamicList
// export const withDynamicListFormAttribute: FormAttributes = [
//   {
//     name: "ВыбранныеЗначения",
//     title: { items: { ru: "Выбранные значения" } },
//     type: { type: ["DynamicList"] },
//     settings: fullDynamicList,
//     itemType: "FormAttribute",
//     columns: [],
//   },
// ]

// export const withDynamicListFormAttributeYAML: FormAttributesYAML = {
//   ВыбранныеЗначения: {
//     Тип: "ДинамическийСписок",
//     ДинамическийСписок: fullDynamicList,
//   },
// }
//#endregion

//#region TableWithColumns

export const tableWithColumnsFormAttribute: FormAttributes = [
  {
    name: "Таблица",
    title: { items: { ru: "" } },
    type: { type: ["ValueTable"] },
    columns: [
      {
        name: "Колонка1",
        type: { type: ["boolean"] },
        itemType: "FormAttributeColumn",
      },
      {
        name: "Колонка2",
        type: { type: ["boolean"] },
        itemType: "FormAttributeColumn",
      },
    ],
    itemType: "FormAttribute",
  },
]

export const tableWithColumnsFormAttributeYAML: FormAttributesYAML = {
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
    type: { type: ["ValueTree"] },
    columns: [
      {
        name: "Колонка1",
        title: { items: { ru: "abc" } },
        type: { type: ["string"] },
        view: { common: false, values: [] },
        edit: { common: false, values: [] },
        fillCheck: "ShowError",
        itemType: "FormAttributeColumn",
      },
    ],
    fieldsList: ["Дерево.Колонка1"],
    itemType: "FormAttribute",
  },
]

export const treeWithColumnFormAttributeYAML: FormAttributesYAML = {
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
    ИспользоватьВсегда: ["Дерево.Колонка1"],
  },
}

//#endregion

//#region WithFunctionalOptions

export const withFunctionalOptionsFormAttribute: FormAttributes = [
  {
    name: "ТестовыйАтрибут",
    title: { items: { ru: "Заголовок" } },
    type: { type: ["string"] },
    functionalOptions: ["FunctionalOption.ФункциональнаяОпция1"],
    itemType: "FormAttribute",
    columns: [],
  },
]

export const withFunctionalOptionsFormAttributeYAML: FormAttributesYAML = {
  ТестовыйАтрибут: {
    Заголовок: "Заголовок",
    Тип: "Строка",
    ФункциональныеОпции: ["FunctionalOption.ФункциональнаяОпция1"],
  },
}

//#endregion

//#region additional column

export const withAdditionalColumnFormAttribute: FormAttributes = [
  {
    name: "Объект",
    type: { type: ["string"] },
    title: { items: { ru: "" } },
    columns: [
      {
        table: "КакаяТоТаблица",
        columns: [
          {
            name: "КолонкаТаблицы",
            title: { items: { ru: "Описание колонки" } },
            type: { type: ["string"] },
            itemType: "FormAttributeColumn",
          },
        ],
      },
    ],
    itemType: "FormAttribute",
  },
]

export const withAdditionalColumnFormAttributeYAML: FormAttributesYAML = {
  Объект: {
    Заголовок: "",
    Тип: "Строка",
    Колонки: {
      КакаяТоТаблица: {
        КолонкаТаблицы: {
          Заголовок: "Описание колонки",
          Тип: "Строка",
        },
      },
    },
  },
}

//#endregion
