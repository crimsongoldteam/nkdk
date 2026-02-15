import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/types/types"
import { FormParameter, FormParameters, FormParametersEnterprise } from "./types"
import { importTypeDescriptionFromEnterprise } from "~/metadata/commonObjects/typeDescription/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"

export const importFormParametersFromEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: FormParametersEnterprise | undefined
): FormParameters | undefined => {
  if (data === undefined) {
    return undefined
  }

  return Object.entries(data).map(([name, parameter]) => {
    const result: FormParameter = {
      name,
      type: importTypeDescriptionFromEnterprise(context, undefined, parameter.Тип)!,
    }

    if (parameter.Ключевой !== undefined) {
      result.keyParameter = parameter.Ключевой
    }

    return result
  })
}

registerTypeRule("FormParameters", "importFromEnterprise", importFormParametersFromEnterprise)
