import type { ProjectStateFragment } from "./binary/fragment"
import type { ProjectStateFileBaselinePathPage } from "./contracts"
import type { ProjectStateValidationFileTask } from "./projectFiles"

export interface ProjectStateValidationFileBatch extends ProjectStateFileBaselinePathPage {
  readonly files: readonly ProjectStateValidationFileTask[]
}

export interface ProjectStateValidationStats {
  readonly hashedFiles: number
  readonly parsedYamlFiles: number
  readonly changedFiles: number
  readonly missingFiles: number
}

export interface ProjectStateRefreshOperation {
  readonly signal: AbortSignal
  abort(reason: unknown): void
}

export interface ProjectStateRefreshExecutor {
  begin(signal?: AbortSignal): ProjectStateRefreshOperation
  processFiles(
    batches: AsyncIterable<ProjectStateValidationFileBatch>,
    producer: {
      writeFragment(fragment: ProjectStateFragment): Promise<void>
      deleteFiles(projectPaths: readonly string[]): Promise<void>
    },
    operation: ProjectStateRefreshOperation,
    projectDir: string,
  ): Promise<ProjectStateValidationStats>
  close(): Promise<void>
}

export function createProjectStateRefreshOperation(signal?: AbortSignal): ProjectStateRefreshOperation {
  const controller = new AbortController()
  if (signal?.aborted === true) controller.abort(signal.reason)
  else signal?.addEventListener("abort", () => controller.abort(signal.reason), { once: true })
  return {
    signal: controller.signal,
    abort: (reason) => controller.abort(reason),
  }
}
