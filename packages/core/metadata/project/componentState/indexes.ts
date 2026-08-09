import { projectXmlExportAssignment } from "../../resourceTopology/core/xmlExportProjection"
import type { ProjectStateReadSession } from "../../projectState"
import type { ComponentHashState, ComponentIndexes, ComponentProjectStructure } from "./types"

export async function readComponentIndexes(params: {
  readonly structure: ComponentProjectStructure
  readonly hashes: ComponentHashState
  readonly projectStateReadSession: Pick<ProjectStateReadSession, "readComponentTargetPage">
}): Promise<ComponentIndexes> {
  const logicalAddresses = params.structure.resources
    .filter(({ kind }) => kind === "content")
    .map((resource) => ({
      logicalAddress: projectXmlExportAssignment(params.structure.topology, resource).logicalAddress,
      sourceProjectPath: resource.projectPath,
    }))
  let cursor: string | undefined
  do {
    const page = params.projectStateReadSession.readComponentTargetPage({
      componentPath: params.structure.componentPath,
      ...(cursor === undefined ? {} : { cursor }),
    })
    logicalAddresses.push(...page.entries.map((entry) => ({
      ...entry,
      sourceProjectPath: componentRelativePath(params.structure.componentPath, entry.sourceProjectPath),
    })))
    cursor = page.nextCursor
  } while (cursor !== undefined)

  return {
    componentPath: params.structure.componentPath,
    sourceProjectFiles: params.hashes.projectFiles,
    logicalAddresses: uniqueLogicalAddresses(logicalAddresses),
  }
}

function componentRelativePath(componentPath: string, rootProjectPath: string): string {
  const prefix = `${componentPath}/`
  if (!rootProjectPath.startsWith(prefix)) {
    throw new Error(`Адрес ProjectState относится к другому компоненту: ${rootProjectPath}`)
  }
  return rootProjectPath.slice(prefix.length)
}

function uniqueLogicalAddresses<T extends { logicalAddress: string }>(entries: readonly T[]): T[] {
  const result = new Map<string, T>()
  for (const entry of entries) {
    if (!result.has(entry.logicalAddress)) result.set(entry.logicalAddress, entry)
  }
  return [...result.values()]
}
