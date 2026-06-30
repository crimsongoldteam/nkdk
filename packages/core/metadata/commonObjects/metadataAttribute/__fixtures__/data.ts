import { MetadataAttributes, MetadataAttributesYAML } from "~/metadata/commonObjects/metadataAttribute/types"
import { explicitYAMLString } from "~/yaml/explicitString"

//#region XML fixtures

// Corresponds to __fixtures__/minimal.xml
export const minimalFromXML: MetadataAttributes = [
  {
    itemType: "MetadataAttribute",
    name: "РеквизитМинимальный",
    synonym: { items: { ru: "Реквизит минимальный" } },
    type: { type: ["string"], stringQualifiers: { length: 10, allowedLength: "Variable" } },
    fillValue: { type: "string", value: "" },
  },
]

// Corresponds to __fixtures__/multiple.xml
export const multipleFromXML: MetadataAttributes = [
  {
    itemType: "MetadataAttribute",
    name: "Реквизит1",
    synonym: { items: { ru: "Реквизит 1" } },
    type: { type: ["string"], stringQualifiers: { length: 10, allowedLength: "Variable" } },
    fillValue: { type: "string", value: "" },
  },
  {
    itemType: "MetadataAttribute",
    name: "Реквизит2",
    synonym: { items: { ru: "Реквизит 2" } },
    type: { type: ["string"], stringQualifiers: { length: 10, allowedLength: "Variable" } },
    fillValue: { type: "string", value: "" },
  },
]

// Corresponds to __fixtures__/documentTabular.xml (non-default values only, after import stripping)
export const documentTabularFromXML: MetadataAttributes = [
  {
    itemType: "MetadataAttribute",
    name: "РеквизитТабличнойЧасти",
    synonym: { items: { ru: "Синоним" } },
    comment: "Комментарий",
    type: { type: ["decimal"], numberQualifiers: { digits: 10, fractionDigits: 0, allowedSign: "Any" } },
    passwordMode: true,
    format: { items: { ru: "ДФ=dd.MM.yyyy" } },
    editFormat: { items: { ru: "ДФ=dd.MM.yy" } },
    toolTip: { items: { ru: "Подсказка" } },
    markNegatives: true,
    mask: "Маска",
    multiLine: true,
    extendedEdit: true,
    minValue: 1,
    maxValue: 99,
    createOnInput: "DontUse",
    linkByType: {
      dataPath: "Document.ДокументВсеСвойства.StandardAttribute.Date",
      linkItem: 0,
    },
    choiceHistoryOnInput: "DontUse",
    fullTextSearch: "DontUse",
    dataHistory: "DontUse",
  },
]

// Corresponds to __fixtures__/document.xml (non-default values only, after import stripping)
export const documentFromXML: MetadataAttributes = [
  {
    itemType: "MetadataAttribute",
    name: "ПолныйРеквизит",
    binaryDataStorageLocationUseField: "Document.ДокументВсеСвойства.Attribute.РеквизитБулево",
    synonym: { items: { ru: "Синоним" } },
    comment: "Комментарий",
    type: { type: ["ValueStorage"] },
    passwordMode: true,
    format: { items: { ru: "ДФ=dd.MM.yyyy" } },
    editFormat: { items: { ru: "ДФ=d.M.yy" } },
    toolTip: { items: { ru: "Подсказка" } },
    markNegatives: true,
    mask: "Маска",
    multiLine: true,
    extendedEdit: true,
    minValue: 1,
    maxValue: 100,
    fillFromFillingValue: true,
    fillChecking: "ShowError",
    createOnInput: "DontUse",
    linkByType: {
      dataPath: "Document.ДокументВсеСвойства.StandardAttribute.Date",
      linkItem: 0,
    },
    choiceHistoryOnInput: "DontUse",
    fullTextSearch: "DontUse",
    dataHistory: "DontUse",
  },
]

