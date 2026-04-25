import { isMap } from "yaml"
import { importMetadataCatalogFromYAML } from "~/metadata/appliedObjects/metadataCatalog/fromYAML"
import { MetadataCatalogRules } from "~/metadata/appliedObjects/metadataCatalog/rules"
import type { MetadataCatalog } from "~/metadata/appliedObjects/metadataCatalog/types"
import { MetadataDocumentRules } from "~/metadata/appliedObjects/metadataDocument/rules"
import type { MetadataDocument } from "~/metadata/appliedObjects/metadataDocument/types"
import { importMetadataEnumerationFromYAML } from "~/metadata/appliedObjects/metadataEnumeration/fromYAML"
import { MetadataEnumerationRules } from "~/metadata/appliedObjects/metadataEnumeration/rules"
import type { MetadataEnumeration } from "~/metadata/appliedObjects/metadataEnumeration/types"
import type { ConfigurationContext } from "~/metadata/context/types"
import { ClientApplicationFormRules } from "~/metadata/forms/clientApplicationForm/rules"
import type { MetadataGraph } from "~/metadata/relations/MetadataGraph"
import type { MetadataKind } from "~/metadata/validation/types"
import { parseMetadataYaml } from "~/yaml/parseMetadataYaml"
import type { ParsedYaml } from "~/yaml/parseMetadataYaml"
import { buildGraphFromModel } from "./buildGraphFromModel"
import { importMetadataItemFromYAML } from "./metadataItem/fromYAML"

interface RuleWithTerminals {
  graphTerminals?: ReadonlyArray<string>
  itemTypePrefix?: string
}

function materializeGraphTerminals(
  graph: MetadataGraph,
  rule: RuleWithTerminals,
  itemNodeId: string,
  ownerName: string,
  filePath: string,
): void {
  if (!rule.graphTerminals?.length) return
  const ownerType = rule.itemTypePrefix ?? ""
  for (const terminalName of rule.graphTerminals) {
    const terminalId = `${itemNodeId}.${terminalName}`
    graph.promoteNode(terminalId, {
      name: terminalName,
      filePaths: [filePath],
      item: { itemType: "EmptyRef", ownerType, ownerName },
    })
    const edgeKey = `${itemNodeId}:${terminalName}:${terminalId}`
    graph.ensureEdge(edgeKey, itemNodeId, terminalId, { yaml: terminalName, kind: terminalName })
  }
}

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
  graph.ensureNode(itemNodeId, { name, filePaths: [filePath] })
  const edgeKey = `${prefix}:${itemType}:${itemNodeId}`
  graph.ensureEdge(edgeKey, prefix, itemNodeId, { yaml: itemType, kind: itemType })
  return itemNodeId
}

// ---- Реестр kind'ов для catalog/document/enumeration ----

interface MetadataKindEntry {
  rule: RuleWithTerminals & { itemTypePrefix: string; itemType: string }
  importFromYAML: (context: ConfigurationContext, yaml: unknown, name: string) => unknown
}

const _kindRegistry = new Map<MetadataKind, MetadataKindEntry>([
  [
    "catalog",
    {
      rule: MetadataCatalogRules,
      importFromYAML: (ctx, yaml, name) =>
        importMetadataCatalogFromYAML(ctx, yaml as never, name),
    },
  ],
  [
    "document",
    {
      rule: MetadataDocumentRules,
      importFromYAML: (ctx, yaml, name) =>
        importMetadataItemFromYAML({ context: ctx, yaml: yaml as never, rule: MetadataDocumentRules, name }),
    },
  ],
  [
    "enumeration",
    {
      rule: MetadataEnumerationRules,
      importFromYAML: (ctx, yaml, name) =>
        importMetadataEnumerationFromYAML(ctx, yaml as never, name),
    },
  ],
])

// ---- Публичный API ----

