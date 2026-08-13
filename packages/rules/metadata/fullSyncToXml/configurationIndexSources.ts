import type { ProjectLogicalAddressEntry } from "../projectDefinition/componentIndexFacts"
import type { FullXmlSyncAssignment, FullXmlSyncExecutionAssignment } from "./types"

export function withConfigurationIndexSources(params: {
  readonly assignment: FullXmlSyncAssignment
  readonly targetLogicalAddresses: readonly ProjectLogicalAddressEntry[]
  readonly baseLogicalAddresses?: readonly ProjectLogicalAddressEntry[]
}): FullXmlSyncExecutionAssignment {
  const targetProjectPaths = new Set<string>([params.assignment.sourceProjectPath])
  for (const entry of params.targetLogicalAddresses) {
    if (isAddressRelated(entry.logicalAddress, params.assignment.logicalAddress)) {
      targetProjectPaths.add(entry.sourceProjectPath)
    }
  }
  if (params.assignment.baseFormPaths?.savedProjectPath !== undefined) {
    targetProjectPaths.add(params.assignment.baseFormPaths.savedProjectPath)
  }

  const baseProjectPaths = new Set<string>()
  if (params.assignment.baseFormPaths?.baseProjectPath !== undefined) {
    baseProjectPaths.add(params.assignment.baseFormPaths.baseProjectPath)
  }
  for (const entry of params.baseLogicalAddresses ?? []) {
    if (isAddressRelated(entry.logicalAddress, params.assignment.logicalAddress)) {
      baseProjectPaths.add(entry.sourceProjectPath)
    }
  }
  return {
    ...params.assignment,
    configurationIndexSources: {
      targetProjectPaths: [...targetProjectPaths].sort(compareUtf8),
      baseProjectPaths: [...baseProjectPaths].sort(compareUtf8),
    },
  }
}

function isAddressRelated(candidate: string, assignment: string): boolean {
  return candidate === assignment
    || assignment.startsWith(`${candidate}.`)
    || candidate.startsWith(`${assignment}.`)
}

function compareUtf8(left: string, right: string): number {
  return Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"))
}
