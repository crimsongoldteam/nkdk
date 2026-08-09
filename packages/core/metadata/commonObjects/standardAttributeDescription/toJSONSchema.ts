import { TProperties, TSchema, Type } from "typebox"
import { ExportToJSONSchemaFn, registerTypeRule } from "../../ruleRuntime"
import { exportMetadataItemToJSONSchema } from "../../ruleRuntime/metadataItem/toJSONSchema"
import { StandardAttributeDescriptionRules } from "./rules"
import type { PropertyRule, StandardAttributeDescriptionsPropertyRule } from "../../ruleRuntime/property/types"
import { commonStandardMemberFillValuePolicy } from "../../standardMembers/declarations"

export const exportStandardAttributeDescriptionToJSONSchema: ExportToJSONSchemaFn = (params): TSchema => {
  const { context } = params
  const rule = asStandardAttributeDescriptionsRule(params.rule)
  const attributeSchema = exportMetadataItemToJSONSchema({
    context: context,
    rule: StandardAttributeDescriptionRules,
  })
  if (context.exportToJSONSchema?.validationPropertyRefs === true) {
    return Type.Record(Type.String(), attributeSchema)
  }

  const properties: TProperties = {}
  for (const [internalName, yamlName] of Object.entries(rule.standartAttributeNames)) {
    const schema = commonStandardMemberFillValuePolicy(internalName)?.policy === "forbidden"
      ? withoutProperty(attributeSchema, "ЗначениеЗаполнения")
      : attributeSchema
    properties[yamlName] = Type.Optional(schema)
  }
  return Type.Object(properties, { additionalProperties: attributeSchema })
}

function asStandardAttributeDescriptionsRule(rule: PropertyRule): StandardAttributeDescriptionsPropertyRule {
  return rule as StandardAttributeDescriptionsPropertyRule
}

function withoutProperty(schema: TSchema, key: string): TSchema {
  const properties = (schema as { properties?: Record<string, TSchema> }).properties
  if (properties === undefined) return schema
  const { [key]: _removed, ...rest } = properties
  return { ...schema, properties: rest }
}

registerTypeRule("StandardAttributeDescriptions", "exportToJSONSchema", exportStandardAttributeDescriptionToJSONSchema)
