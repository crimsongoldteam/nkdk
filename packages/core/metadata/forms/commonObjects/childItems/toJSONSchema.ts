import { TSchema, Type } from "@sinclair/typebox"
import { ConfigurationContext } from "~/metadata/context/types"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/orchestration"
import { getElementRule } from "~/metadata/orchestration/formElement/ruleFactory"
import {
  exportElementRuleToJSONSchema,
  exportElementToJSONSchema,
} from "~/metadata/orchestration/formElement/toJSONSchema"
import { ElementRule, CollectableElementTypeToYAML } from "~/metadata/orchestration/formElement/types"
import { createJSONSchemaPropertyOverrideContext } from "~/metadata/orchestration/jsonSchemaRefs"
import type { PropertyRuleType } from "~/metadata/orchestration/property/registry"
import {
  childItemsTreePropertyTypes,
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
  if (context.exportToJSONSchema?.mode === "inline") {
    return exportInlineGenericChildItemsToJSONSchema({ context, propertyType })
  }

  return exportGenericChildItemsDefinitionToJSONSchema({
    context,
    omitNestedChildItems: true,
    propertyType,
  })
}

function exportInlineGenericChildItemsToJSONSchema(params: {
  context: ConfigurationContext
  propertyType: ChildItemsTreePropertyType
}): TSchema {
  const { context, propertyType } = params
  const module = createChildItemsSchemaModule(createInlineChildItemsDefinitions(context))

  return module.Import(propertyType)
}

type ChildItemsSchemaModule = {
  Import: (key: ChildItemsTreePropertyType) => TSchema
}

function createChildItemsSchemaModule(definitions: Record<ChildItemsTreePropertyType, TSchema>): ChildItemsSchemaModule {
  return Type.Module(definitions) as unknown as ChildItemsSchemaModule
}

function createInlineChildItemsDefinitions(
  context: ConfigurationContext
): Record<ChildItemsTreePropertyType, TSchema> {
  const childItemsContext = createJSONSchemaPropertyOverrideContext(context, createChildItemsPropertyRefs())

  return Object.fromEntries(
    childItemsTreePropertyTypes.map((propertyType) => [
      propertyType,
      exportGenericChildItemsDefinitionToJSONSchema({
        context: childItemsContext,
        omitNestedChildItems: false,
        propertyType,
      }),
    ])
  ) as Record<ChildItemsTreePropertyType, TSchema>
}

function createChildItemsPropertyRefs(): Partial<Record<PropertyRuleType, TSchema>> {
  return Object.fromEntries(
    childItemsTreePropertyTypes.map((propertyType) => [propertyType, Type.Ref(propertyType)])
  ) as Partial<Record<PropertyRuleType, TSchema>>
}

function exportGenericChildItemsDefinitionToJSONSchema(params: {
  context: ConfigurationContext
  omitNestedChildItems: boolean
  propertyType: ChildItemsTreePropertyType
}): TSchema {
  const { context, omitNestedChildItems, propertyType } = params
  const childSchemas = getChildItemTypesByPropertyType(propertyType).map((itemType) =>
    exportElementRuleToJSONSchema({
      context,
      propertyAliases: getTreeNodeJSONSchemaPropertyAliases(itemType),
      rule: omitNestedChildItems ? omitNestedChildItemsRule(getElementRule(itemType)) : getElementRule(itemType),
      yamlKind: CollectableElementTypeToYAML[itemType],
    })
  )

  const itemSchema =
    childSchemas.length === 1
      ? childSchemas[0]
      : Type.Union(childSchemas as [TSchema, TSchema, ...TSchema[]], { discriminantKey: "Вид" })
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
