import { YAMLMap, isMap, isPair, isScalar } from "yaml"
import { getOrCreateRawNodeId, graph } from "~/metadata/relations/graph"
import { getTypeRule, registerTypeRule } from "~/metadata/orchestration"
import { MetadataTabularSectionRules } from "./rules"

const attributesYamlKey = MetadataTabularSectionRules.properties.attributes.yaml

function importMetadataTabularSectionsDependenciesFromYAML(params: {
  yamlMap: YAMLMap
  parentNodeId: string
  filePath: string
}): void {
  const { yamlMap, parentNodeId, filePath } = params

  for (const item of yamlMap.items) {
    if (!isPair(item) || !isScalar(item.key)) continue
    const sectionName = String(item.key.value)
    const offset = item.key.range?.[0]
    const sectionNodeId = `${parentNodeId}.ТабличнаяЧасть.${sectionName}`

    getOrCreateRawNodeId(sectionNodeId, { name: sectionName, offset, filePath })

    const edgeKey = `${parentNodeId}:ТабличнаяЧасть:${sectionNodeId}`
    if (!graph.hasEdge(edgeKey)) {
      graph.addEdgeWithKey(edgeKey, parentNodeId, sectionNodeId, {
        yaml: "ТабличнаяЧасть",
        name: "ТабличнаяЧасть",
      })
    }

    if (isMap(item.value)) {
      const attrsPair = item.value.items.find(
        (i) => isPair(i) && isScalar(i.key) && i.key.value === attributesYamlKey,
      )
      if (attrsPair && isPair(attrsPair) && isMap(attrsPair.value)) {
        const attributesHandler = getTypeRule("MetadataAttributes", "importDependenciesFromYAML")
        attributesHandler?.({ yamlMap: attrsPair.value, parentNodeId: sectionNodeId, filePath })
      }
    }
  }
}

registerTypeRule(
  "MetadataTabularSections",
  "importDependenciesFromYAML",
  importMetadataTabularSectionsDependenciesFromYAML,
)
