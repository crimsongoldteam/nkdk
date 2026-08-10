import { TSchema, Type } from "typebox"
import { ExportToJSONSchemaFn, definePropertyTypeRule } from "../../ruleRuntime"
import { exportMetadataItemToJSONSchema } from "../../ruleRuntime/metadataItem/toJSONSchema"
import { StandardAttributeDescriptionRules } from "./rules"
import type { StandardAttributeDescriptionsPropertyRule } from "@nkdk/runtime/rule-kit"
import { commonStandardMemberFillValuePolicy } from "../../standardMembers/declarations"

export const exportStandardAttributeDescriptionToJSONSchema: ExportToJSONSchemaFn = (params): TSchema => {
  const { context } = params
  const rule = params.rule as StandardAttributeDescriptionsPropertyRule
  const attributeSchema = exportMetadataItemToJSONSchema({
    context: context,
    rule: StandardAttributeDescriptionRules,
  })
  if (
    context.exportToJSONSchema?.validationPropertyRefs === true ||
    context.exportToJSONSchema?.mode === "inline"
  ) {
    return Type.Record(Type.String(), attributeSchema)
  }
  const properties = Object.fromEntries(
    Object.entries(rule.standartAttributeNames).map(([internalName, yamlName]) => [
      yamlName,
      Type.Optional(
        commonStandardMemberFillValuePolicy(internalName)?.policy === "forbidden"
          ? withoutFillValue(attributeSchema)
          : attributeSchema
      ),
    ])
  )
  return Type.Object(properties, { additionalProperties: attributeSchema })
}

function withoutFillValue(schema: TSchema): TSchema {
  const source = schema as TSchema & {
    readonly properties?: Readonly<Record<string, TSchema>>
    readonly required?: readonly string[]
  }
  if (source.properties === undefined) return schema
  const { ЗначениеЗаполнения: _fillValue, ...properties } = source.properties
  const required = source.required?.filter((name) => name !== "ЗначениеЗаполнения")
  return {
    ...source,
    properties,
    ...(required === undefined ? {} : { required }),
  }
}

export const metadataPropertyRule000 = definePropertyTypeRule("StandardAttributeDescriptions", "exportToJSONSchema", exportStandardAttributeDescriptionToJSONSchema)
