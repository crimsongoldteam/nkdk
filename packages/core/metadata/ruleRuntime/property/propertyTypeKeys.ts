import type { PropertyRuleType } from "./registry"
import { PropertyRuleTypeKeys } from "./registry"

const registeredPropertyRuleTypes = new Set<PropertyRuleType>(PropertyRuleTypeKeys)

export const registerPropertyRuleTypes = (keys: readonly PropertyRuleType[]): void => {
  for (const key of keys) {
    registeredPropertyRuleTypes.add(key)
  }
}

export const isRegisteredPropertyRuleType = (key: string): key is PropertyRuleType => {
  return registeredPropertyRuleTypes.has(key as PropertyRuleType)
}

export const getRegisteredPropertyRuleTypes = (): PropertyRuleType[] => {
  return [...registeredPropertyRuleTypes]
}
