import { ConfigurationContext } from "@nkdk/runtime"
import { PropertyRule, definePropertyTypeRule } from "../../../ruleRuntime"
import type { SettingsParameterValueCollectionPropertyRule } from "@nkdk/runtime/rule-kit"
import { exportParameterValueToYAML } from "../parameterValue/toYAML"
import { getSettingsParameterValueRuleForParameter } from "./ruleSet"
import type { SettingsParameterValueCollection, SettingsParameterValueCollectionYAML } from "./types"
import type { SettingsParameterValueYAML } from "../parameterValue/types"

const exportSettingsParameterValueCollectionToYAML = (
  context: ConfigurationContext,
  rule: PropertyRule,
  value: SettingsParameterValueCollection | undefined
): SettingsParameterValueCollectionYAML | undefined => {
  if (!value?.parameters) return undefined
  if (Object.keys(value.parameters).length === 0) return {}

  const collRule = rule as SettingsParameterValueCollectionPropertyRule
  const result: Record<string, SettingsParameterValueYAML> = {}

  for (const paramName of Object.keys(value.parameters)) {
    const data = value.parameters[paramName]
    if (data === undefined) continue

    const itemRule = getSettingsParameterValueRuleForParameter(collRule, paramName)
    if (itemRule === undefined) continue

    const yamlFragment = exportParameterValueToYAML({
      context,
      rule: itemRule,
      data: {
        ...data,
        parameter: paramName,
        ...(data.xmlNil === true ? { value: null, xmlNil: undefined } : {}),
      },
    })
    if (yamlFragment !== undefined) {
      result[paramName] = yamlFragment as SettingsParameterValueYAML
    }
  }

  return Object.keys(result).length > 0 ? result : undefined
}

export const metadataPropertyRule000 = definePropertyTypeRule("SettingsParameterValueCollection", "exportToYAML", exportSettingsParameterValueCollectionToYAML)
