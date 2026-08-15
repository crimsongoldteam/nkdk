import { ConfigurationContext } from "@nkdk/runtime"
import { markYAMLScalarTag, XML_PRESENT_TAG_VALUE, xmlAnomalyTagValue } from "@nkdk/runtime"
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
  if (Object.keys(value.parameters).length === 0) return XML_PRESENT_TAG_VALUE

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
      data: { ...data, parameter: paramName, ...(data.xmlNil === true ? { xmlNil: undefined } : {}) },
    })
    if (yamlFragment !== undefined) {
      const transported = data.xmlNil === true ? withNilTransport(yamlFragment) : yamlFragment
      result[paramName] = transported as SettingsParameterValueYAML
    }
  }

  return Object.keys(result).length > 0 ? result : undefined
}

function withNilTransport(fragment: unknown): Record<string, unknown> {
  const result = typeof fragment === "object" && fragment !== null && !Array.isArray(fragment)
    ? { ...fragment as Record<string, unknown> }
    : {}
  result.Значение = xmlAnomalyTagValue("xml/value", "Nil")
  markYAMLScalarTag(result, "Значение", "xml/value")
  return result
}

export const metadataPropertyRule000 = definePropertyTypeRule("SettingsParameterValueCollection", "exportToYAML", exportSettingsParameterValueCollectionToYAML)
