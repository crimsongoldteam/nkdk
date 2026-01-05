import { ConfigurationContext } from "../../context/types"
import { importMetadataValueFromXML } from "../metadataValue/importFromXML"
import { ChoiceParameter, ChoiceParameters, ChoiceParametersXML, ChoiceParameterXML } from "./types"

export const importChoiceParametersFromXML = (
  context: ConfigurationContext,
  xml: ChoiceParametersXML | undefined
): ChoiceParameters | undefined => {
  if (!xml) return undefined

  const appItems = xml["app:item"]

  const items = Array.isArray(appItems) ? appItems : [appItems]

  return items.map((item) => importChoiceParameterFromXML(context, item)!)
}

const importChoiceParameterFromXML = (context: ConfigurationContext, xml: ChoiceParameterXML): ChoiceParameter => {
  const value = importMetadataValueFromXML(context, xml["app:value"])

  return {
    name: xml._name,
    value,
  }
}
