import { TSchema, Type } from "@sinclair/typebox"
import type { ConfigurationContext } from "~/metadata/context/types"
import { ExportToJSONSchemaFn, registerTypeRule } from "~/metadata/orchestration"
import type { SettingsParameterValueCollectionPropertyRule } from "~/metadata/orchestration/property/types"
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

export const exportSettingsParameterValueCollectionToJSONSchema: ExportToJSONSchemaFn = ({ context, rule }): TSchema => {
  const collectionRule = rule as SettingsParameterValueCollectionPropertyRule

  if (collectionRule.defaultItemRule !== undefined) {
    return Type.Record(Type.String(), requiredSettingsParameterValueSchema(context, collectionRule.defaultItemRule))
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

registerTypeRule(
  "SettingsParameterValueCollection",
  "exportToJSONSchema",
  exportSettingsParameterValueCollectionToJSONSchema
)
