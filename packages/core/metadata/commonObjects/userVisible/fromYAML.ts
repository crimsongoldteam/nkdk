import { importBooleanFromYAML } from "~/metadata/commonObjects/boolean/fromYAML"
import type { PropertyRule } from "~/metadata/orchestration/property/types"
import { ImportFromYAMLFunctionNew } from "~/metadata/orchestration"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import { ConfigurationContext } from "../../context/types"
import type { UserVisibleYAML, type UserVisible, type UserVisibleRolesYAML } from "./types"

export const importUserVisibleFromYAML: ImportFromYAMLFunctionNew = (params: {
  context: ConfigurationContext
  rule: PropertyRule
  value: UserVisibleYAML | undefined
  source?: UserVisible | undefined
  yaml?: Record<string, any> | undefined
}): UserVisible | undefined => {
  const { context, value } = params
  if (value === undefined) return undefined

  const roles: UserVisibleRolesYAML = "Роли" in value ? value.Роли : {}
  const values = Object.entries(roles).map(([key, val]) => {
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
