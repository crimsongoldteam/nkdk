import { TypeDescriptionRule, TypeDescriptionRules } from "./types"

export const getTypeDescriptionRule = (type: string): TypeDescriptionRule | undefined => {
  return TypeDescriptionRules[type]
}