// Corresponds to __fixtures__/full.xml (non-default values only, after import stripping)
export const fullFromXML: MetadataAttributes = [
  {
    itemType: "MetadataAttribute",
    name: "РеквизитПолный",
    binaryDataStorageLocationUseField: "Catalog.СправочникВладелец.Attribute.РеквизитБулево",
    synonym: { items: { ru: "Синоним" } },
    comment: "Комментарий",
    type: { type: ["CatalogRef.СправочникПолный"] },
    passwordMode: true,
    format: { items: { ru: "ЧЦ=15; ЧДЦ=2" } },
    editFormat: { items: { ru: "ЧЦ=15; ЧДЦ=3" } },
    toolTip: { items: { ru: "Подсказка" } },
    markNegatives: true,
    mask: "Маска",
    multiLine: true,
    extendedEdit: true,
    minValue: 1,
    maxValue: 100,
    fillChecking: "ShowError",
    choiceParameterLinks: [
      {
        name: "Отбор.Наименование",
        dataPath: "Catalog.СправочникВладелец.StandardAttribute.Description",
        valueChange: "Clear",
      },
    ],
    choiceParameters: [
      {
        name: "Отбор.ПометкаУдаления",
        value: { type: "boolean", value: false },
      },
    ],
    createOnInput: "DontUse",
    choiceForm: "Catalog.СправочникПолный.Form.ФормаВыбора",
    linkByType: {
      dataPath: "Catalog.СправочникВладелец.StandardAttribute.Code",
      linkItem: 1,
    },
    choiceHistoryOnInput: "DontUse",
    use: "ForFolderAndItem",
    fullTextSearch: "DontUse",
    dataHistory: "DontUse",
    binaryDataStorageLocationUse: "DontUse",
  },
]

//#endregion

//#region YAML fixtures

export const fullMetadataAttributes: MetadataAttributes = [
  {
    itemType: "MetadataAttribute",
    binaryDataStorageLocationUse: "Use",
    binaryDataStorageLocationUseField: "Catalog.Справочник.Attribute.АтрибутХраненияДвоичныхДанных",
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
    ЗначениеЗаполнения: explicitYAMLString("Значение заполнения"),
    Индексирование: "Индексировать",
    Использование: "ДляГруппыИЭлемента",
    ИсторияВыбораПриВводе: "НеИспользовать",
    ИсторияДанных: "НеИспользовать",
    Комментарий: "Комментарий к реквизиту",
    МаксимальноеЗначение: 100,
    Маска: "999",
    МинимальноеЗначение: 10,
    МногострочныйРежим: "Истина",
    ПараметрыВыбора: { "Отбор.Параметр": explicitYAMLString("Значение") },
    Подсказка: "Подсказка для реквизита",
    ПолеИспользованияХраненияВХранилищеДвоичныхДанных: "АтрибутХраненияДвоичныхДанных",
    ПолнотекстовыйПоиск: "НеИспользовать",
    ПроверкаЗаполнения: "ВыдаватьОшибку",
    РасширенноеРедактирование: "Истина",
    РежимПароля: "Истина",
    СвязиПараметровВыбора: [
      {
        Имя: "Отбор.Владелец",
        ПутьКДанным: "Catalog.Справочник.Attribute.Реквизит",
      },
    ],
    СвязьПоТипу: "Справочник.Справочник.Реквизит.Реквизит(1)",
    СозданиеПриВводе: "Использовать",
    ФормаВыбора: "Catalog.Справочник.Form.ФормаВыбора",
    Формат: "Формат отображения",
    ФорматРедактирования: "Формат редактирования",
  },
}

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

export const shortMetadataAttribute: MetadataAttributes = [
  {
    itemType: "MetadataAttribute",
    name: "ТестовыйРеквизит",
    type: { type: ["string"] },
    synonym: { items: { ru: "Тестовый реквизит" } },
  },
]

export const shortMetadataAttributeYAML: MetadataAttributesYAML = {
  ТестовыйРеквизит: { Тип: "Строка" },
}

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
