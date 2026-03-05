import { capitalize } from "~/helpers/capitalize"
import { ConfigurationContext } from "~/metadata/context/types"
import { MetadataItemType, ToEnterprise, ToMetadata } from ".."
import { getTypeRule } from "../formElement/factory"
import { PropertyRuleTypeKeys } from "./registry"
import { MetadataItemRule, PropertyRule } from "./types"

export const exportPropertiesToEnterprise = <Type extends MetadataItemType>(params: {
  context: ConfigurationContext
  metadataItem: ToMetadata<Type>
  rule: MetadataItemRule & { itemType: Type }
}): ToEnterprise<Type> => {
  const { context, metadataItem, rule } = params

  const result = {} as ToEnterprise<Type>

  for (const [key, ruleProp] of Object.entries(rule.properties) as [keyof ToMetadata<Type> & string, PropertyRule][]) {
    if (ruleProp.toEnterprise === false) continue

    if (ruleProp.type == null || !PropertyRuleTypeKeys.includes(ruleProp.type)) continue
    const value = metadataItem[key]

    const exportedValue = exportPropertyToEnterprise({
      context,
      rule: ruleProp,
      value,
    })

    if (exportedValue !== undefined) {
      result[capitalize(key) as keyof ToEnterprise<Type>] = exportedValue
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
