import type { ImportAssignment, ImportAssignmentRole, ImportExternalFile, ImportXmlInput } from "./types"
import { childUid, configurationUid, metadataItemUid } from "../configurationIndex/logicalAddress"

export interface ImportAssignmentGroup {
  definition: {
    role: ImportAssignmentRole
    itemType: string
    logicalAddressSegment?: string
  }
  values: Record<string, string>
  targetProjectPath: string
  xmlFiles: ImportXmlInput[]
  externalFiles: ImportExternalFile[]
}

interface AssignmentBuildContext {
  directoryToGroup: ReadonlyMap<string, ImportAssignmentGroup>
  assignmentByGroup: Map<ImportAssignmentGroup, ImportAssignment>
}

export function createImportAssignments(groups: readonly ImportAssignmentGroup[]): ImportAssignment[] {
  const sortedGroups = [...groups].sort((left, right) => compareUtf8(left.targetProjectPath, right.targetProjectPath))
  const context: AssignmentBuildContext = {
    directoryToGroup: buildDirectoryIndex(sortedGroups),
    assignmentByGroup: new Map(),
  }
  return sortedGroups.map((group) => createAssignment(group, context))
}

function buildDirectoryIndex(groups: readonly ImportAssignmentGroup[]): ReadonlyMap<string, ImportAssignmentGroup> {
  const directoryToGroup = new Map<string, ImportAssignmentGroup>()
  for (const group of groups) {
    if (group.definition.role === "configuration") continue
    directoryToGroup.set(projectDirectory(group.targetProjectPath), group)
  }
  return directoryToGroup
}

function createAssignment(group: ImportAssignmentGroup, context: AssignmentBuildContext): ImportAssignment {
  const existing = context.assignmentByGroup.get(group)
  if (existing !== undefined) return existing

  const itemName = assignmentItemName(group.targetProjectPath)
  const ownerGroup = findOwnerGroup(group, context)
  const owner = ownerGroup === undefined ? undefined : assignmentIdentity(ownerGroup, context)
  const logicalAddressSegment = group.definition.logicalAddressSegment ?? group.definition.itemType
  const logicalAddress =
    group.definition.role === "configuration"
      ? configurationUid()
      : group.definition.role === "properties"
        ? metadataItemUid(group.targetProjectPath.split("/")[0]!, itemName)
        : childUid(owner?.logicalAddress ?? group.definition.itemType, logicalAddressSegment, itemName)
  const assignment = {
    id: group.targetProjectPath,
    role: group.definition.role,
    targetProjectPath: group.targetProjectPath,
    itemType: group.definition.itemType,
    itemName,
    logicalAddress,
    owner,
    xmlFiles: [...group.xmlFiles].sort((left, right) => compareUtf8(left.sourcePath, right.sourcePath)),
    externalFiles: [...group.externalFiles].sort((left, right) =>
      compareUtf8(left.targetProjectPath, right.targetProjectPath)
    ),
  } satisfies ImportAssignment
  context.assignmentByGroup.set(group, assignment)
  return assignment
}

function assignmentIdentity(
  group: ImportAssignmentGroup,
  context: AssignmentBuildContext
): { itemType: string; name: string; logicalAddress: string } {
  const assignment = createAssignment(group, context)
  return { itemType: assignment.itemType, name: assignment.itemName, logicalAddress: assignment.logicalAddress }
}

function findOwnerGroup(
  group: ImportAssignmentGroup,
  context: AssignmentBuildContext
): ImportAssignmentGroup | undefined {
  if (group.definition.role !== "fileItem") return undefined
  let directory = projectParentDirectory(projectDirectory(group.targetProjectPath))
  while (directory !== undefined) {
    const owner = context.directoryToGroup.get(directory)
    if (owner !== undefined) return owner
    directory = projectParentDirectory(directory)
  }
  return undefined
}

function assignmentItemName(targetProjectPath: string): string {
  const parts = targetProjectPath.split("/")
  return parts.length === 1 ? parts[0]!.replace(/\.[^.]+$/, "") : parts[parts.length - 2]!
}

function projectDirectory(projectPath: string): string {
  const separator = projectPath.lastIndexOf("/")
  return separator < 0 ? "" : projectPath.slice(0, separator)
}

function projectParentDirectory(directory: string): string | undefined {
  if (directory === "") return undefined
  const separator = directory.lastIndexOf("/")
  return separator < 0 ? "" : directory.slice(0, separator)
}

function compareUtf8(left: string, right: string): number {
  return Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"))
}
