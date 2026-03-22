import type { ConfigurationContext } from "~/metadata/context/types"
import { importParameterValueFromYAML } from "../parameterValue/fromYAML"
import type { SettingsParameterValue, SettingsParameterValuePropertyRule, SettingsParameterValueYAML } from "../parameterValue/types"
import { AppearanceFieldsRules } from "./rules"
import type { AppearanceFields, AppearanceFieldsYAML } from "./types"

export const importAppearanceFieldsFromYAML = (
  context: ConfigurationContext,
  yaml: AppearanceFieldsYAML
): AppearanceFields => {
  const result: Partial<AppearanceFields> = {}

  for (const [key, propertyRule] of Object.entries(AppearanceFieldsRules.properties)) {
    const paramKey = key as keyof AppearanceFieldsYAML
    const value = (yaml as Record<string, unknown>)[paramKey]
    if (value === undefined) continue

    const rule: SettingsParameterValuePropertyRule = {
      type: "SettingsParameterValue",
      valueType: (propertyRule as SettingsParameterValuePropertyRule).valueType,
      ...((propertyRule as SettingsParameterValuePropertyRule).typeSE !== undefined
        ? { typeSE: (propertyRule as SettingsParameterValuePropertyRule).typeSE }
        : {}),
    }

    ;(result as Record<string, unknown>)[key] = importParameterValueFromYAML(
      context,
      rule,
      value as SettingsParameterValueYAML
    ) as SettingsParameterValue
  }

  return {
    itemType: "AppearanceFields",
    ...result,
  } as AppearanceFields
}
