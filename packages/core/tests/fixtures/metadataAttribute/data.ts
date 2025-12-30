import { MetadataAttributes } from "~/metadata/commonObjects/metadataAttribute/types"

export const full: MetadataAttributes = [
  {
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

export const minimal: MetadataAttributes = [
  {
    name: "ТестовыйРеквизит",
    type: { type: ["string"] },
  },
]
