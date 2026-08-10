import { definePropertyTypeRule } from "../../../ruleRuntime/property/propertyRuleRegistrySet"
import { TSchema, Type } from "typebox"
import type { ConfigurationContext } from "@nkdk/runtime"
import { ExportToJSONSchemaFn } from "../../../ruleRuntime"
import type { SettingsParameterValueCollectionPropertyRule } from "@nkdk/runtime/rule-kit"
import type { SettingsParameterValuePropertyRule } from "../parameterValue/types"
import { exportSettingsParameterValueToJSONSchema } from "../parameterValue/toJSONSchema"

const schemaForParameterRule = (context: ConfigurationContext, rule: SettingsParameterValueCollectionPropertyRule) => {
  const parameterRules = Object.fromEntries(
    Object.entries(rule.parameterRules ?? {})
      .filter((entry): entry is [string, SettingsParameterValuePropertyRule] => entry[1] !== undefined)
      .map(([parameterName, parameterRule]) => [
        parameterName,
        Type.Optional(requiredSettingsParameterValueSchema(context, parameterRule)),
      ])
  ) as Record<string, TSchema>

  return Type.Object(parameterRules, { additionalProperties: false })
}

export const exportSettingsParameterValueCollectionToJSONSchema: ExportToJSONSchemaFn = ({
  context,
  rule,
}): TSchema => {
  const collectionRule = rule as SettingsParameterValueCollectionPropertyRule

  if (collectionRule.defaultItemRule !== undefined) {
    const defaultSchema = requiredSettingsParameterValueSchema(context, collectionRule.defaultItemRule)
    const parameterRules = schemaForParameterRule(context, collectionRule)
    return Type.Object(parameterRules.properties, { additionalProperties: defaultSchema })
  }

  return schemaForParameterRule(context, collectionRule)
}

function requiredSettingsParameterValueSchema(
  context: ConfigurationContext,
  rule: SettingsParameterValuePropertyRule
): TSchema {
  const schema = exportSettingsParameterValueToJSONSchema({
    context,
    rule,
    value: undefined,
  })
  if (schema === undefined) throw new Error("SettingsParameterValue JSON Schema is not registered")
  return schema
}

export const metadataPropertyRule000 = definePropertyTypeRule(
  "SettingsParameterValueCollection",
  "exportToJSONSchema",
  exportSettingsParameterValueCollectionToJSONSchema
)
