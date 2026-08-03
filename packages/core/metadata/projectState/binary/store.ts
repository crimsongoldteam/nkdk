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
import {
  openProjectStateFileUpdateBatch,
  openProjectStateImportFinalBatch,
  openProjectStateImportIndexBatch,
} from "./contribution"
import { createBinaryProjectStateQueryPort, openBinaryProjectStateReadSession } from "./readSession"
import { createBinaryProjectStateReadToken } from "./readToken"
import { ProjectStateSnapshotView, type ProjectStateSharedBuffers } from "./snapshot"
import { openProjectStateFragment, type ProjectStateFragmentView } from "./fragment"
import { createTypedProjectStateReader, hasTypedProjectStateFacts } from "./typedReader"

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
      active = { replacements: new Map(), fragments: [], deletions: new Set() }
    },
    appendFragment(fragment) {
      assertOpen()
      const update = assertActive()
      if (update.replacements.size > 0) {
        throw new Error("Нельзя смешивать предметные пакеты и двоичные фрагменты")
      }
      update.fragments.push(openProjectStateFragment(fragment))
      update.candidate = undefined
    },
    replaceFiles(batch) {
      assertOpen()
      const update = assertActive()
      const encoded = openProjectStateFileUpdateBatch(batch)
      for (let index = 0; index < encoded.fileCount; index += 1) {
        replace(update, encoded.update(index), encoded.hash(index))
      }
    },
    replaceImportIndex(batch) {
      assertOpen()
      const update = assertActive()
      const encoded = openProjectStateImportIndexBatch(batch)
      for (let index = 0; index < encoded.fileCount; index += 1) {
        const contribution = encoded.contribution(index)
        const previousPatch = currentPatch(update, contribution.projectPath)
        const previous = previousPatch?.update
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
        }, previousPatch?.hash ?? 0n)
      }
    },
    registerImportFileIdentities(files) {
      assertOpen()
      const update = assertActive()
      for (const identity of files) {
        const previous = currentPatch(update, identity.projectPath)?.update
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
      const encoded = openProjectStateImportFinalBatch(batch)
      for (let index = 0; index < encoded.fileCount; index += 1) {
        const finalState = encoded.finalState(index)
        const previous = currentPatch(update, finalState.projectPath)?.update
        if (previous === undefined) throw new Error(`Identity файла ${finalState.projectPath} не зарегистрирована`)
        if (!sameIdentity(previous, finalState) || previous.kind !== finalState.kind) {
          throw identityError(finalState.projectPath)
        }
        replace(
          update,
          mergeImportFinal(previous, finalState),
          encoded.hash(index),
        )
      }
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
      const typed = hasTypedProjectStateFacts(snapshot) ? createTypedProjectStateReader(snapshot) : undefined
      const updates: ProjectStateFileUpdate[] = []
      const hashes: bigint[] = []
      for (let fileId = 0; fileId < snapshot.fileCount; fileId += 1) {
        if (snapshot.componentPath(fileId) !== componentPath) continue
        updates.push(typed?.fileUpdate(fileId) ?? decodeUpdate(snapshot, fileId))
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
    if (update.replacements.size === 0 && update.fragments.length === 0 && update.deletions.size === 0) return published
    update.candidate ??= update.fragments.length > 0
      ? buildProjectStateSnapshot({ base: published, fragments: update.fragments, deletions: [...update.deletions] })
      : buildProjectStateSnapshot({ base: published, replacements: [...update.replacements.values()], deletions: [...update.deletions] })
    return update.candidate
  }

  function currentPatch(update: ActiveUpdate, projectPath: string): ProjectStateSnapshotPatch | undefined {
    const replacement = update.replacements.get(projectPath)
    if (replacement !== undefined) return replacement
    if (update.deletions.has(projectPath)) return undefined
    return readPatch(new ProjectStateSnapshotView(published), projectPath)
  }
}

function replace(active: ActiveUpdate, update: ProjectStateFileUpdate, hash: bigint): void {
  if (active.fragments.length > 0) {
    throw new Error("Нельзя смешивать предметные пакеты и двоичные фрагменты")
  }
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

function readPatch(snapshot: ProjectStateSnapshotView, projectPath: string): ProjectStateSnapshotPatch | undefined {
  const fileId = snapshot.findFile(projectPath)
  return fileId === undefined
    ? undefined
    : { update: hasTypedProjectStateFacts(snapshot)
        ? createTypedProjectStateReader(snapshot).fileUpdate(fileId)
        : decodeUpdate(snapshot, fileId), hash: snapshot.fileRecord(fileId).hash }
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

function readDiagnostics(snapshot: ProjectStateSnapshotView, publishedMode: boolean): Diagnostic[] {
  const blocked = publishedMode
    ? readProjectStateDependencyReadiness({ queryPort: createBinaryProjectStateQueryPort(snapshot) }).blockedComponentPaths
    : new Set<string>()
  const diagnostics: Diagnostic[] = []
  const typed = hasTypedProjectStateFacts(snapshot) ? createTypedProjectStateReader(snapshot) : undefined
  for (let fileId = 0; fileId < snapshot.fileCount; fileId += 1) {
    const validation = typed?.localValidation(fileId) ?? snapshot.decodeDiagnostics(fileId) as ProjectStateYamlFileUpdate["localValidation"] | undefined
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
  const typed = hasTypedProjectStateFacts(snapshot) ? createTypedProjectStateReader(snapshot) : undefined
  for (let fileId = 0; fileId < snapshot.fileCount; fileId += 1) {
    const record = snapshot.fileRecord(fileId)
    if (record.updateKind !== 1) continue
    const componentPath = snapshot.componentPath(fileId)
    const projectPath = snapshot.filePath(fileId)
    if (readiness.blockedComponentPaths.has(componentPath)) continue
    const legacy = typed === undefined ? decodeUpdate(snapshot, fileId) : undefined
    const pendingReferences = typed?.pendingReferences(fileId)
      ?? (legacy?.kind === "yaml" ? legacy.pendingReferences : [])
    const pendingChecks = typed?.pendingChecks(fileId)
      ?? (legacy?.kind === "yaml" ? legacy.pendingChecks : [])
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
