import type { Diagnostic } from "../../validation/types"
import {
  readProjectStateDependencyReadiness,
  validateProjectStateDependencyBatch,
  validateProjectStateOwnerBatch,
  validateProjectStateReferenceBatch,
  type ProjectStatePendingOwnerCheck,
  type ProjectStatePendingReferenceCheck,
} from "../dependencyValidation"
import {
  assertProjectStateFileBaseline,
  assertProjectStateFileBaselinePage,
  assertProjectStateFileHashBatch,
  type ProjectStateReadToken,
} from "../contracts"
import {
  type ProjectStateFileIdentity,
  type ProjectStateFileUpdate,
} from "../fileUpdate"
import type { ProjectDependencyInputQuery, ProjectStateReadSession } from "../readSession"
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
import { createTypedProjectStateReader } from "./typedReader"

export interface BinaryProjectStateStoreOptions {
  readonly initial?: ProjectStateSharedBuffers
  readonly checkpoint?: (buffers: ProjectStateSharedBuffers) => Promise<void>
  readonly projectDir?: string
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

const YAML_ROLES = [undefined, "configuration", "properties", "form"] as const

export function createBinaryProjectStateStore(
  options: BinaryProjectStateStoreOptions = {},
): BinaryProjectStateStoreFixture {
  let published = options.initial ?? buildProjectStateSnapshot({ fragments: [], deletions: [] })
  let active: ActiveUpdate | undefined
  let closed = false

  const store: ProjectStateStore = {
    readFileBaseline(files) {
      assertOpen()
      const snapshot = new ProjectStateSnapshotView(currentBuffers())
      const knownHashBits = new Uint8Array(Math.ceil(files.length / 8))
      const hashBytes = new Uint8Array(files.length * 8)
      const requestedPaths = new Set(files.map(({ projectPath }) => projectPath))
      files.forEach((file, index) => {
      const fileId = snapshot.findFile(file.projectPath)
        if (fileId === undefined || !sameIdentity(snapshotIdentity(snapshot, fileId), file)) return
        knownHashBits[Math.floor(index / 8)]! |= 1 << (index % 8)
        new DataView(hashBytes.buffer).setBigUint64(index * 8, snapshot.fileRecord(fileId).hash, false)
      })
      const deleted = allIdentities(snapshot).filter(({ projectPath }) => !requestedPaths.has(projectPath))
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
            && sameIdentity(snapshotIdentity(snapshot, fileId), file)
            && snapshot.fileRecord(fileId).hash === hashes.getBigUint64(index * 8, false)
            ? []
            : [{ index, file }]
        }),
        deleted: allIdentities(snapshot).filter(({ projectPath }) => !requestedPaths.has(projectPath)),
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
        new ProjectStateSnapshotView(currentBuffers()),
        params?.mode === "published",
      )
    },
    readDependencyCheckBatch(params: ProjectDependencyBatchQuery) {
      assertOpen()
      const queryPort = createBinaryProjectStateQueryPort(new ProjectStateSnapshotView(currentBuffers()))
      return { results: queryPort.readDependencyInputs(params.requests) }
    },
    validateDependencies(_params: ProjectDependencyValidationParams) {
      assertOpen()
      return validateSnapshotDependencies(
        new ProjectStateSnapshotView(currentBuffers()),
        options.projectDir ?? "",
      )
    },
    readComponentProjection(componentPath): ProjectStateComponentProjection {
      assertOpen()
      const snapshot = new ProjectStateSnapshotView(currentBuffers())
      const typed = createTypedProjectStateReader(snapshot)
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

  return { store, openReadSession: openBinaryProjectStateReadSession }

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

  function materialize(update: ActiveUpdate): ProjectStateSharedBuffers {
    if (update.fragments.length === 0 && update.deletions.size === 0) return published
    update.candidate ??= buildProjectStateSnapshot({
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

function snapshotIdentity(snapshot: ProjectStateSnapshotView, fileId: number): ProjectStateFileIdentity {
  const record = snapshot.fileRecord(fileId)
  const yamlRole = YAML_ROLES[record.yamlRole]
  return {
    projectPath: snapshot.filePath(fileId),
    componentPath: snapshot.componentPath(fileId),
    resourceKind: record.resourceKind === 1 ? "yaml" : "resource",
    ...(yamlRole === undefined ? {} : { yamlRole }),
  }
}

function allIdentities(snapshot: ProjectStateSnapshotView): ProjectStateFileIdentity[] {
  return Array.from({ length: snapshot.fileCount }, (_, fileId) => snapshotIdentity(snapshot, fileId))
}

function sameIdentity(left: ProjectStateFileIdentity, right: ProjectStateFileIdentity): boolean {
  return left.projectPath === right.projectPath
    && left.componentPath === right.componentPath
    && left.resourceKind === right.resourceKind
    && left.yamlRole === right.yamlRole
}

function readDiagnostics(snapshot: ProjectStateSnapshotView, publishedMode: boolean): Diagnostic[] {
  const blocked = publishedMode
    ? readProjectStateDependencyReadiness({ queryPort: createBinaryProjectStateQueryPort(snapshot) }).blockedComponentPaths
    : new Set<string>()
  const diagnostics: Diagnostic[] = []
  const typed = createTypedProjectStateReader(snapshot)
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

function validateSnapshotDependencies(snapshot: ProjectStateSnapshotView, projectDir: string): Diagnostic[] {
  const queryPort = createBinaryProjectStateQueryPort(snapshot)
  const readiness = readProjectStateDependencyReadiness({ queryPort })
  const references: ProjectStatePendingReferenceCheck[] = []
  const dependencies: ProjectDependencyInputQuery[] = []
  const owners: ProjectStatePendingOwnerCheck[] = []
  const seenOwners = new Set<string>()
  const typed = createTypedProjectStateReader(snapshot)
  for (let fileId = 0; fileId < snapshot.fileCount; fileId += 1) {
    const record = snapshot.fileRecord(fileId)
    if (record.updateKind !== 1) continue
    const componentPath = snapshot.componentPath(fileId)
    const projectPath = snapshot.filePath(fileId)
    if (readiness.blockedComponentPaths.has(componentPath)) continue
    const pendingReferences = typed.pendingReferences(fileId)
    const pendingChecks = typed.pendingChecks(fileId)
    pendingReferences.forEach((reference, index) => references.push({
      requestId: `reference:${fileId}:${index}`,
      componentPath,
      reference: { ...reference, filePath: projectPath },
    }))
    pendingChecks.forEach((check, index) => {
      dependencies.push({
        requestId: `dependency:${fileId}:${index}`,
        componentPath,
        projectPath,
        check,
      })
      const ownerKey = `${componentPath}\u0000${check.owner.kind}\u0000${check.owner.name ?? ""}`
      if (!seenOwners.has(ownerKey)) {
        seenOwners.add(ownerKey)
        owners.push({ requestId: `owner:${fileId}:${index}`, componentPath, owner: check.owner })
      }
    })
  }
  return [
    ...validateProjectStateReferenceBatch({ checks: references, projectDir, queryPort }),
    ...validateProjectStateOwnerBatch({ checks: owners, projectDir, queryPort }),
    ...validateProjectStateDependencyBatch({ checks: dependencies, projectDir, queryPort }),
    ...readiness.diagnostics,
  ]
}
