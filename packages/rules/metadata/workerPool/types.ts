import type { ConfigurationContext } from "@nkdk/runtime"
import type { ProjectStateReadToken } from "../projectState/contracts"

export type MetadataWorkerOperationOutcome = "success" | "failure" | "cancelled"

export interface MetadataWorkerProbeCommand {
  readonly kind: "probe"
  readonly value: string
}

export interface MetadataWorkerProbeResult {
  readonly kind: "probeResult"
  readonly value: string
}

export interface MetadataWorkerOperationTypeMap {
  probe: {
    command: MetadataWorkerProbeCommand
    result: MetadataWorkerProbeResult
  }
}

export type MetadataWorkerOperationCommand =
  MetadataWorkerOperationTypeMap[keyof MetadataWorkerOperationTypeMap]["command"]

export type MetadataWorkerOperationResult =
  MetadataWorkerOperationTypeMap[keyof MetadataWorkerOperationTypeMap]["result"]

export type MetadataWorkerImportResult = Extract<MetadataWorkerOperationResult, { readonly kind: "importResult" }>
export type MetadataWorkerFullSyncResult = Extract<MetadataWorkerOperationResult, { readonly kind: "fullSyncResult" }>

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
