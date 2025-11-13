import { TElementType } from "../metadata/forms/elements/types"
import { TElementRules } from "./types"

const rulesRegistry = new Map<TElementType, TElementRules>()

export const registerElementRules = (
  elementType: TElementType,
  rules: TElementRules
): void => {
  rulesRegistry.set(elementType, rules)
}

export const getElementRules = (elementType: TElementType): TElementRules => {
  const rules = rulesRegistry.get(elementType)
  if (!rules) {
    throw new Error(`Rules for element type ${elementType} not found`)
  }
  return rules
}

export const clearElementRules = (): void => {
  rulesRegistry.clear()
}
