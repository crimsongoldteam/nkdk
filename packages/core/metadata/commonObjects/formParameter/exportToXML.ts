import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/typeRulesFactory"
import { ConfigurationContext } from "../../context/types"
import { exportTypeDescriptionToXML } from "../typeDescription/exportToXML"
import { FormParameter, FormParameters, FormParametersXML, FormParameterXML } from "./types"

export const exportFormParametersToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  parameters: FormParameters | undefined
): FormParametersXML | undefined => {
  if (parameters === undefined || parameters.length === 0) {
    return undefined
  }

  const result = parameters.map((parameter) => exportFormParameterToXML(context, undefined, parameter))
  return result
}

const exportFormParameterToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  parameter: FormParameter
): FormParameterXML => {
  const result: FormParameterXML = {
    _name: parameter.name,
    Type: exportTypeDescriptionToXML(context, undefined, parameter.type)!,
  }

  if (parameter.keyParameter !== undefined) {
    result.KeyParameter = parameter.keyParameter
  }

  return result
}

registerTypeRule("FormParameters", "exportToXML", exportFormParametersToXML)
