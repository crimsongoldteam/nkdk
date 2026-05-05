import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { ConfigurationContext } from "../../context/types"
import { exportMetadataValueToXML } from "../metadataValue/toXML"
import { ChoiceParameters, ChoiceParametersXML } from "./types"

export const exportChoiceParametersToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  parameters: ChoiceParameters | undefined
): ChoiceParametersXML | undefined => {
  if (!parameters || parameters.length === 0) return undefined

  const items = parameters.map((param) => ({
    _name: param.name,
    "app:value": exportMetadataValueToXML(context, undefined, param.value)!,
  }))

  return {
    "app:item": items,
  }
}

registerTypeRule("ChoiceParameters", "exportToXML", exportChoiceParametersToXML)
