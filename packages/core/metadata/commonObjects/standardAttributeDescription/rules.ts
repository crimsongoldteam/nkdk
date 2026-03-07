import { StandartAttributeNameFromYAML } from "~/metadata/commonObjects/standardAttributeDescription/types"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"

export const StandardAttributeDescriptionRules = {
  itemType: "StandardAttributeDescription",
  properties: {
    name: {
      xml: "_name",
      type: "string",
      defaultValue: ({ name }: { name?: string }) => (name ? StandartAttributeNameFromYAML(name) : undefined),
    },
    choiceForm: {
      yaml: "ФормаВыбора",
      xml: "xr:ChoiceForm",
      type: "string",
    },
    choiceHistoryOnInput: {
      yaml: "ИсторияВыбораПриВводе",
      xml: "xr:ChoiceHistoryOnInput",
      type: "SystemEnumeration",
      typeSE: "ChoiceHistoryOnInput",
    },
    choiceParameterLinks: {
      yaml: "СвязиПараметровВыбора",
      xml: "xr:ChoiceParameterLinks",
      type: "ChoiceParameterLinks",
    },
    choiceParameters: {
      yaml: "ПараметрыВыбора",
      xml: "xr:ChoiceParameters",
      type: "ChoiceParameters",
    },
    comment: {
      yaml: "Комментарий",
      xml: "xr:Comment",
      type: "string",
    },
    createOnInput: {
      yaml: "СозданиеПриВводе",
      xml: "xr:CreateOnInput",
      type: "SystemEnumeration",
      typeSE: "CreateOnInput",
    },
    dataHistory: {
      yaml: "ИсторияДанных",
      xml: "xr:DataHistory",
      type: "SystemEnumeration",
      typeSE: "DataHistoryUse",
    },
    editFormat: {
      yaml: "ФорматРедактирования",
      xml: "xr:EditFormat",
      type: "I8nText",
    },
    extendedEdit: {
      yaml: "РасширенноеРедактирование",
      xml: "xr:ExtendedEdit",
      type: "boolean",
    },
    fillChecking: {
      yaml: "ПроверкаЗаполнения",
      xml: "xr:FillChecking",
      type: "SystemEnumeration",
      typeSE: "FillChecking",
    },
    fillFromFillingValue: {
      yaml: "ЗаполнятьИзДанныхЗаполнения",
      xml: "xr:FillFromFillingValue",
      type: "boolean",
    },
    fillValue: {
      yaml: "ЗначениеЗаполнения",
      xml: "xr:FillValue",
      type: "MetadataValue",
    },
    format: {
      yaml: "Формат",
      xml: "xr:Format",
      type: "I8nText",
    },
    fullTextSearch: {
      yaml: "ПолнотекстовыйПоиск",
      xml: "xr:FullTextSearch",
      type: "SystemEnumeration",
      typeSE: "UseFullTextSearch",
    },
    linkByType: {
      yaml: "СвязьПоТипу",
      xml: "xr:LinkByType",
      type: "TypeLink",
    },
    markNegatives: {
      yaml: "ВыделятьОтрицательные",
      xml: "xr:MarkNegatives",
      type: "boolean",
    },
    mask: {
      yaml: "Маска",
      xml: "xr:Mask",
      type: "string",
    },
    maxValue: {
      yaml: "МаксимальноеЗначение",
      xml: "xr:MaxValue",
      type: "number",
    },
    minValue: {
      yaml: "МинимальноеЗначение",
      xml: "xr:MinValue",
      type: "number",
    },
    multiLine: {
      yaml: "МногострочныйРежим",
      xml: "xr:MultiLine",
      type: "boolean",
    },
    passwordMode: {
      yaml: "РежимПароля",
      xml: "xr:PasswordMode",
      type: "boolean",
    },
    quickChoice: {
      yaml: "БыстрыйВыбор",
      xml: "xr:QuickChoice",
      type: "SystemEnumeration",
      typeSE: "UseQuickChoice",
    },
    synonym: {
      yaml: "Синоним",
      xml: "xr:Synonym",
      type: "I8nText",
    },
    toolTip: {
      yaml: "Подсказка",
      xml: "xr:ToolTip",
      type: "I8nText",
    },
    type: {
      yaml: "Тип",
      xml: "xr:Type",
      type: "TypeDescription",
    },
    typeReductionMode: {
      yaml: "РежимСокращенияТипа",
      xml: "xr:TypeReductionMode",
      type: "SystemEnumeration",
      typeSE: "TypeReductionMode",
    },
  },
} as const satisfies MetadataItemRule