/**
 * Общий хелпер «прочитанный файл → модель + граф».
 * Инкапсулирует kind-диспетчер через реестр.
 * Для form — создаёт узел с двумя filePaths (yaml + nkdk) и owning-ребром «Форма».
 * Бросает, если kind неизвестен.
 */
export function importMetadataFileWithGraph(params: {
  /** Путь к yaml-файлу (основной файл). */
  filePath: string
  /** Путь к nkdk-файлу (только для form). */
  nkdkFilePath?: string
  /** Содержимое файлов. */
  sources: { yaml: string; nkdk?: string }
  kind: MetadataKind | "form"
  name: string
  graph: MetadataGraph
  context: ConfigurationContext
  /** NodeId владельца формы (требуется для kind === "form"). */
  ownerNodeId?: string
}): ImportMetadataFileResult | undefined {
  const { filePath, nkdkFilePath, sources, kind, name, graph, context } = params

  // ---- form: особый путь ----
  if (kind === "form") {
    const { ownerNodeId } = params
    if (!ownerNodeId) {
      throw new Error("importMetadataFileWithGraph: form kind требует ownerNodeId")
    }

    const formNodeId = `${ownerNodeId}.Форма.${name}`

    // Создаём владельца как stub, если он ещё не импортирован
    graph.ensureNode(ownerNodeId, { name: ownerNodeId.split(".").pop()! })

    // Форм-узел с обоими filePaths (yaml + nkdk, если есть)
    const formFilePaths: string[] = [filePath]
    if (nkdkFilePath) formFilePaths.push(nkdkFilePath)

    graph.promoteNode(formNodeId, {
      name,
      filePaths: formFilePaths,
      item: { itemType: "ClientApplicationForm", name },
    })

    // Owning-ребро «Форма» от владельца к форме
    const edgeKey = `${ownerNodeId}:Форма:${formNodeId}`
    graph.ensureEdge(edgeKey, ownerNodeId, formNodeId, { yaml: "Форма", kind: "Форма" })

    // Парсим YAML формы и строим граф реквизитов/параметров/команд
    const parsed = parseMetadataYaml(sources.yaml)
    const yamlMap = isMap(parsed.doc.contents) ? parsed.doc.contents : undefined
    const importContext: ConfigurationContext = { ...context, graph }

    const model = importMetadataItemFromYAML({
      context: importContext,
      yaml: parsed.data as never,
      rule: ClientApplicationFormRules as never,
    })

    if (model) {
      buildGraphFromModel({
        model: model as Record<string, unknown>,
        yamlMap,
        rule: ClientApplicationFormRules as never,
        graph,
        parentNodeId: formNodeId,
        filePath,
      })
    }

    return undefined
  }

  // ---- catalog / document / enumeration: через реестр ----
  const entry = _kindRegistry.get(kind as MetadataKind)
  if (!entry) {
    throw new Error(`importMetadataFileWithGraph: неизвестный kind "${kind}"`)
  }

  const parsed = parseMetadataYaml(sources.yaml)
  const yamlMap = isMap(parsed.doc.contents) ? parsed.doc.contents : undefined

  const importContext: ConfigurationContext = { ...context, graph }

  const itemNodeId = ensureRootNode(
    graph,
    entry.rule.itemTypePrefix,
    entry.rule.itemType,
    name,
    filePath
  )
  const model = entry.importFromYAML(importContext, parsed.data, name) as
    | MetadataCatalog
    | MetadataDocument
    | MetadataEnumeration
    | undefined
  if (!model) return undefined

  graph.setNodeAttribute(itemNodeId, "item", model)
  graph.updateNodeFilePath(itemNodeId, filePath)
  materializeGraphTerminals(graph, entry.rule, itemNodeId, name, filePath)
  buildGraphFromModel({
    model: model as unknown as Record<string, unknown>,
    yamlMap,
    rule: entry.rule as never,
    graph,
    parentNodeId: itemNodeId,
    filePath,
  })
  return { model, parsed }
}
