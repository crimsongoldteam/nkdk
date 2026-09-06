import type { DirectImportFactsSink } from "@nkdk/runtime/rule-kit"
import { createSelectedPropertyValue } from "./selectedPropertyValue"

type PropertyFact = Parameters<DirectImportFactsSink["acceptProperty"]>[0]

/** Материализует только явно запрошенные свойства, не YAML-представление документа. */
export function selectImportPropertyValues(
  facts: readonly PropertyFact[],
  keys: Iterable<string>,
): ReadonlyMap<string, unknown> {
  const selected = new Map([...keys].map(key => [key, createSelectedPropertyValue()]))
  for (const containers of [true, false]) {
    for (const fact of facts) {
      if (fact.propertyKey.startsWith("$container:") !== containers) continue
      const key = fact.yamlPath[0]
      const target = typeof key === "string" ? selected.get(key) : undefined
      if (target === undefined) continue
      const value = fact.value
      if (value === undefined && fact.scalarTag === undefined && fact.presentInXML !== true) continue
      target.accept(fact.yamlPath.slice(1), value, fact.scalarTag)
    }
  }
  return new Map([...selected].map(([key, value]) => [key, value.finish()]))
}
