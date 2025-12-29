import {
  StandardAttributeDescription,
  StandardAttributeDescriptions,
  StandardAttributeDescriptionsEnterprise,
} from "~/metadata/commonObjects/standardAttributeDescription/types"

export const allParameters: StandardAttributeDescriptions = [
  {
    name: "PredefinedDataName",
    choiceForm: "ФормаВыбора",
    choiceHistoryOnInput: "DontUse",
    choiceParameterLinks: [
      {
        name: "Отбор.Владелец2",
        dataPath: "Catalog.Справочник2.Attribute.Реквизит2",
        valueChange: "Clear",
      },
    ],
    choiceParameters: [
      {
        name: "Отбор.Владелец",
        dataPath: "Catalog.Справочник1.Attribute.Реквизит1",
        valueChange: "Clear",
      },
    ],
    comment: "Какой-то комментарий",
    createOnInput: "Use",
    dataHistory: "DontUse",
    editFormat: { items: { ru: "Формат редактирования", en: "Edit format" } },
    extendedEdit: true,
    fillChecking: "ShowError",
    fillFromFillingValue: true,
    fillValue: {
      type: "string",
      value: "Текстовое значение",
    },
    format: { items: { ru: "Формат" } },
    fullTextSearch: "DontUse",
    linkByType: {
      dataPath: "Catalog.КакойТоСправочник.Attribute.КакойТоРеквизит",
      linkItem: 0,
    },
    markNegatives: true,
    mask: "999",
    maxValue: 100,
    minValue: 0,
    multiLine: true,
    passwordMode: true,
    quickChoice: "Use",
    synonym: { items: { ru: "Какой-то синоним" } },
    toolTip: { items: { ru: "Подсказка для поля" } },
    type: {
      type: ["string"],
      stringQualifiers: { length: 10, allowedLength: "Variable" },
    },
    typeReductionMode: "Deny",
  },
]

export const allParametersEnterprise: StandardAttributeDescriptionsEnterprise = {
  ИмяПредопределенныхДанных: {
    Синоним: "Какой-то синоним",
    ПроверкаЗаполнения: "ВыдаватьОшибку",
    БыстрыйВыбор: "Использовать",
    ВыделятьОтрицательные: "Истина",
    ЗаполнятьИзДанныхЗаполнения: "Ложь",
    ЗначениеЗаполнения: '"Текстовое значение"',
    ИсторияВыбораПриВводе: "Авто",
    ИсторияДанных: "Использовать",
    Комментарий: "Какой-то комментарий",
    МаксимальноеЗначение: 100,
    Маска: "999",
    МинимальноеЗначение: 0,
    МногострочныйРежим: "Истина",
    ПараметрыВыбора: "Отбор.Владелец(Справочник.Справочник1.Реквизит.Реквизит1)",
    Подсказка: "Подсказка для поля",
    ПолнотекстовыйПоиск: "Использовать",
    РасширенноеРедактирование: "Ложь",
    РежимПароля: "Истина",
    РежимСокращенияТипа: "Запрещать",
    СвязиПараметровВыбора: "Отбор.Владелец2(Справочник.Справочник2.Реквизит.Реквизит2)",
    СвязьПоТипу: "Справочник.КакойТоСправочник.Реквизит.КакойТоРеквизит",
    СозданиеПриВводе: "Авто",
    Тип: "Строка(10)",
    ФормаВыбора: "ФормаВыбора",
    Формат: "Формат",
    ФорматРедактирования: { ru: "Формат редактирования", en: "Edit format" },
  },
}

export const necessaryParameters: StandardAttributeDescription = {
  name: "PredefinedDataName",
}

export const multiple: StandardAttributeDescriptions = [
  {
    fillChecking: "ShowError",
    name: "PredefinedDataName",
    synonym: { items: { ru: "Какой-то синоним" } },
  },
  {
    name: "Predefined",
    synonym: { items: { ru: "Другой какой-то синоним" } },
  },
]
