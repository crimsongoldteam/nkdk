import { capitalize } from "~/helpers/capitalize"
import { ConfigurationContext } from "~/metadata/context/types"
import { ExportToXMLFunction, ExportToXMLFunctionNew, getTypeRule } from "../types/types"
import { ItemXML, MetadataItem, MetadataItemRule, PropertyRule } from "./types"

export const exportPropertiesToXML = <T extends MetadataItem>(params: {
  context: ConfigurationContext
  metadataItem: T | undefined
  rule: MetadataItemRule<T>
  tag?: MetadataItemRule<T>["tags"]
}): ItemXML => {
  const { context, metadataItem, rule, tag: tag } = params

  const result: ItemXML = {}

  for (const [key, ruleProp] of Object.entries(rule.properties) as [string, PropertyRule<T>][]) {
    if (tag && (!ruleProp.tag || !tag.includes(ruleProp.tag))) continue

    const currentContext: ConfigurationContext = {
      ...context,
      elementsTree: context.elementsTree ? [...context.elementsTree] : undefined,
    }

    const value = metadataItem === undefined ? undefined : (metadataItem as any)[key]

    const xmlKey = ruleProp.xml ?? capitalize(key)

    const exportedValue = exportPropertyToXML({
      context: currentContext,
      rule: ruleProp,
      value,
      metadataItem,
    })

    if (exportedValue === undefined) continue
    result[xmlKey] = exportedValue
  }

  return result
}

export const exportPropertyToXML = (params: {
  context: ConfigurationContext
  rule: PropertyRule<any>
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
