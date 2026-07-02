import { importTypeDescriptionFromYAML } from "../../../commonObjects/typeDescription/fromYAML"
import { ConfigurationContext } from "../../../context/types"
import { PropertyRule } from "../../elements/calendarField/rules"
import { registerTypeRule } from "../../../orchestration/property/typeRuleRegistry"
import { FormParameter, FormParameters, FormParametersYAML } from "./types"

export const importFormParametersFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: FormParametersYAML | undefined
): FormParameters | undefined => {
  if (data === undefined) {
    return undefined
  }

  return Object.entries(data).map(([name, parameter]) => {
    const result: FormParameter = {
      name,
    }

    const type = importTypeDescriptionFromYAML(context, undefined, parameter.Тип)
    if (type !== undefined) {
      result.type = type
    }

    if (parameter.Ключевой !== undefined) {
      result.keyParameter = parameter.Ключевой
    }

    return result
  })
}

registerTypeRule("FormParameters", "importFromYAML", importFormParametersFromYAML)
