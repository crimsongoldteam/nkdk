import type { ConfigurationContext } from "~/metadata/context/types"
import { importRegisteredMetadataSourceWithGraph } from "~/metadata/orchestration/graphImport/importRegisteredMetadataSourceWithGraph"
import { getGraphImportRegistration } from "~/metadata/orchestration/graphImport/registry"
import { parseFilePath } from "./buildGraph"
import { GraphBuilder } from "./internal/GraphBuilder"
import type { FileGraphData, ImportContext, ProjectGraphSource } from "./types"
import { walkGraphToFileData } from "./walkGraphToFileData"

export interface BuildGraphForChangedFileParams {
  projectPath: string
  filePath: string
  text: string
  context: ImportContext
  pairedText?: ProjectGraphSource["pairedText"]
}

export async function buildGraphForChangedFile(
  params: BuildGraphForChangedFileParams,
): Promise<FileGraphData[]> {
  const { filePath, text, context, pairedText } = params
  void params.projectPath

  const parsed = parseFilePath(filePath)
  if (!parsed) return []

  const graph = new GraphBuilder()
  const importContext: ConfigurationContext = context as ConfigurationContext

  await importRegisteredMetadataSourceWithGraph({
    filePath,
    sources: { yaml: text, paired: pairedText },
    kind: parsed.kind,
    name: parsed.name,
    pathParams: parsed.pathParams,
    graph,
    context: importContext,
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
