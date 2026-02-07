import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "../../context/types"
import { exportMetadataValueToXML } from "../metadataValue/exportToXML"
import { ChoiceParameters, ChoiceParametersXML } from "./types"

export const exportChoiceParametersToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
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
