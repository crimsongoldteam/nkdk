import type { ConfigurationContextFromXML } from "../context/types"
import type { SharedValidationSnapshot } from "../validation/sharedValidationSnapshot"
import type { ValidationOwnerFacts } from "../validation/dataPath/ownerFacts"

export type ImportAssignmentRole = "configuration" | "properties" | "fileItem"

export interface ImportXmlInput {
  role: "metadata" | "body" | "property"
  sourcePath: string
}

export interface ImportAssignment {
  id: string
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
      context: ConfigurationContextFromXML
      outputDir: string
    }
  | { kind: "firstPass"; assignments: ImportAssignment[] }
  | { kind: "secondPass"; sharedMetadata: SharedValidationSnapshot }
  | { kind: "dispose" }

export interface ImportFirstPassResult {
  kind: "firstPassResult"
  ownerFacts: ValidationOwnerFacts[]
  diagnostics: ImportDiagnostic[]
  fragmentBuffer: ArrayBuffer
}

export interface ImportSecondPassResult {
  kind: "secondPassResult"
  diagnostics: ImportDiagnostic[]
  warnings: ImportDiagnostic[]
  files: ImportResultFile[]
}

export type ImportWorkerCommandResult = ImportFirstPassResult | ImportSecondPassResult | undefined
