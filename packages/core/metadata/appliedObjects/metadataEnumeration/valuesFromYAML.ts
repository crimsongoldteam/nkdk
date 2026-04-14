import { ConfigurationContext } from "~/metadata/context/types"
import { registerTypeRule } from "~/metadata/orchestration"
import { defaultGraph } from "~/metadata/relations/graph"
import {
  MetadataEnumerationValue,
  MetadataEnumerationValues,
  MetadataEnumerationValuesYAML,
} from "./types"

const EDGE_NAME = "ЗначениеПеречисления"

export const importMetadataEnumerationValuesFromYAML = (
  context: ConfigurationContext,
  _rule: unknown,
  data: MetadataEnumerationValuesYAML | undefined
): MetadataEnumerationValues | undefined => {
  if (!data) return undefined

  const { graphContext } = context
  const g = context.graph ?? defaultGraph

  const results = Object.entries(data).map(([name]) => {
    const enumValue: MetadataEnumerationValue = {
      itemType: "MetadataEnumerationValue",
      name,
    }

    if (graphContext?.parentNodeId) {
      const valueNodeId = `${graphContext.parentNodeId}.${name}`
      g.ensureNode(valueNodeId, {
        name,
        filePath: graphContext.filePath,
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
