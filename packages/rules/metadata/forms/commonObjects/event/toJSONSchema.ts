import { TSchema, Type } from "typebox"
import { ConfigurationContext } from "@nkdk/runtime"
import { definePropertyTypeRule } from "../../../ruleRuntime/property/typeRuleRegistry"
import type { EventsPropertyRule, PropertyRule } from "@nkdk/runtime/rule-kit"

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
    props[yamlKey] = Type.Optional(
      Type.Union([
        Type.String(),
        Type.Object(
          {
            Перед: Type.Optional(Type.String()),
            После: Type.Optional(Type.String()),
            Вместо: Type.Optional(Type.String()),
          },
          { additionalProperties: false, minProperties: 1 }
        ),
      ])
    )
  }

  return Type.Object(props, { additionalProperties: false })
}

export const metadataPropertyRule000 = definePropertyTypeRule("Events", "exportToJSONSchema", exportEventsToJSONSchema)
