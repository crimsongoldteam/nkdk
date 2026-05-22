import {
  StandardAttributeDescriptions,
  StandardAttributeDescriptionsYAML,
} from "~/metadata/commonObjects/standardAttributeDescription/types"

// all reflects the content of __fixtures__/all.xml after filterNonEmpty:
// only Owner (non-default), Parent (fillFromFillingValue=true), Description (fillChecking=ShowError)
export const all: StandardAttributeDescriptions = [
  {
    itemType: "StandardAttributeDescription",
    name: "Owner",
    choiceForm: "Catalog.СправочникВладелец.Form.ФормаВыбора",
    choiceHistoryOnInput: "DontUse",
    choiceParameterLinks: [
      {
        name: "Отбор.Наименование",
        dataPath: "Catalog.Справочник1.StandardAttribute.Description",
        valueChange: "DontChange",
      },
    ],
    choiceParameters: [
      {
        name: "Отбор.Ссылка",
        value: {
          type: "ref",
          value: "Catalog.Справочник1.EmptyRef",
        },
      },
    ],
    comment: "Комментарий",
    createOnInput: "DontUse",
    dataHistory: "DontUse",
    fillValue: {
      type: "ref",
      value: "Catalog.СправочникВладелец.ПредопределенноеЗначение",
    },
    fullTextSearch: "DontUse",
    quickChoice: "Use",
    synonym: { items: { ru: "Синоним" } },
    toolTip: { items: { ru: "Подсказка" } },
  },
  {
    itemType: "StandardAttributeDescription",
    name: "Description",
    fillChecking: "ShowError",
  },
  {
    itemType: "StandardAttributeDescription",
    name: "Parent",
    fillFromFillingValue: true,
  },
]

export const allYAML: StandardAttributeDescriptionsYAML = {
  Владелец: {
    БыстрыйВыбор: "Использовать",
    ЗначениеЗаполнения: "Справочник.СправочникВладелец.ПредопределенноеЗначение",
    ИсторияВыбораПриВводе: "НеИспользовать",
    ИсторияДанных: "НеИспользовать",
    Комментарий: "Комментарий",
    ПараметрыВыбора: {
      "Отбор.Ссылка": "Справочник.Справочник1.ПустаяСсылка",
    },
    Подсказка: "Подсказка",
    ПолнотекстовыйПоиск: "НеИспользовать",
    СвязиПараметровВыбора: [
      {
        Имя: "Отбор.Наименование",
        ПутьКДанным: "Catalog.Справочник1.StandardAttribute.Description",
        РежимИзменения: "НеИзменять",
      },
    ],
    СозданиеПриВводе: "НеИспользовать",
    Синоним: "Синоним",
    ФормаВыбора: "Catalog.СправочникВладелец.Form.ФормаВыбора",
  },
  Наименование: {
    ПроверкаЗаполнения: "ВыдаватьОшибку",
  },
  Родитель: {
    ЗаполнятьИзДанныхЗаполнения: "Истина",
  },
}

export const minimal: StandardAttributeDescriptions = [
  {
    itemType: "StandardAttributeDescription",
    name: "PredefinedDataName",
  },
]

export const minimalYAML: StandardAttributeDescriptionsYAML = {
  ИмяПредопределенныхДанных: {},
}

export const multiple: StandardAttributeDescriptions = [
  {
    itemType: "StandardAttributeDescription",
    fillChecking: "ShowError",
    name: "PredefinedDataName",
    synonym: { items: { ru: "Какой-то синоним" } },
  },
  {
    itemType: "StandardAttributeDescription",
    name: "Predefined",
    synonym: { items: { ru: "Другой какой-то синоним" } },
  },
]

export const accountingExtDimensions = [
  { itemType: "StandardAttributeDescription", name: "ExtDimension1" },
  { itemType: "StandardAttributeDescription", name: "ExtDimensionType1" },
  { itemType: "StandardAttributeDescription", name: "ExtDimension50" },
  { itemType: "StandardAttributeDescription", name: "ExtDimensionType50" },
] satisfies StandardAttributeDescriptions
