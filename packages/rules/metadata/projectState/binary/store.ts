import type { Diagnostic } from "@nkdk/runtime"
import { openDiagnosticBatch } from "@nkdk/runtime"
import {
  readLocalDiagnosticBatch,
  validateDependencyDiagnosticBatch,
  validateSnapshotDependencyDiagnostics,
} from "./diagnosticBatches"
import type {
  ProjectStateDependencyValidator,
} from "../contracts/dependencyValidation"
import {
  assertProjectStateFileBaseline,
  assertProjectStateFileBaselinePage,
  assertProjectStateFileHashBatch,
  type ProjectStateReadToken,
} from "../contracts"
import {
  type ProjectStateFileUpdate,
} from "../contracts/fileUpdate"
import type { ProjectStateFileIdentity } from "../contracts/fileIdentity"
import type { ProjectStateReadSession } from "../contracts/dependencyValidation"
import type {
  ProjectDependencyBatchQuery,
  ProjectDependencyValidationParams,
  ProjectStateComponentProjection,
  ProjectStateStore,
} from "../store"
import { buildProjectStateSnapshot } from "./builder"
import { createBinaryProjectStateQueryPort, openBinaryProjectStateReadSession } from "./readSession"
import { createBinaryProjectStateReadToken } from "./readToken"
import { ProjectStateSnapshotView, type ProjectStateSharedBuffers } from "./snapshot"
import { openProjectStateFragment, type ProjectStateFragmentView } from "./fragment"
import {
  createTypedProjectStateReadIndex,
  createTypedProjectStateReader,
  type TypedProjectStateReadIndex,
} from "./typedReader"

export interface BinaryProjectStateStoreOptions {
  readonly dependencyValidator: ProjectStateDependencyValidator
  readonly initial?: ProjectStateSharedBuffers
  readonly checkpoint?: (buffers: ProjectStateSharedBuffers) => Promise<void>
  readonly projectDir?: string
  readonly buildSnapshot?: typeof buildProjectStateSnapshot
}

export interface BinaryProjectStateStoreFixture {
  readonly store: ProjectStateStore
  openReadSession(token: ProjectStateReadToken): ProjectStateReadSession
}

interface ActiveUpdate {
  readonly fragments: ProjectStateFragmentView[]
  readonly deletions: Set<string>
  candidate?: ProjectStateSharedBuffers
}

interface BinaryProjectStateReadContext {
  readonly snapshot: ProjectStateSnapshotView
  readonly readIndex: TypedProjectStateReadIndex
}

const YAML_ROLES = [undefined, "configuration", "properties", "form"] as const

