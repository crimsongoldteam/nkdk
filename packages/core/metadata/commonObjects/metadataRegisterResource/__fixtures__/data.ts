import {
  MetadataRegisterResources,
  MetadataRegisterResourcesYAML,
} from "~/metadata/commonObjects/metadataRegisterResource/types"
import { explicitYAMLString } from "~/yaml/explicitString"

export const resourcesFromXML: MetadataRegisterResources = [
  {
    itemType: "MetadataRegisterResource",
    name: "РесурсВсеСвойства",
    synonym: { items: { ru: "Ресурс все свойства" } },
    comment: "Комментарий",
    type: { type: ["ValueStorage"] },
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
    fullTextSearch: "DontUse",
    binaryDataStorageLocationUse: "DontUse",
    binaryDataStorageLocationUseField:
      "InformationRegister.Регистр.Attribute.ИспользоватьХранилищеДвоичныхДанных",
    objectBelonging: "Native",
  },
]

export const resourcesYAML: MetadataRegisterResourcesYAML = {
  РесурсВсеСвойства: {
    Комментарий: "Комментарий",
    Тип: "ХранилищеЗначения",
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
    ЗначениеЗаполнения: explicitYAMLString("Значение заполнения"),
    ПроверкаЗаполнения: "ВыдаватьОшибку",
    СвязиПараметровВыбора: [
      {
        Имя: "Отбор.Владелец",
        ПутьКДанным: "Catalog.Справочник.Attribute.Реквизит",
      },
    ],
    ПараметрыВыбора: { "Отбор.Параметр": explicitYAMLString("Значение") },
    СозданиеПриВводе: "НеИспользовать",
    ФормаВыбора: "Catalog.Справочник.Form.ФормаВыбора",
    СвязьПоТипу: "Справочник.Справочник.Реквизит.Реквизит(1)",
    ИсторияВыбораПриВводе: "НеИспользовать",
    ПолнотекстовыйПоиск: "НеИспользовать",
    ИспользованиеХраненияВХранилищеДвоичныхДанных: "НеИспользовать",
    ПолеИспользованияХраненияВХранилищеДвоичныхДанных:
      "InformationRegister.Регистр.Attribute.ИспользоватьХранилищеДвоичныхДанных",
  },
}
