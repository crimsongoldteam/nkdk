import type { MetadataTargetConstraint, ParsedMetadataTarget } from "../commonObjects/metadataTargets"
import type { ValidationDependencyRequest } from "./projectValidationTypes"
import type { Diagnostic } from "./types"
import type { YamlPath } from "./yamlLocations"

export type MetadataReferenceResolveResult =
  | { ok: true; filePath?: string; details?: unknown }
  | { ok: false; diagnostics: Diagnostic[]; dependency?: ValidationDependencyRequest }

export interface ProjectObjectIndexEntry {
  canonical: string
  target: Extract<ParsedMetadataTarget, { kind: "object" }>
  result: MetadataReferenceResolveResult
}

export interface ProjectMemberIndexEntry {
  canonical: string
  target: Extract<ParsedMetadataTarget, { kind: "member" }>
  result: MetadataReferenceResolveResult
}

export interface ProjectValueIndexEntry {
  canonical: string
  target: Extract<ParsedMetadataTarget, { kind: "value" }>
  result: MetadataReferenceResolveResult
}

export interface PendingMetadataTargetReference {
  filePath: string
  yamlPath: YamlPath
  canonical: string
  target: ParsedMetadataTarget
  constraint: MetadataTargetConstraint
}

export interface ProjectReferenceSnapshot {
  objectIndex: Array<ProjectObjectIndexEntry | ProjectReferenceIndexConflict>
  objectIndexByKey: Record<string, ProjectObjectIndexEntry | ProjectReferenceIndexConflict>
  memberIndex: Array<ProjectMemberIndexEntry | ProjectReferenceIndexConflict>
  memberIndexByKey: Record<string, ProjectMemberIndexEntry | ProjectReferenceIndexConflict>
  valueIndex: Array<ProjectValueIndexEntry | ProjectReferenceIndexConflict>
  valueIndexByKey: Record<string, ProjectValueIndexEntry | ProjectReferenceIndexConflict>
  pendingReferences: PendingMetadataTargetReference[]
  stats: ProjectReferenceSnapshotStats
}

export interface ProjectReferenceSnapshotStats {
  objectEntries: number
  memberEntries: number
  valueEntries: number
  pendingReferences: number
  conflicts: number
  snapshotBytes: number
}

export interface ProjectReferenceIndexConflict {
  canonical: string
  conflict: true
}

export interface ProjectReferenceIndex {
  resolve(reference: PendingMetadataTargetReference): ProjectReferenceIndexResult
  stats(): ProjectReferenceIndexStats
}

export type ProjectReferenceIndexResult =
  | { ok: true }
  | { ok: false; reason: "notFound"; diagnostics: Diagnostic[] }
  | { ok: false; reason: "conflict"; diagnostics: Diagnostic[] }
  | { ok: false; reason: "filter"; diagnostics: Diagnostic[] }
  | { ok: false; reason: "needsDependency"; dependency: ValidationDependencyRequest; diagnostics: Diagnostic[] }
  | { ok: false; reason: "unsupported"; diagnostics: Diagnostic[] }

export interface ProjectReferenceIndexStats {
  hits: number
  misses: number
  conflicts: number
  filterFailures: number
  dependencies: number
  unsupported: number
  fallbacks: 0
}

export interface ValidatePendingReferencesWithIndexResult {
  diagnostics: Diagnostic[]
  stats: ProjectReferenceIndexStats
}

export function projectObjectIndexKey(target: Extract<ParsedMetadataTarget, { kind: "object" }>): string {
  return [
    target.root,
    target.objectName,
    ...(target.segments ?? []).flatMap((segment) => [segment.kind, segment.objectName]),
  ].join(".")
}

export function projectMemberIndexKey(target: Extract<ParsedMetadataTarget, { kind: "member" }>): string {
  return [
    target.root,
    target.objectName,
    ...(target.objectSegments ?? []).flatMap((segment) => [segment.kind, segment.objectName]),
    ...target.segments.flatMap((segment) => [segment.kind, segment.name]),
  ].join(".")
}

export function projectValueIndexKey(target: Extract<ParsedMetadataTarget, { kind: "value" }>): string {
  const base = [
    target.root,
    target.objectName,
    ...(target.kind === "value" && "objectSegments" in target ? target.objectSegments ?? [] : []).flatMap((segment) => [
      segment.kind,
      segment.objectName,
    ]),
    target.valueKind,
  ]
  if ("valueName" in target) return [...base, target.valueName].join(".")
  return base.join(".")
}

