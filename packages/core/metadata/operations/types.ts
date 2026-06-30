import type { Diagnostic } from "~/metadata/validation/types"

export type MetadataOperationTarget =
  | MetadataObjectOperationTarget
  | MetadataNamedChildOperationTarget
  | MetadataFileItemOperationTarget

export interface MetadataOperationOwnerTarget {
  itemTypePrefix: string
  name: string
}

export interface MetadataObjectOperationTarget {
  kind: "object"
  itemTypePrefix: string
  name: string
}

export type MetadataNamedChildKind =
  | "attribute"
  | "tabularSection"
  | "dimension"
  | "resource"
  | "addressingAttribute"
  | "command"

export interface MetadataNamedChildOperationTarget {
  kind: MetadataNamedChildKind
  owner: MetadataOperationOwnerTarget
  parent?: {
    kind: "tabularSection"
    name: string
  }
  name: string
}

export type MetadataFileItemRole = "form" | "template" | "command"

export interface MetadataFileItemOperationTarget {
  kind: "fileItem"
  owner: MetadataOperationOwnerTarget
  role: MetadataFileItemRole
  name: string
}

export type MetadataOperationMode = "plan" | "applied"

export interface MetadataOperationChangedXmlFile {
  path: string
  change: "added" | "changed" | "deleted"
}

export interface MetadataOperationReferenceChange {
  filePath: string
  yamlPath: readonly (string | number)[]
  from: string
  to: string
}

export interface MetadataOperationBlockedReference {
  filePath: string
  yamlPath: readonly (string | number)[]
  value: string
}

export interface MetadataOperationMigrationInfo {
  from: string
  to: string
  fileName?: string
}

export interface MetadataOperationSuccess {
  ok: true
  mode: MetadataOperationMode
  changedFiles: string[]
  rewrittenReferences: MetadataOperationReferenceChange[]
  createdMigration?: MetadataOperationMigrationInfo
  blockedReferences: []
}

export interface MetadataOperationValidationFailed {
  ok: false
  code: "validation_failed"
  message: string
  diagnostics: Diagnostic[]
}

export interface MetadataOperationFailure {
  ok: false
  code:
    | "target_not_found"
    | "invalid_name"
    | "name_conflict"
    | "references_found"
    | "unsupported_target"
    | "write_failed"
  message: string
  changedFiles: string[]
  rewrittenReferences: MetadataOperationReferenceChange[]
  blockedReferences: MetadataOperationBlockedReference[]
  failedStep?: string
  appliedFiles?: string[]
  pendingFiles?: string[]
}

export type MetadataOperationResult =
  | MetadataOperationSuccess
  | MetadataOperationValidationFailed
  | MetadataOperationFailure

export interface MigrationPlanItem {
  fileName: string
  from: string
  to: string
}

export interface MigrationChainError {
  fileName?: string
  code:
    | "invalid_migration_file_name"
    | "invalid_migration_file"
    | "invalid_applied_migrations_state"
    | "missing_source_path"
    | "name_conflict"
    | "noop_migration"
    | "duplicate_migration"
    | "same_reference_conflict"
    | "missing_incremental_sync_rule"
  message: string
  path?: string
  value?: string
  conflictingFileName?: string
}

export interface MigrationChainInvalidResult {
  ok: false
  code: "migration_chain_invalid"
  message: string
  migrationErrors: MigrationChainError[]
}
