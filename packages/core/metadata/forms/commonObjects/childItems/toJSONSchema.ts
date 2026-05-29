import { TSchema, Type } from "@sinclair/typebox"
import { ConfigurationContext } from "~/metadata/context/types"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/orchestration"
import { getElementRule } from "~/metadata/orchestration/formElement/ruleFactory"
import {
  exportElementRuleToJSONSchema,
  exportElementToJSONSchema,
} from "~/metadata/orchestration/formElement/toJSONSchema"
import { ElementRule, CollectableElementTypeToYAML } from "~/metadata/orchestration/formElement/types"
import {
  ChildItemsTreePropertyType,
  getChildItemTypesByPropertyType,
  getTreeNodeJSONSchemaPropertyAliases,
} from "./treeYAML"

export const exportChildItemsToJSONSchema: ExportToJSONSchemaFn = (params): TSchema | undefined => {
  const { context, rule, value: items } = params
  if (!isChildItemsTreePropertyType(rule.type)) return undefined

  if (!items || items.length === 0) {
    return exportGenericChildItemsToJSONSchema({ context, propertyType: rule.type })
  }

  const result = {} as TSchema
  for (const item of items) {
    const resultItem = exportElementToJSONSchema({
      context,
      value: item,
    })

    result[item.name] = Type.Optional(resultItem)

    if ("childItems" in item && item.childItems !== undefined && Array.isArray(item.childItems)) {
      for (const childItem of item.childItems) {
        const resultChildItem = exportElementToJSONSchema({
          context,
          value: childItem,
        })
        if (resultChildItem !== undefined) {
          result[childItem.name] = Type.Optional(resultChildItem)
        }
      }
    }
  }
  return Type.Object(result, { additionalProperties: false })
}

function exportGenericChildItemsToJSONSchema(params: {
  context: ConfigurationContext
  propertyType: ChildItemsTreePropertyType
}): TSchema {
  const { context, propertyType } = params
  const childSchemas = getChildItemTypesByPropertyType(propertyType).map((itemType) =>
    exportElementRuleToJSONSchema({
      context,
      propertyAliases: getTreeNodeJSONSchemaPropertyAliases(itemType),
      rule: omitNestedChildItemsRule(getElementRule(itemType)),
      yamlKind: CollectableElementTypeToYAML[itemType],
    })
  )

  const itemSchema =
    childSchemas.length === 1
      ? childSchemas[0]
      : Type.Union(childSchemas as [TSchema, TSchema, ...TSchema[]])
  return Type.Record(Type.String(), itemSchema)
}

function omitNestedChildItemsRule(rule: ElementRule): ElementRule {
  return {
    ...rule,
    properties: Object.fromEntries(
      Object.entries(rule.properties).filter(([_key, propertyRule]) => propertyRule.yaml !== "Элементы")
    ),
  }
}

function isChildItemsTreePropertyType(type: unknown): type is ChildItemsTreePropertyType {
  return (
    type === "GroupChildItems" ||
    type === "CommandBarChildItems" ||
    type === "TableChildItems" ||
    type === "PagesChildItems"
  )
}

registerTypeRule("GroupChildItems", "exportToJSONSchema", exportChildItemsToJSONSchema)
registerTypeRule("CommandBarChildItems", "exportToJSONSchema", exportChildItemsToJSONSchema)
registerTypeRule("TableChildItems", "exportToJSONSchema", exportChildItemsToJSONSchema)
registerTypeRule("PagesChildItems", "exportToJSONSchema", exportChildItemsToJSONSchema)
