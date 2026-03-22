import type { ConfigurationContext } from "~/metadata/context/types"
import { exportParameterValueToYAML } from "../parameterValue/toYAML"
import type { SettingsParameterValue, SettingsParameterValuePropertyRule } from "../parameterValue/types"
import { AppearanceFieldsRules } from "./rules"
import type { AppearanceFields, AppearanceFieldsYAML } from "./types"

export const exportAppearanceFieldsToYAML = (
  context: ConfigurationContext,
  data: AppearanceFields
): AppearanceFieldsYAML => {
  const result: Partial<AppearanceFieldsYAML> = {}

  for (const [key, propertyRule] of Object.entries(AppearanceFieldsRules.properties)) {
    const paramKey = key as keyof AppearanceFields
    const value = data[paramKey]
    if (value === undefined) continue

    const rule: SettingsParameterValuePropertyRule = {
      type: "SettingsParameterValue",
      valueType: (propertyRule as SettingsParameterValuePropertyRule).valueType,
      ...((propertyRule as SettingsParameterValuePropertyRule).typeSE !== undefined
        ? { typeSE: (propertyRule as SettingsParameterValuePropertyRule).typeSE }
        : {}),
    }

    ;(result as Record<string, unknown>)[key] = exportParameterValueToYAML({
      context,
      rule,
      data: value as SettingsParameterValue,
    })
  }

  return result as AppearanceFieldsYAML
}
