import {
  assertProjectStateFileHashBatch,
  type ProjectStateFileBaseline,
  type ProjectStateFileHashBatch,
  type ProjectStateFileIdentity,
} from "../contracts"
import { ProjectStateSnapshotView } from "../binary/snapshot"
import { claimBinaryProjectStateReadToken } from "../binary/readToken"
import {
  allProjectStateSnapshotIdentities,
  createBinaryProjectStateStore,
  projectStateSnapshotIdentity,
  sameProjectStateFileIdentity,
} from "../binary/store"
import type { OpenProjectStateStoreParams } from "../backend"
import type { ProjectStateFileChanges, ProjectStateStore } from "../store"
import {
  decodeRustFileBaselineResponse,
  decodeRustFileComparisonResponse,
  encodeRustFileBaselineRequest,
  encodeRustFileComparisonRequest,
} from "./protocol"
import { openRustProjectStateReader, projectStateSectionViews } from "./addon"
import { planRustProjectStateSnapshot } from "./addon"
import type { ProjectStateSharedBuffers } from "../binary/snapshot"
import type { ProjectStateFragmentView } from "../binary/fragment"
import type { ProjectStateSnapshotBuildInput } from "../binary/typedBuilder"
import type { NativeSnapshotStats, ProjectStateFragmentSections } from "@nkdk/project-state-native"
import { openDiagnosticBatch } from "@nkdk/runtime"
import { validateRustDependencyDiagnosticBatches } from "./dependencyValidation"

let lastBuildStats: NativeSnapshotStats | undefined
let lastValidationStats: RustProjectStateValidationStats | undefined

export interface RustProjectStateValidationStats {
  readonly pages: number
  readonly deferredRows: number
  readonly nativeDiagnostics: number
  readonly maxNativeTemporaryBytes: number
}

export function readLastRustProjectStateBuildStats(): NativeSnapshotStats | undefined {
  return lastBuildStats
}

export function readLastRustProjectStateValidationStats(): RustProjectStateValidationStats | undefined {
  return lastValidationStats
}

export function createRustProjectStateStore(
  params: OpenProjectStateStoreParams & { readonly validationPageSize?: number },
): ProjectStateStore {
  const store = createBinaryProjectStateStore({ ...params, buildSnapshot: buildRustSnapshot }).store
  return {
    ...store,
    readFileBaseline: (files) => withReader(store, ({ native, snapshot }) =>
      readFileBaseline(native, snapshot, files)),
    compareFiles: (batch) => withReader(store, ({ native, snapshot }) =>
      compareFiles(native, snapshot, batch)),
    validateDependencyDiagnosticBatches: () => withReader(store, ({ native, snapshot }) => {
      const stats = {
        pages: 0,
        deferredRows: 0,
        nativeDiagnostics: 0,
        maxNativeTemporaryBytes: 0,
      }
      lastValidationStats = undefined
      const batches = validateRustDependencyDiagnosticBatches({
        native,
        snapshot,
        projectDir: params.projectDir ?? "",
        dependencyValidator: params.dependencyValidator,
        ...(params.validationPageSize === undefined ? {} : { pageSize: params.validationPageSize }),
        onPage: (page) => {
          stats.pages += 1
          stats.deferredRows += page.deferredRows
          stats.nativeDiagnostics += page.nativeDiagnostics
          stats.maxNativeTemporaryBytes = Math.max(
            stats.maxNativeTemporaryBytes,
            page.nativeTemporaryBytes,
          )
        },
      })
      lastValidationStats = stats
      return batches.map(openDiagnosticBatch)
    }),
  }
}

function buildRustSnapshot(input: ProjectStateSnapshotBuildInput): ProjectStateSharedBuffers {
  if (input.base !== undefined && input.fragments.length === 0 && input.deletions.length === 0) return input.base
  const plan = planRustProjectStateSnapshot({
    ...(input.base === undefined ? {} : { base: projectStateSectionViews(input.base) }),
    fragments: input.fragments.map(({ buffers }) => fragmentSectionViews(buffers)),
    deletedProjectPaths: input.deletions,
  })
  try {
    const layout = plan.layout()
    const output = {
      header: new SharedArrayBuffer(layout.header),
      strings: new SharedArrayBuffer(layout.strings),
      files: new SharedArrayBuffer(layout.files),
      facts: new SharedArrayBuffer(layout.facts),
      lookups: new SharedArrayBuffer(layout.lookups),
      diagnostics: new SharedArrayBuffer(layout.diagnostics),
    }
    lastBuildStats = plan.writeInto(projectStateSectionViews(output))
    new ProjectStateSnapshotView(output)
    return output
  } finally {
    plan.close()
  }
}

function fragmentSectionViews(
  buffers: ProjectStateFragmentView["buffers"],
): ProjectStateFragmentSections {
  return {
    header: new Uint8Array(buffers.header), strings: new Uint8Array(buffers.strings),
    files: new Uint8Array(buffers.files), facts: new Uint8Array(buffers.facts),
    diagnostics: new Uint8Array(buffers.diagnostics),
  }
}

function readFileBaseline(
  native: ReturnType<typeof openRustProjectStateReader>,
  snapshot: ProjectStateSnapshotView,
  files: readonly ProjectStateFileIdentity[],
): ProjectStateFileBaseline {
  const found = decodeRustFileBaselineResponse(native.execute(
    encodeRustFileBaselineRequest(files.map(({ projectPath }) => projectPath)),
  ))
  const knownHashBits = new Uint8Array(Math.ceil(files.length / 8))
  const hashBytes = new Uint8Array(files.length * 8)
  const hashes = new DataView(hashBytes.buffer)
  found.forEach((result, index) => {
    if (result.status !== "found") return
    if (!sameProjectStateFileIdentity(projectStateSnapshotIdentity(snapshot, result.fileId!), files[index]!)) return
    knownHashBits[Math.floor(index / 8)]! |= 1 << (index % 8)
    hashes.setBigUint64(index * 8, result.hash!, false)
  })
  const requestedPaths = new Set(files.map(({ projectPath }) => projectPath))
  return {
    knownHashBits,
    hashBytes,
    deleted: allProjectStateSnapshotIdentities(snapshot).filter(({ projectPath }) => !requestedPaths.has(projectPath)),
  }
}

function compareFiles(
  native: ReturnType<typeof openRustProjectStateReader>,
  snapshot: ProjectStateSnapshotView,
  batch: ProjectStateFileHashBatch,
): ProjectStateFileChanges {
  assertProjectStateFileHashBatch(batch)
  const hashes = new DataView(batch.hashBytes.buffer, batch.hashBytes.byteOffset, batch.hashBytes.byteLength)
  const result = decodeRustFileComparisonResponse(native.execute(encodeRustFileComparisonRequest(
    batch.files.map((file, index) => ({ ...file, hash: hashes.getBigUint64(index * 8, false) })),
  )))
  return {
    changed: result.changed.map(({ index }) => ({ index, file: batch.files[index]! })),
    deleted: result.deletedFileIds.map((fileId) => projectStateSnapshotIdentity(snapshot, fileId)),
  }
}

function withReader<T>(
  store: ProjectStateStore,
  operation: (context: {
    readonly native: ReturnType<typeof openRustProjectStateReader>
    readonly snapshot: ProjectStateSnapshotView
  }) => T,
): T {
  const buffers = claimBinaryProjectStateReadToken(store.createReadToken())
  const native = openRustProjectStateReader(projectStateSectionViews(buffers))
  try {
    return operation({ native, snapshot: new ProjectStateSnapshotView(buffers) })
  } finally {
    native.close()
  }
}
