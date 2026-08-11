import { collectPropertyItemRules } from "./propertyRuleRegistrySet"

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
  return declarations.get(propertyType) as Rule | undefined
}
