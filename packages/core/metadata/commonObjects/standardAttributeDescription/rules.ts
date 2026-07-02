import { minMaxValueRule } from "~/metadata/commonObjects/minMaxValue/types"
import { typeDescriptionRule } from "~/metadata/commonObjects/typeDescription/types"
import { typeLinkRule } from "~/metadata/commonObjects/typeLink/types"
import { choiceParameterLinksRule } from "~/metadata/commonObjects/\u0441hoiceParameterLinks/types"
import { choiceParametersRule } from "~/metadata/commonObjects/\u0441hoiceParameters/types"
import { booleanRule } from "~/metadata/commonObjects/boolean/types"
import { i8nTextRule } from "~/metadata/commonObjects/i8nText/types"
import { metadataValueRule } from "~/metadata/commonObjects/metadataValue/types"
import { stringRule } from "~/metadata/commonObjects/string/types"
import { systemEnumerationRule } from "~/metadata/systemEnumerations/types"
import type { MetadataItemRule } from "~/metadata/orchestration/property/types"
import { StandartAttributeNameFromYAML } from "./standartAttributeNames"
export const StandardAttributeDescriptionRules = {
  itemType: "StandardAttributeDescription",
  properties: {
    name: stringRule({
      xml: "_name",
      defaultValue: ({ name }: { name?: string }) => (name ? StandartAttributeNameFromYAML(name) : undefined),
    }),
    choiceForm: stringRule({
      yaml: "ФормаВыбора",
      xml: "xr:ChoiceForm",
      order: 11,
      defaultValueXMLRaw: "",
    }),
    choiceHistoryOnInput: systemEnumerationRule({
      yaml: "ИсторияВыбораПриВводе",
      xml: "xr:ChoiceHistoryOnInput",
      typeSE: "ChoiceHistoryOnInput",
      order: 13,
      defaultValueXML: "Auto",
      implicitValueYAML: "Auto",
    }),
    choiceParameterLinks: choiceParameterLinksRule({
      yaml: "СвязиПараметровВыбора",
      xml: "xr:ChoiceParameterLinks",
      order: 22,
      defaultValueXMLRaw: "",
    }),
    choiceParameters: choiceParametersRule({
      yaml: "ПараметрыВыбора",
      xml: "xr:ChoiceParameters",
      order: 25,
      defaultValueXMLRaw: "",
    }),
    comment: stringRule({
      yaml: "Комментарий",
      xml: "xr:Comment",
      order: 20,
      defaultValueXMLRaw: "",
    }),
    createOnInput: systemEnumerationRule({
      yaml: "СозданиеПриВводе",
      xml: "xr:CreateOnInput",
      typeSE: "CreateOnInput",
      order: 5,
      defaultValueXML: "Auto",
      implicitValueYAML: "Auto",
    }),
    dataHistory: systemEnumerationRule({
      yaml: "ИсторияДанных",
      xml: "xr:DataHistory",
      typeSE: "DataHistoryUse",
      order: 16,
      defaultValueXML: "Use",
      implicitValueYAML: "Use",
    }),
    editFormat: i8nTextRule({
      yaml: "ФорматРедактирования",
      xml: "xr:EditFormat",
      order: 14,
      defaultValueXMLRaw: "",
    }),
    extendedEdit: booleanRule({
      yaml: "РасширенноеРедактирование",
      xml: "xr:ExtendedEdit",
      order: 9,
      defaultValueXML: false,
      implicitValueYAML: false,
    }),
    fillChecking: systemEnumerationRule({
      yaml: "ПроверкаЗаполнения",
      xml: "xr:FillChecking",
      typeSE: "FillChecking",
      order: 2,
      defaultValueXML: "DontCheck",
      implicitValueYAML: "DontCheck",
    }),
    fillFromFillingValue: booleanRule({
      yaml: "ЗаполнятьИзДанныхЗаполнения",
      xml: "xr:FillFromFillingValue",
      order: 4,
      defaultValueXML: false,
      implicitValueYAML: false,
    }),
    fillValue: metadataValueRule({
      yaml: "ЗначениеЗаполнения",
      xml: "xr:FillValue",
      order: 23,
      defaultValueXMLRaw: { "_xsi:nil": true },
    }),
    format: i8nTextRule({
      yaml: "Формат",
      xml: "xr:Format",
      order: 10,
      defaultValueXMLRaw: "",
    }),
    fullTextSearch: systemEnumerationRule({
      yaml: "ПолнотекстовыйПоиск",
      xml: "xr:FullTextSearch",
      typeSE: "UseFullTextSearch",
      order: 21,
      defaultValueXML: "Use",
      implicitValueYAML: "Use",
    }),
    linkByType: typeLinkRule({
      yaml: "СвязьПоТипу",
      xml: "xr:LinkByType",
      order: 1,
      defaultValueXMLRaw: "",
    }),
    markNegatives: booleanRule({
      yaml: "ВыделятьОтрицательные",
      xml: "xr:MarkNegatives",
      order: 17,
      defaultValueXML: false,
      implicitValueYAML: false,
    }),
    mask: stringRule({
      yaml: "Маска",
      xml: "xr:Mask",
      order: 24,
      defaultValueXMLRaw: "",
    }),
    maxValue: minMaxValueRule({
      yaml: "МаксимальноеЗначение",
      xml: "xr:MaxValue",
      order: 7,
      defaultValueXMLRaw: { "_xsi:nil": true },
    }),
    minValue: minMaxValueRule({
      yaml: "МинимальноеЗначение",
      xml: "xr:MinValue",
      order: 18,
      defaultValueXMLRaw: { "_xsi:nil": true },
    }),
    multiLine: booleanRule({
      yaml: "МногострочныйРежим",
      xml: "xr:MultiLine",
      order: 3,
      defaultValueXML: false,
      implicitValueYAML: false,
    }),
    passwordMode: booleanRule({
      yaml: "РежимПароля",
      xml: "xr:PasswordMode",
      order: 15,
      defaultValueXML: false,
      implicitValueYAML: false,
    }),
    quickChoice: systemEnumerationRule({
      yaml: "БыстрыйВыбор",
      xml: "xr:QuickChoice",
      typeSE: "UseQuickChoice",
      order: 12,
      defaultValueXML: "Auto",
      implicitValueYAML: "Auto",
    }),
    synonym: i8nTextRule({
      yaml: "Синоним",
      xml: "xr:Synonym",
      order: 19,
      defaultValueXMLRaw: "",
      excludeIfEqualNameYAML: true,
    }),
    toolTip: i8nTextRule({
      yaml: "Подсказка",
      xml: "xr:ToolTip",
      order: 8,
      defaultValueXMLRaw: "",
    }),
    type: typeDescriptionRule({
      yaml: "Тип",
      xml: "xr:Type",
    }),
    typeReductionMode: systemEnumerationRule({
      yaml: "РежимСокращенияТипа",
      xml: "xr:TypeReductionMode",
      typeSE: "TypeReductionMode",
      order: 6,
      defaultValueXML: "TransformValues",
      implicitValueYAML: "TransformValues",
    }),
  },
} as const satisfies MetadataItemRule
