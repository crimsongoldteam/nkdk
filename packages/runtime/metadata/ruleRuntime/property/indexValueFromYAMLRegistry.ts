import { currentPropertyRuleRegistrySet } from "./propertyRuleExecutionContext"

export type IndexValueFromYAMLFunction = (value: unknown) => unknown

export function indexValueFromYAML<T>(propertyType: string, value: unknown): T | undefined {
  return currentPropertyRuleRegistrySet<{
    indexValueFromYAML<Resolved>(type: string, input: unknown): Resolved | undefined
  }>()?.indexValueFromYAML<T>(propertyType, value)
}
