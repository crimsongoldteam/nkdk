import { MetadataAttributes, MetadataAttributesYAML } from "~/metadata/commonObjects/metadataAttribute/types"

//#region FullMetadataAttributes
export const fullMetadataAttributes: MetadataAttributes = [
  {
    itemType: "MetadataAttribute",
    binaryDataStorageLocationUse: "Use",
    binaryDataStorageLocationUseField: true,
    choiceFoldersAndItems: "Folders",
    choiceForm: "Catalog.Справочник.Form.ФормаВыбора",
    choiceHistoryOnInput: "DontUse",
    choiceParameterLinks: [
      {
        name: "Отбор.Владелец",
        dataPath: "Catalog.Справочник.Attribute.Реквизит",
        valueChange: "Clear",
      },
    ],
    choiceParameters: [
      {
        name: "Отбор.Параметр",
        value: {
          type: "string",
          value: "Значение",
        },
      },
    ],
    comment: "Комментарий к реквизиту",
    createOnInput: "Use",
    dataHistory: "DontUse",
    editFormat: { items: { ru: "Формат редактирования" } },
    extendedEdit: true,
    fillChecking: "ShowError",
    fillFromFillingValue: true,
    fillValue: {
      type: "string",
      value: "Значение заполнения",
    },
    format: { items: { ru: "Формат отображения" } },
    fullTextSearch: "DontUse",
    indexing: "Index",
    linkByType: {
      dataPath: "Catalog.Справочник.Attribute.Реквизит",
      linkItem: 1,
    },
    markNegatives: true,
    mask: "999",
    maxValue: 100,
    minValue: 10,
    multiLine: true,
    name: "ТестовыйРеквизит",
    passwordMode: true,
    quickChoice: "DontUse",
    synonym: { items: { ru: "Какой-то тестовый реквизит" } },
    toolTip: { items: { ru: "Подсказка для реквизита" } },
    type: { type: ["string"] },
    use: "ForFolderAndItem",
  },
]

export const fullMetadataAttributesYAML: MetadataAttributesYAML = {
  ТестовыйРеквизит: {
    Тип: "Строка",
    Синоним: "Какой-то тестовый реквизит",
    БыстрыйВыбор: "НеИспользовать",
    ВыборГруппИЭлементов: "Группы",
    ВыделятьОтрицательные: "Истина",
    ЗаполнятьИзДанныхЗаполнения: "Истина",
    ЗначениеЗаполнения: '"Значение заполнения"',
    Индексирование: "Индексировать",
    Использование: "ДляГруппыИЭлемента",
    ИспользованиеХраненияВХранилищеДвоичныхДанных: "Использовать",
    ИсторияВыбораПриВводе: "НеИспользовать",
    ИсторияДанных: "НеИспользовать",
    Комментарий: "Комментарий к реквизиту",
    МаксимальноеЗначение: 100,
    Маска: "999",
    МинимальноеЗначение: 10,
    МногострочныйРежим: "Истина",
    ПараметрыВыбора: { "Отбор.Параметр": '"Значение"' },
    Подсказка: "Подсказка для реквизита",
    ПолеИспользованияХраненияВХранилищеДвоичныхДанных: "Истина",
    ПолнотекстовыйПоиск: "НеИспользовать",
    ПроверкаЗаполнения: "ВыдаватьОшибку",
    РасширенноеРедактирование: "Истина",
    РежимПароля: "Истина",
    СвязиПараметровВыбора: "Отбор.Владелец(Справочник.Справочник.Реквизит.Реквизит)",
    СвязьПоТипу: "Справочник.Справочник.Реквизит.Реквизит(1)",
    СозданиеПриВводе: "Использовать",
    ФормаВыбора: "Catalog.Справочник.Form.ФормаВыбора",
    Формат: "Формат отображения",
    ФорматРедактирования: "Формат редактирования",
  },
}
//#endregion

//#region Minimal
export const minimalMetadataAttributes: MetadataAttributes = [
  {
    itemType: "MetadataAttribute",
    name: "ТестовыйРеквизит",
    type: { type: ["string"] },
    synonym: { items: { ru: "" } },
  },
]

export const minimalMetadataAttributesYAML: MetadataAttributesYAML = {
  ТестовыйРеквизит: { Тип: "Строка", Синоним: "" },
}
//#endregion

//#region Multiple
export const multipleMetadataAttributes: MetadataAttributes = [
  {
    itemType: "MetadataAttribute",
    name: "ТестовыйРеквизит1",
    synonym: { items: { ru: "N1" } },
    type: { type: ["string"] },
  },
  {
    itemType: "MetadataAttribute",
    name: "ТестовыйРеквизит2",
    synonym: { items: { ru: "N2" } },
    type: { type: ["string"] },
  },
]
//#endregion

//#region Short
export const shortMetadataAttribute: MetadataAttributes = [
  {
    itemType: "MetadataAttribute",
    name: "ТестовыйРеквизит",
    type: { type: ["string"] },
    synonym: { items: { ru: "Тестовый реквизит" } },
  },
]

export const shortMetadataAttributeYAML: MetadataAttributesYAML = {
  ТестовыйРеквизит: "Строка",
}
//#endregion

//#region SkipSynonym
export const skipSynonymFromMetadataAttribute: MetadataAttributes = [
  {
    itemType: "MetadataAttribute",
    name: "ТестовыйРеквизит1",
    type: { type: ["string"] },
    comment: "Комментарий к реквизиту",
    synonym: { items: { ru: "Тестовый реквизит 1" } },
  },
  {
    itemType: "MetadataAttribute",
    name: "ТестовыйРеквизит2",
    type: { type: ["string"] },
    quickChoice: "DontUse",
    synonym: { items: { ru: "Тестовый реквизит 2" } },
  },
]

export const skipSynonymFromMetadataAttributeYAML: MetadataAttributesYAML = {
  ТестовыйРеквизит1: { Тип: "Строка", Комментарий: "Комментарий к реквизиту" },
  ТестовыйРеквизит2: { Тип: "Строка", БыстрыйВыбор: "НеИспользовать" },
}
//#endregion

//#region ShortMultilanguage
export const shortMultilanguageMetadataAttribute: MetadataAttributes = [
  {
    itemType: "MetadataAttribute",
    name: "ТестовыйРеквизит",
    type: { type: ["string"] },
    synonym: { items: { ru: "Тестовый реквизит", en: "Test attribute" } },
  },
]

export const shortMultilanguageMetadataAttributeYAML: MetadataAttributesYAML = {
  ТестовыйРеквизит: { Тип: "Строка", Синоним: { en: "Test attribute" } },
}
//#endregion

//#region WithMinValue
export const withMinValueMetadataAttribute: MetadataAttributes = [
  {
    itemType: "MetadataAttribute",
    name: "ТестовыйРеквизит",
    type: { type: ["string"] },
    synonym: { items: { ru: "Тестовый реквизит" } },
    minValue: 0,
  },
]

//#endregion
