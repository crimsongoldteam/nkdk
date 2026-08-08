import type { XmlImportConfigurationContext } from "../context/types"
import type { ProjectStateFragment } from "../projectState/binary/fragment"
import type { ProjectStateReadToken } from "../projectState/contracts"
import type { ConfigurationSnapshotFragment } from "../configurationIndex/types"
import type { MetadataWorkerBinaryResult } from "./binaryResult"

export type ImportAssignmentRole = "configuration" | "properties" | "fileItem"
export type ExternalFileTransfer = "copy" | "move"

export interface ImportXmlInput {
  role: "metadata" | "body" | "property"
  sourcePath: string
}

export interface ImportAssignment {
  id: string
  topologyNodeId?: string
  role: ImportAssignmentRole
  targetProjectPath: string
  itemType: string
  itemName: string
  logicalAddress: string
  owner: { itemType: string; name: string; logicalAddress: string } | undefined
  xmlFiles: readonly ImportXmlInput[]
  externalFiles: readonly ImportExternalFile[]
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
    }
  | { kind: "firstPass"; assignments: ImportAssignment[] }
  | { kind: "firstPassBatch"; assignments: ImportAssignment[] }
  | { kind: "finishFirstPass" }
  | { kind: "beginSecondPass"; readToken: ProjectStateReadToken }
  | { kind: "secondPass"; assignmentId: string }
  | { kind: "secondPassBatch"; assignmentIds: string[] }
  | { kind: "finishSecondPass" }
  | { kind: "endSecondPass" }
  | { kind: "dispose" }

export interface ImportFirstPassResult {
  kind: "firstPassResult"
  diagnostics: ImportDiagnostic[]
  files: ImportResultFile[]
  configurationFragments: ConfigurationSnapshotFragment[]
  stateFragment?: ProjectStateFragment
}

export interface ImportSecondPassResult {
  kind: "secondPassResult"
  diagnostics: ImportDiagnostic[]
  warnings: ImportDiagnostic[]
  files: ImportResultFile[]
  stateFragment?: ProjectStateFragment
}

export type ImportWorkerCommandResult = ImportFirstPassResult | ImportSecondPassResult | MetadataWorkerBinaryResult | undefined
