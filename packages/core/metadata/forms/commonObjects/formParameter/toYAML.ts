import { exportTypeDescriptionToYAML } from "~/metadata/commonObjects/typeDescription/toYAML"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { FormParameterYAML, FormParameters, FormParametersYAML } from "./types"

export const exportFormParametersToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  parameters: FormParameters | undefined
): FormParametersYAML | undefined => {
  if (parameters === undefined || parameters.length === 0) {
    return undefined
  }

  const result: FormParametersYAML = {}

  for (const parameter of parameters) {
    const enterpriseParameter: FormParameterYAML = {
      Тип: exportTypeDescriptionToYAML(context, undefined, parameter.type)!,
    }

    if (parameter.keyParameter !== undefined) {
      enterpriseParameter.Ключевой = parameter.keyParameter
    }

    result[parameter.name] = enterpriseParameter
  }

  return result
}

registerTypeRule("FormParameters", "exportToYAML", exportFormParametersToYAML)
