import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "../../context/types"
import { _importTypeDescriptionFromXML } from "../typeDescription/_importFromXML"
import { FormParameter, FormParameters, FormParametersXML, FormParameterXML } from "./types"

export const _importFormParametersFromXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  xml: FormParametersXML | undefined
): FormParameters | undefined => {
  if (xml === undefined) {
    return undefined
  }

  const items = Array.isArray(xml) ? xml : [xml]
  return items.map((item) => _importFormParameterFromXML(context, undefined, _rule, item))
}

const _importFormParameterFromXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  xml: FormParameterXML
): FormParameter => {
  const result: FormParameter = {
    name: xml._name,
    type: _importTypeDescriptionFromXML(context, undefined, _rule, xml.Type)!,
  }

  if (xml.KeyParameter !== undefined) {
    result.keyParameter = xml.KeyParameter
  }

  return result
}
