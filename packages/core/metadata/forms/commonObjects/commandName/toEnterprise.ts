import { ConfigurationContext } from "../../../context/types"
import { PropertyRule } from "../../../ruleRuntime"
import { registerTypeRule } from "../../../ruleRuntime/property/typeRuleRegistry"

export const exportCommandNameToEnterprise = (_params: {
  context: ConfigurationContext
  rule: PropertyRule
  value?: string
}): string | undefined => {
  return "КомандаЗаглушка"
}

registerTypeRule("CommandName", "exportToEnterprise", exportCommandNameToEnterprise)