export function createBinaryProjectStateStore(
  options: BinaryProjectStateStoreOptions,
): BinaryProjectStateStoreFixture {
  const buildSnapshot = options.buildSnapshot ?? buildProjectStateSnapshot
  let published = options.initial ?? buildSnapshot({ fragments: [], deletions: [] })
  let active: ActiveUpdate | undefined
  let closed = false
  const readContexts = new WeakMap<ProjectStateSharedBuffers, BinaryProjectStateReadContext>()

  const store: ProjectStateStore = {
    readFileBaseline(files) {
      assertOpen()
      const snapshot = new ProjectStateSnapshotView(currentBuffers())
      const knownHashBits = new Uint8Array(Math.ceil(files.length / 8))
      const hashBytes = new Uint8Array(files.length * 8)
      const requestedPaths = new Set(files.map(({ projectPath }) => projectPath))
      files.forEach((file, index) => {
      const fileId = snapshot.findFile(file.projectPath)
        if (fileId === undefined || !sameProjectStateFileIdentity(projectStateSnapshotIdentity(snapshot, fileId), file)) return
        knownHashBits[Math.floor(index / 8)]! |= 1 << (index % 8)
        new DataView(hashBytes.buffer).setBigUint64(index * 8, snapshot.fileRecord(fileId).hash, false)
      })
      const deleted = allProjectStateSnapshotIdentities(snapshot).filter(({ projectPath }) => !requestedPaths.has(projectPath))
      const result = { knownHashBits, hashBytes, deleted }
      assertProjectStateFileBaseline(result, files.length)
      return result
    },
    readFileBaselinePathPage(projectPaths) {
      assertOpen()
      const snapshot = new ProjectStateSnapshotView(published)
      const knownHashBits = new Uint8Array(Math.ceil(projectPaths.length / 8))
      const hashBytes = new Uint8Array(projectPaths.length * 8)
      const previousFileIds = new Int32Array(projectPaths.length).fill(-1)
      const hashes = new DataView(hashBytes.buffer)
      projectPaths.forEach((projectPath, index) => {
        const fileId = snapshot.findFile(projectPath)
        if (fileId === undefined) return
        previousFileIds[index] = fileId
        knownHashBits[Math.floor(index / 8)]! |= 1 << (index % 8)
        hashes.setBigUint64(index * 8, snapshot.fileRecord(fileId).hash, false)
      })
      const result = { knownHashBits, hashBytes, previousFileIds, storedFileCount: snapshot.fileCount }
      assertProjectStateFileBaselinePage(result, projectPaths.length)
      return result
    },
    compareFiles(batch) {
      assertOpen()
      assertProjectStateFileHashBatch(batch)
      const snapshot = new ProjectStateSnapshotView(currentBuffers())
      const hashes = new DataView(batch.hashBytes.buffer)
      const requestedPaths = new Set(batch.files.map(({ projectPath }) => projectPath))
      return {
        changed: batch.files.flatMap((file, index) => {
          const fileId = snapshot.findFile(file.projectPath)
          return fileId !== undefined
            && sameProjectStateFileIdentity(projectStateSnapshotIdentity(snapshot, fileId), file)
            && snapshot.fileRecord(fileId).hash === hashes.getBigUint64(index * 8, false)
            ? []
            : [{ index, file }]
        }),
        deleted: allProjectStateSnapshotIdentities(snapshot).filter(({ projectPath }) => !requestedPaths.has(projectPath)),
      }
    },
    beginUpdate() {
      assertOpen()
      if (active !== undefined) throw new Error("Обновление состояния проекта уже начато")
      active = { fragments: [], deletions: new Set() }
    },
    appendFragment(fragment) {
      assertOpen()
      const update = assertActive()
      update.fragments.push(openProjectStateFragment(fragment))
      update.candidate = undefined
    },
    clearImportOutput(componentPaths) {
      assertOpen()
      const update = assertActive()
      const selected = new Set(componentPaths)
      const snapshot = new ProjectStateSnapshotView(materialize(update))
      for (let fileId = 0; fileId < snapshot.fileCount; fileId += 1) {
        if (selected.has(snapshot.componentPath(fileId))) remove(update, snapshot.filePath(fileId))
      }
    },
    deleteFiles(projectPaths) {
      assertOpen()
      const update = assertActive()
      projectPaths.forEach((projectPath) => remove(update, projectPath))
    },
    deleteUnseenFiles(seenFileIds) {
      assertOpen()
      const update = assertActive()
      const snapshot = new ProjectStateSnapshotView(published)
      if (seenFileIds.byteLength !== Math.ceil(snapshot.fileCount / 8)) {
        throw new Error("Битовая карта обнаруженных файлов имеет неверный размер")
      }
      let deleted = 0
      for (let fileId = 0; fileId < snapshot.fileCount; fileId += 1) {
        if ((seenFileIds[Math.floor(fileId / 8)]! & (1 << (fileId % 8))) !== 0) continue
        remove(update, snapshot.filePath(fileId))
        deleted += 1
      }
      return deleted
    },
    readLocalDiagnostics(params) {
      assertOpen()
      return readDiagnostics(
        readContext(currentBuffers()),
        params?.mode === "published",
        options.dependencyValidator,
      )
    },
    readLocalDiagnosticBatches(params) {
      assertOpen()
      return [readLocalDiagnosticBatch(
        new ProjectStateSnapshotView(currentBuffers()),
        params?.mode === "published",
        options.dependencyValidator,
      )]
    },
    readDependencyCheckBatch(params: ProjectDependencyBatchQuery) {
      assertOpen()
      const context = readContext(currentBuffers())
      const typed = createTypedProjectStateReader(context.snapshot, context.readIndex)
      const queryPort = createBinaryProjectStateQueryPort(context.snapshot, {
        typedReader: typed,
        dependencyValidator: options.dependencyValidator,
      })
      return { results: queryPort.readDependencyInputs(params.requests) }
    },
    validateDependencies(_params: ProjectDependencyValidationParams) {
      assertOpen()
      return validateSnapshotDependencies(
        readContext(currentBuffers()),
        options.projectDir ?? "",
        options.dependencyValidator,
      )
    },
    validateDependencyDiagnosticBatches(_params: ProjectDependencyValidationParams) {
      assertOpen()
      return [openDiagnosticBatch(validateDependencyDiagnosticBatch(
        new ProjectStateSnapshotView(currentBuffers()),
        options.projectDir ?? "",
        options.dependencyValidator,
      ))]
    },
    readComponentProjection(componentPath): ProjectStateComponentProjection {
      assertOpen()
      const context = readContext(currentBuffers())
      const { snapshot } = context
      const typed = createTypedProjectStateReader(snapshot, context.readIndex)
      const updates: ProjectStateFileUpdate[] = []
      const hashes: bigint[] = []
      for (let fileId = 0; fileId < snapshot.fileCount; fileId += 1) {
        if (snapshot.componentPath(fileId) !== componentPath) continue
        updates.push(typed.fileUpdate(fileId))
        hashes.push(snapshot.fileRecord(fileId).hash)
      }
      const hashBytes = new Uint8Array(hashes.length * 8)
      const view = new DataView(hashBytes.buffer)
      hashes.forEach((hash, index) => view.setBigUint64(index * 8, hash, false))
      return { componentPath, updates, hashBytes }
    },
    createReadToken() {
      assertOpen()
      return createBinaryProjectStateReadToken(currentBuffers())
    },
    commitUpdate() {
      assertOpen()
      const update = assertActive()
      const changed = update.fragments.length > 0 || update.deletions.size > 0
      published = materialize(update)
      active = undefined
      return changed
    },
    rollbackUpdate() {
      assertOpen()
      assertActive()
      active = undefined
    },
    async checkpoint() {
      assertOpen()
      await options.checkpoint?.(published)
    },
    close() {
      if (closed) return
      active = undefined
      closed = true
    },
  }

  return {
    store,
    openReadSession: (token) => openBinaryProjectStateReadSession(token, options.dependencyValidator),
  }

  function assertOpen(): void {
    if (closed) throw new Error("Двоичное хранилище состояния проекта закрыто")
  }

  function assertActive(): ActiveUpdate {
    if (active === undefined) throw new Error("Нет активного обновления состояния проекта")
    return active
  }

  function currentBuffers(): ProjectStateSharedBuffers {
    return active === undefined ? published : materialize(active)
  }

  function readContext(buffers: ProjectStateSharedBuffers): BinaryProjectStateReadContext {
    let context = readContexts.get(buffers)
    if (context !== undefined) return context
    const snapshot = new ProjectStateSnapshotView(buffers)
    context = { snapshot, readIndex: createTypedProjectStateReadIndex(snapshot) }
    readContexts.set(buffers, context)
    return context
  }

  function materialize(update: ActiveUpdate): ProjectStateSharedBuffers {
    if (update.fragments.length === 0 && update.deletions.size === 0) return published
    update.candidate ??= buildSnapshot({
      base: published,
      fragments: update.fragments,
      deletions: [...update.deletions],
    })
    return update.candidate
  }
}

