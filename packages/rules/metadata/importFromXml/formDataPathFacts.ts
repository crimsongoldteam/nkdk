import { yamlPathToPointer, type FormDataPathMetadataProjection } from "@nkdk/runtime"
import { createFormDataPathMetadataCollector, formDataPathPropertyKind, type DirectImportFactsSink, type LocalIndexes } from "@nkdk/runtime/rule-kit"
import { selectImportPropertyPaths } from "./selectedPropertyFacts"

export function createFormDataPathIndexFromFacts(params: {
  readonly facts: readonly Parameters<DirectImportFactsSink["acceptProperty"]>[0][]
  readonly localIndexes: LocalIndexes
  readonly projection: FormDataPathMetadataProjection
}) {
  const projection = params.projection
  const collector = createFormDataPathMetadataCollector({ filePath: "", projection })
  for (const fact of params.facts) {
    if (fact.propertyKey !== "$formElementKind" || !projection.tabularElementItemTypes.includes(fact.itemType)) continue
    collector.acceptItem({ itemType: fact.itemType, yamlPath: fact.yamlPath.slice(0, -1), rulePath: [] })
  }
  const properties = params.localIndexes.metadata.events.filter(event => {
    if (event.kind === "item") { collector.acceptItem(event); return false }
    if (event.kind !== "property") return false
    return formDataPathPropertyKind(event, projection) !== undefined
  })
  const values = selectImportPropertyPaths(params.facts, new Map(properties.map(event => [
    yamlPathToPointer(event.yamlPath) ?? "", event.yamlPath,
  ])))
  // Динамический список имеет тот же приоритет над Тип, что в обычном YAML-индексе.
  for (const dynamic of [false, true]) {
    for (const event of properties) {
      if ((formDataPathPropertyKind(event, projection) === "dynamicList") !== dynamic) continue
      const selected = values.get(yamlPathToPointer(event.yamlPath) ?? "")
      if (selected !== undefined) collector.acceptProperty({ ...event, value: selected.value })
    }
  }
  return collector.finish()
}
