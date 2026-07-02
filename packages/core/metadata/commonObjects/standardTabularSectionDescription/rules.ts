import { standardTabularSectionAttributeDescriptionsRule } from "./builders"
import { i8nTextRule } from "../i8nText/types"
import { stringRule } from "../string/types"
import { systemEnumerationRule } from "../../systemEnumerations/types"
import type { MetadataItemRule } from "../../orchestration/property/types"
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
      excludeIfEqualNameYAML: true,
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
