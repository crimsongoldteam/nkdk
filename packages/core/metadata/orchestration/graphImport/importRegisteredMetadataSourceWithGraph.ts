import { isMap } from "yaml"
import type { ConfigurationContext } from "~/metadata/context/types"
import type { GraphBuilder } from "~/metadata/orchestration/buildGraph/internal/GraphBuilder"
import { buildGraphFromModel } from "~/metadata/orchestration/buildGraphFromModel"
import { parseMetadataYaml } from "~/yaml/parseMetadataYaml"
import type { ParsedYaml } from "~/yaml/parseMetadataYaml"
import {
  getGraphImportRegistration,
  type GraphImportedMetadataModel,
  type GraphImportSources,
  type GraphModelImportResult,
} from "./registry"

export interface ImportRegisteredMetadataSourceResult {
  model: GraphImportedMetadataModel
  parsed: ParsedYaml
}

export async function importRegisteredMetadataSourceWithGraph(params: {
  filePath: string
  sources: GraphImportSources
  kind: string
  name: string
  graph: GraphBuilder
  context: ConfigurationContext
  pathParams?: Record<string, string>
}): Promise<ImportRegisteredMetadataSourceResult | undefined> {
  const { filePath, sources, kind, name, graph, context } = params
  const registration = getGraphImportRegistration(kind)
  if (!registration) {
    throw new Error(`importRegisteredMetadataSourceWithGraph: неизвестный kind "${kind}"`)
  }

  const parsed = parseMetadataYaml(sources.yaml)
  const yamlMap = isMap(parsed.doc.contents) ? parsed.doc.contents : undefined
  const pathParams = params.pathParams ?? {}
  const importContext: ConfigurationContext = { ...context, graph }

  const importResult = registration.importModel({
    filePath,
    sources,
    parsed,
    name,
    pathParams,
    context: importContext,
    graph,
  })
  const imported = isPromiseLike(importResult) ? await importResult : importResult
  if (!imported) return undefined

  const parentNodeId = declareRoot(registration, {
    graph,
    filePath,
    name,
    pathParams,
    context: importContext,
    parsed,
    imported,
  })

  graph.setItem(parentNodeId, imported.model)
  graph.addFilePath(parentNodeId, filePath)

  buildGraphFromModel({
    model: imported.graphModel,
    yamlMap,
    lineCounter: parsed.lineCounter,
    rule: imported.rule,
    graph,
    parentNodeId,
    filePath,
    extra: imported.extra,
  })

  const afterBuildResult = registration.afterBuildGraph?.({
    graph,
    rule: imported.rule,
    model: imported.model,
    graphModel: imported.graphModel,
    name,
    filePath,
    pathParams,
    context: importContext,
    parsed,
    sources,
    parentNodeId,
    extra: imported.extra,
  })
  if (isPromiseLike(afterBuildResult)) {
    await afterBuildResult
  }

  return { model: imported.model, parsed }
}

function isPromiseLike<T>(value: T | Promise<T> | undefined): value is Promise<T> {
  return value !== undefined && typeof (value as { then?: unknown }).then === "function"
}

function declareRoot(
  registration: NonNullable<ReturnType<typeof getGraphImportRegistration>>,
  params: {
    graph: GraphBuilder
    filePath: string
    name: string
    pathParams: Record<string, string>
    context: ConfigurationContext
    parsed: ParsedYaml
    imported: GraphModelImportResult
  },
): string {
  const { imported } = params
  return registration.declareRoot({
    graph: params.graph,
    rule: imported.rule,
    model: imported.model,
    graphModel: imported.graphModel,
    name: params.name,
    filePath: params.filePath,
    pathParams: params.pathParams,
    context: params.context,
    parsed: params.parsed,
  })
}
