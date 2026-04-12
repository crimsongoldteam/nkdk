import { ConfigurationContext } from "~/metadata/context/types"
import { defaultGraph, itemTypePrefix } from "~/metadata/relations/graph"
import { importPropertiesFromYAML } from "../property/fromYAML"
import { MetadataItemRule } from "../property/types"
import { ToMetadata, ToYAML } from "./registry"

export const importMetadataItemFromYAML = <Rule extends MetadataItemRule>(params: {
  context: ConfigurationContext
  yaml: ToYAML<Rule["itemType"]> | undefined
  rule: Rule
  source?: ToMetadata<Rule["itemType"]>
  name?: string
}): ToMetadata<Rule["itemType"]> | undefined => {
  const { yaml, rule, source, name } = params
  let { context } = params

  if (context.graphContext?.filePath && !context.graphContext.parentNodeId && name) {
    const prefix = rule.itemTypePrefix ?? itemTypePrefix[rule.itemType] ?? rule.itemType
    const itemNodeId = `${prefix}.${name}`
    const g = context.graph ?? defaultGraph
    g.ensureNode(prefix, { name: prefix })
    g.ensureNode(itemNodeId, { name, filePath: context.graphContext.filePath })
    const edgeKey = `${prefix}:${rule.itemType}:${itemNodeId}`
    g.ensureEdge(edgeKey, prefix, itemNodeId, { yaml: rule.itemType, name: rule.itemType, kind: "composition" })
    context = { ...context, graphContext: { ...context.graphContext, parentNodeId: itemNodeId } }
  }

  const properties = importPropertiesFromYAML({
    context,
    yaml,
    metadataRule: rule,
    source,
    name,
  })

  if (properties == undefined) {
    return undefined
  }

  return {
    ...properties,
    itemType: rule.itemType,
  } as ToMetadata<Rule["itemType"]>
}
