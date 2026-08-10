import type { ElementRule, ElementType } from "./types"
import { defineMetadataRules } from "../definition"
import type { MetadataRulesDefinition } from "../definition"
import { emptyMetadataRules } from "../definition/testSupport"

const elementRulesRegistry = new Map<ElementType, ElementRule>()

export const getElementRule = <Rule extends ElementRule>(itemType: Rule["itemType"]): Rule => {
  const rule = elementRulesRegistry.get(itemType)
  if (!rule) throw new Error(`Unknown element type: ${itemType}`)
  return rule as Rule
}

export const getElementXMLTagName = <Rule extends ElementRule>(itemType: Rule["itemType"]): string => {
  const rule = getElementRule(itemType)
  return rule.xmlTag ?? rule.itemType
}

export function registerElementRule(itemType: ElementType, elementRule: ElementRule): void {
  elementRulesRegistry.set(itemType, elementRule)
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

export const clearElementRulesRegistry = (): void => {
  elementRulesRegistry.clear()
}
