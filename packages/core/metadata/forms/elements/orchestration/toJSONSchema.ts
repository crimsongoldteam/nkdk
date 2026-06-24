import { TProperties, TSchema, Type } from "@sinclair/typebox"
import { ConfigurationContext } from "~/metadata/context/types"
import { NamedElement } from "~/metadata/forms/elements/baseElement/types"
import { exportPropertiesToJSONSchema } from "~/metadata/orchestration/property/toJSONSchema"
import { getElementRule } from "./ruleFactory"
import { ElementRule } from "./types"

export const exportElementRuleToJSONSchema = (params: {
  context: ConfigurationContext
  rule: ElementRule
  yamlKind: string
  propertyAliases?: Record<string, string>
}): TSchema => {
  const { context, propertyAliases, rule, yamlKind } = params
  const properties = exportPropertiesToJSONSchema({
    context,
    rule,
  })
  const aliasedProperties = applyPropertyAliases({
    aliases: propertyAliases,
    properties: properties as TProperties,
  })

  return Type.Object(
    {
      ...aliasedProperties,
      Вид: Type.Literal(yamlKind),
    },
    {
      additionalProperties: false,
    }
  )
}

export const exportSingleElementRuleToJSONSchema = (params: {
  context: ConfigurationContext
  rule: ElementRule
}): TSchema => {
  const { context, rule } = params
  const properties = exportPropertiesToJSONSchema({
    context,
    rule: shouldOmitNestedChildItems(context) ? omitNestedChildItemsRule(rule) : rule,
  })

  return Type.Object(
    {
      ...(properties as TProperties),
    },
    {
      additionalProperties: false,
    }
  )
}

function shouldOmitNestedChildItems(context: ConfigurationContext): boolean {
  return context.exportToJSONSchema?.mode !== "inline"
}

function omitNestedChildItemsRule(rule: ElementRule): ElementRule {
  return {
    ...rule,
    properties: Object.fromEntries(
      Object.entries(rule.properties).filter(([_key, propertyRule]) => propertyRule.yaml !== "Элементы")
    ),
  }
}

const applyPropertyAliases = (params: { aliases?: Record<string, string>; properties: TProperties }): TProperties => {
  const { aliases } = params
  const result = { ...params.properties }
  if (aliases === undefined) return result

  for (const [from, to] of Object.entries(aliases)) {
    if (result[from] !== undefined) {
      result[to] = result[from]
      delete result[from]
    }
  }
  return result
}

export const exportElementToJSONSchema = <T extends NamedElement>(params: {
  context: ConfigurationContext
  value: T
}): TSchema => {
  const { context, value: element } = params
  const itemType = element.itemType

  const rules = getElementRule(itemType)

  const properties = exportPropertiesToJSONSchema({
    context,
    metadataItem: element,
    rule: rules,
  })

  const result = Type.Object(
    {
      ...properties,
    },
    { additionalProperties: false }
  )

  return result
}
