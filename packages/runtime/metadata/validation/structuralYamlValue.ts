import { isExplicitYAMLString } from "../../yaml/explicitString"
import type { XmlAnomalyAnnotations } from "../../yaml/xmlAnomalyAnnotations"

/** Возвращает семантическое представление YAML для JSON Schema, не изменяя исходное дерево. */
export function structuralYamlValue(value: unknown, annotations?: XmlAnomalyAnnotations): unknown {
  if (isExplicitYAMLString(value)) return value.value
  if (Array.isArray(value)) return structuralArray(value, annotations)
  if (typeof value !== "object" || value === null) return value
  return structuralRecord(value as Record<string, unknown>, annotations)
}

function structuralArray(value: readonly unknown[], annotations?: XmlAnomalyAnnotations): readonly unknown[] {
  let result: unknown[] | undefined
  for (const [index, item] of value.entries()) {
    const structural = structuralYamlValue(item, annotations)
    if (structural === item) continue
    result ??= [...value]
    result[index] = structural
  }
  return result ?? value
}

function structuralRecord(
  value: Record<string, unknown>,
  annotations?: XmlAnomalyAnnotations,
): Record<string, unknown> {
  let result: Record<string, unknown> | undefined
  for (const [key, item] of Object.entries(value)) {
    const annotation = annotations?.at(value, key)
    const semantic = annotation?.kind === "raw" ? annotation.semantic : annotation
    if (item === undefined && (semantic?.kind === "invalid" || semantic?.kind === "important")) {
      result ??= { ...value }
      delete result[key]
      continue
    }
    const structural = structuralYamlValue(item, annotations)
    if (structural === item) continue
    result ??= { ...value }
    result[key] = structural
  }
  return result ?? value
}
