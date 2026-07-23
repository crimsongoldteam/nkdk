import type { ConfigurationContextFromXML } from "../../context/types"
import { getValueOrDefault } from "./helpers"
import { getTypeRule } from "./typeRuleRegistry"
import type { PropertyRule } from "./types"

export const importPropertyFromXML = (params: {
  context: ConfigurationContextFromXML
  rule: PropertyRule
  value: unknown
  name?: string
  ownerXmlName?: string
}): unknown => {
  const { context, rule, value, name, ownerXmlName } = params
  const handler = getTypeRule(rule.type, "importFromXML")
  if (handler === undefined) {
    return getValueOrDefault({ context, rule, value, name, operation: "importFromXML" })
  }
  return getValueOrDefault({
    context,
    rule,
    value: handler(context, rule, value, ownerXmlName),
    name,
    operation: "importFromXML",
  })
}
