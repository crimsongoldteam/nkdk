import type { ConfigurationContext } from "~/metadata/context/types"
import type { GraphBuilder } from "~/metadata/orchestration/buildGraph/internal/GraphBuilder"
import type { PairedGraphSourceText } from "~/metadata/orchestration/buildGraph/types"
import type { MetadataItem, MetadataItemRule } from "~/metadata/orchestration/property/types"
import type { ParsedYaml } from "~/yaml/parseMetadataYaml"

export interface GraphImportSources {
  yaml: string
  paired?: PairedGraphSourceText
}

export interface GraphImportSourceMatch {
  kind: string
  name: string
  pathParams: Record<string, string>
  phase?: number
}

export interface GraphModelImportParams {
  filePath: string
  sources: GraphImportSources
  parsed: ParsedYaml
  name: string
  pathParams: Record<string, string>
  context: ConfigurationContext
  graph: GraphBuilder
}

export interface GraphModelImportResult {
  model: MetadataItem
  graphModel: Record<string, unknown>
  rule: MetadataItemRule
  extra?: Record<string, unknown>
}

export interface DeclareGraphRootParams {
  graph: GraphBuilder
  rule: MetadataItemRule
  model: MetadataItem
  graphModel: Record<string, unknown>
  name: string
  filePath: string
  pathParams: Record<string, string>
  context: ConfigurationContext
  parsed: ParsedYaml
}

export interface AfterBuildGraphParams extends DeclareGraphRootParams {
  sources: GraphImportSources
  parentNodeId: string
  extra?: Record<string, unknown>
}

export interface GraphImportRegistration {
  kind: string
  phase?: number
  includeStubEdgesInChangedFile?: true
  matchPath?: (filePath: string) => GraphImportSourceMatch | undefined
  importModel: (
    params: GraphModelImportParams,
  ) => GraphModelImportResult | undefined | Promise<GraphModelImportResult | undefined>
  declareRoot: (params: DeclareGraphRootParams) => string
  afterBuildGraph?: (params: AfterBuildGraphParams) => void | Promise<void>
}

const graphImportRegistry = new Map<string, GraphImportRegistration>()

export function registerGraphImport(registration: GraphImportRegistration): void {
  graphImportRegistry.set(registration.kind, registration)
}

export function getGraphImportRegistration(kind: string): GraphImportRegistration | undefined {
  return graphImportRegistry.get(kind)
}

export function clearGraphImportRegistry(): void {
  graphImportRegistry.clear()
}

export function resolveGraphImportSource(filePath: string): GraphImportSourceMatch | undefined {
  for (const registration of graphImportRegistry.values()) {
    const match = registration.matchPath?.(filePath)
    if (!match) continue
    return {
      ...match,
      phase: match.phase ?? registration.phase ?? 0,
    }
  }
  return undefined
}

export function toGraphModel(model: MetadataItem): Record<string, unknown> {
  return Object.fromEntries(Object.entries(model))
}
