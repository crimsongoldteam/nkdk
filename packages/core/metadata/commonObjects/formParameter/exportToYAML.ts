import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "../../context/types"
import { exportTypeDescriptionToYAML } from "../typeDescription/exportToYAML"
import { FormParameterEnterprise, FormParameters, FormParametersEnterprise } from "./types"

export const exportFormParametersToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule,
  parameters: FormParameters | undefined
): FormParametersEnterprise | undefined => {
  if (parameters === undefined || parameters.length === 0) {
    return undefined
  }

  const result: FormParametersEnterprise = {}

  for (const parameter of parameters) {
    const enterpriseParameter: FormParameterEnterprise = {
      Тип: exportTypeDescriptionToYAML(context, _rule, parameter.type)!,
    }

    if (parameter.keyParameter !== undefined) {
      enterpriseParameter.Ключевой = parameter.keyParameter
    }

    result[parameter.name] = enterpriseParameter
  }

  return result
}
