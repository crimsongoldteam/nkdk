import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { importMetadataValueFromXML } from "../metadataValue/fromXML"
import { ChoiceParameter, ChoiceParameters, ChoiceParametersXML, ChoiceParameterXML } from "./types"

export const importChoiceParametersFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: ChoiceParametersXML | undefined
): ChoiceParameters | undefined => {
  if (!xml) return undefined

  const appItems = xml["app:item"]

  const items = Array.isArray(appItems) ? appItems : [appItems]

  return items.map((item) => importChoiceParameterFromXML(context, undefined, item)!)
}

const importChoiceParameterFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: ChoiceParameterXML
): ChoiceParameter => {
  const value = importMetadataValueFromXML({
    context,
    rule: { type: "MetadataValue", withType: true },
    value: xml["app:value"],
  })

  return {
    name: xml._name,
    value,
  }
}

registerTypeRule("ChoiceParameters", "importFromXML", importChoiceParametersFromXML)
