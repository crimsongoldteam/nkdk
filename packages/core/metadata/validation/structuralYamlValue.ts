import { isExplicitYAMLString } from "../../yaml/explicitString"

/** Возвращает семантическое представление YAML для JSON Schema, не изменяя исходное дерево. */
export function structuralYamlValue(value: unknown): unknown {
  if (isExplicitYAMLString(value)) return value.value
  if (Array.isArray(value)) return structuralArray(value)
  if (typeof value !== "object" || value === null) return value
  return structuralRecord(value as Record<string, unknown>)
}

function structuralArray(value: readonly unknown[]): readonly unknown[] {
  let result: unknown[] | undefined
  for (const [index, item] of value.entries()) {
    const structural = structuralYamlValue(item)
    if (structural === item) continue
    result ??= [...value]
    result[index] = structural
  }
  return result ?? value
}

function structuralRecord(value: Record<string, unknown>): Record<string, unknown> {
  let result: Record<string, unknown> | undefined
  for (const [key, item] of Object.entries(value)) {
    const structural = structuralYamlValue(item)
    if (structural === item) continue
    result ??= { ...value }
    result[key] = structural
  }
  return result ?? value
}
