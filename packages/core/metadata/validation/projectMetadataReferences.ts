import {
  createProjectReferenceSnapshot as createUnifiedProjectReferenceSnapshot,
  estimateProjectReferenceSnapshotBytes,
  projectMemberIndexKey,
  type PendingMetadataTargetReference,
  type ProjectMemberIndexEntry,
  type ProjectObjectIndexEntry,
  type ProjectReferenceIndexConflict,
  type ProjectReferenceIndexResult,
  type ProjectReferenceSnapshot,
  type ProjectValueIndexEntry,
} from "./projectReferenceIndex"

export {
  estimateProjectReferenceSnapshotBytes,
  projectMemberIndexKey,
  type PendingMetadataTargetReference,
  type ProjectMemberIndexEntry,
  type ProjectObjectIndexEntry,
  type ProjectReferenceIndexConflict,
  type ProjectReferenceIndexResult,
  type ProjectReferenceSnapshot,
  type ProjectValueIndexEntry,
}

export type PendingReferenceFastResult =
  | { ok: true }
  | { ok: false; reason: "miss" | "conflict" | "unsupported" }

export function createProjectReferenceSnapshot(params: {
  objectIndexEntries?: readonly ProjectObjectIndexEntry[]
  memberIndexEntries: readonly ProjectMemberIndexEntry[]
  valueIndexEntries?: readonly ProjectValueIndexEntry[]
  pendingReferences: readonly PendingMetadataTargetReference[]
}): ProjectReferenceSnapshot {
  return createUnifiedProjectReferenceSnapshot({
    objectIndexEntries: params.objectIndexEntries ?? [],
    memberIndexEntries: params.memberIndexEntries,
    valueIndexEntries: params.valueIndexEntries ?? [],
    pendingReferences: params.pendingReferences,
  })
}

export function resolvePendingReference(params: {
  snapshot: ProjectReferenceSnapshot
  reference: PendingMetadataTargetReference
}): PendingReferenceFastResult {
  if (params.reference.target.kind !== "member") return { ok: false, reason: "unsupported" }

  const entry = params.snapshot.memberIndexByKey[projectMemberIndexKey(params.reference.target)]
  if (entry === undefined) return { ok: false, reason: "miss" }
  if (isConflict(entry)) return { ok: false, reason: "conflict" }
  return { ok: true }
}

function isConflict(
  entry: ProjectMemberIndexEntry | ProjectReferenceIndexConflict
): entry is ProjectReferenceIndexConflict {
  return "conflict" in entry
}
