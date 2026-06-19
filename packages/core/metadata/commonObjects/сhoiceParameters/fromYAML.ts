import { PropertyRule } from "~/metadata/orchestration/property/types"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import { asExplicitYAMLStringIfMarked } from "~/yaml/explicitString"
import { ConfigurationContext } from "../../context/types"
import { importMetadataValueFromYAML } from "../metadataValue/fromYAML"
import { ChoiceParameter, ChoiceParameters, ChoiceParametersYAML } from "./types"

export const importChoiceParametersFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: ChoiceParametersYAML | undefined
): ChoiceParameters | undefined => {
  if (!data) return undefined

  return Object.entries(data).map(([name, yamlValue]) => {
    const markedValue =
      yamlValue === null || isEmptyObject(yamlValue)
        ? undefined
        : asExplicitYAMLStringIfMarked(data, name, yamlValue)
    const value = importMetadataValueFromYAML(
      context,
      undefined,
      markedValue as Exclude<ChoiceParametersYAML[string], null>
    )
    const result: ChoiceParameter = { name }

    if (value !== undefined) result.value = value

    return result
  })
}

function isEmptyObject(value: unknown): value is Record<string, never> {
  return typeof value === "object" && value !== null && !Array.isArray(value) && Object.keys(value).length === 0
}

registerTypeRule("ChoiceParameters", "importFromYAML", importChoiceParametersFromYAML)
