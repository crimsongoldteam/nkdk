import { exportTypeDescriptionToXML } from "../../../commonObjects/typeDescription/toXML"
import { ConfigurationContext } from "../../../context/types"
import { PropertyRule } from "../../elements/calendarField/rules"
import { registerTypeRule } from "../../../orchestration/property/typeRuleRegistry"
import { FormParameter, FormParameters, FormParametersXML, FormParameterXML } from "./types"

export const exportFormParametersToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  parameters: FormParameters | undefined
): { Parameter: FormParametersXML } | undefined => {
  if (parameters === undefined || parameters.length === 0) {
    return undefined
  }

  const result = parameters.map((parameter) => exportFormParameterToXML(context, undefined, parameter))

  if (result.length === 0) {
    return undefined
  }

  return { Parameter: result }
}

const exportFormParameterToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  parameter: FormParameter
): FormParameterXML => {
  const result: FormParameterXML = {
    _name: parameter.name,
    Type: parameter.type !== undefined ? exportTypeDescriptionToXML(context, undefined, parameter.type) : {},
  }

  if (parameter.keyParameter !== undefined) {
    result.KeyParameter = parameter.keyParameter
  }

  return result
}

registerTypeRule("FormParameters", "exportToXML", exportFormParametersToXML)
