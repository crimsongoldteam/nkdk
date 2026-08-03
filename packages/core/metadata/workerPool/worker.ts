import type { MetadataWorkerCommand, MetadataWorkerCommandResult } from "./types"
import {
  createMetadataWorkerPersistentState,
  type MetadataWorkerPersistentState,
} from "./workerState"

interface MetadataWorkerCommandHandlerDependencies {
  readonly createState?: typeof createMetadataWorkerPersistentState
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
      initialized.resetOperation(command.operationId)
      return undefined
    }

    initialized.beginOperation(command.operationId)
    switch (command.command.kind) {
      case "probe":
        return { kind: "probeResult", value: command.command.value }
    }
  }
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
