import { importBooleanFromYAML } from "~/metadata/commonObjects/boolean/fromYAML"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { ImportFromYAMLFunctionNew } from "~/metadata/orchestration"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import { ConfigurationContext } from "../../context/types"
import { UserVisibleYAML, type UserVisible } from "./types"

export const importUserVisibleFromYAML: ImportFromYAMLFunctionNew = (params: {
  context: ConfigurationContext
  rule: PropertyRule
  value: UserVisibleYAML | undefined
  source?: UserVisible | undefined
  yaml?: Record<string, any> | undefined
}): UserVisible | undefined => {
  const { context, value } = params
  if (value === undefined) return undefined

  const values = Object.entries(value.Роли).map(([key, val]) => {
    const parsedValue = importBooleanFromYAML(context, undefined, val)
    return {
      name: key,
      value: parsedValue!,
    }
  })

  return {
    common: value.Разрешить !== "Ложь",
    values,
  }
}

registerTypeRule("UserVisible", "importFromYAML", importUserVisibleFromYAML)
