import { projectXmlExportAssignment } from "../../resourceTopology/xmlExportProjection"
import type { ComponentHashState, ComponentIndexes, ComponentProjectStructure } from "./types"

export async function readComponentIndexes(params: {
  readonly structure: ComponentProjectStructure
  readonly hashes: ComponentHashState
}): Promise<ComponentIndexes> {
  const logicalAddresses = params.structure.resources
    .filter(({ kind }) => kind === "content")
    .map((resource) => ({
      logicalAddress: projectXmlExportAssignment(params.structure.topology, resource).logicalAddress,
      sourceProjectPath: resource.projectPath,
    }))

  return {
    componentPath: params.structure.componentPath,
    sourceProjectFiles: params.hashes.projectFiles,
    logicalAddresses: uniqueLogicalAddresses(logicalAddresses),
  }
}

function uniqueLogicalAddresses<T extends { logicalAddress: string }>(entries: readonly T[]): T[] {
  const result = new Map<string, T>()
  for (const entry of entries) {
    if (!result.has(entry.logicalAddress)) result.set(entry.logicalAddress, entry)
  }
  return [...result.values()]
}
