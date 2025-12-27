import { Context } from "../../context/types"
import { importMetadataValueFromXML } from "../metadataValue/importFromXML"
import { ChoiceParameter, ChoiceParameters, ChoiceParametersXML, ChoiceParameterXML } from "./types"

export const importChoiceParameterFromXML = (
  context: Context,
  xml: ChoiceParameterXML | undefined
): ChoiceParameter | undefined => {
  if (!xml) return undefined

  const value = importMetadataValueFromXML(context, xml["app:value"])
  if (!value) return undefined

  return {
    name: xml._name,
    value,
  }
}

export const importChoiceParametersFromXML = (
  context: Context,
  xml: ChoiceParametersXML | undefined
): ChoiceParameters | undefined => {
  if (!xml) return undefined

  const appItems = xml["app:item"]

  const items = Array.isArray(appItems) ? appItems : [appItems]

  return items.map((item) => importChoiceParameterFromXML(context, item)!)
}
