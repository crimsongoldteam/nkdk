import type { ProjectStateReadToken } from "./contracts"
import type {
  ProjectStateFieldEntry,
  ProjectStateFileIdentity,
  ProjectStateFormEntry,
  ProjectStateLocalValidationResult,
  ProjectStateOwnerFact,
  ProjectStatePendingDependencyCheck,
  ProjectStatePendingReference,
  ProjectStateReferenceEntry,
} from "./fileUpdate"
import type { ProjectStateRefreshResult } from "./refresh"
import type { ProjectStateWriterHandle } from "./writerHandle"
import type {
  ProjectStateEncodedImportFinalBatch,
  ProjectStateEncodedImportIndexBatch,
} from "./binary/contribution"
import { openProjectStateImportFinalBatch } from "./binary/contribution"
import {
  assertProjectStateImportFinalFileState,
  assertProjectStatePortableData,
} from "./fileUpdateValidation"

export interface ProjectStateImportParams {
  readonly projectDir: string
  readonly workerCount: number
  readonly output: { readonly componentPaths: readonly string[] }
  readonly signal?: AbortSignal
}

export interface ProjectStateImportIndexContribution extends ProjectStateFileIdentity {
  readonly resourceKind: "yaml"
  readonly yamlRole: NonNullable<ProjectStateFileIdentity["yamlRole"]>
  readonly references: readonly ProjectStateReferenceEntry[]
  readonly owners: readonly ProjectStateOwnerFact[]
  readonly fields: readonly ProjectStateFieldEntry[]
  readonly forms: readonly ProjectStateFormEntry[]
}

export type ProjectStateImportFinalFileState =
  | (ProjectStateFileIdentity & { readonly kind: "resource"; readonly resourceKind: "resource" })
  | (ProjectStateFileIdentity & {
      readonly kind: "yaml"
      readonly resourceKind: "yaml"
      readonly yamlRole: NonNullable<ProjectStateFileIdentity["yamlRole"]>
      readonly localValidation: ProjectStateLocalValidationResult
      readonly pendingReferences: readonly ProjectStatePendingReference[]
      readonly pendingChecks: readonly ProjectStatePendingDependencyCheck[]
      readonly dependencies: readonly string[]
    })

export interface ProjectStateImportFinalFileStateBatch {
  readonly updates: readonly ProjectStateImportFinalFileState[]
  readonly hashBytes: Uint8Array
}

export interface ProjectStateImportSession {
  writeFirstPassBatch(batch: ProjectStateEncodedImportIndexBatch): Promise<void>
  registerFileIdentities(files: readonly ProjectStateFileIdentity[]): Promise<void>
  commitWorkingIndex(): Promise<ProjectStateReadToken>
  /** Выдаёт отдельный одноразовый token следующему worker после фиксации индекса. */
  createReadToken(): Promise<ProjectStateReadToken>
  writeFinalFileState(batch: ProjectStateEncodedImportFinalBatch): Promise<void>
  finalize(beforeCheckpoint?: () => Promise<void>): Promise<ProjectStateRefreshResult>
  abort(cause: unknown): Promise<void>
}

export interface CreateProjectStateImportSessionParams extends ProjectStateImportParams {
  readonly writer: ProjectStateWriterHandle
  readonly publish: (result: ProjectStateRefreshResult) => Promise<void> | void
  readonly discard: (cause: unknown) => Promise<void> | void
}

export async function createProjectStateImportSession(
  params: CreateProjectStateImportSessionParams,
): Promise<ProjectStateImportSession> {
  assertWorkerCount(params.workerCount)
  await params.writer.openProject(params.projectDir)
  await params.writer.beginUpdate(params.projectDir, params.signal)
  await params.writer.clearImportOutput(params.output.componentPaths)
  let phase: "index" | "committing" | "final" | "finalizing" | "done" = "index"
  let changedFiles = 0
  let finalWrites = Promise.resolve()
  const activeWrites = new Set<Promise<void>>()

  function trackWrite(write: Promise<void>): Promise<void> {
    activeWrites.add(write)
    void write.then(
      () => activeWrites.delete(write),
      () => activeWrites.delete(write),
    )
    return write
  }

  function startWrite(
    expectedPhase: "index" | "final",
    rejectedMessage: string,
    write: () => Promise<void>,
  ): Promise<void> {
    if (phase !== expectedPhase) return Promise.reject(new Error(rejectedMessage))
    return trackWrite(Promise.resolve().then(async () => {
      if (phase !== expectedPhase) throw new Error(rejectedMessage)
      await write()
    }))
  }

  function startFinalWrite(write: () => Promise<void>): Promise<void> {
    if (phase !== "final") return Promise.reject(new Error("Import session уже завершена"))
    const queued = finalWrites.then(async () => {
      if (phase === "done") throw new Error("Import session уже завершена")
      await write()
    })
    finalWrites = queued.then(() => undefined, () => undefined)
    return trackWrite(queued)
  }

  return {
    writeFirstPassBatch(batch) {
      return startWrite(
        "index",
        "Рабочий индекс import уже неизменяем",
        () => params.writer.writeImportIndexBatch(batch),
      )
    },
    async registerFileIdentities(files) {
      if (phase === "done") throw new Error("Import session уже завершена")
      if (phase === "index") {
        await startWrite(
          "index",
          "Import session уже завершена",
          () => params.writer.registerImportFileIdentities(files),
        )
        return
      }
      await startFinalWrite(() => params.writer.registerImportFileIdentities(files))
    },
    async commitWorkingIndex() {
      if (phase !== "index") throw new Error("Рабочий индекс import уже зафиксирован")
      phase = "committing"
      await Promise.all([...activeWrites])
      await params.writer.commitUpdate()
      const token = await params.writer.createReadToken()
      await params.writer.beginUpdate(params.projectDir, params.signal)
      phase = "final"
      return token
    },
    async createReadToken() {
      if (phase !== "final") throw new Error("Рабочий индекс import ещё не зафиксирован")
      return params.writer.createReadToken()
    },
    async writeFinalFileState(batch) {
      if (phase === "done") throw new Error("Import session уже завершена")
      const encoded = openProjectStateImportFinalBatch(batch)
      changedFiles += encoded.fileCount
      if (phase === "index") {
        await startWrite(
          "index",
          "Import session уже завершена",
          () => params.writer.writeImportFinalFileState(batch),
        )
        return
      }
      await startFinalWrite(() => params.writer.writeImportFinalFileState(batch))
    },
    async finalize(beforeCheckpoint) {
      if (phase !== "final") throw new Error("Import session нельзя завершить до фиксации индекса")
      phase = "finalizing"
      await finalWrites
      const localDiagnostics = await params.writer.readLocalDiagnostics()
      const dependencyDiagnostics = await params.writer.validateDependencies()
      await beforeCheckpoint?.()
      const readToken = await params.writer.createReadToken()
      await params.writer.commitAndScheduleCheckpoint()
      phase = "done"
      const result: ProjectStateRefreshResult = {
        diagnostics: [...localDiagnostics, ...dependencyDiagnostics],
        readToken,
        stats: { hashedFiles: changedFiles, parsedYamlFiles: 0, changedFiles, deletedFiles: 0 },
      }
      await params.publish(result)
      return result
    },
    async abort(cause) {
      if (phase === "done") return
      phase = "done"
      const failures: unknown[] = [cause]
      const activeWriteResults = await Promise.allSettled([...activeWrites])
      for (const result of activeWriteResults) {
        if (result.status === "rejected" && result.reason !== cause) {
          failures.push(...flattenFailures(result.reason))
        }
      }
      try {
        await params.writer.rollbackUpdate()
      } catch (caught) {
        failures.push(...flattenFailures(caught))
      }
      try {
        await params.discard(cause)
      } catch (caught) {
        failures.push(...flattenFailures(caught))
      }
      if (failures.length > 1) throw new AggregateError(failures, errorMessage(cause))
    },
  }
}

