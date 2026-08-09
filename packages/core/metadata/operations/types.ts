import type { Diagnostic } from "../validation/types"
import type { ProjectStateService } from "../projectState/service"

export type {
  MetadataFileItemRole,
  MetadataNamedChildKind,
} from "../orchestration/property/operationTargets"

export interface MetadataOperationDiagnostic extends Diagnostic {
  code?: string
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
  diagnostics: MetadataOperationDiagnostic[]
}

export interface MetadataOperationValidationFailed {
  ok: false
  code: "validation_failed"
  message: string
  diagnostics: Diagnostic[]
}

export interface RenameMetadataItemParams {
  projectDir: string
  componentPath?: string
  path: string
  newName: string
  allowWrite?: boolean
  ignoreValidationErrors?: boolean
  projectState: ProjectStateService
  now?: Date
}

export interface FindMetadataReferencesParams {
  projectDir: string
  componentPath?: string
  path: string
  ignoreValidationErrors?: boolean
  projectState: ProjectStateService
}

export interface MetadataOperationFailure {
  ok: false
  code:
    | "target_not_found"
    | "invalid_path"
    | "invalid_name"
    | "name_conflict"
    | "references_found"
    | "unsupported_target"
    | "rule_contract_violation"
    | "write_failed"
  message: string
  changedFiles: string[]
  rewrittenReferences: MetadataOperationReferenceChange[]
  blockedReferences: MetadataOperationBlockedReference[]
  failedStep?: string
  appliedFiles?: string[]
  pendingFiles?: string[]
  diagnostics: MetadataOperationDiagnostic[]
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
