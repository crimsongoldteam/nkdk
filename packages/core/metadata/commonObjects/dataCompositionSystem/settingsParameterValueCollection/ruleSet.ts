import type { SettingsParameterValuePropertyRule } from "../parameterValue/types"
import type { SettingsParameterValueRuleSet } from "./types"

export const getSettingsParameterValueRuleForParameter = (
  ruleSet: SettingsParameterValueRuleSet,
  parameterName: string
): SettingsParameterValuePropertyRule | undefined =>
  ruleSet.parameterRules?.[parameterName] ?? ruleSet.defaultItemRule
