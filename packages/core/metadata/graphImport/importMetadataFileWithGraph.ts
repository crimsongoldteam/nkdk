import type { ConfigurationContext } from "~/metadata/context/types"
import type { GraphBuilder } from "~/metadata/orchestration/buildGraph/internal/GraphBuilder"
import {
  importRegisteredMetadataSourceWithGraph,
  type ImportRegisteredMetadataSourceResult,
} from "~/metadata/orchestration/graphImport/importRegisteredMetadataSourceWithGraph"
import { ensureDefaultGraphImportsRegistered } from "./registerDefaultGraphImports"

export type ImportMetadataFileResult = ImportRegisteredMetadataSourceResult

export async function importMetadataFileWithGraph(params: {
  filePath: string
  sources: { yaml: string }
  kind: string
  name: string
  graph: GraphBuilder
  context: ConfigurationContext
  ownerNodeId?: string
}): Promise<ImportMetadataFileResult | undefined> {
  ensureDefaultGraphImportsRegistered()

  return importRegisteredMetadataSourceWithGraph({
    filePath: params.filePath,
    sources: {
      yaml: params.sources.yaml,
    },
    kind: params.kind,
    name: params.name,
    graph: params.graph,
    context: params.context,
    pathParams: params.ownerNodeId ? { ownerNodeId: params.ownerNodeId } : undefined,
  })
}
