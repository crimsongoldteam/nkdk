import type { ConfigurationContext } from "~/metadata/context/types"
import { exportParameterValueToDcsXML } from "../parameterValue/toDcsXML"
import type { ParameterValueXML, SettingsParameterValue, SettingsParameterValuePropertyRule } from "../parameterValue/types"
import { AppearanceFieldsRules } from "./rules"
import type { AppearanceFields, AppearanceFieldsXML } from "./types"

export const exportAppearanceFieldsToDcsXML = (
  context: ConfigurationContext,
  data: AppearanceFields
): AppearanceFieldsXML => {
  const items: ParameterValueXML[] = []

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

    items.push(
      exportParameterValueToDcsXML({
        context,
        rule,
        data: value as SettingsParameterValue,
        rootSettingsXsi: true,
      })
    )
  }

  if (items.length === 0) return {}
  return { "dcscor:item": items.length === 1 ? items[0] : items }
}
