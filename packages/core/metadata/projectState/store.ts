import type { Diagnostic } from "../validation/types"
import type {
  ProjectStateFileIdentity,
  ProjectStateFileUpdate,
} from "./fileUpdate"
import type {
  ProjectDependencyInputQuery,
  ProjectDependencyInputResult,
} from "./readSession"
import type {
  ProjectStateFileBaseline,
  ProjectStateFileBaselinePathPage,
  ProjectStateFileHashBatch,
  ProjectStateReadToken,
} from "./contracts"
import type { ProjectStateFragment } from "./binary/fragment"
import type { DiagnosticBatchView } from "../diagnostics/binaryBatch"

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
  readonly hashBytes: Uint8Array
}

export interface ProjectStateStore {
  readFileBaseline(files: readonly ProjectStateFileIdentity[]): ProjectStateFileBaseline
  readFileBaselinePathPage(projectPaths: readonly string[]): ProjectStateFileBaselinePathPage
  compareFiles(current: ProjectStateFileHashBatch): ProjectStateFileChanges
  beginUpdate(): void
  appendFragment(fragment: ProjectStateFragment): void
  clearImportOutput(componentPaths: readonly string[]): void
  deleteFiles(projectPaths: readonly string[]): void
  deleteUnseenFiles(seenFileIds: Uint8Array): number
  readLocalDiagnostics(params?: { readonly mode?: "published" }): readonly Diagnostic[]
  readLocalDiagnosticBatches?(params?: { readonly mode?: "published" }): readonly DiagnosticBatchView[]
  readDependencyCheckBatch(params: ProjectDependencyBatchQuery): ProjectDependencyBatch
  validateDependencies(params: ProjectDependencyValidationParams): readonly Diagnostic[]
  validateDependencyDiagnosticBatches?(params: ProjectDependencyValidationParams): readonly DiagnosticBatchView[]
  readComponentProjection(componentPath: string): ProjectStateComponentProjection
  createReadToken(): ProjectStateReadToken
  commitUpdate(): boolean
  rollbackUpdate(): void
  checkpoint(): Promise<void>
  close(): void
}
