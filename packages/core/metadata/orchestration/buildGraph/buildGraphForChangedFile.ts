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

export function buildGraphForChangedFile(
  params: BuildGraphForChangedFileParams,
): FileGraphData[] {
  const { filePath, text, context, pairedText } = params
  void params.projectPath

  const parsed = parseFilePath(filePath)
  if (!parsed) return []

  const graph = new GraphBuilder()
  const importContext: ConfigurationContext = context as ConfigurationContext

  if (parsed.kind === "form") {
    importMetadataFileWithGraph({
      filePath,
      sources: { yaml: text, nkdk: pairedText?.text },
      kind: "form",
      name: parsed.formName,
      graph,
      context: importContext,
      ownerNodeId: parsed.ownerNodeId,
      nkdkFilePath: pairedText?.filePath,
    })
  } else {
    importMetadataFileWithGraph({
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
