import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/types/factory"
import { ConfigurationContext } from "../../context/types"
import { exportMetadataValueToYAML } from "../metadataValue/toYAML"
import { ChoiceParameters, ChoiceParametersYAML } from "./types"

export const exportChoiceParametersToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: ChoiceParameters | undefined
): ChoiceParametersYAML | undefined => {
  if (!data) return undefined

  return Object.fromEntries(
    data.map((param) => [param.name, exportMetadataValueToYAML(context, undefined, param.value)])
  )
}

registerTypeRule("ChoiceParameters", "exportToYAML", exportChoiceParametersToYAML)
