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
  assertProjectStateFileHashBatch,
  type ProjectStateReadToken,
} from "../contracts"
import {
  assertProjectStateFileUpdateBatch,
  type ProjectStateFileIdentity,
  type ProjectStateFileUpdate,
  type ProjectStateYamlFileUpdate,
} from "../fileUpdate"
import type {
  ProjectStateImportFinalFileState,
} from "../importSession"
import type { ProjectDependencyInputQuery, ProjectStateReadSession } from "../readSession"
import type {
  ProjectDependencyBatchQuery,
  ProjectDependencyValidationParams,
  ProjectStateComponentProjection,
  ProjectStateStore,
} from "../store"
import { buildProjectStateSnapshot, type ProjectStateSnapshotPatch } from "./builder"
import { createBinaryProjectStateQueryPort, openBinaryProjectStateReadSession } from "./readSession"
import { createBinaryProjectStateReadToken } from "./readToken"
import { ProjectStateSnapshotView, type ProjectStateSharedBuffers } from "./snapshot"

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
  readonly replacements: Map<string, ProjectStateSnapshotPatch>
  readonly deletions: Set<string>
  candidate?: ProjectStateSharedBuffers
}

const YAML_ROLES = [undefined, "configuration", "properties", "form"] as const

export function createBinaryProjectStateStore(
  options: BinaryProjectStateStoreOptions = {},
): BinaryProjectStateStoreFixture {
  let published = options.initial ?? buildProjectStateSnapshot({ replacements: [], deletions: [] })
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
        const fileId = findFile(snapshot, file.projectPath)
        if (fileId === undefined || !sameIdentity(snapshotIdentity(snapshot, fileId), file)) return
        knownHashBits[Math.floor(index / 8)]! |= 1 << (index % 8)
        new DataView(hashBytes.buffer).setBigUint64(index * 8, snapshot.fileRecord(fileId).hash, false)
      })
      const deleted = allIdentities(snapshot).filter(({ projectPath }) => !requestedPaths.has(projectPath))
      const result = { knownHashBits, hashBytes, deleted }
      assertProjectStateFileBaseline(result, files.length)
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
          const fileId = findFile(snapshot, file.projectPath)
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
      active = { replacements: new Map(), deletions: new Set() }
    },
    replaceFiles(batch) {
      assertOpen()
      const update = assertActive()
      assertProjectStateFileUpdateBatch(batch)
      const hashes = new DataView(batch.hashBytes.buffer)
      batch.updates.forEach((file, index) => replace(update, file, hashes.getBigUint64(index * 8, false)))
    },
    replaceImportIndex(batch) {
      assertOpen()
      const update = assertActive()
      for (const contribution of batch) {
        const previous = readUpdate(new ProjectStateSnapshotView(materialize(update)), contribution.projectPath)
        const localValidation = previous?.kind === "yaml"
          ? previous.localValidation
          : { contributedFacts: false, diagnostics: [], schemaDiagnostics: [] }
        replace(update, {
          ...contribution,
          kind: "yaml",
          localValidation,
          pendingReferences: previous?.kind === "yaml" ? previous.pendingReferences : [],
          pendingChecks: previous?.kind === "yaml" ? previous.pendingChecks : [],
          dependencies: previous?.kind === "yaml" ? previous.dependencies : [],
        }, previous === undefined ? 0n : readHash(new ProjectStateSnapshotView(materialize(update)), contribution.projectPath))
      }
    },
    registerImportFileIdentities(files) {
      assertOpen()
      const update = assertActive()
      for (const identity of files) {
        const snapshot = new ProjectStateSnapshotView(materialize(update))
        const previous = readUpdate(snapshot, identity.projectPath)
        if (previous !== undefined) {
          if (!sameIdentity(previous, identity)) throw identityError(identity.projectPath)
          continue
        }
        replace(update, placeholder(identity), 0n)
      }
    },
    replaceImportFinalFileState(batch) {
      assertOpen()
      const update = assertActive()
      assertHashBytes(batch.hashBytes, batch.updates.length)
      const hashes = new DataView(batch.hashBytes.buffer)
      batch.updates.forEach((finalState, index) => {
        const snapshot = new ProjectStateSnapshotView(materialize(update))
        const previous = readUpdate(snapshot, finalState.projectPath)
        if (previous === undefined) throw new Error(`Identity файла ${finalState.projectPath} не зарегистрирована`)
        if (!sameIdentity(previous, finalState) || previous.kind !== finalState.kind) {
          throw identityError(finalState.projectPath)
        }
        replace(update, mergeImportFinal(previous, finalState), hashes.getBigUint64(index * 8, false))
      })
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
      const updates: ProjectStateFileUpdate[] = []
      const hashes: bigint[] = []
      for (let fileId = 0; fileId < snapshot.fileCount; fileId += 1) {
        if (snapshot.componentPath(fileId) !== componentPath) continue
        updates.push(decodeUpdate(snapshot, fileId))
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
      published = materialize(update)
      active = undefined
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
    update.candidate ??= buildProjectStateSnapshot({
      base: published,
      replacements: [...update.replacements.values()],
      deletions: [...update.deletions],
    })
    return update.candidate
  }
}

