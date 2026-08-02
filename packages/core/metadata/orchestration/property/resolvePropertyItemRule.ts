import { getTypeRule } from "./typeRuleRegistry"
import type { MetadataItemRule, PropertyRule } from "./types"

export function resolvePropertyItemRule(
  propertyRule: PropertyRule,
  fallback?: MetadataItemRule
): MetadataItemRule | undefined {
  if ("itemRule" in propertyRule && propertyRule.itemRule !== undefined) {
    return propertyRule.itemRule as MetadataItemRule
  }
  return fallback ?? getTypeRule(propertyRule.type, "collectionItemRule")?.itemRule
}
