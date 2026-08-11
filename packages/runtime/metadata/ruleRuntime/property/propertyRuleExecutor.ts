import { getValueOrDefault } from "./helpers"
import type { PropertyRuleRegistrySet } from "./propertyRuleRegistrySet"
import type { PropertyRuleExecution } from "./fn"

export interface PropertyRuleExecutor extends PropertyRuleExecution {}

export function createPropertyRuleExecutor(
  registries: PropertyRuleRegistrySet,
): PropertyRuleExecutor {
  const executor: PropertyRuleExecutor = {
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
        value: handler(context, rule, value, ownerXmlName, executor),
        name,
        operation: "importFromXML",
      })
    },
  }
  return executor
}
