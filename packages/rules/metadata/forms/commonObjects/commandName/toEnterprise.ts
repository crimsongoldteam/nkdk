import { ConfigurationContext } from "@nkdk/runtime"
import { PropertyRule } from "../../../ruleRuntime"
import { definePropertyTypeRule } from "../../../ruleRuntime/property/typeRuleRegistry"

export const exportCommandNameToEnterprise = (_params: {
  context: ConfigurationContext
  rule: PropertyRule
  value?: string
}): string | undefined => {
  return "КомандаЗаглушка"
}

export const metadataPropertyRule000 = definePropertyTypeRule("CommandName", "exportToEnterprise", exportCommandNameToEnterprise)
