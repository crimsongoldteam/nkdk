import { TSchema, Type } from "@sinclairtypebox"
import { ConfigurationContext } from "../../../context/types"
import { registerTypeRule } from "../../../orchestration/property/typeRuleRegistry"
import type { EventsPropertyRule, PropertyRule } from "../../../orchestration/property/types"

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
