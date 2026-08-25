import type { MetadataXmlPrepareComposition } from "../resourceTopology/adapters/capabilities"
import type { ImportControlCompositionEntry } from "../workerPool/importContracts"
import { fileBackedMemberPath } from "../resourceTopology/core/fileBackedMemberPath"

export function importControlComposition(
  assignments: readonly ImportControlCompositionEntry[],
): MetadataXmlPrepareComposition {
  const rootLogicalAddress = assignments.find(({ assignmentRole }) => assignmentRole === "configuration")?.logicalAddress
  return {
    children(ownerLogicalAddress) {
      const assignmentChildren = assignments.flatMap((assignment) => {
        const owner = assignment.ownerLogicalAddress
          ?? (assignment.assignmentRole === "configuration" ? undefined : rootLogicalAddress)
        return owner === ownerLogicalAddress ? [assignment] : []
      })
      const fileMembers = new Map<string, ImportControlCompositionEntry>()
      for (const assignment of assignments) {
        if (assignment.logicalAddress !== ownerLogicalAddress) continue
        for (const externalProjectPath of assignment.externalProjectPaths ?? []) {
          const member = fileBackedMemberPath(assignment.sourceProjectPath, externalProjectPath)
          if (member === undefined) continue
          fileMembers.set(member.projectPath, {
            sourceProjectPath: member.projectPath,
            itemType: "",
            itemName: member.itemName,
            logicalAddress: `${ownerLogicalAddress}.__external__.${member.collectionName}.${member.itemName}`,
            assignmentRole: "fileItem",
            ownerLogicalAddress,
          })
        }
      }
      return [...assignmentChildren, ...fileMembers.values()]
    },
  }
}
