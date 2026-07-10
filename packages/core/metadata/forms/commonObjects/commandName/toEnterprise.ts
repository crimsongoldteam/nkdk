import { ConfigurationContext } from "../../../context/types"
import { PropertyRule } from "../../../orchestration"
import { registerTypeRule } from "../../../orchestration/property/typeRuleRegistry"

export const exportCommandNameToEnterprise = (_params: {
  context: ConfigurationContext
  rule: PropertyRule
  value?: string
}): string | undefined => {
  return "КомандаЗаглушка"
}

registerTypeRule("CommandName", "exportToEnterprise", exportCommandNameToEnterprise)
