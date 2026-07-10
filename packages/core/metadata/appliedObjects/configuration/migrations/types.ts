export const MIGRATIONS_DIR = "Миграции" as const
export const APPLIED_MIGRATIONS_FILE = ".nkdk-migrations.yaml" as const
export const DELETE_ACTION = "Удалить" as const
export const ADD_ACTION = "Добавить" as const

export type MigrationAction = string

export interface MigrationEntry {
  path: string
  value: MigrationAction
}

export interface AppliedMigrationsState {
  applied: string[]
}

export type StructuralKind = "object" | "attribute" | "tabularSection" | "dimension"

export interface StructuralNode {
  path: string
  kind: StructuralKind
  name: string
  referencePath?: string
}

export interface StructuralState {
  nodes: Map<string, StructuralNode>
}

export interface MigrationConflict {
  levelPath: string
  deleted: string[]
  added: string[]
}

export interface AppliedMigrationResult {
  state: StructuralState
  referencePathByCurrentPath: Map<string, string>
  appliedFileNames: string[]
  targetChecks: MigrationTargetCheck[]
}

export interface MigrationTargetCheck {
  path: string
  expected: "exists" | "absent"
}
