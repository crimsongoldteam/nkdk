import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/typeRulesFactory"
import { ConfigurationContext } from "../../context/types"
import { importTypeDescriptionFromXML } from "../typeDescription/importFromXML"
import { FormParameter, FormParameters, FormParametersXML, FormParameterXML } from "./types"

export const importFormParametersFromXML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  xml: FormParametersXML | undefined
): FormParameters | undefined => {
  if (xml === undefined) {
    return undefined
  }

  const items = Array.isArray(xml) ? xml : [xml]
  return items.map((item) => importFormParameterFromXML(context, undefined, item))
}

const importFormParameterFromXML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
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

registerTypeRule("FormParameter", "importFromXML", importFormParametersFromXML)
