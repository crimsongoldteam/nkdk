import { minMaxValueRule } from "../minMaxValue/types"
import { typeDescriptionRule } from "../typeDescription/types"
import { typeLinkRule } from "../typeLink/types"
import { choiceParameterLinksRule } from "../\u0441hoiceParameterLinks/types"
import { choiceParametersRule } from "../\u0441hoiceParameters/types"
import { booleanRule } from "../boolean/types"
import { i8nTextRule } from "../i8nText/types"
import { metadataValueRule } from "../metadataValue/types"
import { stringRule } from "../string/types"
import { systemEnumerationRule } from "../../systemEnumerations/types"
import type { MetadataItemRule } from "../../orchestration/property/types"
import { StandartAttributeNameFromYAML } from "./standartAttributeNames"
export const StandardAttributeDescriptionRules = {
  itemType: "StandardAttributeDescription",
  xmlOrder: [
    "linkByType",
    "fillChecking",
    "multiLine",
    "fillFromFillingValue",
    "createOnInput",
    "typeReductionMode",
    "maxValue",
    "toolTip",
    "extendedEdit",
    "format",
    "choiceForm",
    "quickChoice",
    "choiceHistoryOnInput",
    "editFormat",
    "passwordMode",
    "dataHistory",
    "markNegatives",
    "minValue",
    "synonym",
    "comment",
    "fullTextSearch",
    "choiceParameterLinks",
    "fillValue",
    "mask",
    "choiceParameters",
    "name",
  ],
  properties: {
    name: stringRule({
      xml: "_name",
      defaultValue: ({ name }: { name?: string }) => (name ? StandartAttributeNameFromYAML(name) : undefined),
    }),
    choiceForm: stringRule({
      yaml: "ФормаВыбора",
      xml: "xr:ChoiceForm",
      defaultValueXMLRaw: "",
    }),
    choiceHistoryOnInput: systemEnumerationRule({
      yaml: "ИсторияВыбораПриВводе",
      xml: "xr:ChoiceHistoryOnInput",
      typeSE: "ChoiceHistoryOnInput",
      defaultValueXML: "Auto",
      implicitValueYAML: "Auto",
    }),
    choiceParameterLinks: choiceParameterLinksRule({
      yaml: "СвязиПараметровВыбора",
      xml: "xr:ChoiceParameterLinks",
      defaultValueXMLRaw: "",
    }),
    choiceParameters: choiceParametersRule({
      yaml: "ПараметрыВыбора",
      xml: "xr:ChoiceParameters",
      defaultValueXMLRaw: "",
    }),
    comment: stringRule({
      yaml: "Комментарий",
      xml: "xr:Comment",
      defaultValueXMLRaw: "",
    }),
    createOnInput: systemEnumerationRule({
      yaml: "СозданиеПриВводе",
      xml: "xr:CreateOnInput",
      typeSE: "CreateOnInput",
      defaultValueXML: "Auto",
      implicitValueYAML: "Auto",
    }),
    dataHistory: systemEnumerationRule({
      yaml: "ИсторияДанных",
      xml: "xr:DataHistory",
      typeSE: "DataHistoryUse",
      defaultValueXML: "Use",
      implicitValueYAML: "Use",
    }),
    editFormat: i8nTextRule({
      yaml: "ФорматРедактирования",
      xml: "xr:EditFormat",
      defaultValueXMLRaw: "",
    }),
    extendedEdit: booleanRule({
      yaml: "РасширенноеРедактирование",
      xml: "xr:ExtendedEdit",
      defaultValueXML: false,
      implicitValueYAML: false,
    }),
    fillChecking: systemEnumerationRule({
      yaml: "ПроверкаЗаполнения",
      xml: "xr:FillChecking",
      typeSE: "FillChecking",
      defaultValueXML: "DontCheck",
      implicitValueYAML: "DontCheck",
    }),
    fillFromFillingValue: booleanRule({
      yaml: "ЗаполнятьИзДанныхЗаполнения",
      xml: "xr:FillFromFillingValue",
      defaultValueXML: false,
      implicitValueYAML: false,
    }),
    fillValue: metadataValueRule({
      yaml: "ЗначениеЗаполнения",
      xml: "xr:FillValue",
      defaultValueXMLRaw: { "_xsi:nil": true },
    }),
    format: i8nTextRule({
      yaml: "Формат",
      xml: "xr:Format",
      defaultValueXMLRaw: "",
    }),
    fullTextSearch: systemEnumerationRule({
      yaml: "ПолнотекстовыйПоиск",
      xml: "xr:FullTextSearch",
      typeSE: "UseFullTextSearch",
      defaultValueXML: "Use",
      implicitValueYAML: "Use",
    }),
    linkByType: typeLinkRule({
      yaml: "СвязьПоТипу",
      xml: "xr:LinkByType",
      defaultValueXMLRaw: "",
    }),
    markNegatives: booleanRule({
      yaml: "ВыделятьОтрицательные",
      xml: "xr:MarkNegatives",
      defaultValueXML: false,
      implicitValueYAML: false,
    }),
    mask: stringRule({
      yaml: "Маска",
      xml: "xr:Mask",
      defaultValueXMLRaw: "",
    }),
    maxValue: minMaxValueRule({
      yaml: "МаксимальноеЗначение",
      xml: "xr:MaxValue",
      defaultValueXMLRaw: { "_xsi:nil": true },
    }),
    minValue: minMaxValueRule({
      yaml: "МинимальноеЗначение",
      xml: "xr:MinValue",
      defaultValueXMLRaw: { "_xsi:nil": true },
    }),
    multiLine: booleanRule({
      yaml: "МногострочныйРежим",
      xml: "xr:MultiLine",
      defaultValueXML: false,
      implicitValueYAML: false,
    }),
    passwordMode: booleanRule({
      yaml: "РежимПароля",
      xml: "xr:PasswordMode",
      defaultValueXML: false,
      implicitValueYAML: false,
    }),
    quickChoice: systemEnumerationRule({
      yaml: "БыстрыйВыбор",
      xml: "xr:QuickChoice",
      typeSE: "UseQuickChoice",
      defaultValueXML: "Auto",
      implicitValueYAML: "Auto",
    }),
    synonym: i8nTextRule({
      yaml: "Синоним",
      xml: "xr:Synonym",
      defaultValueXMLRaw: "",
      excludeIfEqualNameYAML: true,
    }),
    toolTip: i8nTextRule({
      yaml: "Подсказка",
      xml: "xr:ToolTip",
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
      defaultValueXML: "TransformValues",
      implicitValueYAML: "TransformValues",
    }),
  },
} as const satisfies MetadataItemRule
