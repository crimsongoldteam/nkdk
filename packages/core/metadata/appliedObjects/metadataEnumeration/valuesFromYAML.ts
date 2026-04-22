import { YAMLMap } from "yaml"
import { ConfigurationContext } from "~/metadata/context/types"
import { MetadataGraph } from "~/metadata/relations/MetadataGraph"
import { PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import { findKeyOffset, findSubmap } from "~/metadata/orchestration/property/position"
import {
  MetadataEnumerationValue,
  MetadataEnumerationValues,
  MetadataEnumerationValuesYAML,
} from "./types"

const EDGE_NAME = "ЗначениеПеречисления"

export const importMetadataEnumerationValuesFromYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataEnumerationValuesYAML | undefined
): MetadataEnumerationValues | undefined => {
  if (!data) return undefined

  const results = Object.entries(data).map(([name]): MetadataEnumerationValue => ({
    itemType: "MetadataEnumerationValue",
    name,
  }))

  return results.length > 0 ? results : undefined
}

function buildEnumerationValuesGraph(params: {
  model: unknown
  parentNodeId: string
  filePath: string
  yamlMap: YAMLMap | undefined
  propRule: PropertyRule
  graph: MetadataGraph
}): void {
  const { model, parentNodeId, filePath, yamlMap, propRule, graph } = params
  const values = model as MetadataEnumerationValues | undefined
  if (!values || values.length === 0) return

  const valuesYamlMap = propRule.yaml ? findSubmap(yamlMap, propRule.yaml) : undefined

  for (const value of values) {
    const nodeId = `${parentNodeId}.${value.name}`
    const offset = valuesYamlMap ? findKeyOffset(valuesYamlMap, value.name) : undefined
    graph.ensureNode(nodeId, {
      name: value.name,
      filePath,
      positionFrom: offset !== undefined ? { offset } : undefined,
    })
    const edgeKey = `${parentNodeId}:${EDGE_NAME}:${nodeId}`
    graph.ensureEdge(edgeKey, parentNodeId, nodeId, {
      yaml: EDGE_NAME,
      name: EDGE_NAME,
      kind: "composition",
    })
    graph.setNodeAttribute(nodeId, "item", value)
  }
}

registerTypeRule("MetadataEnumerationValues", "importFromYAML", importMetadataEnumerationValuesFromYAML)
registerTypeRule("MetadataEnumerationValues", "buildGraphFromModel", buildEnumerationValuesGraph)
