import { TSchema, Type } from "@sinclair/typebox"
import { MetadataItemRule } from "../property/types"

const EVENTS_YAML_KEY = "События"

export const exportEventsToJSONSchema = (params: { rule: MetadataItemRule }): Record<string, TSchema> => {
  const { rule } = params

  if (!rule.events || Object.keys(rule.events).length === 0) {
    return {}
  }

  const eventProperties: Record<string, TSchema> = {}
  for (const enterpriseName of Object.values(rule.events)) {
    eventProperties[enterpriseName] = Type.Optional(Type.String())
  }

  return {
    [EVENTS_YAML_KEY]: Type.Optional(Type.Object(eventProperties, { additionalProperties: false })),
  }
}
