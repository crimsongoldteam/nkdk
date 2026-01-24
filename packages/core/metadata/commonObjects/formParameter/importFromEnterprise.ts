import { ConfigurationContext } from "../../context/types"
import { importTypeDescriptionFromEnterprise } from "../typeDescription/importFromEnterprise"
import { FormParameter, FormParameters, FormParametersEnterprise } from "./types"

export const importFormParametersFromEnterprise = (
  context: ConfigurationContext,
  data: FormParametersEnterprise | undefined
): FormParameters | undefined => {
  if (data === undefined) {
    return undefined
  }

  return Object.entries(data).map(([name, parameter]) => {
    const result: FormParameter = {
      name,
      type: importTypeDescriptionFromEnterprise(context, parameter.Тип)!,
    }

    if (parameter.Ключевой !== undefined) {
      result.keyParameter = parameter.Ключевой
    }

    return result
  })
}
