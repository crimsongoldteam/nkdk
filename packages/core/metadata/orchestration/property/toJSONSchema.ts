import { TSchema, Type } from "@sinclair/typebox"
import { ConfigurationContext } from "~/metadata/context/types"
import { getTypeRule } from "../formElement/factory"
import { MetadataItem, MetadataItemRule, PropertyRule } from "./types"

export const exportPropertiesToJSONSchema = <T extends MetadataItem>(params: {
  context: ConfigurationContext
  rule: MetadataItemRule
  metadataItem?: T
}): TSchema => {
  const { context, metadataItem, rule } = params

  const result = {} as TSchema

  for (const [key, ruleProp] of Object.entries(rule.properties) as [
    keyof T extends string ? keyof T : never,
    PropertyRule,
  ][]) {
    // if (ruleProp.fromEnterprise === false) continue

    const yamlKey = ruleProp.yaml
    if (!yamlKey) continue

    const value = metadataItem ? metadataItem[key] : undefined

    const exportedValue = exportPropertyToJSONSchema({
      context,
      rule: ruleProp,
      value,
    })
    if (exportedValue !== undefined) {
      result[yamlKey] = Type.Optional(exportedValue)
    }
  }

  return result
}

export const exportPropertyToJSONSchema = (params: {
  context: ConfigurationContext
  rule: PropertyRule
  value: any
}): TSchema | undefined => {
  const { context, rule, value } = params

  const typeExportFn = rule.type ? getTypeRule(rule.type, "exportToJSONSchema") : undefined

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
