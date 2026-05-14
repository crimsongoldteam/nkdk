import { LineCounter, YAMLMap } from "yaml"
import { ConfigurationContext } from "~/metadata/context/types"
import {
  exportMetadataItemToYAML,
  importMetadataItemFromYAML,
  PropertyRule,
  registerTypeRule,
} from "~/metadata/orchestration"
import { computeKeyPosition, findSubmap } from "~/metadata/orchestration/property/position"
import { GraphOps, GraphOpsChild } from "~/metadata/orchestration/property/fn"
import { MetadataEnumerationValueRules } from "./rules"
import {
  MetadataEnumerationValue,
  MetadataEnumerationValues,
  MetadataEnumerationValueYAML,
  MetadataEnumerationValuesYAML,
} from "./types"

const EDGE_KIND = "ENUM_VALUE"
const EDGE_YAML = "ЗначениеПеречисления"

export const importMetadataEnumerationValuesFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataEnumerationValuesYAML | undefined
): MetadataEnumerationValues | undefined => {
  if (!data) return undefined

  const results = Object.entries(data).map(([name, value]): MetadataEnumerationValue => {
    const imported = importMetadataItemFromYAML({
      context,
      yaml: value,
      rule: MetadataEnumerationValueRules,
      name,
    }) as MetadataEnumerationValue
    return { ...imported, name }
  })

  return results.length > 0 ? results : undefined
}

const exportMetadataEnumerationValuesToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataEnumerationValues | undefined
): MetadataEnumerationValuesYAML | undefined => {
  if (!data || data.length === 0) return undefined

  return Object.fromEntries(
    data.map((value) => {
      const { name, ...valueWithoutName } = value
      const valueForYAML = valueWithoutName as MetadataEnumerationValue
      const yaml = exportMetadataItemToYAML({
        context,
        rule: MetadataEnumerationValueRules,
        data: valueForYAML,
      }) as MetadataEnumerationValueYAML | undefined

      return [name, yaml ?? {}]
    })
  )
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

  return { children, edgeKind: EDGE_KIND, edgeYaml: EDGE_YAML }
}

registerTypeRule("MetadataEnumerationValues", "importFromYAML", importMetadataEnumerationValuesFromYAML)
registerTypeRule("MetadataEnumerationValues", "exportToYAML", exportMetadataEnumerationValuesToYAML)
registerTypeRule("MetadataEnumerationValues", "buildGraphFromModel", buildEnumerationValuesGraph)
