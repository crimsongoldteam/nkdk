import type { ElementRule, ElementType } from "./types"
import { defineMetadataRules } from "../definition"
import type { MetadataRulesDefinition } from "../definition"
import { emptyMetadataRules } from "../definition/testSupport"
import { currentRuleRegistrySet } from "../ruleRegistryExecutionContext"

export const getElementRule = <Rule extends ElementRule>(itemType: Rule["itemType"]): Rule => {
  const rule = currentRuleRegistrySet<{
    formElements: ReadonlyMap<string, ElementRule>
  }>()?.formElements.get(itemType)
  if (!rule) throw new Error(`Unknown element type: ${itemType}`)
  return rule as Rule
}

export const getElementXMLTagName = <Rule extends ElementRule>(itemType: Rule["itemType"]): string => {
  const rule = getElementRule(itemType)
  return rule.xmlTag ?? rule.itemType
}

export function defineElementRule(
  itemType: ElementType,
  elementRule: ElementRule,
): MetadataRulesDefinition<never> {
  return defineMetadataRules({
    ...emptyMetadataRules,
    formElements: { [itemType]: elementRule },
  })
}
