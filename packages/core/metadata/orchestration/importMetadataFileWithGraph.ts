import { isMap } from "yaml"
import { importMetadataCatalogFromYAML } from "~/metadata/appliedObjects/metadataCatalog/fromYAML"
import { MetadataCatalogRules } from "~/metadata/appliedObjects/metadataCatalog/rules"
import type { MetadataCatalog } from "~/metadata/appliedObjects/metadataCatalog/types"
import { importMetadataDocumentFromYAML } from "~/metadata/appliedObjects/metadataDocument/fromYAML"
import { MetadataDocumentRules } from "~/metadata/appliedObjects/metadataDocument/rules"
import type { MetadataDocument } from "~/metadata/appliedObjects/metadataDocument/types"
import { importMetadataEnumerationFromYAML } from "~/metadata/appliedObjects/metadataEnumeration/fromYAML"
import { MetadataEnumerationRules } from "~/metadata/appliedObjects/metadataEnumeration/rules"
import type { MetadataEnumeration } from "~/metadata/appliedObjects/metadataEnumeration/types"
import type { ConfigurationContext } from "~/metadata/context/types"
import type { MetadataGraph } from "~/metadata/relations/MetadataGraph"
import type { MetadataKind } from "~/metadata/validation/types"
import { parseMetadataYaml } from "~/yaml/parseMetadataYaml"
import type { ParsedYaml } from "~/yaml/parseMetadataYaml"
import { buildGraphFromModel } from "./buildGraphFromModel"

export interface ImportMetadataFileResult {
  model: MetadataCatalog | MetadataDocument | MetadataEnumeration
  parsed: ParsedYaml
}

function ensureRootNode(
  graph: MetadataGraph,
  prefix: string,
  itemType: string,
  name: string,
  filePath: string
): string {
  const itemNodeId = `${prefix}.${name}`
  graph.ensureNode(prefix, { name: prefix })
  graph.ensureNode(itemNodeId, { name, filePath })
  const edgeKey = `${prefix}:${itemType}:${itemNodeId}`
  graph.ensureEdge(edgeKey, prefix, itemNodeId, { yaml: itemType, kind: itemType })
  return itemNodeId
}

/**
 * Общий хелпер «прочитанный файл → модель + граф».
 * Инкапсулирует kind-диспетчер: parseMetadataYaml → importXxxFromYAML → buildGraphFromModel.
 * Бросает, если kind неизвестен.
 */
export function importMetadataFileWithGraph(params: {
  filePath: string
  text: string
  kind: MetadataKind
  name: string
  graph: MetadataGraph
  context: ConfigurationContext
}): ImportMetadataFileResult | undefined {
  const { filePath, text, kind, name, graph, context } = params

  const parsed = parseMetadataYaml(text)
  const yamlMap = isMap(parsed.doc.contents) ? parsed.doc.contents : undefined

  const importContext: ConfigurationContext = { ...context, graph }

  if (kind === "catalog") {
    const itemNodeId = ensureRootNode(
      graph,
      MetadataCatalogRules.itemTypePrefix,
      MetadataCatalogRules.itemType,
      name,
      filePath
    )
    const model = importMetadataCatalogFromYAML(importContext, parsed.data, name)
    if (!model) return undefined
    graph.setNodeAttribute(itemNodeId, "item", model)
    graph.updateNodeFilePath(itemNodeId, filePath)
    buildGraphFromModel({
      model: model as unknown as Record<string, unknown>,
      yamlMap,
      rule: MetadataCatalogRules,
      graph,
      parentNodeId: itemNodeId,
      filePath,
    })
    return { model, parsed }
  }

  if (kind === "document") {
    const itemNodeId = ensureRootNode(
      graph,
      MetadataDocumentRules.itemTypePrefix,
      MetadataDocumentRules.itemType,
      name,
      filePath
    )
    const model = importMetadataDocumentFromYAML(importContext, parsed.data, name)
    if (!model) return undefined
    graph.setNodeAttribute(itemNodeId, "item", model)
    graph.updateNodeFilePath(itemNodeId, filePath)
    buildGraphFromModel({
      model: model as unknown as Record<string, unknown>,
      yamlMap,
      rule: MetadataDocumentRules,
      graph,
      parentNodeId: itemNodeId,
      filePath,
    })
    return { model, parsed }
  }

  if (kind === "enumeration") {
    const itemNodeId = ensureRootNode(
      graph,
      MetadataEnumerationRules.itemTypePrefix,
      MetadataEnumerationRules.itemType,
      name,
      filePath
    )
    const model = importMetadataEnumerationFromYAML(importContext, parsed.data, name)
    if (!model) return undefined
    graph.setNodeAttribute(itemNodeId, "item", model)
    graph.updateNodeFilePath(itemNodeId, filePath)
    buildGraphFromModel({
      model: model as unknown as Record<string, unknown>,
      yamlMap,
      rule: MetadataEnumerationRules,
      graph,
      parentNodeId: itemNodeId,
      filePath,
    })
    return { model, parsed }
  }

  throw new Error(`importMetadataFileWithGraph: неизвестный kind "${kind}"`)
}
