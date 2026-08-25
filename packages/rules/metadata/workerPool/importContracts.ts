import type { ValidationIssueTarget, XmlImportConfigurationContext } from "@nkdk/runtime"
import type { ProjectStateFragment } from "../projectState/binary/fragment"
import type { ProjectStateReadToken } from "../projectState/contracts"
import type { ConfigurationIndexBlockFragment } from "@nkdk/runtime"
import type { MetadataWorkerBinaryResult } from "./binaryResult"
import type { PreparedImportBinaryRecord } from "../importFromXml/binaryResult"
import type { ConfigurationIndexStoreDescriptor } from "@nkdk/runtime"
import type { PreparedImportStoreDescriptor } from "../projectState/preparedImportStore"

export type ImportAssignmentRole = "configuration" | "properties" | "fileItem"
export type ExternalFileTransfer = "copy" | "move"

export interface ImportXmlInput {
  role: "metadata" | "body" | "property"
  sourcePath: string
}

export interface ImportAssignment {
  id: string
  topologyAddress: ImportTopologyAddress
  role: ImportAssignmentRole
  targetProjectPath: string
  itemType: string
  itemName: string
  logicalAddress: string
  owner: { itemType: string; name: string; logicalAddress: string } | undefined
  xmlFiles: readonly ImportXmlInput[]
  externalFiles: readonly ImportExternalFile[]
}

export interface ImportControlCompositionEntry {
  readonly sourceProjectPath: string
  readonly itemType: string
  readonly itemName: string
  readonly logicalAddress: string
  readonly assignmentRole: ImportAssignmentRole
  readonly ownerLogicalAddress?: string
  readonly externalProjectPaths?: readonly string[]
}

export interface ImportIssueDecision {
  readonly kind: "invalid" | "important"
  readonly target: ValidationIssueTarget
  readonly issueCodes: readonly string[]
}

export interface ImportProjectIssueDecision {
  readonly targetProjectPath: string
  readonly decision: ImportIssueDecision
}

export function importControlCompositionEntry(
  assignment: ImportAssignment,
): ImportControlCompositionEntry {
  const ownerLogicalAddress = assignment.owner?.logicalAddress
  return {
    sourceProjectPath: assignment.targetProjectPath,
    itemType: assignment.itemType,
    itemName: assignment.itemName,
    logicalAddress: assignment.logicalAddress,
    assignmentRole: assignment.role,
    ...(assignment.externalFiles.length === 0
      ? {}
      : { externalProjectPaths: assignment.externalFiles.map(({ targetProjectPath }) => targetProjectPath) }),
    ...(ownerLogicalAddress === undefined ? {} : { ownerLogicalAddress }),
  }
}

export interface ImportTopologyAddress {
  nodeId: string
  values: Readonly<Record<string, string>>
}

export interface ImportExternalFile {
  sourcePath: string
  targetProjectPath: string
}

export interface ImportIgnoredFile {
  sourcePath: string
}

export interface ImportSnapshotFile {
  sourcePath: string
  capabilityId: string
  targetProjectPath: string
}

export interface ImportDiagnostic {
  severity: "error" | "warning"
  code: string
  message: string
  targetProjectPath: string
  sourcePath?: string
  value?: string
}

export interface ImportResultFile {
  sourceKind: "worker" | "xml"
  sourcePath: string
  targetProjectPath: string
}

export type ImportWorkerCommand =
  | {
      kind: "initialize"
      operationId: string
      workerIndex: number
      context: XmlImportConfigurationContext
      outputDir: string
      projectDir?: string
      componentPath?: string
      preparedStore?: PreparedImportStoreDescriptor
      configurationIndex?: ConfigurationIndexStoreDescriptor
    }
  | { kind: "firstPass"; assignments: ImportAssignment[] }
  | { kind: "firstPassBatch"; assignments: ImportAssignment[] }
  | { kind: "finishFirstPass" }
  | {
      kind: "beginSecondPass"
      readToken: ProjectStateReadToken
      composition?: readonly ImportControlCompositionEntry[]
    }
  | { kind: "secondPass"; assignmentId: string }
  | { kind: "secondPassBatch"; assignmentIds: string[] }
  | { kind: "finishSecondPass" }
  | { kind: "endSecondPass" }
  | {
      kind: "beginThirdPass"
      readToken: ProjectStateReadToken
      issueDecisions?: readonly ImportProjectIssueDecision[]
    }
  | { kind: "thirdPassBatch"; assignmentIds: string[] }
  | { kind: "finishThirdPass" }
  | { kind: "dispose" }

export interface ImportFirstPassResult {
  kind: "firstPassResult"
  diagnostics: ImportDiagnostic[]
  files: ImportResultFile[]
  configurationFragments: ConfigurationIndexBlockFragment[]
  stateFragment?: ProjectStateFragment
  preparedRecords: PreparedImportBinaryRecord[]
}

export interface ImportSecondPassResult {
  kind: "secondPassResult"
  diagnostics: ImportDiagnostic[]
  warnings: ImportDiagnostic[]
  files: ImportResultFile[]
  configurationFragments: ConfigurationIndexBlockFragment[]
  stateFragment?: ProjectStateFragment
}

export type ImportWorkerCommandResult = ImportFirstPassResult | ImportSecondPassResult | MetadataWorkerBinaryResult | undefined
