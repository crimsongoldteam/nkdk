import { ConfigurationContext } from "../../context/types"
import { exportTypeDescriptionToEnterprise } from "../typeDescription/exportToEnterprise"
import { FormParameterEnterprise, FormParameters, FormParametersEnterprise } from "./types"

export const exportFormParametersToEnterprise = (
  context: ConfigurationContext,
  parameters: FormParameters | undefined
): FormParametersEnterprise | undefined => {
  if (parameters === undefined || parameters.length === 0) {
    return undefined
  }

  const result: FormParametersEnterprise = {}

  for (const parameter of parameters) {
    const enterpriseParameter: FormParameterEnterprise = {
      Тип: exportTypeDescriptionToEnterprise(context, parameter.type)!,
    }

    if (parameter.keyParameter !== undefined) {
      enterpriseParameter.Ключевой = parameter.keyParameter
    }

    result[parameter.name] = enterpriseParameter
  }

  return result
}
