import { TProperties, TSchema, Type } from "typebox"
import { ConfigurationContext } from "../../../context/types"
import { NamedElement } from "../baseElement/types"
import { exportPropertiesToJSONSchema } from "../../../orchestration/property/toJSONSchema"
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
    properties,
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
      ...properties,
    },
    {
      additionalProperties: false,
    }
  )
}

function shouldOmitNestedChildItems(context: ConfigurationContext): boolean {
  const exportContext = context.exportToJSONSchema
  if (exportContext?.mode === "inline") return false
  return exportContext?.includeNestedChildItems !== true
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
