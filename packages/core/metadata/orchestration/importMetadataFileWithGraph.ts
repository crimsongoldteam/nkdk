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

  const importContext: ConfigurationContext = {
    ...context,
    graph,
    graphContext: { filePath, currentYamlMap: yamlMap },
  }

  if (kind === "catalog") {
    const model = importMetadataCatalogFromYAML(importContext, parsed.data, name)
    if (!model) return undefined
    buildGraphFromModel({
      model: model as unknown as Record<string, unknown>,
      yamlMap,
      rule: MetadataCatalogRules,
      graph,
      parentNodeId: `${MetadataCatalogRules.itemTypePrefix}.${name}`,
      filePath,
    })
    return { model, parsed }
  }

  if (kind === "document") {
    const model = importMetadataDocumentFromYAML(importContext, parsed.data, name)
    if (!model) return undefined
    buildGraphFromModel({
      model: model as unknown as Record<string, unknown>,
      yamlMap,
      rule: MetadataDocumentRules,
      graph,
      parentNodeId: `${MetadataDocumentRules.itemTypePrefix}.${name}`,
      filePath,
    })
    return { model, parsed }
  }

  if (kind === "enumeration") {
    const model = importMetadataEnumerationFromYAML(importContext, parsed.data, name)
    if (!model) return undefined
    buildGraphFromModel({
      model: model as unknown as Record<string, unknown>,
      yamlMap,
      rule: MetadataEnumerationRules,
      graph,
      parentNodeId: `${MetadataEnumerationRules.itemTypePrefix}.${name}`,
      filePath,
    })
    return { model, parsed }
  }

  throw new Error(`importMetadataFileWithGraph: неизвестный kind "${kind}"`)
}
