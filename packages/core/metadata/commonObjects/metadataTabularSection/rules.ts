import { uuidPropertyRule } from "~/metadata/commonObjects/uuid/rule"
import { addDefaultLanguageNameToSynonym } from "~/metadata/helpers/synonymHelpers"
import { getParentFromContext } from "~/metadata/context/helpers"
import { ConfigurationContext } from "~/metadata/context/types"
import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { MetadataItemRule } from "~/metadata/orchestration/property/types"

const propertiesParents = ["Properties"]
const childObjectsParents = ["ChildObjects"]

export const MetadataTabularSectionRules = {
  itemType: "MetadataTabularSection",
  properties: {
    uuid: uuidPropertyRule,
    internalInfo: {
      type: "InternalInfo",
      forReferenceOnly: true,
      getName: (params: { context: ConfigurationContextWithExportToXML; metadata: { name: string } }) => {
        const { context, metadata } = params
        const parent = getParentFromContext(context, ["MetadataCatalog"])
        const parentPath = parent.name
        return `${parentPath}.${metadata.name}`
      },
      items: [
        { name: `CatalogTabularSection`, category: "TabularSection" },
        { name: `CatalogTabularSectionRow`, category: "TabularSectionRow" },
      ],
    },
    name: {
      xml: "Name",
      type: "string",
      required: true,
      xmlParents: propertiesParents,
      order: 1,
    },
    synonym: {
      yaml: "Синоним",
      xml: "Synonym",
      type: "I8nText",
      excludeIfEqualNameYAML: true,
      xmlParents: propertiesParents,
      defaultValueXMLRaw: "",
      defaultValue: ({ context, name }: { context: ConfigurationContext; name?: string }) =>
        addDefaultLanguageNameToSynonym(context, undefined, name ?? ""),
      order: 2,
    },
    comment: {
      yaml: "Комментарий",
      xml: "Comment",
      type: "string",
      xmlParents: propertiesParents,
      defaultValueXMLRaw: "",
      order: 3,
    },
    toolTip: {
      yaml: "Подсказка",
      xml: "ToolTip",
      type: "I8nText",
      xmlParents: propertiesParents,
      defaultValueXMLRaw: "",
      order: 4,
    },
    fillChecking: {
      yaml: "ПроверкаЗаполнения",
      xml: "FillChecking",
      type: "SystemEnumeration",
      typeSE: "FillChecking",
      xmlParents: propertiesParents,
      defaultValueXML: "DontCheck",
      order: 5,
    },
    standardAttributes: {
      yaml: "СтандартныеРеквизиты",
      xml: "StandardAttributes",
      type: "StandardAttributeDescriptions",
      standartAttributeNames: { LineNumber: "НомерСтроки" },
      xmlParents: propertiesParents,
      order: 6,
    },
    use: {
      yaml: "Использование",
      xml: "Use",
      type: "SystemEnumeration",
      typeSE: "AttributeUse",
      xmlParents: propertiesParents,
      defaultValueXML: "ForItem",
      order: 7,
    },
    lineNumberLength: {
      yaml: "ДлинаНомераСтроки",
      xml: "LineNumberLength",
      type: "number",
      xmlParents: propertiesParents,
      defaultValueXML: 5,
      order: 8,
    },
    objectBelonging: {
      yaml: "ПринадлежностьОбъекта",
      xml: "ObjectBelonging",
      type: "SystemEnumeration",
      typeSE: "ObjectBelonging",
      xmlParents: propertiesParents,
      order: 9,
    },
    attributes: {
      yaml: "Реквизиты",
      type: "MetadataAttributes",
      defaultValue: [],
      defaultValueXMLRaw: {},
      required: true,
      xmlParents: childObjectsParents,
      xml: "Attribute",
    },
  },
} as const satisfies MetadataItemRule
