import { capitalize } from "~/helpers/capitalize"
import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { getTypeRule } from "../formElement/factory"
import { ExportToXMLFunction, ExportToXMLFunctionNew } from "./fn"
import { getOrderedKeysToXML } from "./helpers"
import { ItemXML, MetadataItem, MetadataItemRule, PropertyRule } from "./types"

export const exportPropertiesToXML = <T extends MetadataItem>(params: {
  context: ConfigurationContextWithExportToXML
  metadata: T | undefined
  referenceMetadata?: T | undefined
  rule: MetadataItemRule
  tag?: string[]
}): ItemXML => {
  const { context, metadata: metadata, referenceMetadata, rule, tag: tag } = params

  const result: ItemXML = {}

  const orderedKeys = getOrderedKeysToXML({ rule, tag, referenceMetadata })

  for (const key of orderedKeys) {
    if (key === "events") continue
    if (key === "itemType") continue
    const ruleProp = rule.properties[key]

    const currentContext: ConfigurationContextWithExportToXML = {
      ...context,
      exportToXML: { ...context.exportToXML },
    }

    const value = metadata === undefined ? undefined : (metadata as any)[key]

    const exportedValue = exportPropertyToXML({
      context: currentContext,
      rule: ruleProp,
      value,
      metadataItem: metadata,
    })

    setXMLValue(key, result, ruleProp, exportedValue)
  }

  return result
}

const setXMLValue = (key: string, xml: any, rule: PropertyRule, value: any): any => {
  if (value === undefined) return

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
  metadataItem?: any
}): any | undefined => {
  const { context, rule, value, metadataItem } = params

  const typeExportFn = rule.type ? getTypeRule(rule.type, "exportToXML") : undefined

  if (!typeExportFn) {
    if (value === rule.defaultValue) {
      return undefined
    }
    return value
  }

  if (typeExportFn.length === 1) {
    const exportedValue = (typeExportFn as ExportToXMLFunctionNew)({
      context,
      rule,
      value,
      metadataItem,
    })
    if (exportedValue === rule.defaultValue) {
      return undefined
    }
    return exportedValue
  }

  const exportedValue = (typeExportFn as ExportToXMLFunction)(context, rule, value)
  if (exportedValue === rule.defaultValue) {
    return undefined
  }
  return exportedValue
}
