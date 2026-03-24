import type { ConfigurationContextFromXML } from "~/metadata/context/types"
import { importPropertiesFromXML } from "~/metadata/orchestration"
import type { ParameterValueXML } from "../parameterValue/types"
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
  const preparedXML: Partial<Record<PropertyKey, ParameterValueXML>> = {}

  for (const item of items) {
    const parameterName = (item as ParameterValueXML)["dcscor:parameter"] as PropertyKey
    if (AppearanceFieldsRules.properties[parameterName] === undefined) continue
    preparedXML[parameterName] = item as ParameterValueXML
  }

  const result = importPropertiesFromXML({
    context,
    xml: preparedXML,
    rule: AppearanceFieldsRules,
  })

  return {
    itemType: "AppearanceFields",
    ...(result ?? {}),
  } as AppearanceFields
}
