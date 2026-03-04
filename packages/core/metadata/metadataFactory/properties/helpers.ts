import { ConfigurationContext } from "~/metadata/context/types"
import { TypeRulesOperations } from "../../orchestration/property/fn"
import { PropertyRule } from "../../orchestration/property/types"

export const getValueOrDefault = (params: {
  context: ConfigurationContext
  rule: PropertyRule
  value: any
  name?: string
  operation: TypeRulesOperations
}): any => {
  const { context, rule, value, name, operation } = params

  if (value !== undefined) {
    return value
  }

  if (typeof rule.defaultValue === "function") {
    return rule.defaultValue({ context, name, operation })
  }

  return rule.defaultValue
}
