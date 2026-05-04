import { isMap } from "yaml"
import { getKindByYaml } from "~/metadata/orchestration/buildGraph/internal/edgeKinds"
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
import type { GraphBuilder } from "~/metadata/orchestration/buildGraph/internal/GraphBuilder"
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
  graph: GraphBuilder,
  rule: RuleWithTerminals,
  itemNodeId: string,
  ownerName: string,
  filePath: string,
): void {
  if (!rule.graphTerminals?.length) return
  const ownerType = rule.itemTypePrefix ?? ""
  for (const terminalName of rule.graphTerminals) {
    const terminalId = `${itemNodeId}.${terminalName}`
    graph.ensureNode(terminalId, { name: terminalName })
    graph.addFilePath(terminalId, filePath)
    graph.setItem(terminalId, { itemType: "EmptyRef", ownerType, ownerName })
    const edgeKind = getKindByYaml(terminalName) ?? terminalName
    graph.ensureEdge(itemNodeId, terminalId, edgeKind, { yaml: terminalName })
  }
}

export interface ImportMetadataFileResult {
  model: MetadataCatalog | MetadataDocument | MetadataEnumeration
  parsed: ParsedYaml
}

function ensureRootNode(
  graph: GraphBuilder,
  prefix: string,
  itemType: string,
  name: string,
  filePath: string
): string {
  const itemNodeId = `${prefix}.${name}`
  graph.ensureNode(prefix, { name: prefix })
  graph.ensureNode(itemNodeId, { name })
  graph.addFilePath(itemNodeId, filePath)
  const edgeKind = getKindByYaml(itemType) ?? itemType
  graph.ensureEdge(prefix, itemNodeId, edgeKind, { yaml: itemType })
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
  graph: GraphBuilder
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
    graph.ensureNode(formNodeId, { name })
    graph.addFilePath(formNodeId, filePath)
    if (nkdkFilePath) graph.addFilePath(formNodeId, nkdkFilePath)
    graph.setItem(formNodeId, { itemType: "ClientApplicationForm", name })

    // Owning-ребро «Форма» от владельца к форме
    graph.ensureEdge(ownerNodeId, formNodeId, "FORM", { yaml: "Форма" })

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
        lineCounter: parsed.lineCounter,
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

  graph.setItem(itemNodeId, model)
  graph.addFilePath(itemNodeId, filePath)
  materializeGraphTerminals(graph, entry.rule, itemNodeId, name, filePath)
  buildGraphFromModel({
    model: model as unknown as Record<string, unknown>,
    yamlMap,
    lineCounter: parsed.lineCounter,
    rule: entry.rule as never,
    graph,
    parentNodeId: itemNodeId,
    filePath,
  })
  return { model, parsed }
}
