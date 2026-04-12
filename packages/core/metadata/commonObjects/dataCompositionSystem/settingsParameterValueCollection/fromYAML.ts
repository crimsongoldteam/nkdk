import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import type { SettingsParameterValueCollectionPropertyRule } from "~/metadata/orchestration/property/types"
import { importParameterValueFromYAML } from "../parameterValue/fromYAML"
import type { SettingsParameterValueYAML } from "../parameterValue/types"
import { getSettingsParameterValueRuleForParameter } from "./ruleSet"
import type { SettingsParameterValueCollection, SettingsParameterValueCollectionYAML } from "./types"

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v)

const wrapYamlFragment = (paramName: string, yamlFragment: unknown): SettingsParameterValueYAML => {
  if (yamlFragment === undefined || yamlFragment === null) {
    return { Параметр: paramName }
  }
  if (typeof yamlFragment === "object" && !Array.isArray(yamlFragment)) {
    const o = yamlFragment as Record<string, unknown>
    return { ...o, Параметр: o["Параметр"] ?? paramName } as SettingsParameterValueYAML
  }
  return { Значение: yamlFragment as never, Параметр: paramName }
}

const importSettingsParameterValueCollectionFromYAML = (
  context: ConfigurationContext,
  rule: PropertyRule,
  value: SettingsParameterValueCollectionYAML | unknown
): SettingsParameterValueCollection | undefined => {
  if (value === undefined || value === null) return undefined
  if (!isPlainObject(value)) return undefined

  const collRule = rule as SettingsParameterValueCollectionPropertyRule
  const parameters: SettingsParameterValueCollection["parameters"] = {}

  for (const [paramName, yamlFragment] of Object.entries(value)) {
    const itemRule = getSettingsParameterValueRuleForParameter(collRule, paramName)
    if (itemRule === undefined) continue

    const wrapped = wrapYamlFragment(paramName, yamlFragment)
    const imported = importParameterValueFromYAML(context, itemRule, wrapped)
    if (imported !== undefined) {
      parameters[paramName] = { ...imported, parameter: paramName }
    }
  }

  return Object.keys(parameters).length > 0
    ? { itemType: "SettingsParameterValueCollection", parameters }
    : undefined
}

registerTypeRule("SettingsParameterValueCollection", "importFromYAML", importSettingsParameterValueCollectionFromYAML)