function replace(active: ActiveUpdate, update: ProjectStateFileUpdate, hash: bigint): void {
  active.deletions.delete(update.projectPath)
  active.replacements.set(update.projectPath, { update, hash })
  active.candidate = undefined
}

function remove(active: ActiveUpdate, projectPath: string): void {
  active.replacements.delete(projectPath)
  active.deletions.add(projectPath)
  active.candidate = undefined
}

function placeholder(identity: ProjectStateFileIdentity): ProjectStateFileUpdate {
  if (identity.resourceKind === "resource") return { ...identity, kind: "resource" }
  if (identity.yamlRole === undefined) throw identityError(identity.projectPath)
  return {
    ...identity,
    kind: "yaml",
    yamlRole: identity.yamlRole,
    localValidation: { contributedFacts: false, diagnostics: [], schemaDiagnostics: [] },
    references: [],
    pendingReferences: [],
    owners: [],
    fields: [],
    forms: [],
    pendingChecks: [],
    dependencies: [],
  }
}

function mergeImportFinal(
  previous: ProjectStateFileUpdate,
  finalState: ProjectStateImportFinalFileState,
): ProjectStateFileUpdate {
  if (finalState.kind === "resource") return finalState
  if (previous.kind !== "yaml") throw identityError(finalState.projectPath)
  return {
    ...previous,
    localValidation: finalState.localValidation,
    pendingReferences: finalState.pendingReferences,
    pendingChecks: finalState.pendingChecks,
    dependencies: finalState.dependencies,
  }
}

function readHash(snapshot: ProjectStateSnapshotView, projectPath: string): bigint {
  const fileId = findFile(snapshot, projectPath)
  return fileId === undefined ? 0n : snapshot.fileRecord(fileId).hash
}

function readUpdate(snapshot: ProjectStateSnapshotView, projectPath: string): ProjectStateFileUpdate | undefined {
  const fileId = findFile(snapshot, projectPath)
  return fileId === undefined ? undefined : decodeUpdate(snapshot, fileId)
}

function decodeUpdate(snapshot: ProjectStateSnapshotView, fileId: number): ProjectStateFileUpdate {
  const identity = snapshotIdentity(snapshot, fileId)
  const record = snapshot.fileRecord(fileId)
  if (record.updateKind === 2) return { ...identity, kind: "resource" }
  const facts = snapshot.decodeFacts(fileId) as Omit<
    ProjectStateYamlFileUpdate,
    keyof ProjectStateFileIdentity | "kind" | "localValidation"
  >
  const localValidation = snapshot.decodeDiagnostics(fileId) as ProjectStateYamlFileUpdate["localValidation"]
  return { ...identity, kind: "yaml", ...facts, localValidation } as ProjectStateYamlFileUpdate
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

function identityError(projectPath: string): Error {
  return new Error(`Нельзя менять identity индексированного файла ${projectPath}`)
}

function assertHashBytes(hashBytes: Uint8Array, fileCount: number): void {
  const expectedLength = fileCount * 8
  if (
    !(hashBytes instanceof Uint8Array)
    || hashBytes.byteOffset !== 0
    || hashBytes.byteLength !== expectedLength
    || hashBytes.buffer.byteLength !== expectedLength
  ) {
    throw new Error(`hashBytes должен занимать ${expectedLength} байт`)
  }
}

function findFile(snapshot: ProjectStateSnapshotView, projectPath: string): number | undefined {
  let low = 0
  let high = snapshot.fileCount - 1
  while (low <= high) {
    const middle = (low + high) >>> 1
    const candidate = snapshot.filePath(middle)
    if (candidate === projectPath) return middle
    if (candidate < projectPath) low = middle + 1
    else high = middle - 1
  }
  return undefined
}

function readDiagnostics(snapshot: ProjectStateSnapshotView, publishedMode: boolean): Diagnostic[] {
  const blocked = publishedMode
    ? readProjectStateDependencyReadiness({ queryPort: createBinaryProjectStateQueryPort(snapshot) }).blockedComponentPaths
    : new Set<string>()
  const diagnostics: Diagnostic[] = []
  for (let fileId = 0; fileId < snapshot.fileCount; fileId += 1) {
    const validation = snapshot.decodeDiagnostics(fileId) as ProjectStateYamlFileUpdate["localValidation"] | undefined
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
  for (let fileId = 0; fileId < snapshot.fileCount; fileId += 1) {
    const update = decodeUpdate(snapshot, fileId)
    if (update.kind !== "yaml" || readiness.blockedComponentPaths.has(update.componentPath)) continue
    update.pendingReferences.forEach((reference, index) => references.push({
      requestId: `reference:${fileId}:${index}`,
      componentPath: update.componentPath,
      reference: { ...reference, filePath: update.projectPath },
    }))
    update.pendingChecks.forEach((check, index) => {
      dependencies.push({
        requestId: `dependency:${fileId}:${index}`,
        componentPath: update.componentPath,
        projectPath: update.projectPath,
        check,
      })
      const ownerKey = `${update.componentPath}\u0000${check.owner.kind}\u0000${check.owner.name ?? ""}`
      if (!seenOwners.has(ownerKey)) {
        seenOwners.add(ownerKey)
        owners.push({ requestId: `owner:${fileId}:${index}`, componentPath: update.componentPath, owner: check.owner })
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
