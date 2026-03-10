import { MetadataItemRule } from "~/metadata/orchestration/property/types"

const propertiesParents = ["Properties"]
const childObjectsParents = ["ChildObjects"]

export const MetadataTabularSectionRules = {
  itemType: "MetadataTabularSection",
  properties: {
    name: {
      xml: "Name",
      type: "string",
      required: true,
      xmlParents: propertiesParents,
    },
    synonym: {
      yaml: "Синоним",
      xml: "Synonym",
      type: "I8nText",
      excludeIfEqualNameYAML: true,
      xmlParents: propertiesParents,
    },
    comment: {
      yaml: "Комментарий",
      xml: "Comment",
      type: "string",
      xmlParents: propertiesParents,
    },
    fillChecking: {
      yaml: "ПроверкаЗаполнения",
      xml: "FillChecking",
      type: "SystemEnumeration",
      typeSE: "FillChecking",
      xmlParents: propertiesParents,
      defaultValueXML: "DontCheck",
    },
    lineNumberLength: {
      yaml: "ДлинаНомераСтроки",
      xml: "LineNumberLength",
      type: "number",
      xmlParents: propertiesParents,
      defaultValueXML: 5,
    },
    objectBelonging: {
      yaml: "ПринадлежностьОбъекта",
      xml: "ObjectBelonging",
      type: "SystemEnumeration",
      typeSE: "ObjectBelonging",
      xmlParents: propertiesParents,
    },
    standardAttributes: {
      yaml: "СтандартныеРеквизиты",
      xml: "StandardAttributes",
      type: "StandardAttributeDescriptions",
      standartAttributeNames: ["LineNumber"],
      xmlParents: propertiesParents,
    },
    attributes: {
      yaml: "Реквизиты",
      type: "MetadataAttributes",
      defaultValue: [],
      required: true,
      xmlParents: childObjectsParents,
      xml: "Attribute",
    },
    toolTip: {
      yaml: "Подсказка",
      xml: "ToolTip",
      type: "I8nText",
      xmlParents: propertiesParents,
    },
    use: {
      yaml: "Использование",
      xml: "Use",
      type: "SystemEnumeration",
      typeSE: "AttributeUse",
      xmlParents: propertiesParents,
      defaultValueXML: "ForItem",
    },
  },
} as const satisfies MetadataItemRule
