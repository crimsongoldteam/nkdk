import { projectXmlExportAssignment } from "../../resourceTopology/core/xmlExportProjection"
import type { ProjectStateReadSession } from "../../projectState"
import type { ComponentHashState, ComponentIndexes, ComponentProjectStructure } from "./types"
import { collectComponentLogicalAddresses } from "./logicalAddresses"

export async function readComponentIndexes(params: {
  readonly structure: ComponentProjectStructure
  readonly hashes: ComponentHashState
  readonly projectStateReadSession: Pick<ProjectStateReadSession, "readComponentTargetPage">
}): Promise<ComponentIndexes> {
  const logicalAddresses = collectComponentLogicalAddresses({
    componentPath: params.structure.componentPath,
    known: params.structure.resources
      .filter(({ kind }) => kind === "content")
      .map((resource) => ({
        logicalAddress: projectXmlExportAssignment(params.structure.topology, resource).logicalAddress,
        sourceProjectPath: resource.projectPath,
      })),
    projectStateReadSession: params.projectStateReadSession,
  })

  return {
    componentPath: params.structure.componentPath,
    sourceProjectFiles: params.hashes.projectFiles,
    logicalAddresses,
  }
}
