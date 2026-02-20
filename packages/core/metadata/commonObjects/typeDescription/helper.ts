import { TypeDescriptionRule, TypeDescriptionRules } from "./types"

export const getTypeDescriptionRule = (type: string): TypeDescriptionRule | undefined => {
  return TypeDescriptionRules[type]
}

export const getTypeFromYAML = (enterprise: string): string | undefined => {
  // Find the key (type) that corresponds to this enterprise value
  for (const [type, rule] of Object.entries(TypeDescriptionRules)) {
    if (rule.enterprise === enterprise) {
      return type
    }
  }
  return undefined
}
