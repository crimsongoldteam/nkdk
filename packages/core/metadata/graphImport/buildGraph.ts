import {
  buildGraph as buildRegisteredGraph,
  buildGraphForChangedFile as buildRegisteredGraphForChangedFile,
} from "~/metadata/orchestration/buildGraph"
import type {
  BuildGraphForChangedFileParams,
  FileGraphData,
  ImportContext,
  ProjectGraphInput,
} from "~/metadata/orchestration/buildGraph"
import { ensureDefaultGraphImportsRegistered } from "./registerDefaultGraphImports"

export async function buildGraph(
  projectFiles: ProjectGraphInput,
  context: ImportContext,
): Promise<FileGraphData[]> {
  ensureDefaultGraphImportsRegistered()
  return buildRegisteredGraph(projectFiles, context)
}

export async function buildGraphForChangedFile(
  params: BuildGraphForChangedFileParams,
): Promise<FileGraphData[]> {
  ensureDefaultGraphImportsRegistered()
  return buildRegisteredGraphForChangedFile(params)
}
