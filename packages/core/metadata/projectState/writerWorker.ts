import { parentPort } from "node:worker_threads"
import type { ProjectStateCompatibility } from "./compatibility"
import {
  projectStateSnapshotPath,
  openPersistentSqliteProjectStateStore,
} from "./sqlite/persistence"
import type { SqliteProjectStateStoreFixture } from "./sqlite/store"
import {
  assertProjectStateWriterCommand,
  type ProjectStateWriterAcknowledgement,
  type ProjectStateWriterCommand,
  type ProjectStateWriterResponse,
} from "./writerProtocol"

const port = parentPort
if (port === null) throw new Error("ProjectState writer должен запускаться в worker thread")

let fixture: SqliteProjectStateStoreFixture | undefined
let compatibility: ProjectStateCompatibility | undefined
let projectDir: string | undefined
let activeOperationId: string | undefined
let transactionActive = false
const cancelledOperations = new Set<string>()
let sequence = Promise.resolve()

port.on("message", (value: unknown) => {
  sequence = sequence.then(async () => {
    const requestId = requestIdFrom(value)
    try {
      assertProjectStateWriterCommand(value)
      const result = await execute(value)
      port.postMessage({ kind: "ack", requestId, result } satisfies ProjectStateWriterResponse)
      if (value.kind === "close") port.close()
    } catch (caught) {
      const error = caught instanceof Error ? caught : new Error(String(caught))
      port.postMessage({
        kind: "failed",
        requestId,
        error: { name: error.name, message: error.message },
      } satisfies ProjectStateWriterResponse)
    }
  })
})

function requestIdFrom(value: unknown): string {
  if (typeof value !== "object" || value === null || !("requestId" in value)) return "unknown"
  return typeof value.requestId === "string" && value.requestId.length > 0 ? value.requestId : "unknown"
}

async function execute(command: ProjectStateWriterCommand): Promise<ProjectStateWriterAcknowledgement> {
  switch (command.kind) {
    case "openProject":
      closeStore()
      compatibility = command.compatibility
      projectDir = command.projectDir
      fixture = await openPersistentSqliteProjectStateStore({ projectDir, compatibility })
      return { kind: "opened" }
    case "compareFiles":
      return { kind: "filesCompared", changes: requireStore().store.compareFiles(command.batch) }
    case "readLocalDiagnostics":
      return { kind: "localDiagnostics", diagnostics: requireStore().store.readLocalDiagnostics({ mode: "published" }) }
    case "validateDependencies": {
      const current = requireActiveOperation(command.operationId)
      if (cancelledOperations.has(command.operationId)) throw new Error("Операция состояния проекта отменена")
      return {
        kind: "dependencyDiagnostics",
        diagnostics: current.store.validateDependencies({ requests: [] }),
        operationId: command.operationId,
      }
    }
    case "createReadToken":
      return { kind: "readToken", token: requireStore().store.createReadToken() }
    case "readComponentProjection":
      return {
        kind: "componentProjection",
        projection: requireStore().store.readComponentProjection(command.componentPath),
      }
    case "beginUpdate": {
      const current = requireStore()
      if (activeOperationId !== undefined) throw new Error("Обновление состояния проекта уже начато")
      cancelledOperations.delete(command.operationId)
      current.store.beginUpdate()
      transactionActive = true
      activeOperationId = command.operationId
      return { kind: "updateBegun", operationId: command.operationId }
    }
    case "writeBatch": {
      const current = requireActiveOperation(command.operationId)
      if (cancelledOperations.has(command.operationId)) throw new Error("Операция состояния проекта отменена")
      assertProjectStateWriterCommand(command)
      current.store.replaceFiles(command.batch)
      return { kind: "batchWritten", operationId: command.operationId }
    }
    case "writeImportIndexBatch": {
      const current = requireActiveOperation(command.operationId)
      current.store.replaceImportIndex(command.batch)
      return { kind: "importIndexBatchWritten", operationId: command.operationId }
    }
    case "writeImportFinalFileState": {
      const current = requireActiveOperation(command.operationId)
      current.store.replaceImportFinalFileState(command.batch)
      return { kind: "importFinalFileStateWritten", operationId: command.operationId }
    }
    case "deleteFiles":
      requireActiveOperation(command.operationId).store.deleteFiles(command.projectPaths)
      return { kind: "filesDeleted", operationId: command.operationId }
    case "commitUpdate": {
      requireActiveOperation(command.operationId).store.commitUpdate()
      transactionActive = false
      activeOperationId = undefined
      return { kind: "updateCommitted", operationId: command.operationId }
    }
    case "rollbackUpdate":
      requireActiveOperation(command.operationId).store.rollbackUpdate()
      transactionActive = false
      activeOperationId = undefined
      return { kind: "updateRolledBack", operationId: command.operationId }
    case "checkpoint":
      await requireStore().store.checkpoint()
      return { kind: "checkpointed", snapshotPath: projectStateSnapshotPath(projectDir!) }
    case "cancelOperation":
      cancelledOperations.add(command.operationId)
      if (activeOperationId === command.operationId && transactionActive) {
        requireStore().store.rollbackUpdate()
        transactionActive = false
        activeOperationId = undefined
      }
      return { kind: "operationCancelled", operationId: command.operationId }
    case "reset":
      if (compatibility === undefined) throw new Error("ProjectState writer ещё не открывал проект")
      closeStore()
      projectDir = command.projectDir
      fixture = await openPersistentSqliteProjectStateStore({
        projectDir,
        compatibility,
        loadSnapshot: false,
      })
      return { kind: "reset" }
    case "close":
      closeStore()
      return { kind: "closed" }
  }
}

function requireStore(): SqliteProjectStateStoreFixture {
  if (fixture === undefined || projectDir === undefined) throw new Error("ProjectState writer не открыл проект")
  return fixture
}

function requireActiveOperation(operationId: string): SqliteProjectStateStoreFixture {
  const current = requireStore()
  if (activeOperationId !== operationId || !transactionActive) throw new Error("Команда относится не к активному обновлению")
  return current
}

function closeStore(): void {
  fixture?.store.close()
  fixture = undefined
  projectDir = undefined
  activeOperationId = undefined
  transactionActive = false
}
