export type Direction = "fromXML" | "toYAML" | "fromYAML" | "toXML" | "standalone"

export type MigrationStatus = "pending" | "migrated" | "obsolete-internal"

export interface DeletedTestSource {
  deletingCommit: string
  parentCommit: string
  path: string
  sourceText: string
}

export interface DeletedScenario {
  id: string
  deletingCommit: string
  parentCommit: string
  sourcePath: string
  direction: Direction
  oldTitle: string
  declarationText: string
  fixtures: string[]
  line: number
}

export interface MigrationRow extends DeletedScenario {
  behavior: string
  targetPath: string
  targetTitle: string
  status: MigrationStatus
  justification?: string
}

export interface AuditOptions {
  repositoryRoot: string
  expectedScenarios: DeletedScenario[]
  requireComplete: boolean
}

export interface AuditError {
  id?: string
  message: string
}
