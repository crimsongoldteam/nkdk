import type { ProjectResourceSource } from "../orchestration/property/fn"

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

export type XmlImportRoute =
  | {
      kind: "assignment"
      xmlPattern: string
      targetPattern: string
      role: ImportAssignmentRole
      itemType: string
      source: ProjectResourceSource
    }
  | {
      kind: "externalFile"
      xmlPattern: string
      targetPattern: string
      assignmentTargetPattern: string
      source: ProjectResourceSource
    }
  | {
      kind: "ignore"
      xmlPattern: string
      source: ProjectResourceSource
    }
