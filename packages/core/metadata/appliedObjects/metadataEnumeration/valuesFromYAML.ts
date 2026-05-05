import { LineCounter, YAMLMap } from "yaml"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import { computeKeyPosition, findSubmap } from "~/metadata/orchestration/property/position"
import { GraphOps, GraphOpsChild } from "~/metadata/orchestration/property/fn"
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
  lineCounter: LineCounter | undefined
  propRule: PropertyRule
}): GraphOps | undefined {
  const { model, yamlMap, lineCounter, propRule } = params
  const values = model as MetadataEnumerationValues | undefined
  if (!values || values.length === 0) return undefined

  const valuesYamlMap = propRule.yaml ? findSubmap(yamlMap, propRule.yaml) : undefined

  const children: GraphOpsChild[] = values.map((value) => {
    return {
      idSuffix: value.name,
      name: value.name,
      positionFrom:
        valuesYamlMap && lineCounter
          ? computeKeyPosition(valuesYamlMap, value.name, lineCounter)
          : undefined,
      item: value as unknown as Record<string, unknown>,
    }
  })

  return { children, edgeKind: EDGE_NAME, edgeYaml: EDGE_NAME }
}

registerTypeRule("MetadataEnumerationValues", "importFromYAML", importMetadataEnumerationValuesFromYAML)
registerTypeRule("MetadataEnumerationValues", "buildGraphFromModel", buildEnumerationValuesGraph)