function remove(active: ActiveUpdate, projectPath: string): void {
  active.deletions.add(projectPath)
  active.candidate = undefined
}

export function projectStateSnapshotIdentity(
  snapshot: ProjectStateSnapshotView,
  fileId: number,
): ProjectStateFileIdentity {
  const record = snapshot.fileRecord(fileId)
  const yamlRole = YAML_ROLES[record.yamlRole]
  return {
    projectPath: snapshot.filePath(fileId),
    componentPath: snapshot.componentPath(fileId),
    resourceKind: record.resourceKind === 1 ? "yaml" : "resource",
    ...(yamlRole === undefined ? {} : { yamlRole }),
  }
}

export function allProjectStateSnapshotIdentities(snapshot: ProjectStateSnapshotView): ProjectStateFileIdentity[] {
  return Array.from({ length: snapshot.fileCount }, (_, fileId) => projectStateSnapshotIdentity(snapshot, fileId))
}

export function sameProjectStateFileIdentity(
  left: ProjectStateFileIdentity,
  right: ProjectStateFileIdentity,
): boolean {
  return left.projectPath === right.projectPath
    && left.componentPath === right.componentPath
    && left.resourceKind === right.resourceKind
    && left.yamlRole === right.yamlRole
}

function readDiagnostics(
  context: BinaryProjectStateReadContext,
  publishedMode: boolean,
  dependencyValidator: ProjectStateDependencyValidator,
): Diagnostic[] {
  const { snapshot } = context
  const typed = createTypedProjectStateReader(snapshot, context.readIndex)
  const blocked = publishedMode
    ? dependencyValidator.readReadiness({
        queryPort: createBinaryProjectStateQueryPort(snapshot, { typedReader: typed, dependencyValidator }),
      }).blockedComponentPaths
    : new Set<string>()
  const diagnostics: Diagnostic[] = []
  for (let fileId = 0; fileId < snapshot.fileCount; fileId += 1) {
    const validation = typed.localValidation(fileId)
    if (validation === undefined) continue
    const selected = publishedMode && blocked.has(snapshot.componentPath(fileId))
      ? validation.schemaDiagnostics
      : validation.diagnostics
    diagnostics.push(...selected.map((diagnostic) => ({ ...diagnostic, filePath: snapshot.filePath(fileId) })))
  }
  return diagnostics
}

function validateSnapshotDependencies(
  context: BinaryProjectStateReadContext,
  projectDir: string,
  dependencyValidator: ProjectStateDependencyValidator,
): Diagnostic[] {
  const { snapshot } = context
  const typed = createTypedProjectStateReader(snapshot, context.readIndex)
  return validateSnapshotDependencyDiagnostics(snapshot, projectDir, dependencyValidator, typed)
}
