import { collectPropertyItemRules } from "./propertyRuleRegistrySet"
import { currentPropertyRuleRegistrySet } from "./propertyRuleExecutionContext"

type DeclaredItemRule = object

const declarations = new Map<string, DeclaredItemRule>()

export function declarePropertyItemRule(propertyType: string, itemRule: DeclaredItemRule): void {
  for (const [type, rule] of collectPropertyItemRules({ [propertyType]: itemRule })) {
    declarations.set(type, rule)
  }
}

export function getDeclaredPropertyItemRule<Rule extends object = DeclaredItemRule>(
  propertyType: string
): Rule | undefined {
  return currentPropertyRuleRegistrySet<{
    getDeclaredPropertyItemRule<Resolved extends object>(type: string): Resolved | undefined
  }>()?.getDeclaredPropertyItemRule<Rule>(propertyType)
    ?? declarations.get(propertyType) as Rule | undefined
}
