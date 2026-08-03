import type { MetadataWorkerCommand, MetadataWorkerCommandResult } from "./types"
import { move, transferableSymbol, valueSymbol } from "piscina"
import {
  createMetadataWorkerPersistentState,
  type MetadataWorkerPersistentState,
} from "./workerState"
import { runPreparedYamlProjectWorkerTask } from "../project/preparedYamlProjectWorker"
import { runImportWorkerCommand } from "../importFromXml/worker"
import { runFullXmlSyncWorkerCommand } from "../fullSyncToXml/worker"
import { runProjectQuery } from "./projectQueries"

interface MetadataWorkerCommandHandlerDependencies {
  readonly createState?: typeof createMetadataWorkerPersistentState
  readonly runImportCommand?: typeof runImportWorkerCommand
  readonly runFullSyncCommand?: typeof runFullXmlSyncWorkerCommand
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
      await (dependencies.runImportCommand ?? runImportWorkerCommand)({ kind: "dispose" })
      await (dependencies.runFullSyncCommand ?? runFullXmlSyncWorkerCommand)({ kind: "dispose" })
      initialized.resetOperation(command.operationId)
      return undefined
    }

    initialized.beginOperation(command.operationId)
    switch (command.command.kind) {
      case "probe":
        return { kind: "probeResult", value: command.command.value }
      case "validation":
        return runPreparedYamlProjectWorkerTask(command.command.task, {
          persistentValidationState: {
            schemaCache: initialized.schemaCache,
            rulesSnapshot: initialized.rulesSnapshot,
          },
        })
      case "import":
        return movableImportResult({
          kind: "importResult",
          result: await (dependencies.runImportCommand ?? runImportWorkerCommand)(command.command.command, {
            persistentValidationState: {
              schemaCache: initialized.schemaCache,
              rulesSnapshot: initialized.rulesSnapshot,
            },
          }),
        })
      case "fullSync":
        return movableOperationResult({
          kind: "fullSyncResult",
          result: await (dependencies.runFullSyncCommand ?? runFullXmlSyncWorkerCommand)(
            command.command.command,
            {
              openReadSession() { throw new Error("Состояние проекта не установлено в универсальный worker") },
              ...(initialized.projectState === undefined
                ? {}
                : { projectStateReadSession: initialized.projectState }),
            },
          ),
        })
      case "projectQuery":
        return runProjectQuery(command.command.command, initialized.projectState)
    }
  }
}

function movableImportResult(result: Extract<MetadataWorkerCommandResult, { kind: "importResult" }>) {
  return movableOperationResult(result, Object.values(result.result?.stateFragment?.buffers ?? {}))
}

function movableOperationResult<T extends Exclude<MetadataWorkerCommandResult, undefined>>(
  result: T,
  transferables: readonly ArrayBuffer[] = result.kind === "fullSyncResult" && result.result !== undefined
    ? [result.result.fragmentBuffer]
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
