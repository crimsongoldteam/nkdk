import { ConfigurationContext } from "@nkdk/runtime"
import { PropertyRule, definePropertyTypeRule } from "../../../ruleRuntime"
import type { SettingsParameterValueCollectionPropertyRule } from "@nkdk/runtime/rule-kit"
import { asExplicitYAMLStringIfMarked } from "@nkdk/runtime"
import { importParameterValueFromYAML } from "../parameterValue/fromYAML"
import type { SettingsParameterValueYAML } from "../parameterValue/types"
import { getSettingsParameterValueRuleForParameter } from "./ruleSet"
import type { SettingsParameterValueCollection, SettingsParameterValueCollectionYAML } from "./types"

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v)

const wrapYamlFragment = (paramName: string, yamlFragment: unknown): SettingsParameterValueYAML => {
  if (yamlFragment === undefined || yamlFragment === null) {
    return { Параметр: paramName, Значение: undefined }
  }
  if (typeof yamlFragment === "object" && !Array.isArray(yamlFragment)) {
    const o = yamlFragment as Record<string, unknown>
    return {
      ...(Object.keys(o).length === 0 ? { Значение: undefined } : {}),
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
    const imported = importParameterValueFromYAML(context, itemRule, wrapped)
    if (imported !== undefined) {
      parameters[paramName] = {
        ...imported,
        parameter: paramName,
      }
    }
  }

  return { itemType: "SettingsParameterValueCollection", parameters }
}

export const metadataPropertyRule000 = definePropertyTypeRule("SettingsParameterValueCollection", "importFromYAML", importSettingsParameterValueCollectionFromYAML)
