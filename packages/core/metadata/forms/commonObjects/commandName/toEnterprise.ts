import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/orchestration"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"

export const exportCommandNameToEnterprise = (_params: {
  context: ConfigurationContext
  rule: PropertyRule
  value?: string
}): string | undefined => {
  return "КомандаЗаглушка"
}

registerTypeRule("CommandName", "exportToEnterprise", exportCommandNameToEnterprise)
