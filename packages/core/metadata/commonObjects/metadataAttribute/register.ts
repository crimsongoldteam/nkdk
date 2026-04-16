import { TSchema, Type } from "@sinclair/typebox"
import { isMap, isPair, isScalar, YAMLMap } from "yaml"
import { MetadataAttributeYAML, MetadataAttributes, MetadataAttributesXML, MetadataAttributesYAML } from "./types"
import { importTypeDescriptionFromYAML } from "~/metadata/commonObjects/typeDescription/fromYAML"
import { TypeDescriptionYAML } from "~/metadata/commonObjects/typeDescription/types"
import { ConfigurationContext, ConfigurationContextFromXML } from "~/metadata/context/types"
import { splitPascalCase } from "~/metadata/helpers/canConvertToPascalCase"
import { ExportToJSONSchemaFn, importMetadataItemFromYAML, registerTypeRule } from "~/metadata/orchestration"
import { exportMetadataItemToJSONSchema } from "~/metadata/orchestration/metadataItem/toJSONSchema"
import { registerMetadataItemCollectionRule } from "~/metadata/orchestration/metadataCollection/ruleFactory"
import { exportMetadataCollectionToYAMLAsRecord } from "~/metadata/orchestration/metadataCollection/toYAML"
import { importPropertyFromXML } from "~/metadata/orchestration/property/fromXML"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { defaultGraph } from "~/metadata/relations/graph"
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

const importMetadataAttributeFromYAML = (
  context: ConfigurationContext,
  yaml: MetadataAttributeYAML | TypeDescriptionYAML,
  name: string
) => {
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

  return {
    ...properties,
    name,
  }
}

const importMetadataAttributesFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataAttributesYAML | undefined
): MetadataAttributes | undefined => {
  if (!data) return undefined

  const { graphContext } = context
  const g = context.graph ?? defaultGraph
  const attrsYamlMap = graphContext ? findSubmap(graphContext.currentYamlMap, _rule?.yaml) : undefined

  const results = Object.entries(data).map(([name, value]) => {
    if (graphContext?.parentNodeId) {
      const attrNodeId = `${graphContext.parentNodeId}.${name}`
      const offset = attrsYamlMap ? findKeyOffset(attrsYamlMap, name) : undefined
      const attrValueYamlMap = findSubmap(attrsYamlMap, name)

      g.ensureNode(attrNodeId, {
        name,
        positionFrom: offset !== undefined ? { offset } : undefined,
        filePath: graphContext.filePath,
      })
      const edgeKey = `${graphContext.parentNodeId}:${EDGE_NAME}:${attrNodeId}`
      g.ensureEdge(edgeKey, graphContext.parentNodeId, attrNodeId, {
        yaml: EDGE_NAME,
        name: EDGE_NAME,
        kind: "composition",
      })

      const childContext: ConfigurationContext = {
        ...context,
        graphContext: { ...graphContext, parentNodeId: attrNodeId, currentYamlMap: attrValueYamlMap },
      }

      const attr = importMetadataAttributeFromYAML(childContext, value as MetadataAttributeYAML, name)

      g.setNodeAttribute(attrNodeId, "item", attr)

      return attr
    }

    return importMetadataAttributeFromYAML(context, value as MetadataAttributeYAML, name)
  })

  return results.length > 0 ? (results as MetadataAttributes) : undefined
}

registerMetadataItemCollectionRule({
  propertyType: "MetadataAttributes",
  itemRule: MetadataAttributeRules,
  xmlElement: "Attribute",
  keyField: "name",
  fromYAML: importMetadataAttributesFromYAML,
})

const exportMetadataAttributesToJSONSchema: ExportToJSONSchemaFn = (params: {
  context: ConfigurationContext
}): TSchema => {
  const { context } = params
  const attributeSchema = exportMetadataItemToJSONSchema({
    context: context,
    rule: MetadataAttributeRules,
  })
  return Type.Record(Type.String(), attributeSchema)
}

registerTypeRule("MetadataAttributes", "exportToJSONSchema", exportMetadataAttributesToJSONSchema)

// Compat exports for consumers that call these functions directly
export const importMetadataAttributesFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: MetadataAttributesXML | undefined
): MetadataAttributes | undefined => {
  return importPropertyFromXML({ context, rule: { type: "MetadataAttributes" }, value: xml }) as MetadataAttributes | undefined
}

export const exportMetadataAttributesToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataAttributes | undefined
): MetadataAttributesYAML | undefined => {
  return exportMetadataCollectionToYAMLAsRecord({
    context,
    data,
    itemRule: MetadataAttributeRules,
    keyField: "name",
  }) as MetadataAttributesYAML | undefined
}
