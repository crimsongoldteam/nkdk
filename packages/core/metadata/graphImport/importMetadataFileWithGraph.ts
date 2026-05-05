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
  nkdkFilePath?: string
  sources: { yaml: string; nkdk?: string }
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
      paired: params.sources.nkdk
        ? {
            filePath: params.nkdkFilePath ?? "",
            text: params.sources.nkdk,
          }
        : undefined,
    },
    kind: params.kind,
    name: params.name,
    graph: params.graph,
    context: params.context,
    pathParams: params.ownerNodeId ? { ownerNodeId: params.ownerNodeId } : undefined,
  })
}
