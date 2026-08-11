import { currentPropertyRuleRegistrySet } from "./propertyRuleExecutionContext"

type DeclaredItemRule = object

export function getDeclaredPropertyItemRule<Rule extends object = DeclaredItemRule>(
  propertyType: string
): Rule | undefined {
  return currentPropertyRuleRegistrySet<{
    getDeclaredPropertyItemRule<Resolved extends object>(type: string): Resolved | undefined
  }>()?.getDeclaredPropertyItemRule<Rule>(propertyType)
}
