import { ConfigurationContext } from "../../../context/types"
import { PropertyRule, registerTypeRule } from "../../../orchestration"
import type { SettingsParameterValueCollectionPropertyRule } from "../../../orchestration/property/types"
import { exportParameterValueToYAML } from "../parameterValue/toYAML"
import { getSettingsParameterValueRuleForParameter } from "./ruleSet"
import type { SettingsParameterValueCollection, SettingsParameterValueCollectionYAML } from "./types"

const exportSettingsParameterValueCollectionToYAML = (
  context: ConfigurationContext,
  rule: PropertyRule,
  value: SettingsParameterValueCollection | undefined
): SettingsParameterValueCollectionYAML | undefined => {
  if (!value?.parameters) return undefined

  const collRule = rule as SettingsParameterValueCollectionPropertyRule
  const result: SettingsParameterValueCollectionYAML = {}

  for (const paramName of Object.keys(value.parameters)) {
    const data = value.parameters[paramName]
    if (data === undefined) continue

    const itemRule = getSettingsParameterValueRuleForParameter(collRule, paramName)
    if (itemRule === undefined) continue

    const yamlFragment = exportParameterValueToYAML({
      context,
      rule: itemRule,
      data: { ...data, parameter: paramName },
    })
    if (yamlFragment !== undefined) {
      result[paramName] = yamlFragment as SettingsParameterValueCollectionYAML[string]
    }
  }

  return Object.keys(result).length > 0 ? result : undefined
}

registerTypeRule("SettingsParameterValueCollection", "exportToYAML", exportSettingsParameterValueCollectionToYAML)
