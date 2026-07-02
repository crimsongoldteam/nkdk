import type { MetadataTargetConstraint, ParsedMetadataTarget } from "../commonObjects/metadataTargets"
import type { MetadataResolveResult, ProjectMetadataResolver } from "./projectMetadataResolver"
import type { Diagnostic } from "./types"
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

export interface ValidatePendingReferencesResult {
  diagnostics: Diagnostic[]
  hits: number
  misses: number
  fallbacks: number
}

export function validatePendingReferences(params: {
  snapshot: ProjectReferenceSnapshot
  references: readonly PendingMetadataTargetReference[]
  resolver: ProjectMetadataResolver
}): ValidatePendingReferencesResult {
  const diagnostics: Diagnostic[] = []
  let hits = 0
  let misses = 0
  let fallbacks = 0

  for (const reference of params.references) {
    const fast = resolvePendingReference({ snapshot: params.snapshot, reference })
    if (fast.ok) {
      hits += 1
      continue
    }

    misses += 1
    fallbacks += 1
    diagnostics.push(...resolveReferenceByResolver({ reference, resolver: params.resolver }))
  }

  return { diagnostics, hits, misses, fallbacks }
}

function resolveReferenceByResolver(params: {
  reference: PendingMetadataTargetReference
  resolver: ProjectMetadataResolver
}): Diagnostic[] {
  const { target, constraint } = params.reference
  if (target.kind === "object") {
    const result = params.resolver.resolveObject({
      target,
      filters: constraint.kind === "object" ? constraint.filters : undefined,
    })
    return result.ok ? [] : result.diagnostics
  }

  if (target.kind === "member" && constraint.kind === "member") {
    const result = params.resolver.resolveMember({ target, filters: constraint.filters })
    return result.ok ? [] : result.diagnostics
  }

  if (target.kind === "value") {
    const result = params.resolver.resolveValue({ target })
    return result.ok ? [] : result.diagnostics
  }

  return []
}

function isConflict(entry: ProjectMemberIndexEntry | ProjectMemberIndexConflict): entry is ProjectMemberIndexConflict {
  return "conflict" in entry
}
