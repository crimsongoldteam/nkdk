import { capitalize } from "~/helpers/capitalize"
import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { ToMetadata } from ".."
import { getTypeRule } from "../formElement/factory"
import { ExportToXMLFunction, ExportToXMLFunctionNew } from "./fn"
import { getOrderedKeysToXML, shouldProcessProperty } from "./helpers"
import { ItemXML, MetadataItemRule, PropertyRule } from "./types"

export const exportPropertiesToXML = <Rule extends MetadataItemRule>(params: {
  context: ConfigurationContextWithExportToXML
  metadata: ToMetadata<Rule["itemType"]> | undefined
  referenceMetadata?: ToMetadata<Rule["itemType"]> | undefined
  rule: Rule
  tag?: string[]
}): ItemXML => {
  const { context, metadata: metadata, referenceMetadata, rule, tag: tag } = params

  const result: ItemXML = {}

  const xmlContext = context.exportToXML?.context
  if (xmlContext) {
    if (xmlContext.propertiesItemXmlStack === undefined) {
      xmlContext.propertiesItemXmlStack = []
    }
    xmlContext.propertiesItemXmlStack.push(result)
  }

  const orderedKeys = getOrderedKeysToXML({ rule, tag, referenceMetadata })

  try {
    for (const key of orderedKeys) {
      if (key === "itemType") continue
      const ruleProp = rule.properties[key]
      if (!shouldProcessProperty({ rule: ruleProp, operation: "exportToXML" })) continue

      const currentContext: ConfigurationContextWithExportToXML = {
        ...context,
        exportToXML: { ...context.exportToXML },
      }

      const value = metadata === undefined ? undefined : (metadata as any)[key]

      const referenceValue = referenceMetadata === undefined ? undefined : (referenceMetadata as any)[key]

      const valueToExport = value !== undefined ? value : referenceValue

      const exportedValue = exportPropertyToXML({
        context: currentContext,
        rule: ruleProp,
        value: valueToExport,
        referenceMetadata: referenceValue,
        metadataItem: metadata,
      })

      setXMLValue(key, result, ruleProp, exportedValue)
    }
  } finally {
    xmlContext?.propertiesItemXmlStack?.pop()
  }

  return result
}

const setXMLValue = (key: string, xml: any, rule: PropertyRule, value: any): any => {
  if (value === undefined) return
  if (Array.isArray(value) && value.length === 0) return

  const xmlKey = rule.xml ?? capitalize(key)

  if (rule.xmlParents === undefined) {
    xml[xmlKey] = value
    return
  }

  let currentXml = xml
  for (const xmlParent of rule.xmlParents) {
    if (currentXml[xmlParent] === undefined) {
      currentXml[xmlParent] = {}
    }
    currentXml = currentXml[xmlParent]
  }

  currentXml[xmlKey] = value
}

export const exportPropertyToXML = (params: {
  context: ConfigurationContextWithExportToXML
  rule: PropertyRule
  value: any
  referenceMetadata?: any
  metadataItem?: any
}): any | undefined => {
  const { context, rule, value, metadataItem, referenceMetadata } = params

  const defaultValueXML = rule.defaultValueXML

  const typeExportFn = rule.type ? getTypeRule(rule.type, "exportToXML") : undefined

  if (!typeExportFn) {
    if (value === rule.defaultValue) {
      return defaultValueXML
    }
    return value
  }

  if (typeExportFn.length === 1) {
    const exportedValue = (typeExportFn as ExportToXMLFunctionNew)({
      context,
      rule,
      value,
      metadataItem,
      referenceMetadata,
    })
    if (exportedValue === rule.defaultValue) {
      return defaultValueXML
    }
    return exportedValue
  }

  const exportedValue = (typeExportFn as ExportToXMLFunction)(context, rule, value, referenceMetadata)
  if (exportedValue === rule.defaultValue) {
    return defaultValueXML
  }
  return exportedValue
}
