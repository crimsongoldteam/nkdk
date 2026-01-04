import { TypeDescriptionRule, TypeDescriptionRules, TypeDescriptionRulesFromEnterprise } from "./types"

export const getTypeDescriptionRule = (type: string): TypeDescriptionRule | undefined => {
  return TypeDescriptionRules[type]
}

export const getTypeDescriptionRuleFromEnterprise = (enterprise: string): TypeDescriptionRule | undefined => {
  return TypeDescriptionRulesFromEnterprise[enterprise]
}

export const getTypeFromEnterprise = (enterprise: string): string | undefined => {
  // Find the key (type) that corresponds to this enterprise value
  for (const [type, rule] of Object.entries(TypeDescriptionRules)) {
    if (rule.enterprise === enterprise) {
      return type
    }
  }
  return undefined
}
