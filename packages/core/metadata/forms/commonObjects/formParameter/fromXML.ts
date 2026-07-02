import { importBooleanFromXML } from "../../../commonObjects/boolean/fromXML"
import { importTypeDescriptionFromXML } from "../../../commonObjects/typeDescription/fromXML"
import { ConfigurationContextFromXML } from "../../../context/types"
import { PropertyRule } from "../../elements/calendarField/rules"
import { registerTypeRule } from "../../../orchestration/property/typeRuleRegistry"
import { FormParameter, FormParameters, FormParametersXML, FormParameterXML } from "./types"

export const importFormParametersFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: { Parameter: FormParametersXML } | undefined
): FormParameters | undefined => {
  if (xml === undefined) {
    return undefined
  }

  const items = Array.isArray(xml.Parameter) ? xml.Parameter : [xml.Parameter]
  return items.map((item) => importFormParameterFromXML({ context, xml: item }))
}

const importFormParameterFromXML = (params: {
  context: ConfigurationContextFromXML
  xml: FormParameterXML
}): FormParameter => {
  const { context, xml } = params
  const result: FormParameter = {
    name: xml._name,
  }

  const type = importTypeDescriptionFromXML(context, undefined, xml.Type)
  if (type !== undefined) {
    result.type = type
  }

  if (xml.KeyParameter !== undefined) {
    const keyParameter = importBooleanFromXML(context, undefined, xml.KeyParameter)
    if (keyParameter !== undefined) {
      result.keyParameter = keyParameter
    }
  }

  return result
}

registerTypeRule("FormParameters", "importFromXML", importFormParametersFromXML)
