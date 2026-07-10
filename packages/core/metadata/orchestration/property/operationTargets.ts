import type { MetadataFileItemRole, MetadataNamedChildKind } from "../../operations/types"

export type PropertyOperationTargetDeclaration =
  | NamedCollectionOperationTargetDeclaration
  | FileItemCollectionOperationTargetDeclaration

export interface NamedCollectionOperationTargetDeclaration {
  kind: "namedCollectionTarget"
  targetKind: MetadataNamedChildKind
  migrationSegment: string
  requiresMigration: boolean
}

export interface FileItemCollectionOperationTargetDeclaration {
  kind: "fileItemCollectionTarget"
  role: MetadataFileItemRole
  migrationSegment: string
  folderName: string
  yamlFileName: string
  requiresMigration: false
}

export function namedCollectionTarget(params: {
  kind: MetadataNamedChildKind
  migrationSegment: string
  requiresMigration: boolean
}): NamedCollectionOperationTargetDeclaration {
  return {
    kind: "namedCollectionTarget",
    targetKind: params.kind,
    migrationSegment: params.migrationSegment,
    requiresMigration: params.requiresMigration,
  }
}

export function fileItemCollectionTarget(params: {
  role: MetadataFileItemRole
  migrationSegment: string
  folderName: string
  yamlFileName: string
}): FileItemCollectionOperationTargetDeclaration {
  return {
    kind: "fileItemCollectionTarget",
    role: params.role,
    migrationSegment: params.migrationSegment,
    folderName: params.folderName,
    yamlFileName: params.yamlFileName,
    requiresMigration: false,
  }
}
