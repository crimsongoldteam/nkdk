import type { ProjectStateDependencyValidator } from "./contracts/dependencyValidation"
import type { ProjectStateReadToken } from "./contracts"
import type { ProjectStateReadSession } from "./readSession"
import type { ProjectStateSharedBuffers } from "./binary/snapshot"
import type { ProjectStateStore } from "./store"

export type ProjectStateBackendKind = "typescript" | "rust"

export interface OpenProjectStateStoreParams {
  readonly projectDir: string
  readonly initial?: ProjectStateSharedBuffers
  readonly dependencyValidator: ProjectStateDependencyValidator
}

export interface ProjectStateBackend {
  readonly kind: ProjectStateBackendKind
  openStore(params: OpenProjectStateStoreParams): Promise<ProjectStateStore>
  openReadSession(
    token: ProjectStateReadToken,
    dependencyValidator: ProjectStateDependencyValidator,
  ): ProjectStateReadSession
}
