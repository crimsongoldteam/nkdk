export interface FileBackedMemberPath {
  readonly projectPath: string
  readonly collectionName: string
  readonly itemName: string
}

export function fileBackedMemberPath(
  ownerProjectPath: string,
  externalProjectPath: string,
): FileBackedMemberPath | undefined {
  const ownerParts = ownerProjectPath.split("/")
  ownerParts.pop()
  const externalParts = externalProjectPath.split("/")
  if (!ownerParts.every((part, index) => externalParts[index] === part)) return undefined
  const relative = externalParts.slice(ownerParts.length)
  const collectionName = relative[0]
  const itemName = relative[1]
  if (collectionName === undefined || itemName === undefined) return undefined
  return {
    projectPath: [...ownerParts, collectionName, itemName].join("/"),
    collectionName,
    itemName,
  }
}
