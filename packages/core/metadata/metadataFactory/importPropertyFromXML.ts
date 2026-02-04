import { ConfigurationContext } from "../context/types"
import { PropertyRule } from "../forms"
import { getTypeRule } from "./typeRulesFactory"

export const importPropertyFromXML = (context: ConfigurationContext, propertyRule: PropertyRule, data: any): any => {
  const ruleFunction = getTypeRule(propertyRule.type as any, "importFromXML")

  if (ruleFunction === undefined) return data

  const result = ruleFunction(context, propertyRule, data)

  return result
}
