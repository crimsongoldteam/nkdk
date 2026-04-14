import { isMap, isPair, isScalar, YAMLMap } from "yaml"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import { defaultGraph } from "~/metadata/relations/graph"
import {
  MetadataEnumerationValue,
  MetadataEnumerationValues,
  MetadataEnumerationValuesYAML,
} from "./types"

const EDGE_NAME = "ЗначениеПеречисления"

function findSubmap(yamlMap: YAMLMap | undefined, key: string | undefined): YAMLMap | undefined {
  if (!yamlMap || !key) return undefined
  const pair = yamlMap.items.find((i) => isPair(i) && isScalar(i.key) && i.key.value === key)
  if (!pair || !isPair(pair) || !isMap(pair.value)) return undefined
  return pair.value
}

function findKeyOffset(yamlMap: YAMLMap, key: string): number | undefined {
  const pair = yamlMap.items.find((i) => isPair(i) && isScalar(i.key) && i.key.value === key)
  if (!pair || !isPair(pair) || !isScalar(pair.key)) return undefined
  return pair.key.range?.[0]
}

export const importMetadataEnumerationValuesFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataEnumerationValuesYAML | undefined
): MetadataEnumerationValues | undefined => {
  if (!data) return undefined

  const { graphContext } = context
  const g = context.graph ?? defaultGraph
  const valuesYamlMap = graphContext
    ? findSubmap(graphContext.currentYamlMap, _rule?.yaml)
    : undefined

  const results = Object.entries(data).map(([name]) => {
    const enumValue: MetadataEnumerationValue = {
      itemType: "MetadataEnumerationValue",
      name,
    }

    if (graphContext?.parentNodeId) {
      const valueNodeId = `${graphContext.parentNodeId}.${name}`
      const offset = valuesYamlMap ? findKeyOffset(valuesYamlMap, name) : undefined
      g.ensureNode(valueNodeId, {
        name,
        filePath: graphContext.filePath,
        positionFrom: offset !== undefined ? { offset } : undefined,
      })
      const edgeKey = `${graphContext.parentNodeId}:${EDGE_NAME}:${valueNodeId}`
      g.ensureEdge(edgeKey, graphContext.parentNodeId, valueNodeId, {
        yaml: EDGE_NAME,
        name: EDGE_NAME,
        kind: "composition",
      })
      g.setNodeAttribute(valueNodeId, "item", enumValue)
    }

    return enumValue
  })

  return results.length > 0 ? results : undefined
}

registerTypeRule("MetadataEnumerationValues", "importFromYAML", importMetadataEnumerationValuesFromYAML)
