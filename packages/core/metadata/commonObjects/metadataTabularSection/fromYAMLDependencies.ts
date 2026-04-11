import { YAMLMap, isMap, isNode, isPair, isScalar } from "yaml"
import { ConfigurationContext } from "~/metadata/context/types"
import { getTypeRule, registerTypeRule } from "~/metadata/orchestration"
import { getOrCreateRawNodeId, graph } from "~/metadata/relations/graph"
import { importMetadataTabularSectionFromYAML } from "./fromYAML"
import { MetadataTabularSectionRules } from "./rules"

const attributesYamlKey = MetadataTabularSectionRules.properties.attributes.yaml

function importMetadataTabularSectionsDependenciesFromYAML(params: {
  context: ConfigurationContext
  yamlMap?: YAMLMap
  parentNodeId: string
  filePath: string
}): void {
  const { context, yamlMap, parentNodeId, filePath } = params
  if (!yamlMap) return

  for (const item of yamlMap.items) {
    if (!isPair(item) || !isScalar(item.key)) continue
    const sectionName = String(item.key.value)
    const offset = item.key.range?.[0]
    const sectionNodeId = `${parentNodeId}.ТабличнаяЧасть.${sectionName}`

    const yamlValue = isNode(item.value) ? item.value.toJSON() : undefined
    const sectionItem = importMetadataTabularSectionFromYAML(context, undefined, yamlValue, sectionName)

    getOrCreateRawNodeId(sectionNodeId, {
      name: sectionName,
      item: sectionItem,
      positionFrom: offset !== undefined ? { offset } : undefined,
      filePath,
    })

    const edgeKey = `${parentNodeId}:ТабличнаяЧасть:${sectionNodeId}`
    if (!graph.hasEdge(edgeKey)) {
      graph.addEdgeWithKey(edgeKey, parentNodeId, sectionNodeId, {
        yaml: "ТабличнаяЧасть",
        name: "ТабличнаяЧасть",
      })
    }

    if (isMap(item.value)) {
      const attrsPair = item.value.items.find((i) => isPair(i) && isScalar(i.key) && i.key.value === attributesYamlKey)
      if (attrsPair && isPair(attrsPair) && isMap(attrsPair.value)) {
        const attributesHandler = getTypeRule("MetadataAttributes", "importDependenciesFromYAML")
        attributesHandler?.({ context, yamlMap: attrsPair.value, parentNodeId: sectionNodeId, filePath })
      }
    }
  }
}

registerTypeRule(
  "MetadataTabularSections",
  "importDependenciesFromYAML",
  importMetadataTabularSectionsDependenciesFromYAML
)
