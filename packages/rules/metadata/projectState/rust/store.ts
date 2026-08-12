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

export function createRustProjectStateStore(params: OpenProjectStateStoreParams): ProjectStateStore {
  const store = createBinaryProjectStateStore(params).store
  return {
    ...store,
    readFileBaseline: (files) => withReader(store, ({ native, snapshot }) =>
      readFileBaseline(native, snapshot, files)),
    compareFiles: (batch) => withReader(store, ({ native, snapshot }) =>
      compareFiles(native, snapshot, batch)),
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
