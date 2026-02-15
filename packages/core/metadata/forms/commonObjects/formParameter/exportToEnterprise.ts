import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/types/types"
import { FormParameterEnterprise, FormParameters, FormParametersEnterprise } from "./types"
import { exportTypeDescriptionToEnterprise } from "~/metadata/commonObjects/typeDescription/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"

export const exportFormParametersToEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  parameters: FormParameters | undefined
): FormParametersEnterprise | undefined => {
  if (parameters === undefined || parameters.length === 0) {
    return undefined
  }

  const result: FormParametersEnterprise = {}

  for (const parameter of parameters) {
    const enterpriseParameter: FormParameterEnterprise = {
      Тип: exportTypeDescriptionToEnterprise(context, undefined, parameter.type)!,
    }

    if (parameter.keyParameter !== undefined) {
      enterpriseParameter.Ключевой = parameter.keyParameter
    }

    result[parameter.name] = enterpriseParameter
  }

  return result
}

registerTypeRule("FormParameters", "exportToEnterprise", exportFormParametersToEnterprise)
