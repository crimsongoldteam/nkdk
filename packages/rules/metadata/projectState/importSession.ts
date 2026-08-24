import { performance } from "node:perf_hooks"
import type { ProjectStateReadToken } from "./contracts"
import type {
  ProjectStateFileIdentity,
  ProjectStateLocalValidationResult,
  ProjectStatePendingDependencyCheck,
  ProjectStatePendingReference,
  ProjectStateTargetEntry,
} from "./fileUpdate"
export type { ProjectStateImportIndexContribution } from "./fileUpdate"
import type { ProjectStateRefreshResult } from "./refresh"
import type { ProjectStateWriterHandle } from "./writerHandle"
import {
  createProjectStateFragmentWriter,
  openProjectStateFragment,
  type ProjectStateFragment,
} from "./binary/fragment"
import {
  assertProjectStateImportFinalFileState,
  assertProjectStatePortableData,
} from "./fileUpdateValidation"
import {
  createMetadataDiagnosticCollection,
  validationIssuePathFromPointer,
  type ValidationIssue,
} from "@nkdk/runtime"

export interface ProjectStateImportParams {
  readonly projectDir: string
  readonly workerCount: number
  readonly output: { readonly componentPaths: readonly string[] }
  readonly signal?: AbortSignal
  readonly profile?: ProjectStateImportProfileOptions
}

export type ProjectStateImportProfilePhase =
  | "workingIndex"
  | "semanticIndex"
  | "finalBuild"
  | "dependencyValidation"
  | "save"
  | "publication"

export interface ProjectStateImportProfileOptions {
  readonly onPhase?: (event: { readonly phase: ProjectStateImportProfilePhase; readonly elapsedMs: number }) => void
}

export type ProjectStateImportFinalFileState =
  | (ProjectStateFileIdentity & {
      readonly kind: "resource"
      readonly resourceKind: "resource"
      readonly targets: readonly ProjectStateTargetEntry[]
    })
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
  writeStateFragment(fragment: ProjectStateFragment): Promise<void>
  replaceFinalHashes(files: readonly { readonly projectPath: string; readonly hash: bigint }[]): Promise<void>
  commitWorkingIndex(): Promise<ProjectStateReadToken>
  commitSemanticIndex(): Promise<ProjectStateReadToken>
  collectSemanticValidationIssues(): Promise<readonly ProjectStateImportValidationIssue[]>
  /** Выдаёт отдельный одноразовый token следующему worker после фиксации индекса. */
  createReadToken(): Promise<ProjectStateReadToken>
  finalize(beforeCheckpoint?: () => Promise<void>): Promise<ProjectStateRefreshResult>
  abort(cause: unknown): Promise<void>
}

export interface ProjectStateImportValidationIssue {
  readonly projectPath: string
  readonly issue: ValidationIssue
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
  let phase:
    | "working"
    | "committingWorking"
    | "semantic"
    | "committingSemantic"
    | "final"
    | "finalizing"
    | "done" = "working"
  const changedPaths = new Set<string>()
  let finalWrites = Promise.resolve()
  const activeWrites = new Set<Promise<void>>()

  async function measurePhase<T>(phaseName: ProjectStateImportProfilePhase, action: () => Promise<T>): Promise<T> {
    const startedAt = performance.now()
    try {
      return await action()
    } finally {
      params.profile?.onPhase?.({ phase: phaseName, elapsedMs: performance.now() - startedAt })
    }
  }

  function trackWrite(write: Promise<void>): Promise<void> {
    activeWrites.add(write)
    void write.then(
      () => activeWrites.delete(write),
      () => activeWrites.delete(write),
    )
    return write
  }

