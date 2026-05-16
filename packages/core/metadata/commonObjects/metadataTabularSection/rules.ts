import { uuidPropertyRule } from "~/metadata/commonObjects/uuid/rule"
import { addDefaultLanguageNameToSynonym } from "~/metadata/helpers/synonymHelpers"
import { getParentFromContext } from "~/metadata/context/helpers"
import { ConfigurationContext } from "~/metadata/context/types"
import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { MetadataItemRule, PropertyRule } from "~/metadata/orchestration/property/types"

const propertiesParents = ["Properties"]
const childObjectsParents = ["ChildObjects"]
const emptyAttributes: [] = []

const getParentNameByItemType = (context: ConfigurationContextWithExportToXML, parentItemType: string): string => {
  const elements = context.exportToXML.itemsTree
  for (let i = elements.length - 1; i >= 0; i--) {
    const element = elements[i]
    if (String(element.itemType) === parentItemType) return element.name
  }

  return getParentFromContext(context).name
}

const commonTabularSectionProperties = {
  uuid: uuidPropertyRule,
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
  lineNumberLength: {
    yaml: "ДлинаНомераСтроки",
    xml: "LineNumberLength",
    type: "number",
    xmlParents: propertiesParents,
    defaultValueXML: 5,
    preserveFromReferenceXML: true,
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
    type: "MetadataTabularSectionAttributes",
    defaultValue: emptyAttributes,
    defaultValueXMLEmpty: emptyAttributes,
    defaultValueXMLRaw: {},
    required: true,
    xmlParents: childObjectsParents,
    xml: "Attribute",
  },
} as const satisfies Record<string, PropertyRule>

export const MetadataTabularSectionRules = {
  itemType: "MetadataTabularSection",
  properties: {
    ...commonTabularSectionProperties,
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
    use: {
      yaml: "Использование",
      xml: "Use",
      type: "SystemEnumeration",
      typeSE: "AttributeUse",
      xmlParents: propertiesParents,
      defaultValueXML: "ForItem",
      order: 7,
    },
  },
} as const satisfies MetadataItemRule

export const MetadataDocumentTabularSectionRules = {
  itemType: "MetadataTabularSection",
  properties: {
    ...commonTabularSectionProperties,
    internalInfo: {
      type: "InternalInfo",
      forReferenceOnly: true,
      getName: (params: { context: ConfigurationContextWithExportToXML; metadata: { name: string } }) => {
        const { context, metadata } = params
        const parent = getParentFromContext(context, ["MetadataDocument"])
        const parentPath = parent.name
        return `${parentPath}.${metadata.name}`
      },
      items: [
        { name: `DocumentTabularSection`, category: "TabularSection" },
        { name: `DocumentTabularSectionRow`, category: "TabularSectionRow" },
      ],
    },
  },
} as const satisfies MetadataItemRule

export const MetadataTaskTabularSectionRules = {
  itemType: "MetadataTabularSection",
  properties: {
    ...commonTabularSectionProperties,
    internalInfo: {
      type: "InternalInfo",
      forReferenceOnly: true,
      getName: (params: { context: ConfigurationContextWithExportToXML; metadata: { name: string } }) => {
        const parentPath = getParentNameByItemType(params.context, "MetadataTask")
        return `${parentPath}.${params.metadata.name}`
      },
      items: [
        { name: "TaskTabularSection", category: "TabularSection" },
        { name: "TaskTabularSectionRow", category: "TabularSectionRow" },
      ],
    },
  },
} as const satisfies MetadataItemRule

export const MetadataBusinessProcessTabularSectionRules = {
  itemType: "MetadataTabularSection",
  properties: {
    ...commonTabularSectionProperties,
    internalInfo: {
      type: "InternalInfo",
      forReferenceOnly: true,
      getName: (params: { context: ConfigurationContextWithExportToXML; metadata: { name: string } }) => {
        const parentPath = getParentNameByItemType(params.context, "MetadataBusinessProcess")
        return `${parentPath}.${params.metadata.name}`
      },
      items: [
        { name: "BusinessProcessTabularSection", category: "TabularSection" },
        { name: "BusinessProcessTabularSectionRow", category: "TabularSectionRow" },
      ],
    },
  },
} as const satisfies MetadataItemRule

