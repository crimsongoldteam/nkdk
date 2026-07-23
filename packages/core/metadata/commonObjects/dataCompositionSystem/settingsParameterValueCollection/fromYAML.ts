import { ConfigurationContext } from "../../../context/types"
import { PropertyRule, registerTypeRule } from "../../../orchestration"
import type { SettingsParameterValueCollectionPropertyRule } from "../../../orchestration/property/types"
import { asExplicitYAMLStringIfMarked } from "../../../../yaml/explicitString"
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
    return {
      ...o,
      ...("Значение" in o ? { Значение: asExplicitYAMLStringIfMarked(o, "Значение", o["Значение"]) } : {}),
      Параметр: o["Параметр"] ?? paramName,
    } as SettingsParameterValueYAML
  }
  return { Значение: yamlFragment as never, Параметр: paramName }
}

const importSettingsParameterValueCollectionFromYAML = (
  context: ConfigurationContext,
  rule: PropertyRule,
  value: SettingsParameterValueCollectionYAML | unknown,
  source?: SettingsParameterValueCollection
): SettingsParameterValueCollection | undefined => {
  if (value === undefined || value === null) return undefined
  if (!isPlainObject(value)) return undefined

  const collRule = rule as SettingsParameterValueCollectionPropertyRule
  const parameters: SettingsParameterValueCollection["parameters"] = {}

  for (const [paramName, yamlFragment] of Object.entries(value)) {
    const itemRule = getSettingsParameterValueRuleForParameter(collRule, paramName)
    if (itemRule === undefined) continue

    const valueFragment = asExplicitYAMLStringIfMarked(value, paramName, yamlFragment)
    const wrapped = wrapYamlFragment(paramName, valueFragment)
    const imported = importParameterValueFromYAML(context, itemRule, wrapped, source?.parameters[paramName])
    if (imported !== undefined) {
      parameters[paramName] = { ...imported, parameter: paramName }
    }
  }

  if (Object.keys(parameters).length === 0) return undefined
  const orderedParameters: SettingsParameterValueCollection["parameters"] = {}
  for (const name of Object.keys(source?.parameters ?? {})) {
    if (parameters[name] !== undefined) orderedParameters[name] = parameters[name]
  }
  for (const [name, parameter] of Object.entries(parameters)) {
    if (orderedParameters[name] === undefined) orderedParameters[name] = parameter
  }
  return { itemType: "SettingsParameterValueCollection", parameters: orderedParameters }
}

registerTypeRule("SettingsParameterValueCollection", "importFromYAML", importSettingsParameterValueCollectionFromYAML)