  function startWrite(
    expectedPhase: "working" | "semantic",
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

  async function commitIndex(profilePhase: "workingIndex" | "semanticIndex"): Promise<ProjectStateReadToken> {
    return measurePhase(profilePhase, async () => {
      await Promise.all([...activeWrites])
      await params.writer.commitUpdate()
      const committed = await params.writer.createReadToken()
      await params.writer.beginUpdate(params.projectDir, params.signal)
      return committed
    })
  }

  return {
    async writeStateFragment(fragment) {
      if (phase === "done") throw new Error("Import session уже завершена")
      const checked = openProjectStateFragment(fragment)
      if (phase === "working") {
        for (let id = 0; id < checked.fileCount; id += 1) {
          changedPaths.add(checked.stringValue(checked.fileRecord(id).projectPathId))
        }
        await startWrite("working", "Рабочая фаза import уже завершена", () => params.writer.writeFragment(fragment))
        return
      }
      for (let id = 0; id < checked.fileCount; id += 1) {
        changedPaths.add(checked.stringValue(checked.fileRecord(id).projectPathId))
      }
      if (phase === "semantic") {
        await startWrite("semantic", "Смысловая фаза import уже завершена", () => params.writer.writeFragment(fragment))
        return
      }
      await startFinalWrite(() => params.writer.writeFragment(fragment))
    },
    async replaceFinalHashes(files) {
      const hashes = new Map<string, bigint>()
      for (const file of files) {
        if (hashes.has(file.projectPath)) throw new Error(`Повторный путь окончательного хэша: ${file.projectPath}`)
        hashes.set(file.projectPath, file.hash)
      }
      await startFinalWrite(async () => {
        const entries = []
        for (const componentPath of params.output.componentPaths) {
          const projection = await params.writer.readComponentProjection(componentPath)
          for (const update of projection.updates) {
            const hash = hashes.get(update.projectPath)
            if (hash === undefined) continue
            entries.push({ update, hash })
            hashes.delete(update.projectPath)
          }
        }
        if (hashes.size > 0) {
          throw new Error(`Окончательное состояние не содержит файлы: ${[...hashes.keys()].join(", ")}`)
        }
        if (entries.length === 0) return
        const writer = createProjectStateFragmentWriter()
        for (const { update, hash } of entries) writer.appendFile(update, hash)
        await params.writer.writeFragment(writer.finish())
      })
    },
    async commitWorkingIndex() {
      if (phase !== "working") throw new Error("Рабочий индекс import уже зафиксирован")
      phase = "committingWorking"
      const token = await commitIndex("workingIndex")
      phase = "semantic"
      return token
    },
    async commitSemanticIndex() {
      if (phase !== "semantic") throw new Error("Смысловой индекс import нельзя зафиксировать сейчас")
      phase = "committingSemantic"
      const token = await commitIndex("semanticIndex")
      phase = "final"
      return token
    },
    async collectSemanticValidationIssues() {
      if (phase !== "final") {
        throw new Error("Ошибки смыслового индекса доступны только после его фиксации")
      }
      const batches = await params.writer.validateDependencyDiagnosticBatches()
      const diagnostics = createMetadataDiagnosticCollection(batches)
      try {
        return [...diagnostics]
          .filter(({ severity }) => severity === "error")
          .map((diagnostic) => ({
            projectPath: importTargetProjectPath(diagnostic.filePath, params.output.componentPaths),
            issue: {
              code: diagnostic.code ?? `diagnostic.${diagnostic.source}`,
              kind: diagnostic.source === "syntax" || diagnostic.source === "external-file"
                ? "infrastructure" as const
                : "semantic" as const,
              target: {
                kind: "path" as const,
                path: validationIssuePathFromPointer(diagnostic.path ?? ""),
              },
            },
          }))
      } finally {
        diagnostics.release()
      }
    },
    async createReadToken() {
      if (phase !== "semantic" && phase !== "final") {
        throw new Error("Индекс import ещё не зафиксирован")
      }
      return params.writer.createReadToken()
    },
    async finalize(beforeCheckpoint) {
      if (phase !== "final") throw new Error("Import session нельзя завершить до фиксации индекса")
      phase = "finalizing"
      const localDiagnostics = await measurePhase("finalBuild", async () => {
        await finalWrites
        return params.writer.readLocalDiagnosticBatches()
      })
      const dependencyDiagnostics = await measurePhase(
        "dependencyValidation",
        () => params.writer.validateDependencyDiagnosticBatches(),
      )
      await beforeCheckpoint?.()
      const readToken = await params.writer.createReadToken()
      await measurePhase("save", () => params.writer.commitAndScheduleCheckpoint())
      const result: ProjectStateRefreshResult = {
        diagnostics: createMetadataDiagnosticCollection([...localDiagnostics, ...dependencyDiagnostics]),
        readToken,
        stats: { hashedFiles: changedPaths.size, parsedYamlFiles: 0, changedFiles: changedPaths.size, deletedFiles: 0 },
      }
      await measurePhase("publication", async () => params.publish(result))
      phase = "done"
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

function importTargetProjectPath(
  diagnosticFilePath: string,
  componentPaths: readonly string[],
): string {
  const normalized = diagnosticFilePath.replaceAll("\\", "/")
  const candidates = [...componentPaths]
    .map((componentPath) => componentPath.replaceAll("\\", "/").replace(/^\/+|\/+$/gu, ""))
    .filter((componentPath) => componentPath.length > 0)
    .sort((left, right) => right.length - left.length)
  for (const componentPath of candidates) {
    if (normalized.startsWith(`${componentPath}/`)) return normalized.slice(componentPath.length + 1)
    const marker = `/${componentPath}/`
    const markerIndex = normalized.lastIndexOf(marker)
    if (markerIndex >= 0) return normalized.slice(markerIndex + marker.length)
  }
  return normalized
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