export function createProjectReferenceSnapshot(params: {
  objectIndexEntries: readonly ProjectObjectIndexEntry[]
  memberIndexEntries: readonly ProjectMemberIndexEntry[]
  valueIndexEntries: readonly ProjectValueIndexEntry[]
  pendingReferences: readonly PendingMetadataTargetReference[]
}): ProjectReferenceSnapshot {
  const objectIndex = uniqueEntries(params.objectIndexEntries)
  const memberIndex = uniqueEntries(params.memberIndexEntries)
  const valueIndex = uniqueEntries(params.valueIndexEntries)
  const snapshotWithoutBytes = {
    objectIndex: objectIndex.entries,
    objectIndexByKey: objectIndex.byKey,
    memberIndex: memberIndex.entries,
    memberIndexByKey: memberIndex.byKey,
    valueIndex: valueIndex.entries,
    valueIndexByKey: valueIndex.byKey,
    pendingReferences: [...params.pendingReferences],
    stats: {
      objectEntries: objectIndex.entries.length,
      memberEntries: memberIndex.entries.length,
      valueEntries: valueIndex.entries.length,
      pendingReferences: params.pendingReferences.length,
      conflicts: objectIndex.conflicts + memberIndex.conflicts + valueIndex.conflicts,
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

export function estimateProjectReferenceSnapshotBytes(
  snapshot: Omit<ProjectReferenceSnapshot, "stats"> | ProjectReferenceSnapshot
): number {
  return Buffer.byteLength(JSON.stringify(snapshot), "utf8")
}

export function createProjectReferenceIndex(params: {
  projectDir: string
  mode: "full" | "partial"
  snapshot: ProjectReferenceSnapshot
}): ProjectReferenceIndex {
  const stats: ProjectReferenceIndexStats = {
    hits: 0,
    misses: 0,
    conflicts: 0,
    filterFailures: 0,
    dependencies: 0,
    unsupported: 0,
    fallbacks: 0,
  }

  return {
    resolve(reference) {
      const result = resolveReference(params.snapshot, reference)
      if (result.ok) stats.hits += 1
      else if (result.reason === "notFound") stats.misses += 1
      else if (result.reason === "conflict") stats.conflicts += 1
      else if (result.reason === "filter") stats.filterFailures += 1
      else if (result.reason === "needsDependency") stats.dependencies += 1
      else stats.unsupported += 1
      return result
    },
    stats() {
      return { ...stats }
    },
  }
}

export function validatePendingReferencesWithIndex(params: {
  index: ProjectReferenceIndex
  references: readonly PendingMetadataTargetReference[]
}): ValidatePendingReferencesWithIndexResult {
  const diagnostics: Diagnostic[] = []
  for (const reference of params.references) {
    const result = params.index.resolve(reference)
    if (!result.ok) diagnostics.push(...result.diagnostics)
  }
  return { diagnostics, stats: params.index.stats() }
}

function resolveReference(
  snapshot: ProjectReferenceSnapshot,
  reference: PendingMetadataTargetReference
): ProjectReferenceIndexResult {
  const entry = lookupEntry(snapshot, reference.target)
  if (entry === undefined) {
    return {
      ok: false,
      reason: "notFound",
      diagnostics: [referenceDiagnostic(reference, `Не найдена ссылка "${reference.canonical}"`)],
    }
  }
  if (isConflict(entry)) {
    return {
      ok: false,
      reason: "conflict",
      diagnostics: [referenceDiagnostic(reference, `Неоднозначная ссылка "${reference.canonical}"`)],
    }
  }
  if (!entry.result.ok) {
    if (entry.result.dependency !== undefined) {
      return {
        ok: false,
        reason: "needsDependency",
        dependency: entry.result.dependency,
        diagnostics: entry.result.diagnostics,
      }
    }
    return { ok: false, reason: "notFound", diagnostics: entry.result.diagnostics }
  }
  return { ok: true }
}

function lookupEntry(snapshot: ProjectReferenceSnapshot, target: ParsedMetadataTarget) {
  if (target.kind === "object") return snapshot.objectIndexByKey[projectObjectIndexKey(target)]
  if (target.kind === "member") return snapshot.memberIndexByKey[projectMemberIndexKey(target)]
  if (target.kind === "value") return snapshot.valueIndexByKey[projectValueIndexKey(target)]
  return undefined
}

function referenceDiagnostic(reference: PendingMetadataTargetReference, message: string): Diagnostic {
  return {
    filePath: reference.filePath,
    line: 1,
    col: 1,
    severity: "error",
    source: "reference",
    message,
  }
}

function uniqueEntries<Entry extends { canonical: string }>(
  entries: readonly Entry[]
): {
  entries: Array<Entry | ProjectReferenceIndexConflict>
  byKey: Record<string, Entry | ProjectReferenceIndexConflict>
  conflicts: number
} {
  const byKeyMap = new Map<string, Entry | ProjectReferenceIndexConflict>()
  for (const entry of entries) {
    const existing = byKeyMap.get(entry.canonical)
    if (existing === undefined) {
      byKeyMap.set(entry.canonical, entry)
      continue
    }
    byKeyMap.set(entry.canonical, { canonical: entry.canonical, conflict: true })
  }

  const materialized = [...byKeyMap.values()]
  return {
    entries: materialized,
    byKey: Object.fromEntries(byKeyMap),
    conflicts: materialized.filter(isConflict).length,
  }
}

function isConflict(entry: unknown): entry is ProjectReferenceIndexConflict {
  return typeof entry === "object" && entry !== null && "conflict" in entry
}
