import type { ConfigurationContext } from "../context/types"
import type { ProjectStateReadToken } from "../projectState/contracts"
import type {
  PreparedYamlProjectWorkerTask,
  PreparedYamlProjectWorkerTaskResult,
} from "../project/preparedYamlProjectWorker"

export type MetadataWorkerOperationOutcome = "success" | "failure" | "cancelled"

export interface MetadataWorkerProbeCommand {
  readonly kind: "probe"
  readonly value: string
}

export type MetadataWorkerOperationCommand =
  | MetadataWorkerProbeCommand
  | {
      readonly kind: "validation"
      readonly task: PreparedYamlProjectWorkerTask
    }

export interface MetadataWorkerProbeResult {
  readonly kind: "probeResult"
  readonly value: string
}

export type MetadataWorkerOperationResult = MetadataWorkerProbeResult | PreparedYamlProjectWorkerTaskResult

export type MetadataWorkerCommand =
  | {
      readonly kind: "initializeLine"
      readonly workerIndex: number
      readonly context: ConfigurationContext
    }
  | {
      readonly kind: "runOperation"
      readonly operationId: string
      readonly command: MetadataWorkerOperationCommand
    }
  | {
      readonly kind: "resetOperation"
      readonly operationId: string
      readonly outcome: MetadataWorkerOperationOutcome
    }
  | {
      readonly kind: "installProjectState"
      readonly readToken: ProjectStateReadToken
    }
  | { readonly kind: "clearProjectState" }

export type MetadataWorkerCommandResult = MetadataWorkerOperationResult | undefined

export interface MetadataWorkerLine {
  run(command: MetadataWorkerCommand): Promise<MetadataWorkerCommandResult>
  destroy(): Promise<void>
}

export interface MetadataWorkerOperation {
  readonly id: string
  readonly concurrency: number
  run(workerIndex: number, command: MetadataWorkerOperationCommand): Promise<MetadataWorkerOperationResult>
  finish(outcome: MetadataWorkerOperationOutcome): Promise<void>
}

export interface MetadataWorkerPoolHandle {
  beginOperation(params: {
    id: string
    concurrency: number
    context: ConfigurationContext
    signal?: AbortSignal
  }): Promise<MetadataWorkerOperation>
  installProjectState(token: ProjectStateReadToken): Promise<void>
  clearProjectState(): Promise<void>
  size(): number
  close(): Promise<void>
}