export const MetadataDataProcessorTabularSectionRules = {
  itemType: "MetadataTabularSection",
  properties: {
    ...commonTabularSectionProperties,
    internalInfo: {
      type: "InternalInfo",
      forReferenceOnly: true,
      getName: (params: { context: ConfigurationContextWithExportToXML; metadata: { name: string } }) => {
        const { context, metadata } = params
        const parentPath = getParentNameByItemType(context, "MetadataDataProcessor")
        return `${parentPath}.${metadata.name}`
      },
      items: [
        { name: "DataProcessorTabularSection", category: "TabularSection" },
        { name: "DataProcessorTabularSectionRow", category: "TabularSectionRow" },
      ],
    },
  },
} as const satisfies MetadataItemRule

export const MetadataReportTabularSectionRules = {
  itemType: "MetadataTabularSection",
  properties: {
    ...commonTabularSectionProperties,
    internalInfo: {
      type: "InternalInfo",
      forReferenceOnly: true,
      getName: (params: { context: ConfigurationContextWithExportToXML; metadata: { name: string } }) => {
        const { context, metadata } = params
        const parentPath = getParentNameByItemType(context, "MetadataReport")
        return `${parentPath}.${metadata.name}`
      },
      items: [
        { name: "ReportTabularSection", category: "TabularSection" },
        { name: "ReportTabularSectionRow", category: "TabularSectionRow" },
      ],
    },
  },
} as const satisfies MetadataItemRule

export const MetadataExchangePlanTabularSectionRules = {
  itemType: "MetadataTabularSection",
  properties: {
    ...commonTabularSectionProperties,
    internalInfo: {
      type: "InternalInfo",
      forReferenceOnly: true,
      getName: (params: { context: ConfigurationContextWithExportToXML; metadata: { name: string } }) => {
        const { context, metadata } = params
        const parentPath = getParentNameByItemType(context, "MetadataExchangePlan")
        return `${parentPath}.${metadata.name}`
      },
      items: [
        { name: "ExchangePlanTabularSection", category: "TabularSection" },
        { name: "ExchangePlanTabularSectionRow", category: "TabularSectionRow" },
      ],
    },
  },
} as const satisfies MetadataItemRule

export const MetadataChartOfAccountsTabularSectionRules = {
  itemType: "MetadataTabularSection",
  properties: {
    ...commonTabularSectionProperties,
    internalInfo: {
      type: "InternalInfo",
      forReferenceOnly: true,
      getName: (params: { context: ConfigurationContextWithExportToXML; metadata: { name: string } }) => {
        const parent = getParentFromContext(params.context, ["MetadataChartOfAccounts" as never])
        return `${parent.name}.${params.metadata.name}`
      },
      items: [
        { name: "ChartOfAccountsTabularSection", category: "TabularSection" },
        { name: "ChartOfAccountsTabularSectionRow", category: "TabularSectionRow" },
      ],
    },
  },
} as const satisfies MetadataItemRule

export const MetadataChartOfCalculationTypesTabularSectionRules = {
  itemType: "MetadataTabularSection",
  properties: {
    ...commonTabularSectionProperties,
    internalInfo: {
      type: "InternalInfo",
      forReferenceOnly: true,
      getName: (params: { context: ConfigurationContextWithExportToXML; metadata: { name: string } }) => {
        const parent = getParentFromContext(params.context, ["MetadataChartOfCalculationTypes" as never])
        return `${parent.name}.${params.metadata.name}`
      },
      items: [
        { name: "ChartOfCalculationTypesTabularSection", category: "TabularSection" },
        { name: "ChartOfCalculationTypesTabularSectionRow", category: "TabularSectionRow" },
      ],
    },
  },
} as const satisfies MetadataItemRule

export const MetadataChartOfCharacteristicTypesTabularSectionRules = {
  itemType: "MetadataTabularSection",
  properties: {
    ...commonTabularSectionProperties,
    internalInfo: {
      type: "InternalInfo",
      forReferenceOnly: true,
      getName: (params: { context: ConfigurationContextWithExportToXML; metadata: { name: string } }) => {
        const parent = getParentFromContext(params.context, ["MetadataChartOfCharacteristicTypes" as never])
        return `${parent.name}.${params.metadata.name}`
      },
      items: [
        { name: "ChartOfCharacteristicTypesTabularSection", category: "TabularSection" },
        { name: "ChartOfCharacteristicTypesTabularSectionRow", category: "TabularSectionRow" },
      ],
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
  },
} as const satisfies MetadataItemRule
