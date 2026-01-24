import { ConfigurationContext } from "../../context/types"
import { importTypeDescriptionFromXML } from "../typeDescription/importFromXML"
import { FormParameter, FormParameters, FormParametersXML, FormParameterXML } from "./types"

export const importFormParametersFromXML = (
  context: ConfigurationContext,
  xml: FormParametersXML | undefined
): FormParameters | undefined => {
  if (xml === undefined) {
    return undefined
  }

  const items = Array.isArray(xml) ? xml : [xml]
  return items.map((item) => importFormParameterFromXML(context, item))
}

const importFormParameterFromXML = (context: ConfigurationContext, xml: FormParameterXML): FormParameter => {
  const result: FormParameter = {
    name: xml._name,
    type: importTypeDescriptionFromXML(context, xml.Type)!,
  }

  if (xml.KeyParameter !== undefined) {
    result.keyParameter = xml.KeyParameter
  }

  return result
}
