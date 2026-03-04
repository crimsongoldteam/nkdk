import { capitalize } from "~/helpers/capitalize"
import { ConfigurationContext } from "~/metadata/context/types"
import { ToEnterprise } from "../rules"
import { getTypeRule } from "../types/factory"
import { TypesNames } from "../types/types"
import { MetadataItem, MetadataItemRule, PropertyRule } from "./types"

export const exportPropertiesToEnterprise = <T extends MetadataItem>(params: {
  context: ConfigurationContext
  metadataItem: T
  rule: MetadataItemRule
}): ToEnterprise<T> => {
  const { context, metadataItem, rule } = params

  const result = {} as ToEnterprise<T>

  for (const [key, ruleProp] of Object.entries(rule.properties) as [
    keyof T extends string ? keyof T : never,
    PropertyRule,
  ][]) {
    if (ruleProp.toEnterprise === false) continue

    if (ruleProp.type == null || !(TypesNames as readonly string[]).includes(ruleProp.type)) continue
    const value = metadataItem[key]

    const exportedValue = exportPropertyToEnterprise({
      context,
      rule: ruleProp,
      value,
    })

    if (exportedValue !== undefined) {
      result[capitalize(key) as keyof ToEnterprise<T>] = exportedValue
    }
  }

  return result
}

export const exportPropertyToEnterprise = (params: {
  context: ConfigurationContext
  rule: PropertyRule
  value: any
}): any | undefined => {
  const { context, rule, value } = params

  const typeExportFn = rule.type ? getTypeRule(rule.type, "exportToEnterprise") : undefined

  if (!typeExportFn) {
    return value
  }

  const exportedValue = typeExportFn({
    context,
    rule,
    value,
  })

  return exportedValue
}
