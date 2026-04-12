import { isPair, isScalar, YAMLMap } from "yaml"
import { ConfigurationContext } from "~/metadata/context/types"
import { importMetadataItemCollectionFromYAMLAsRecord } from "~/metadata/orchestration/metadataCollection/fromYAML"
import { registerMetadataItemCollectionRule } from "~/metadata/orchestration/metadataCollection/ruleFactory"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { defaultGraph } from "~/metadata/relations/graph"
import { StandardAttributeDescriptionRules } from "./rules"
import {
  StandartAttributeNameFromYAML,
  StandartAttributeNameToYAML,
  type StandartAttributeName,
} from "./standartAttributeNames"

const EDGE_NAME = "СтандартныйРеквизит"

function findKeyOffset(yamlMap: YAMLMap, key: string): number | undefined {
  const pair = yamlMap.items.find((i) => isPair(i) && isScalar(i.key) && i.key.value === key)
  if (!pair || !isPair(pair) || !isScalar(pair.key)) return undefined
  return pair.key.range?.[0]
}

function findStdAttrsSubmap(currentYamlMap: YAMLMap | undefined, propYaml: string | undefined): YAMLMap | undefined {
  if (!currentYamlMap || !propYaml) return undefined
  const pair = currentYamlMap.items.find((i) => isPair(i) && isScalar(i.key) && i.key.value === propYaml)
  if (!pair || !isPair(pair)) return undefined
  if (pair.value instanceof YAMLMap) return pair.value as YAMLMap
  return undefined
}

function importStandardAttributeDescriptionsFromYAML(
  context: ConfigurationContext,
  rule: PropertyRule | undefined,
  value: any
) {
  const result = importMetadataItemCollectionFromYAMLAsRecord({
    context,
    itemRule: StandardAttributeDescriptionRules,
    yaml: value,
    nameFromYAMLKey: StandartAttributeNameFromYAML,
  })

  const { graphContext } = context
  if (graphContext?.parentNodeId && rule?.type === "StandardAttributeDescriptions") {
    const g = context.graph ?? defaultGraph
    const { parentNodeId, filePath, currentYamlMap } = graphContext
    const stdAttrsYamlMap = findStdAttrsSubmap(currentYamlMap, rule.yaml)

    for (const [, russianName] of Object.entries(rule.standartAttributeNames)) {
      // NodeId без промежуточных сегментов: Справочник.TestCatalog.Ссылка
      const nodeId = `${parentNodeId}.${russianName}`
      const offset = stdAttrsYamlMap ? findKeyOffset(stdAttrsYamlMap, russianName) : undefined

      g.ensureNode(nodeId, {
        name: russianName,
        positionFrom: offset !== undefined ? { offset } : undefined,
        filePath,
      })

      const edgeKey = `${parentNodeId}:${EDGE_NAME}:${russianName}`
      g.ensureEdge(edgeKey, parentNodeId, nodeId, { yaml: EDGE_NAME, name: EDGE_NAME, kind: "composition" })
    }
  }

  return result
}

registerMetadataItemCollectionRule({
  propertyType: "StandardAttributeDescriptions",
  itemRule: StandardAttributeDescriptionRules,
  xmlElement: "xr:StandardAttribute",
  keyField: "name",
  nameFromYAMLKey: StandartAttributeNameFromYAML,
  recordYamlKeyFromItem: (item) => StandartAttributeNameToYAML[item.name as StandartAttributeName],
  fromYAML: importStandardAttributeDescriptionsFromYAML,
})
