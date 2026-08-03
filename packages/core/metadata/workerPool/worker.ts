import type { MetadataWorkerCommand, MetadataWorkerCommandResult } from "./types"
import { move, transferableSymbol, valueSymbol } from "piscina"
import {
  createMetadataWorkerPersistentState,
  type MetadataWorkerPersistentState,
} from "./workerState"
import { runPreparedYamlProjectWorkerTask } from "../project/preparedYamlProjectWorker"
import { runImportWorkerCommand } from "../importFromXml/worker"

interface MetadataWorkerCommandHandlerDependencies {
  readonly createState?: typeof createMetadataWorkerPersistentState
  readonly runImportCommand?: typeof runImportWorkerCommand
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
    }
  }
}

function movableImportResult(
  result: Extract<MetadataWorkerCommandResult, { kind: "importResult" }>,
): Extract<MetadataWorkerCommandResult, { kind: "importResult" }> {
  const buffers = Object.values(result.result?.stateFragment?.buffers ?? {})
  if (buffers.length === 0) return result
  return move({
    get [transferableSymbol]() { return buffers },
    get [valueSymbol]() { return result },
  }) as unknown as Extract<MetadataWorkerCommandResult, { kind: "importResult" }>
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
