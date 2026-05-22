import {
  MetadataRegisterAttributes,
  MetadataRegisterAttributesYAML,
} from "~/metadata/commonObjects/metadataRegisterAttribute/types"

export const attributesFromXML: MetadataRegisterAttributes = [
  {
    itemType: "MetadataRegisterAttribute",
    name: "РеквизитВсеСвойства",
    synonym: { items: { ru: "Реквизит все свойства" } },
    comment: "Комментарий",
    type: { type: ["decimal"], numberQualifiers: { digits: 10, fractionDigits: 0, allowedSign: "Any" } },
    passwordMode: true,
    format: { items: { ru: "Формат отображения" } },
    editFormat: { items: { ru: "Формат редактирования" } },
    toolTip: { items: { ru: "Подсказка" } },
    markNegatives: true,
    mask: "999",
    multiLine: true,
    extendedEdit: true,
    minValue: 10,
    maxValue: 100,
    fillFromFillingValue: true,
    fillValue: { type: "string", value: "Значение заполнения" },
    fillChecking: "ShowError",
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
    createOnInput: "DontUse",
    choiceForm: "Catalog.Справочник.Form.ФормаВыбора",
    linkByType: {
      dataPath: "Catalog.Справочник.Attribute.Реквизит",
      linkItem: 1,
    },
    choiceHistoryOnInput: "DontUse",
    indexing: "Index",
    fullTextSearch: "DontUse",
    dataHistory: "DontUse",
    binaryDataStorageLocationUse: "DontUse",
    binaryDataStorageLocationUseField:
      "InformationRegister.Регистр.Attribute.ИспользоватьХранилищеДвоичныхДанных",
    objectBelonging: "Native",
  },
]

export const attributesYAML: MetadataRegisterAttributesYAML = {
  РеквизитВсеСвойства: {
    Комментарий: "Комментарий",
    Тип: "Число(10, 0)",
    РежимПароля: "Истина",
    Формат: "Формат отображения",
    ФорматРедактирования: "Формат редактирования",
    Подсказка: "Подсказка",
    ВыделятьОтрицательные: "Истина",
    Маска: "999",
    МногострочныйРежим: "Истина",
    РасширенноеРедактирование: "Истина",
    МинимальноеЗначение: 10,
    МаксимальноеЗначение: 100,
    ЗаполнятьИзДанныхЗаполнения: "Истина",
    ЗначениеЗаполнения: '"Значение заполнения"',
    ПроверкаЗаполнения: "ВыдаватьОшибку",
    СвязиПараметровВыбора: [
      {
        Имя: "Отбор.Владелец",
        ПутьКДанным: "Catalog.Справочник.Attribute.Реквизит",
      },
    ],
    ПараметрыВыбора: { "Отбор.Параметр": '"Значение"' },
    СозданиеПриВводе: "НеИспользовать",
    ФормаВыбора: "Catalog.Справочник.Form.ФормаВыбора",
    СвязьПоТипу: "Справочник.Справочник.Реквизит.Реквизит(1)",
    ИсторияВыбораПриВводе: "НеИспользовать",
    Индексирование: "Индексировать",
    ПолнотекстовыйПоиск: "НеИспользовать",
    ИсторияДанных: "НеИспользовать",
    ИспользованиеХраненияВХранилищеДвоичныхДанных: "НеИспользовать",
    ПолеИспользованияХраненияВХранилищеДвоичныхДанных:
      "InformationRegister.Регистр.Attribute.ИспользоватьХранилищеДвоичныхДанных",
  },
}
