import { importTypeDescriptionFromXML } from "~/metadata/commonObjects/typeDescription/fromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/types/factory"
import { FormParameter, FormParameters, FormParametersXML, FormParameterXML } from "./types"

export const importFormParametersFromXML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  xml: { Parameter: FormParametersXML } | undefined
): FormParameters | undefined => {
  if (xml === undefined) {
    return undefined
  }

  const items = Array.isArray(xml.Parameter) ? xml.Parameter : [xml.Parameter]
  return items.map((item) => importFormParameterFromXML(context, undefined, item))
}

const importFormParameterFromXML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  xml: FormParameterXML
): FormParameter => {
  const result: FormParameter = {
    name: xml._name,
    type: importTypeDescriptionFromXML(context, undefined, xml.Type)!,
  }

  if (xml.KeyParameter !== undefined) {
    result.keyParameter = xml.KeyParameter
  }

  return result
}

registerTypeRule("FormParameters", "importFromXML", importFormParametersFromXML)
