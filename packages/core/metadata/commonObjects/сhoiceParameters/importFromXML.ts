import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/types/factory"
import { ConfigurationContext } from "../../context/types"
import { importMetadataValueFromXML } from "../metadataValue/importFromXML"
import { ChoiceParameter, ChoiceParameters, ChoiceParametersXML, ChoiceParameterXML } from "./types"

export const importChoiceParametersFromXML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  xml: ChoiceParametersXML | undefined
): ChoiceParameters | undefined => {
  if (!xml) return undefined

  const appItems = xml["app:item"]

  const items = Array.isArray(appItems) ? appItems : [appItems]

  return items.map((item) => importChoiceParameterFromXML(context, undefined, item)!)
}

const importChoiceParameterFromXML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  xml: ChoiceParameterXML
): ChoiceParameter => {
  const value = importMetadataValueFromXML(context, undefined, xml["app:value"])

  return {
    name: xml._name,
    value,
  }
}

registerTypeRule("ChoiceParameters", "importFromXML", importChoiceParametersFromXML)
