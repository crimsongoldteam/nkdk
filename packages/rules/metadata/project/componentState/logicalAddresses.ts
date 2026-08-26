import type { ProjectLogicalAddressEntry } from "../../projectDefinition/componentIndexFacts"
import type { ProjectStateReadSession } from "../../projectState"

export function collectComponentLogicalAddresses(params: {
  readonly componentPath: string
  readonly known: readonly ProjectLogicalAddressEntry[]
  readonly projectStateReadSession: Pick<ProjectStateReadSession, "readComponentTargetPage">
}): ProjectLogicalAddressEntry[] {
  const result = new Map(params.known.map((entry) => [entry.logicalAddress, entry]))
  let cursor: string | undefined
  do {
    const page = params.projectStateReadSession.readComponentTargetPage({
      componentPath: params.componentPath,
      ...(cursor === undefined ? {} : { cursor }),
    })
    for (const entry of page.entries) {
      const sourceProjectPath = componentRelativePath(params.componentPath, entry.sourceProjectPath)
      if (result.has(entry.logicalAddress)) continue
      result.set(entry.logicalAddress, {
        logicalAddress: entry.logicalAddress,
        sourceProjectPath,
      })
    }
    cursor = page.nextCursor
  } while (cursor !== undefined)

  return [...result.values()]
}

function componentRelativePath(componentPath: string, rootProjectPath: string): string {
  const prefix = `${componentPath}/`
  if (!rootProjectPath.startsWith(prefix)) {
    throw new Error(`Адрес ProjectState относится к другому компоненту: ${rootProjectPath}`)
  }
  return rootProjectPath.slice(prefix.length)
}
