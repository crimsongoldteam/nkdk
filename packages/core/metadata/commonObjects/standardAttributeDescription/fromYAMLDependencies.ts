import { isPair, isScalar, YAMLMap } from "yaml"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { getOrCreateRawNodeId, graph } from "~/metadata/relations/graph"

function importStandardAttributesDependenciesFromYAML(params: {
  yamlMap?: YAMLMap
  parentNodeId: string
  filePath: string
  propRule?: PropertyRule
}): void {
  const { yamlMap, parentNodeId, filePath, propRule } = params
  if (!propRule || propRule.type !== "StandardAttributeDescriptions") return

  const { standartAttributeNames } = propRule

  for (const [, russianName] of Object.entries(standartAttributeNames)) {
    const pair = yamlMap?.items.find(
      (item) => isPair(item) && isScalar(item.key) && item.key.value === russianName,
    )
    const offset = pair && isPair(pair) && isScalar(pair.key) ? pair.key.range?.[0] : undefined

    const nodeId = `${parentNodeId}.СтандартныйРеквизит.${russianName}`

    getOrCreateRawNodeId(nodeId, { name: russianName, offset, filePath })

    const edgeKey = `${parentNodeId}:СтандартныйРеквизит:${russianName}`
    if (!graph.hasEdge(edgeKey)) {
      graph.addEdgeWithKey(edgeKey, parentNodeId, nodeId, {
        yaml: "СтандартныйРеквизит",
        name: "СтандартныйРеквизит",
      })
    }
  }
}

registerTypeRule("StandardAttributeDescriptions", "importDependenciesFromYAML", importStandardAttributesDependenciesFromYAML)
