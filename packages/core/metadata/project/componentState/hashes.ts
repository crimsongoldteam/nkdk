import { hashConfigurationProjectFileList } from "../../configurationIndex"
import type { ComponentHashState, ComponentProjectStructure } from "./types"

export async function readComponentHashState(params: {
  readonly structure: ComponentProjectStructure
  readonly concurrency?: number
}): Promise<ComponentHashState> {
  return {
    componentPath: params.structure.componentPath,
    projectFiles: await hashConfigurationProjectFileList(
      params.structure.componentDir,
      params.structure.projectPaths,
      { concurrency: params.concurrency }
    ),
  }
}
