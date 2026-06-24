import { TSchema, Type } from "@sinclair/typebox"
import { ConfigurationContext } from "~/metadata/context/types"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import { EventsPropertyRule, PropertyRule } from "~/metadata/orchestration/property/types"

const isEventsPropertyRule = (rule: PropertyRule): rule is EventsPropertyRule => {
  return rule.type === "Events"
}

export const exportEventsToJSONSchema = (params: {
  context: ConfigurationContext
  rule: PropertyRule
  value: unknown
}): TSchema | undefined => {
  if (!isEventsPropertyRule(params.rule)) return undefined

  const props: Record<string, TSchema> = {}
  for (const yamlKey of Object.values(params.rule.items) as string[]) {
    props[yamlKey] = Type.Optional(Type.String())
  }

  return Type.Object(props, { additionalProperties: false })
}

registerTypeRule("Events", "exportToJSONSchema", exportEventsToJSONSchema)
