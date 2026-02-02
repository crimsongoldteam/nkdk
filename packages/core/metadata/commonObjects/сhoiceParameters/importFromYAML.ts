import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "../../context/types"
import { importMetadataValueFromYAML } from "../metadataValue/importFromYAML"
import { ChoiceParameters, ChoiceParametersEnterprise } from "./types"

export const importChoiceParametersFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule,
  data: ChoiceParametersEnterprise | undefined
): ChoiceParameters | undefined => {
  if (!data) return undefined

  return Object.entries(data).map(([name, value]) => ({
    name,
    value: importMetadataValueFromYAML(context, _rule, value),
  }))
}
