import type { ProjectStateReadToken } from "../contracts"
import type { ProjectStateWriterTransport } from "../writerHandle"
import type {
  ProjectStateWriterAcknowledgement,
  ProjectStateWriterCommand,
  ProjectStateWriterResponse,
} from "../writerProtocol"

type WriterTransportEvent = "message" | "error" | "exit"
type WriterTransportListener = ((response: ProjectStateWriterResponse) => void) | ((error: Error) => void) | ((code: number) => void)

export type MockWriterTransportOutcome =
  | ProjectStateWriterResponse
  | { readonly kind: "transportError"; readonly error: Error }
  | { readonly kind: "transportExit"; readonly code: number }

export type MockWriterTransportHandler = (
  command: ProjectStateWriterCommand,
) => MockWriterTransportOutcome | Promise<MockWriterTransportOutcome> | undefined

interface RegisteredListener {
  readonly listener: WriterTransportListener
  readonly once: boolean
}

export interface MockWriterTransport extends ProjectStateWriterTransport {
  readonly commands: readonly ProjectStateWriterCommand[]
  emitError(error: Error): void
  emitExit(code: number): void
}

export function createMockWriterTransport(
  handler: MockWriterTransportHandler = acknowledgeWriterCommand,
): MockWriterTransport {
  const commands: ProjectStateWriterCommand[] = []
  const listeners = new Map<WriterTransportEvent, RegisteredListener[]>()

  const transport: MockWriterTransport = {
    commands,
    postMessage(command, transfer = []) {
      const cloned = structuredClone(command, { transfer: [...transfer] })
      commands.push(cloned)
      const outcome = handler(cloned)
      if (isPromise(outcome)) {
        void outcome.then(emitOutcome, (caught: unknown) => emit("error", toError(caught)))
      } else if (outcome !== undefined) {
        emitOutcome(outcome)
      }
    },
    on(event: WriterTransportEvent, listener: WriterTransportListener) {
      addListener(event, listener, false)
      return transport
    },
    once(event: WriterTransportEvent, listener: WriterTransportListener) {
      addListener(event, listener, true)
      return transport
    },
    off(event: WriterTransportEvent, listener: WriterTransportListener) {
      listeners.set(event, (listeners.get(event) ?? []).filter((registered) => registered.listener !== listener))
      return transport
    },
    async terminate() {
      return 0
    },
    emitError(error) {
      emit("error", error)
    },
    emitExit(code) {
      emit("exit", code)
    },
  }
  return transport

  function addListener(event: WriterTransportEvent, listener: WriterTransportListener, once: boolean): void {
    listeners.set(event, [...listeners.get(event) ?? [], { listener, once }])
  }

  function emitOutcome(outcome: MockWriterTransportOutcome): void {
    if (outcome.kind === "transportError") emit("error", outcome.error)
    else if (outcome.kind === "transportExit") emit("exit", outcome.code)
    else emit("message", outcome)
  }

  function emit(event: WriterTransportEvent, value: ProjectStateWriterResponse | Error | number): void {
    const registered = listeners.get(event) ?? []
    listeners.set(event, registered.filter(({ once }) => !once))
    for (const { listener } of registered) (listener as (emitted: unknown) => void)(value)
  }
}

export function acknowledgeWriterCommand(command: ProjectStateWriterCommand): ProjectStateWriterResponse {
  return { kind: "ack", requestId: command.requestId, result: acknowledgement(command) }
}

function acknowledgement(command: ProjectStateWriterCommand): ProjectStateWriterAcknowledgement {
  switch (command.kind) {
    case "openProject": return { kind: "opened" }
    case "compareFiles": return { kind: "filesCompared", changes: { changed: [], deleted: [] } }
    case "readFileBaseline": {
      return {
        kind: "fileBaseline",
        baseline: {
          knownHashBits: new Uint8Array(Math.ceil(command.files.length / 8)),
          hashBytes: new Uint8Array(command.files.length * 8),
          deleted: [],
        },
      }
    }
    case "readLocalDiagnostics": return { kind: "localDiagnostics", diagnostics: [] }
    case "validateDependencies": return { kind: "dependencyDiagnostics", diagnostics: [], operationId: command.operationId }
    case "createReadToken": return { kind: "readToken", token: new Uint8Array() as ProjectStateReadToken }
    case "readComponentProjection": {
      return { kind: "componentProjection", projection: { componentPath: command.componentPath, updates: [], hashBytes: new Uint8Array() } }
    }
    case "beginUpdate": return { kind: "updateBegun", operationId: command.operationId }
    case "writeBatch": return { kind: "batchWritten", operationId: command.operationId }
    case "writeImportIndexBatch": return { kind: "importIndexBatchWritten", operationId: command.operationId }
    case "registerImportFileIdentities": return { kind: "importFileIdentitiesRegistered", operationId: command.operationId }
    case "writeImportFinalFileState": return { kind: "importFinalFileStateWritten", operationId: command.operationId }
    case "clearImportOutput": return { kind: "importOutputCleared", operationId: command.operationId }
    case "deleteFiles": return { kind: "filesDeleted", operationId: command.operationId }
    case "commitUpdate": return { kind: "updateCommitted", operationId: command.operationId }
    case "rollbackUpdate": return { kind: "updateRolledBack", operationId: command.operationId }
    case "checkpoint": return { kind: "checkpointed", snapshotPath: "/mock/project-state.sqlite" }
    case "cancelOperation": return { kind: "operationCancelled", operationId: command.operationId }
    case "reset": return { kind: "reset" }
    case "close": return { kind: "closed" }
  }
}

function isPromise(value: unknown): value is Promise<MockWriterTransportOutcome> {
  return typeof value === "object" && value !== null && "then" in value
}

function toError(caught: unknown): Error {
  return caught instanceof Error ? caught : new Error(String(caught))
}
