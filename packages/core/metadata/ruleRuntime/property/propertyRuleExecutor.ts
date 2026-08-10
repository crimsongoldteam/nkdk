import type { ConfigurationContextFromXML } from "@nkdk/runtime"
import { getValueOrDefault } from "./helpers"
import type { PropertyRuleRegistrySet } from "./propertyRuleRegistrySet"
import type { PropertyRule } from "./types"

export interface PropertyRuleExecutor {
  fromXML(params: {
    readonly context: ConfigurationContextFromXML
    readonly rule: PropertyRule
    readonly value: unknown
    readonly name?: string
    readonly ownerXmlName?: string
  }): unknown
}

export function createPropertyRuleExecutor(
  registries: PropertyRuleRegistrySet,
): PropertyRuleExecutor {
  return {
    fromXML(params) {
      const { context, rule, value, name, ownerXmlName } = params
      const handler = registries.getTypeRule(rule.type, "importFromXML")
      if (handler === undefined) {
        return getValueOrDefault({
          context,
          rule,
          value,
          name,
          operation: "importFromXML",
        })
      }
      return getValueOrDefault({
        context,
        rule,
        value: handler(context, rule, value, ownerXmlName),
        name,
        operation: "importFromXML",
      })
    },
  }
}
