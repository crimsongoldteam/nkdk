import { capitalize } from "~/helpers/capitalize"
import { ConfigurationContext } from "~/metadata/context/types"
import { getTypeRule } from "../typeRulesFactory"
import { ItemXML, MetadataItem, MetadataItemRule, PropertyRule } from "./types"

export const exportPropertiesToXML = <T extends MetadataItem>(params: {
  context: ConfigurationContext
  metadataItem: T | undefined
  rule: MetadataItemRule<T>
}): ItemXML => {
  const { context, metadataItem, rule } = params

  const result: ItemXML = {}

  for (const [key, ruleProp] of Object.entries(rule.properties) as [string, PropertyRule<T>][]) {
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
}): any | undefined => {
  const { context, rule, value } = params

  const typeExportFn = rule.type ? getTypeRule(rule.type, "exportToXML") : undefined

  if (!typeExportFn) {
    if (value === rule.defaultValue) {
      return undefined
    }
    return value
  }

  const exportedValue = typeExportFn(context, rule, value)
  if (exportedValue === rule.defaultValue) {
    return undefined
  }
  return exportedValue
}
