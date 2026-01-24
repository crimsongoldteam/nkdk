import { ConfigurationContext } from "../../context/types"
import { exportTypeDescriptionToXML } from "../typeDescription/exportToXML"
import { FormParameter, FormParameters, FormParametersXML, FormParameterXML } from "./types"

export const exportFormParametersToXML = (
  context: ConfigurationContext,
  parameters: FormParameters | undefined
): FormParametersXML | undefined => {
  if (parameters === undefined || parameters.length === 0) {
    return undefined
  }

  const result = parameters.map((parameter) => exportFormParameterToXML(context, parameter))
  return result.length === 1 ? result[0] : result
}

const exportFormParameterToXML = (context: ConfigurationContext, parameter: FormParameter): FormParameterXML => {
  const result: FormParameterXML = {
    _name: parameter.name,
    Type: exportTypeDescriptionToXML(context, parameter.type)!,
  }

  if (parameter.keyParameter !== undefined) {
    result.KeyParameter = parameter.keyParameter
  }

  return result
}
