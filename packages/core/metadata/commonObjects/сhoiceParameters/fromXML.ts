import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/orchestration/property/types"
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
    rule: {
      type: "MetadataValue",
      valueType: [
        "string",
        "decimal",
        "dateTime",
        "boolean",
        "ref",
        "objectRef",
        "fixedArray",
        "formChoiceListDesTimeValue",
      ],
    },
    value: xml["app:value"],
  })

  const result: ChoiceParameter = {
    name: xml._name,
  }

  if (value !== undefined) result.value = value

  return result
}

registerTypeRule("ChoiceParameters", "importFromXML", importChoiceParametersFromXML)
