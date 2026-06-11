import { PropertyRule } from "~/metadata/orchestration/property/types"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
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
    const value = importMetadataValueFromYAML(context, undefined, yamlValue)
    const result: ChoiceParameter = { name }

    if (value !== undefined) result.value = value

    return result
  })
}

registerTypeRule("ChoiceParameters", "importFromYAML", importChoiceParametersFromYAML)
