import { capitalize } from "~/helpers/capitalize"
import { ConfigurationContext } from "~/metadata/context/types"
import { getTypeRule } from "../../metadataFactory/types/factory"
import { ExportToXMLFunction, ExportToXMLFunctionNew } from "./fn"
import { ItemXML, MetadataItem, MetadataItemRule, PropertyRule } from "./types"

export const exportPropertiesToXML = <T extends MetadataItem>(params: {
  context: ConfigurationContext
  metadataItem: T | undefined
  rule: MetadataItemRule
  tag?: string[]
}): ItemXML => {
  const { context, metadataItem, rule, tag: tag } = params

  const result: ItemXML = {}

  for (const [key, ruleProp] of Object.entries(rule.properties) as [string, PropertyRule][]) {
    if (tag && (!ruleProp.tag || !tag.includes(ruleProp.tag))) continue

    const currentContext: ConfigurationContext = {
      ...context,
      elementsTree: context.elementsTree ? [...context.elementsTree] : undefined,
    }

    const value = metadataItem === undefined ? undefined : (metadataItem as any)[key]

    const exportedValue = exportPropertyToXML({
      context: currentContext,
      rule: ruleProp,
      value,
      metadataItem,
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
  context: ConfigurationContext
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
