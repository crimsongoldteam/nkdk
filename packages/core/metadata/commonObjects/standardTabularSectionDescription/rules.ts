import { MetadataItemRule } from "~/metadata/orchestration/property/types"

export const StandardTabularSectionDescriptionRules = {
  itemType: "StandardTabularSectionDescription",
  properties: {
    name: {
      xml: "_name",
      type: "string",
      required: true,
    },
    synonym: {
      yaml: "Синоним",
      xml: "xr:Synonym",
      type: "I8nText",
      defaultValueXMLRaw: "",
    },
    comment: {
      yaml: "Комментарий",
      xml: "xr:Comment",
      type: "string",
      defaultValueXMLRaw: "",
    },
    toolTip: {
      yaml: "Подсказка",
      xml: "xr:ToolTip",
      type: "I8nText",
      defaultValueXMLRaw: "",
    },
    fillChecking: {
      yaml: "ПроверкаЗаполнения",
      xml: "xr:FillChecking",
      type: "SystemEnumeration",
      typeSE: "FillChecking",
      defaultValueXML: "DontCheck",
      defaultValueYAML: "DontCheck",
    },
    standardAttributes: {
      yaml: "СтандартныеРеквизиты",
      xml: "xr:StandardAttributes",
      type: "StandardTabularSectionAttributeDescriptions",
    },
  },
} as const satisfies MetadataItemRule
