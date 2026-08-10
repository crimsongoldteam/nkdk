import { importBooleanFromYAML } from "../boolean/fromYAML"
import type { PropertyRule } from "../../ruleRuntime/property/types"
import { ImportFromYAMLFunctionNew } from "../../ruleRuntime"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { ConfigurationContext } from "../../context/types"
import type { UserVisible, UserVisibleRolesYAML, UserVisibleYAML } from "./types"

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

export const metadataPropertyRule000 = definePropertyTypeRule("UserVisible", "importFromYAML", importUserVisibleFromYAML)
