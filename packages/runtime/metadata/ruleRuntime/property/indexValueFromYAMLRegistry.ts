import { currentPropertyRuleRegistrySet } from "./propertyRuleExecutionContext"

export type IndexValueFromYAMLFunction = (value: unknown) => unknown

const indexValueFromYAMLRegistry = new Map<string, IndexValueFromYAMLFunction>()

export function registerIndexValueFromYAML(propertyType: string, handler: IndexValueFromYAMLFunction): void {
  indexValueFromYAMLRegistry.set(propertyType, handler)
}

export function indexValueFromYAML<T>(propertyType: string, value: unknown): T | undefined {
  return currentPropertyRuleRegistrySet<{
    indexValueFromYAML<Resolved>(type: string, input: unknown): Resolved | undefined
  }>()?.indexValueFromYAML<T>(propertyType, value)
    ?? indexValueFromYAMLRegistry.get(propertyType)?.(value) as T | undefined
}
