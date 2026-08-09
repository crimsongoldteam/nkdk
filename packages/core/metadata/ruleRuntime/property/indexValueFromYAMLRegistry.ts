export type IndexValueFromYAMLFunction = (value: unknown) => unknown

const indexValueFromYAMLRegistry = new Map<string, IndexValueFromYAMLFunction>()

export function registerIndexValueFromYAML(propertyType: string, handler: IndexValueFromYAMLFunction): void {
  indexValueFromYAMLRegistry.set(propertyType, handler)
}

export function indexValueFromYAML<T>(propertyType: string, value: unknown): T | undefined {
  return indexValueFromYAMLRegistry.get(propertyType)?.(value) as T | undefined
}
