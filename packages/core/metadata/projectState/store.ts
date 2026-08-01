import type { Diagnostic } from "../validation/types"
import type {
  ProjectStateFileIdentity,
  ProjectStateFileUpdate,
  ProjectStateFileUpdateBatch,
} from "./fileUpdate"
import type {
  ProjectDependencyInputQuery,
  ProjectDependencyInputResult,
} from "./readSession"
import type { ProjectStateFileHashBatch, ProjectStateReadToken } from "./contracts"

export interface ProjectStateCompatibility {
  readonly formatVersion: number
  readonly coreVersion: string
}

export interface ProjectStateFileChange {
  readonly index: number
  readonly file: ProjectStateFileIdentity
}

export interface ProjectStateFileChanges {
  readonly changed: readonly ProjectStateFileChange[]
  readonly deleted: readonly ProjectStateFileIdentity[]
}

export interface ProjectDependencyBatchQuery {
  readonly requests: readonly ProjectDependencyInputQuery[]
}

export interface ProjectDependencyBatch {
  readonly results: readonly ProjectDependencyInputResult[]
}

export interface ProjectDependencyValidationRequest {
  readonly requestId: string
  readonly componentPath: string
  readonly projectPath: string
}

export interface ProjectDependencyValidationParams {
  readonly requests: readonly ProjectDependencyValidationRequest[]
}

export interface ProjectStateComponentProjection {
  readonly componentPath: string
  readonly updates: readonly ProjectStateFileUpdate[]
}

export interface ProjectStateStore {
  readCompatibility(): ProjectStateCompatibility | undefined
  compareFiles(current: ProjectStateFileHashBatch): ProjectStateFileChanges
  beginUpdate(): void
  replaceFiles(batch: ProjectStateFileUpdateBatch): void
  deleteFiles(projectPaths: readonly string[]): void
  readLocalDiagnostics(): readonly Diagnostic[]
  readDependencyCheckBatch(params: ProjectDependencyBatchQuery): ProjectDependencyBatch
  validateDependencies(params: ProjectDependencyValidationParams): readonly Diagnostic[]
  readComponentProjection(componentPath: string): ProjectStateComponentProjection
  createReadToken(): ProjectStateReadToken
  commitUpdate(): void
  rollbackUpdate(): void
  checkpoint(): Promise<void>
  close(): void
}
