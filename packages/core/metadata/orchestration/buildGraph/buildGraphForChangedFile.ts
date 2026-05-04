import type { ConfigurationContext } from "~/metadata/context/types"
import { importMetadataFileWithGraph } from "~/metadata/orchestration/importMetadataFileWithGraph"
import { GraphBuilder } from "./internal/GraphBuilder"
import { parseFilePath } from "./buildGraph"
import { walkGraphToFileData } from "./walkGraphToFileData"
import type { FileGraphData, ImportContext } from "./types"

export interface BuildGraphForChangedFileParams {
  projectPath: string
  filePath: string
  text: string
  context: ImportContext
  pairedText?: {
    filePath: string
    text: string
  }
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

  if (parsed.kind === "form") {
    await importMetadataFileWithGraph({
      filePath,
      sources: { yaml: text, nkdk: pairedText?.text },
      kind: "form",
      name: parsed.formName,
      graph,
      context: importContext,
      ownerNodeId: parsed.ownerNodeId,
      nkdkFilePath: pairedText?.filePath,
    })

    const files = walkGraphToFileData(graph)
    const stub = files.find((file) => file.filePath === "")
    const changedFile = files.find((file) => file.filePath === filePath)
    if (stub && changedFile) {
      changedFile.edges.push(...stub.edges)
    }
    return files.filter((file) => file.filePath !== "")
  } else {
    await importMetadataFileWithGraph({
      filePath,
      sources: { yaml: text },
      kind: parsed.kind,
      name: parsed.name,
      graph,
      context: importContext,
    })
  }

  return walkGraphToFileData(graph).filter((file) => file.filePath !== "")
}
