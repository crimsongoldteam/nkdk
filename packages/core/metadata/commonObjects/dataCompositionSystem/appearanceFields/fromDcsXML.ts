import type { ConfigurationContextFromXML } from "~/metadata/context/types"
import { importParameterValueFromDcsXML } from "../parameterValue/fromDcsXML"
import type { ParameterValueXML, SettingsParameterValue, SettingsParameterValuePropertyRule } from "../parameterValue/types"
import { AppearanceFieldsRules } from "./rules"
import type { AppearanceFields, AppearanceFieldsXML } from "./types"

type PropertyKey = keyof typeof AppearanceFieldsRules.properties

const asArray = <T>(x: T | T[] | undefined): T[] => {
  if (x === undefined) return []
  return Array.isArray(x) ? x : [x]
}

export const importAppearanceFieldsFromDcsXML = (
  context: ConfigurationContextFromXML,
  xml: AppearanceFieldsXML
): AppearanceFields => {
  const items = asArray(xml["dcscor:item"])
  const result: Partial<AppearanceFields> = {}

  for (const item of items) {
    const parameterName = (item as ParameterValueXML)["dcscor:parameter"] as PropertyKey
    const propertyRule = AppearanceFieldsRules.properties[parameterName]
    if (propertyRule === undefined) continue

    const rule: SettingsParameterValuePropertyRule = {
      type: "SettingsParameterValue",
      valueType: (propertyRule as SettingsParameterValuePropertyRule).valueType,
      ...((propertyRule as SettingsParameterValuePropertyRule).typeSE !== undefined
        ? { typeSE: (propertyRule as SettingsParameterValuePropertyRule).typeSE }
        : {}),
    }

    result[parameterName] = importParameterValueFromDcsXML(
      context,
      rule,
      item as ParameterValueXML
    ) as SettingsParameterValue
  }

  return {
    itemType: "AppearanceFields",
    ...result,
  } as AppearanceFields
}
