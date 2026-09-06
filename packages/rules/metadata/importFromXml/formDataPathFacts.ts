import { yamlPathToPointer, type FormDataPathMetadataProjection } from "@nkdk/runtime"
import { createFormDataPathMetadataCollector, type DirectImportFactsSink, type LocalIndexes } from "@nkdk/runtime/rule-kit"
import { selectImportPropertyPaths } from "./selectedPropertyFacts"

export function createFormDataPathIndexFromFacts(params: {
  readonly facts: readonly Parameters<DirectImportFactsSink["acceptProperty"]>[0][]
  readonly localIndexes: LocalIndexes
  readonly projection: FormDataPathMetadataProjection
}) {
  const projection = params.projection
  const collector = createFormDataPathMetadataCollector({ filePath: "", projection })
  const properties = params.localIndexes.metadata.events.filter(event => {
    if (event.kind === "item") { collector.acceptItem(event); return false }
    if (event.kind !== "property") return false
    const key = event.rulePath.at(-1)?.propertyKey
    const ownerType = event.rulePath.at(-2)?.nestedItemType
    if (ownerType === projection.attributeItemType) {
      return key === projection.typePropertyKey || key === projection.dynamicListPropertyKey || key === projection.additionalColumnsPropertyKey
    }
    if (ownerType === projection.columnItemType) return key === projection.typePropertyKey
    return key === projection.tableDataPathPropertyKey && projection.tabularElementItemTypes.includes(ownerType ?? "")
  })
  const values = selectImportPropertyPaths(params.facts, new Map(properties.map(event => [
    yamlPathToPointer(event.yamlPath) ?? "", event.yamlPath,
  ])))
  // Динамический список имеет тот же приоритет над Тип, что в обычном YAML-индексе.
  for (const dynamic of [false, true]) {
    for (const event of properties) {
      if ((event.rulePath.at(-1)?.propertyKey === projection.dynamicListPropertyKey) !== dynamic) continue
      const selected = values.get(yamlPathToPointer(event.yamlPath) ?? "")
      if (selected !== undefined) collector.acceptProperty({ ...event, value: selected.value })
    }
  }
  return collector.finish()
}
