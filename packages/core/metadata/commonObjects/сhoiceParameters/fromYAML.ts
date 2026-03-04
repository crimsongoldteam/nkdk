import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/types/factory"
import { ConfigurationContext } from "../../context/types"
import { importMetadataValueFromYAML } from "../metadataValue/fromYAML"
import { ChoiceParameters, ChoiceParametersYAML } from "./types"

export const importChoiceParametersFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: ChoiceParametersYAML | undefined
): ChoiceParameters | undefined => {
  if (!data) return undefined

  return Object.entries(data).map(([name, value]) => ({
    name,
    value: importMetadataValueFromYAML(context, undefined, value),
  }))
}

registerTypeRule("ChoiceParameters", "importFromYAML", importChoiceParametersFromYAML)
