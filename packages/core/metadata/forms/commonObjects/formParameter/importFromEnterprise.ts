import { importTypeDescriptionFromYAML } from "~/metadata/commonObjects/typeDescription/fromYAML"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/types/factory"
import { FormParameter, FormParameters, FormParametersYAML } from "./types"

export const importFormParametersFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  data: FormParametersYAML | undefined
): FormParameters | undefined => {
  if (data === undefined) {
    return undefined
  }

  return Object.entries(data).map(([name, parameter]) => {
    const result: FormParameter = {
      name,
      type: importTypeDescriptionFromYAML(context, undefined, parameter.Тип)!,
    }

    if (parameter.Ключевой !== undefined) {
      result.keyParameter = parameter.Ключевой
    }

    return result
  })
}

registerTypeRule("FormParameters", "importFromYAML", importFormParametersFromYAML)
