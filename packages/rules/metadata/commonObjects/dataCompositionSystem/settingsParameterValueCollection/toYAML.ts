import { ConfigurationContext } from "@nkdk/runtime"
import { markYAMLScalarTag, xmlScalarTagValue } from "@nkdk/runtime"
import { PropertyRule, definePropertyTypeRule } from "../../../ruleRuntime"
import type { SettingsParameterValueCollectionPropertyRule } from "@nkdk/runtime/rule-kit"
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
      data: { ...data, parameter: paramName, ...(data.xmlNil === true ? { xmlNil: undefined } : {}) },
    })
    if (yamlFragment !== undefined) {
      const transported = data.xmlNil === true ? withNilTransport(yamlFragment) : yamlFragment
      result[paramName] = transported as SettingsParameterValueCollectionYAML[string]
    }
  }

  return Object.keys(result).length > 0 ? result : undefined
}

function withNilTransport(fragment: unknown): Record<string, unknown> {
  const result = typeof fragment === "object" && fragment !== null && !Array.isArray(fragment)
    ? { ...fragment as Record<string, unknown> }
    : {}
  result.Значение = xmlScalarTagValue("Nil")
  markYAMLScalarTag(result, "Значение", "xml")
  return result
}

export const metadataPropertyRule000 = definePropertyTypeRule("SettingsParameterValueCollection", "exportToYAML", exportSettingsParameterValueCollectionToYAML)
