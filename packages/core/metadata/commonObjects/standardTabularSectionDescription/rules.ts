import { standardTabularSectionAttributeDescriptionsRule } from "~/metadata/commonObjects/standardTabularSectionDescription/types"
import { i8nTextRule } from "~/metadata/commonObjects/i8nText/types"
import { stringRule } from "~/metadata/commonObjects/string/types"
import { systemEnumerationRule } from "~/metadata/systemEnumerations/types"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"
export const StandardTabularSectionDescriptionRules = {
  itemType: "StandardTabularSectionDescription",
  properties: {
    name: stringRule({
      xml: "_name",
      required: true,
    }),
    synonym: i8nTextRule({
      yaml: "Синоним",
      xml: "xr:Synonym",
      defaultValueXMLRaw: "",
    }),
    comment: stringRule({
      yaml: "Комментарий",
      xml: "xr:Comment",
      defaultValueXMLRaw: "",
    }),
    toolTip: i8nTextRule({
      yaml: "Подсказка",
      xml: "xr:ToolTip",
      defaultValueXMLRaw: "",
    }),
    fillChecking: systemEnumerationRule({
      yaml: "ПроверкаЗаполнения",
      xml: "xr:FillChecking",
      typeSE: "FillChecking",
      defaultValueXML: "DontCheck",
      implicitValueYAML: "DontCheck",
    }),
    standardAttributes: standardTabularSectionAttributeDescriptionsRule({
      yaml: "СтандартныеРеквизиты",
      xml: "xr:StandardAttributes",
    }),
  },
} as const satisfies MetadataItemRule
