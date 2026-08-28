import type { TSchema } from "typebox"

const STRUCTURAL_YAML_PROPERTIES_KEY = "x-nkdk-structuralYamlProperties"

export function withStructuralYAMLProperties<T extends TSchema>(
  schema: T,
  properties: readonly string[],
): T {
  return {
    ...schema,
    [STRUCTURAL_YAML_PROPERTIES_KEY]: [...properties],
  }
}

export function structuralYAMLProperties(schema: TSchema): ReadonlySet<string> {
  const value = (schema as TSchema & Record<string, unknown>)[STRUCTURAL_YAML_PROPERTIES_KEY]
  return new Set(Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [])
}
