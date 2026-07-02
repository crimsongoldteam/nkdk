import type { MetadataTargetConstraint, ParsedMetadataTarget } from "../commonObjects/metadataTargets"
import type { MetadataResolveResult } from "./projectMetadataResolver"
import type { YamlPath } from "./yamlLocations"

export interface ProjectMemberIndexEntry {
  canonical: string
  target: Extract<ParsedMetadataTarget, { kind: "member" }>
  result: MetadataResolveResult
}

export interface PendingMetadataTargetReference {
  filePath: string
  yamlPath: YamlPath
  canonical: string
  target: ParsedMetadataTarget
  constraint: MetadataTargetConstraint
}

export interface ProjectReferenceSnapshot {
  memberIndex: Array<ProjectMemberIndexEntry | ProjectMemberIndexConflict>
  pendingReferences: PendingMetadataTargetReference[]
  stats: {
    memberEntries: number
    pendingReferences: number
    conflicts: number
    snapshotBytes: number
  }
}

export interface ProjectMemberIndexConflict {
  canonical: string
  conflict: true
}

export type PendingReferenceFastResult =
  | { ok: true }
  | { ok: false; reason: "miss" | "conflict" | "unsupported" }

export function projectMemberIndexKey(target: Extract<ParsedMetadataTarget, { kind: "member" }>): string {
  return [
    target.root,
    target.objectName,
    ...(target.objectSegments ?? []).flatMap((segment) => [segment.kind, segment.objectName]),
    ...target.segments.flatMap((segment) => [segment.kind, segment.name]),
  ].join(".")
}

export function createProjectReferenceSnapshot(params: {
  memberIndexEntries: readonly ProjectMemberIndexEntry[]
  pendingReferences: readonly PendingMetadataTargetReference[]
}): ProjectReferenceSnapshot {
  const entriesByKey = new Map<string, ProjectMemberIndexEntry | ProjectMemberIndexConflict>()
  for (const entry of params.memberIndexEntries) {
    const existing = entriesByKey.get(entry.canonical)
    if (existing === undefined) {
      entriesByKey.set(entry.canonical, entry)
      continue
    }

    entriesByKey.set(entry.canonical, { canonical: entry.canonical, conflict: true })
  }

  const memberIndex = [...entriesByKey.values()]
  const snapshotWithoutBytes = {
    memberIndex,
    pendingReferences: [...params.pendingReferences],
    stats: {
      memberEntries: memberIndex.length,
      pendingReferences: params.pendingReferences.length,
      conflicts: memberIndex.filter(isConflict).length,
      snapshotBytes: 0,
    },
  }

  return {
    ...snapshotWithoutBytes,
    stats: {
      ...snapshotWithoutBytes.stats,
      snapshotBytes: estimateProjectReferenceSnapshotBytes(snapshotWithoutBytes),
    },
  }
}

export function resolvePendingReference(params: {
  snapshot: ProjectReferenceSnapshot
  reference: PendingMetadataTargetReference
}): PendingReferenceFastResult {
  if (params.reference.target.kind !== "member") return { ok: false, reason: "unsupported" }

  const index = new Map(params.snapshot.memberIndex.map((entry) => [entry.canonical, entry]))
  const entry = index.get(projectMemberIndexKey(params.reference.target))
  if (entry === undefined) return { ok: false, reason: "miss" }
  if (isConflict(entry)) return { ok: false, reason: "conflict" }
  return { ok: true }
}

export function estimateProjectReferenceSnapshotBytes(
  snapshot: Omit<ProjectReferenceSnapshot, "stats"> | ProjectReferenceSnapshot
): number {
  return Buffer.byteLength(JSON.stringify(snapshot), "utf8")
}

function isConflict(entry: ProjectMemberIndexEntry | ProjectMemberIndexConflict): entry is ProjectMemberIndexConflict {
  return "conflict" in entry
}