function flattenFailures(caught: unknown): unknown[] {
  return caught instanceof AggregateError
    ? caught.errors.flatMap((failure) => flattenFailures(failure))
    : [caught]
}

function errorMessage(caught: unknown): string {
  return caught instanceof Error ? caught.message : String(caught)
}

export function assertProjectStateImportFinalFileStateBatch(
  value: unknown,
): asserts value is ProjectStateImportFinalFileStateBatch & { readonly hashBytes: Uint8Array<ArrayBuffer> } {
  if (
    typeof value !== "object"
    || value === null
    || Array.isArray(value)
    || Object.getPrototypeOf(value) !== Object.prototype
  ) {
    throw new Error("ProjectStateImportFinalFileStateBatch должен быть обычным объектом")
  }
  const batch = value as Record<string, unknown>
  for (const key of Reflect.ownKeys(batch)) {
    if (typeof key === "symbol" || (key !== "updates" && key !== "hashBytes")) {
      throw new Error("ProjectStateImportFinalFileStateBatch содержит неизвестное поле")
    }
    assertEnumerableDataProperty(batch, key, "ProjectStateImportFinalFileStateBatch")
  }
  if (!Array.isArray(batch["updates"])) throw new Error("updates должен быть массивом")
  assertProjectStatePortableData(batch["updates"], "updates")
  const hashBytes = batch["hashBytes"]
  if (!(hashBytes instanceof Uint8Array)) throw new Error("hashBytes должен быть Uint8Array")
  const expected = batch["updates"].length * 8
  if (!(hashBytes.buffer instanceof ArrayBuffer)
    || hashBytes.byteOffset !== 0
    || hashBytes.byteLength !== expected
    || hashBytes.buffer.byteLength !== expected) {
    throw new Error(`hashBytes должен быть zero-offset ArrayBuffer длиной ${expected} байт`)
  }
  assertExactHashBytes(hashBytes)
  for (const [index, update] of batch["updates"].entries()) {
    assertProjectStateImportFinalFileState(update, `updates[${index}]`)
  }
}

function assertExactHashBytes(hashBytes: Uint8Array): void {
  if (Object.getPrototypeOf(hashBytes) !== Uint8Array.prototype) {
    throw new Error("hashBytes должен быть обычным Uint8Array")
  }
  for (const key of Reflect.ownKeys(hashBytes)) {
    if (typeof key === "symbol") throw new Error("hashBytes содержит symbol-поле")
    const index = Number(key)
    if (!Number.isSafeInteger(index) || index < 0 || index >= hashBytes.length || String(index) !== key) {
      throw new Error(`hashBytes.${key} не является индексом`)
    }
    assertEnumerableDataProperty(hashBytes, key, "hashBytes")
  }
  if (Object.getPrototypeOf(hashBytes.buffer) !== ArrayBuffer.prototype || Reflect.ownKeys(hashBytes.buffer).length > 0) {
    throw new Error("hashBytes должен владеть обычным ArrayBuffer")
  }
}

function assertEnumerableDataProperty(value: object, key: PropertyKey, path: string): void {
  const descriptor = Object.getOwnPropertyDescriptor(value, key)
  if (descriptor === undefined || !("value" in descriptor) || !descriptor.enumerable) {
    throw new Error(`${path}.${String(key)} должен быть enumerable data property`)
  }
}

function assertWorkerCount(value: number): void {
  if (!Number.isSafeInteger(value) || value < 1) throw new Error("workerCount должен быть положительным целым числом")
}
