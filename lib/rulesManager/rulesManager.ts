import { TConfigurationSettings } from "../metadata/configurationSettings/types"
import { TElementType } from "../metadata/forms/elements/types"
import { TElementRule, TElementRules } from "./types"

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

export const formatProperty = (
  rule: TElementRule,
  value: any,
  configurationSettings: TConfigurationSettings
): any => {
  if (!rule || !rule.inProperties()) {
    return undefined
  }

  if (value === undefined) {
    return undefined
  }

  return rule.formatProperties
    ? rule.formatProperties(value, configurationSettings, rule)
    : value.toString()
}
