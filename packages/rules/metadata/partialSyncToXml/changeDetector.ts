import type { PartialXmlChanges, PartialXmlFileVersion } from "./types"

export function detectPartialXmlChanges(params: {
  readonly current: readonly PartialXmlFileVersion[]
  readonly previous: readonly PartialXmlFileVersion[]
}): PartialXmlChanges {
  const current = sortedUniqueVersions(params.current, "текущем")
  const previous = sortedUniqueVersions(params.previous, "предыдущем")
  const added: PartialXmlFileVersion[] = []
  const changed: { current: PartialXmlFileVersion; previous: PartialXmlFileVersion }[] = []
  const deleted: PartialXmlFileVersion[] = []
  let currentIndex = 0
  let previousIndex = 0

  while (currentIndex < current.length || previousIndex < previous.length) {
    const currentVersion = current[currentIndex]
    const previousVersion = previous[previousIndex]
    if (currentVersion === undefined) {
      deleted.push(previousVersion!)
      previousIndex += 1
      continue
    }
    if (previousVersion === undefined) {
      added.push(currentVersion)
      currentIndex += 1
      continue
    }

    const order = compareProjectPaths(currentVersion.projectPath, previousVersion.projectPath)
    if (order < 0) {
      added.push(currentVersion)
      currentIndex += 1
    } else if (order > 0) {
      deleted.push(previousVersion)
      previousIndex += 1
    } else {
      if (currentVersion.contentHash !== previousVersion.contentHash) {
        changed.push({ current: currentVersion, previous: previousVersion })
      }
      currentIndex += 1
      previousIndex += 1
    }
  }

  return { added, changed, deleted }
}

function sortedUniqueVersions(
  versions: readonly PartialXmlFileVersion[],
  setName: string,
): PartialXmlFileVersion[] {
  const sorted = [...versions]
  for (const version of sorted) assertNormalizedProjectPath(version.projectPath)
  sorted.sort((left, right) => compareProjectPaths(left.projectPath, right.projectPath))
  for (let index = 1; index < sorted.length; index += 1) {
    if (sorted[index - 1]!.projectPath === sorted[index]!.projectPath) {
      throw new Error(`Путь ${sorted[index]!.projectPath} повторяется в ${setName} наборе файлов`)
    }
  }
  return sorted
}

function assertNormalizedProjectPath(projectPath: string): void {
  const segments = projectPath.split("/")
  if (
    projectPath === "" ||
    projectPath.startsWith("/") ||
    projectPath.endsWith("/") ||
    projectPath.includes("\\") ||
    projectPath.includes("\0") ||
    segments.some((segment) => segment === "" || segment === "." || segment === "..")
  ) {
    throw new Error(`Путь должен быть нормализованным и относительным: ${JSON.stringify(projectPath)}`)
  }
}

function compareProjectPaths(left: string, right: string): number {
  return Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"))
}
