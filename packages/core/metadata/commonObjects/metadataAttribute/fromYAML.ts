import { isMap, isPair, isScalar, YAMLMap } from "yaml"
import {
  MetadataAttribute,
  MetadataAttributeYAML,
  MetadataAttributes,
  MetadataAttributesYAML,
} from "~/metadata/commonObjects/metadataAttribute/types"
import { importTypeDescriptionFromYAML } from "~/metadata/commonObjects/typeDescription/fromYAML"
import { TypeDescriptionYAML } from "~/metadata/commonObjects/typeDescription/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { splitPascalCase } from "~/metadata/helpers/canConvertToPascalCase"
import { removeDefaults } from "~/metadata/helpers/compactObject"
import { importMetadataItemFromYAML, registerTypeRule } from "~/metadata/orchestration"
import { getOrCreateRawNodeId, graph } from "~/metadata/relations/graph"
import { getDefaultsAttribute } from "./defaults"
import { MetadataAttributeRules } from "./rules"

const EDGE_NAME = "Реквизит"

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

export const importMetadataAttributesFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataAttributesYAML | undefined
): MetadataAttributes | undefined => {
  if (!data) return undefined

  const { graphContext } = context
  const attrsYamlMap = graphContext
    ? findSubmap(graphContext.currentYamlMap, _rule?.yaml)
    : undefined

  const results = Object.entries(data).map(([name, value]) => {
    if (graphContext?.parentNodeId) {
      const attrNodeId = `${graphContext.parentNodeId}.${EDGE_NAME}.${name}`
      const offset = attrsYamlMap ? findKeyOffset(attrsYamlMap, name) : undefined
      const attrValueYamlMap = findSubmap(attrsYamlMap, name)

      getOrCreateRawNodeId(attrNodeId, {
        name,
        positionFrom: offset !== undefined ? { offset } : undefined,
        filePath: graphContext.filePath,
      })
      const edgeKey = `${graphContext.parentNodeId}:${EDGE_NAME}:${attrNodeId}`
      if (!graph.hasEdge(edgeKey)) {
        graph.addEdgeWithKey(edgeKey, graphContext.parentNodeId, attrNodeId, {
          yaml: EDGE_NAME,
          name: EDGE_NAME,
        })
      }

      const childContext: ConfigurationContext = {
        ...context,
        graphContext: { ...graphContext, parentNodeId: attrNodeId, currentYamlMap: attrValueYamlMap },
      }

      const attr = importMetadataAttributeFromYAML(childContext, value as MetadataAttributeYAML, name)

      graph.setNodeAttribute(attrNodeId, "item", attr)

      return attr
    }

    return importMetadataAttributeFromYAML(context, value as MetadataAttributeYAML, name)
  })

  return results.length > 0 ? results : undefined
}

export const importMetadataAttributeFromYAML = (
  context: ConfigurationContext,
  yaml: MetadataAttributeYAML | TypeDescriptionYAML,
  name: string
): MetadataAttribute => {
  if (typeof yaml === "string" || Array.isArray(yaml)) {
    const type = importTypeDescriptionFromYAML(context, undefined, yaml)
    if (!type) throw new Error("Type is required")

    return {
      itemType: MetadataAttributeRules.itemType,
      name,
      type,
      synonym: { items: { [context.defaultLanguage]: splitPascalCase(name) } },
    }
  }

  const properties = importMetadataItemFromYAML({
    context,
    yaml: yaml as MetadataAttributeYAML,
    rule: MetadataAttributeRules,
    name,
  })

  if (properties == undefined) throw new Error("Properties are required")

  const result: MetadataAttribute = {
    ...properties,
    name,
  }

  const defaults = getDefaultsAttribute(context, result)
  return removeDefaults(result, defaults)
}

registerTypeRule("MetadataAttributes", "importFromYAML", importMetadataAttributesFromYAML)
