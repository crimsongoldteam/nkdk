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
import { assertProjectStateImportFinalFileState } from "./fileUpdateValidation"

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
  writeFirstPassBatch(batch: readonly ProjectStateImportIndexContribution[]): Promise<void>
  registerFileIdentities(files: readonly ProjectStateFileIdentity[]): Promise<void>
  commitWorkingIndex(): Promise<ProjectStateReadToken>
  /** Выдаёт отдельный одноразовый token следующему worker после фиксации индекса. */
  createReadToken(): Promise<ProjectStateReadToken>
  writeFinalFileState(batch: ProjectStateImportFinalFileStateBatch): Promise<void>
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
  let phase: "index" | "final" | "done" = "index"
  let changedFiles = 0
  let finalWrites = Promise.resolve()

  return {
    writeFirstPassBatch(batch) {
      if (phase !== "index") return Promise.reject(new Error("Рабочий индекс import уже неизменяем"))
      return params.writer.writeImportIndexBatch(batch)
    },
    async registerFileIdentities(files) {
      if (phase === "done") throw new Error("Import session уже завершена")
      if (phase === "index") {
        await params.writer.registerImportFileIdentities(files)
        return
      }
      const write = finalWrites.then(async () => {
        await params.writer.beginUpdate(params.projectDir, params.signal)
        await params.writer.registerImportFileIdentities(files)
        await params.writer.commitUpdate()
      })
      finalWrites = write.then(() => undefined, () => undefined)
      await write
    },
    async commitWorkingIndex() {
      if (phase !== "index") throw new Error("Рабочий индекс import уже зафиксирован")
      await params.writer.commitUpdate()
      phase = "final"
      return params.writer.createReadToken()
    },
    async createReadToken() {
      if (phase !== "final") throw new Error("Рабочий индекс import ещё не зафиксирован")
      return params.writer.createReadToken()
    },
    async writeFinalFileState(batch) {
      if (phase === "done") throw new Error("Import session уже завершена")
      assertProjectStateImportFinalFileStateBatch(batch)
      changedFiles += batch.updates.length
      if (phase === "index") {
        await params.writer.writeImportFinalFileState(batch)
        return
      }
      const write = finalWrites.then(async () => {
        await params.writer.beginUpdate(params.projectDir, params.signal)
        await params.writer.writeImportFinalFileState(batch)
        await params.writer.commitUpdate()
      })
      finalWrites = write.then(() => undefined, () => undefined)
      await write
    },
    async finalize(beforeCheckpoint) {
      if (phase !== "final") throw new Error("Import session нельзя завершить до фиксации индекса")
      await finalWrites
      await params.writer.beginUpdate(params.projectDir, params.signal)
      const localDiagnostics = await params.writer.readLocalDiagnostics()
      const dependencyDiagnostics = await params.writer.validateDependencies()
      await beforeCheckpoint?.()
      const readToken = await params.writer.createReadToken()
      await params.writer.commitAndCheckpoint()
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
      try {
        await finalWrites
      } catch (caught) {
        failures.push(...flattenFailures(caught))
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
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("ProjectStateImportFinalFileStateBatch должен быть объектом")
  }
  const batch = value as Record<string, unknown>
  if (Object.keys(batch).some((key) => key !== "updates" && key !== "hashBytes")) {
    throw new Error("ProjectStateImportFinalFileStateBatch содержит неизвестное поле")
  }
  if (!Array.isArray(batch["updates"])) throw new Error("updates должен быть массивом")
  const hashBytes = batch["hashBytes"]
  if (!(hashBytes instanceof Uint8Array)) throw new Error("hashBytes должен быть Uint8Array")
  const expected = batch["updates"].length * 8
  if (!(hashBytes.buffer instanceof ArrayBuffer)
    || hashBytes.byteOffset !== 0
    || hashBytes.byteLength !== expected
    || hashBytes.buffer.byteLength !== expected) {
    throw new Error(`hashBytes должен быть zero-offset ArrayBuffer длиной ${expected} байт`)
  }
  for (const [index, update] of batch["updates"].entries()) {
    assertProjectStateImportFinalFileState(update, `updates[${index}]`)
  }
}

function assertWorkerCount(value: number): void {
  if (!Number.isSafeInteger(value) || value < 1) throw new Error("workerCount должен быть положительным целым числом")
}
