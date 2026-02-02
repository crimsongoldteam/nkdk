import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "../../context/types"
import { importTypeDescriptionFromYAML } from "../typeDescription/importFromYAML"
import { FormParameter, FormParameters, FormParametersEnterprise } from "./types"

export const importFormParametersFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule,
  data: FormParametersEnterprise | undefined
): FormParameters | undefined => {
  if (data === undefined) {
    return undefined
  }

  return Object.entries(data).map(([name, parameter]) => {
    const result: FormParameter = {
      name,
      type: importTypeDescriptionFromYAML(context, _rule, parameter.Тип)!,
    }

    if (parameter.Ключевой !== undefined) {
      result.keyParameter = parameter.Ключевой
    }

    return result
  })
}
