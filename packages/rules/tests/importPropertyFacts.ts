import { markYAMLScalarTag } from "@nkdk/runtime"
import { baseFormProjectionSourceFromFacts } from "../metadata/importFromXml/baseFormProjectionFacts"
import type { DirectImportPropertyFact } from "../metadata/importFromXml/propertyFacts"

/** Только для сопоставления результата фактов с существующими YAML-проверками. */
export function materializeImportPropertyFacts(facts: readonly DirectImportPropertyFact[]): Record<string, unknown> {
  const source = baseFormProjectionSourceFromFacts(facts)
  const result = Object.fromEntries(source.keys().map(key => [key, source.read(key)]))
  for (const fact of facts) {
    if (fact.yamlPath.length === 1 && fact.scalarTag !== undefined) {
      markYAMLScalarTag(result, fact.yamlPath[0]!, fact.scalarTag)
    }
  }
  return result
}
