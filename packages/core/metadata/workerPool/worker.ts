import { registerCoreMetadata } from "../composition/coreMetadata"
import type {
  MetadataWorkerCommand,
  MetadataWorkerCommandResult,
  MetadataWorkerOperationCommand,
  MetadataWorkerOperationResult,
} from "./types"
import { move, transferableSymbol, valueSymbol } from "piscina"
import {
  createMetadataWorkerPersistentState,
  type MetadataWorkerPersistentState,
} from "./workerState"
import { createMovableBinaryResult } from "./binaryResult"
import {
  resetRegisteredMetadataWorkerOperations,
  runRegisteredMetadataWorkerOperation,
} from "./operationRegistry"
import { registerMetadataWorkerOperations } from "../composition/workerOperations"

registerCoreMetadata()
registerMetadataWorkerOperations()

type ImportOperationCommand = Extract<MetadataWorkerOperationCommand, { readonly kind: "import" }>
type ImportOperationResult = Extract<MetadataWorkerOperationResult, { readonly kind: "importResult" }>
type FullSyncOperationCommand = Extract<MetadataWorkerOperationCommand, { readonly kind: "fullSync" }>
type FullSyncOperationResult = Extract<MetadataWorkerOperationResult, { readonly kind: "fullSyncResult" }>

interface MetadataWorkerCommandHandlerDependencies {
  readonly createState?: typeof createMetadataWorkerPersistentState
  readonly runImportCommand?: (
    command: ImportOperationCommand["command"],
    dependencies?: {
      readonly persistentValidationState: Pick<MetadataWorkerPersistentState, "schemaCache" | "rulesSnapshot">
    },
  ) => Promise<ImportOperationResult["result"]>
  readonly runFullSyncCommand?: (
    command: FullSyncOperationCommand["command"],
    dependencies?: {
      openReadSession(): never
      readonly projectStateReadSession?: NonNullable<MetadataWorkerPersistentState["projectState"]>
    },
  ) => Promise<FullSyncOperationResult["result"]>
}

export function createMetadataWorkerCommandHandler(
  dependencies: MetadataWorkerCommandHandlerDependencies = {},
): (command: MetadataWorkerCommand) => Promise<MetadataWorkerCommandResult> {
  let state: MetadataWorkerPersistentState | undefined

  return async (command) => {
    if (command.kind === "initializeLine") {
      if (state !== undefined) throw new Error("Универсальный worker уже инициализирован")
      state = await (dependencies.createState ?? createMetadataWorkerPersistentState)({
        workerIndex: command.workerIndex,
        context: command.context,
      })
      return undefined
    }

    const initialized = requireState(state)
    if (command.kind === "installProjectState") {
      initialized.installProjectState(command.readToken)
      return undefined
    }
    if (command.kind === "clearProjectState") {
      initialized.clearProjectState()
      return undefined
    }
    if (command.kind === "resetOperation") {
      if (dependencies.runImportCommand === undefined && dependencies.runFullSyncCommand === undefined) {
        await resetRegisteredMetadataWorkerOperations(initialized, command.outcome)
      } else {
        await dependencies.runImportCommand?.({ kind: "dispose" })
        await dependencies.runFullSyncCommand?.({ kind: "dispose" })
      }
      initialized.resetOperation(command.operationId)
      return undefined
    }

    initialized.beginOperation(command.operationId)
    let result: MetadataWorkerOperationResult
    switch (command.command.kind) {
      case "probe":
        result = await runRegisteredMetadataWorkerOperation(command.command, initialized)
        break
      case "validation":
        result = await runRegisteredMetadataWorkerOperation(command.command, initialized)
        break
      case "import":
        if (dependencies.runImportCommand === undefined) {
          result = await runRegisteredMetadataWorkerOperation(command.command, initialized)
          break
        }
        result = movableImportResult({
          kind: "importResult",
          result: await dependencies.runImportCommand(command.command.command, {
            persistentValidationState: {
              schemaCache: initialized.schemaCache,
              rulesSnapshot: initialized.rulesSnapshot,
            },
          }),
        })
        break
      case "fullSync":
        if (dependencies.runFullSyncCommand === undefined) {
          result = await runRegisteredMetadataWorkerOperation(command.command, initialized)
          break
        }
        result = movableOperationResult({
          kind: "fullSyncResult",
          result: await dependencies.runFullSyncCommand(
            command.command.command,
            {
              openReadSession() { throw new Error("Состояние проекта не установлено в универсальный worker") },
              ...(initialized.projectState === undefined
                ? {}
                : { projectStateReadSession: initialized.projectState }),
            },
          ),
        })
        break
      case "projectQuery":
        result = await runRegisteredMetadataWorkerOperation(command.command, initialized)
        break
    }
    return movableBinaryResult(result)
  }
}

function movableBinaryResult(result: MetadataWorkerOperationResult): MetadataWorkerOperationResult {
  return result.kind === "binaryResult" ? createMovableBinaryResult(result) : result
}

function movableImportResult(result: Extract<MetadataWorkerCommandResult, { kind: "importResult" }>) {
  return movableOperationResult(
    result,
    result.result?.kind === "binaryResult"
      ? result.result.buffers.map(({ buffer }) => buffer)
      : Object.values(result.result?.stateFragment?.buffers ?? {}),
  )
}

function movableOperationResult<T extends Exclude<MetadataWorkerCommandResult, undefined>>(
  result: T,
  transferables: readonly ArrayBuffer[] = result.kind === "fullSyncResult" && result.result !== undefined
    ? result.result.kind === "binaryResult"
      ? result.result.buffers.map(({ buffer }) => buffer)
      : [result.result.fragmentBuffer]
    : [],
): T {
  const buffers = [...transferables]
  if (buffers.length === 0) return result
  return move({
    get [transferableSymbol]() { return buffers },
    get [valueSymbol]() { return result },
  }) as unknown as T
}

const runMetadataWorkerCommand = createMetadataWorkerCommandHandler()

export default function metadataWorkerEntryPoint(
  command: MetadataWorkerCommand,
): Promise<MetadataWorkerCommandResult> {
  return runMetadataWorkerCommand(command)
}

function requireState(
  state: MetadataWorkerPersistentState | undefined,
): MetadataWorkerPersistentState {
  if (state === undefined) throw new Error("Универсальный worker не инициализирован")
  return state
}
