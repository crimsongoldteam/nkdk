import { importRegisteredMetadataSourceWithGraph } from "~/metadata/orchestration/graphImport/importRegisteredMetadataSourceWithGraph"
import { getGraphImportRegistration } from "~/metadata/orchestration/graphImport/registry"
import { parseFilePath } from "./buildGraph"
import { GraphBuilder } from "./internal/GraphBuilder"
import type { FileGraphData, ImportContext } from "./types"
import { walkGraphToFileData } from "./walkGraphToFileData"

export interface BuildGraphForChangedFileParams {
  projectPath: string
  filePath: string
  text: string
  context: ImportContext
}

export async function buildGraphForChangedFile(
  params: BuildGraphForChangedFileParams,
): Promise<FileGraphData[]> {
  const { filePath, text, context } = params
  void params.projectPath

  const parsed = parseFilePath(filePath)
  if (!parsed) return []

  const graph = new GraphBuilder()

  await importRegisteredMetadataSourceWithGraph({
    filePath,
    sources: { yaml: text },
    kind: parsed.kind,
    name: parsed.name,
    pathParams: parsed.pathParams,
    graph,
    context,
  })

  const files = walkGraphToFileData(graph)
  const registration = getGraphImportRegistration(parsed.kind)
  if (registration?.includeStubEdgesInChangedFile) {
    const stub = files.find((file) => file.filePath === "")
    const changedFile = files.find((file) => file.filePath === filePath)
    if (stub && changedFile) {
      changedFile.edges.push(...stub.edges)
    }
  }
  return files.filter((file) => file.filePath !== "")
}
