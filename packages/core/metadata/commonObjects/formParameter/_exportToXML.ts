import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "../../context/types"
import { _exportTypeDescriptionToXML } from "../typeDescription/_exportToXML"
import { FormParameter, FormParameters, FormParametersXML, FormParameterXML } from "./types"

export const _exportFormParametersToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  parameters: FormParameters | undefined
): FormParametersXML | undefined => {
  if (parameters === undefined || parameters.length === 0) {
    return undefined
  }

  const result = parameters.map((parameter) => _exportFormParameterToXML(context, _rule, parameter))
  return result
}

const _exportFormParameterToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  parameter: FormParameter
): FormParameterXML => {
  const result: FormParameterXML = {
    _name: parameter.name,
    Type: _exportTypeDescriptionToXML(context, _rule, parameter.type)!,
  }

  if (parameter.keyParameter !== undefined) {
    result.KeyParameter = parameter.keyParameter
  }

  return result
}
