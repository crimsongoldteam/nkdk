import type {
  MetadataObjectPathKind,
  MetadataRootName,
  MetadataTargetConstraint,
  MetadataTargetFilter,
  MetadataTypeFilterValue,
  ParsedMetadataTarget,
} from "../commonObjects/metadataTargets"
import { objectPathKindToYAML, rootToYAML } from "../commonObjects/metadataTargets/roots"
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
  objectIndexByKey: Record<string, ProjectObjectIndexEntry | ProjectReferenceIndexConflict>
  memberIndexByKey: Record<string, ProjectMemberIndexEntry | ProjectReferenceIndexConflict>
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
  firstDependency?: ValidationDependencyRequest
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
    objectIndexByKey: objectIndex.byKey,
    memberIndexByKey: memberIndex.byKey,
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
  resolveObjectFilePath?: (target: Extract<ParsedMetadataTarget, { kind: "object" }>) => string | undefined
  resolveProjectFile?: (target: Extract<ParsedMetadataTarget, { kind: "object" }>) => ValidationDependencyRequest | undefined
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
      const result = resolveReference(params, reference)
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
  let firstDependency: ValidationDependencyRequest | undefined
  for (const reference of params.references) {
    const result = params.index.resolve(reference)
    if (!result.ok && result.reason === "needsDependency" && firstDependency === undefined) {
      firstDependency = result.dependency
    }
    if (!result.ok) diagnostics.push(...result.diagnostics)
  }
  return {
    diagnostics,
    stats: params.index.stats(),
    ...(firstDependency === undefined ? {} : { firstDependency }),
  }
}

function resolveReference(
  params: {
    mode: "full" | "partial"
    snapshot: ProjectReferenceSnapshot
    resolveObjectFilePath?: (target: Extract<ParsedMetadataTarget, { kind: "object" }>) => string | undefined
    resolveProjectFile?: (target: Extract<ParsedMetadataTarget, { kind: "object" }>) => ValidationDependencyRequest | undefined
  },
  reference: PendingMetadataTargetReference
): ProjectReferenceIndexResult {
  const entry = lookupEntry(params.snapshot, reference.target)
  if (entry === undefined) {
    const dependency =
      params.mode === "partial" && reference.target.kind === "object"
        ? params.resolveProjectFile?.(reference.target)
        : undefined
    if (dependency !== undefined) {
      return { ok: false, reason: "needsDependency", dependency, diagnostics: [] }
    }
    if (reference.target.kind === "object") {
      const filePath = params.resolveObjectFilePath?.(reference.target)
      return {
        ok: false,
        reason: "notFound",
        diagnostics: [
          referenceDiagnostic(reference, `Не найден объект "${formatObjectTarget(reference.target)}"`, filePath),
        ],
      }
    }
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
  if (reference.target.kind === "object") {
    const filterResult = matchesObjectFilters({ reference, entry: entry as ProjectObjectIndexEntry })
    if (!filterResult.ok) return filterResult
  }
  if (reference.target.kind === "member") {
    const filterResult = matchesMemberFilters({ reference, entry: entry as ProjectMemberIndexEntry })
    if (!filterResult.ok) return filterResult
  }
  return { ok: true }
}

function matchesObjectFilters(params: {
  reference: PendingMetadataTargetReference
  entry: ProjectObjectIndexEntry
}): ProjectReferenceIndexResult {
  if (params.reference.constraint.kind !== "object") return { ok: true }

  for (const filter of params.reference.constraint.filters ?? []) {
    if (filter.kind !== "styleItemType") continue
    const actualType = styleItemTypeFromDetails(params.entry.result.ok ? params.entry.result.details : undefined)
    if (actualType === undefined || filter.values.includes(actualType)) continue
    return memberFilterError(
      params.reference,
      `Объект "${params.reference.canonical}" имеет тип "${actualType}", ожидался: ${filter.values.join(", ")}`
    )
  }

  return { ok: true }
}

function matchesMemberFilters(params: {
  reference: PendingMetadataTargetReference
  entry: ProjectMemberIndexEntry
}): ProjectReferenceIndexResult {
  if (params.reference.constraint.kind !== "member") return { ok: true }

  for (const filter of params.reference.constraint.filters ?? []) {
    const result = matchesMemberFilter({ ...params, filter })
    if (!result.ok) return result
  }

  return { ok: true }
}

function matchesMemberFilter(params: {
  reference: PendingMetadataTargetReference
  entry: ProjectMemberIndexEntry
  filter: MetadataTargetFilter
}): ProjectReferenceIndexResult {
  const displayName = params.reference.canonical
  switch (params.filter.kind) {
    case "directMember":
      if (params.entry.target.segments.length === 1) return { ok: true }
      return memberFilterError(
        params.reference,
        `Член "${displayName}" не подходит: ожидаются прямые члены текущего объекта`
      )
    case "hasType":
      if (matchesHasTypeFilter(params.entry.result.ok ? params.entry.result.details : undefined, params.filter.type)) {
        return { ok: true }
      }
      return memberFilterError(
        params.reference,
        `Член "${displayName}" не подходит: ожидаются члены, тип которых содержит ${formatTypeFilter(params.filter.type)}`
      )
    case "stringIndexedAttribute":
      if (matchesStringIndexedAttributeFilter(params.entry.result.ok ? params.entry.result.details : undefined)) {
        return { ok: true }
      }
      return memberFilterError(
        params.reference,
        `Член "${displayName}" не подходит: ожидаются реквизиты, пригодные для ввода по строке`
      )
    case "styleItemType":
      return { ok: true }
  }
}

function memberFilterError(reference: PendingMetadataTargetReference, message: string): ProjectReferenceIndexResult {
  return { ok: false, reason: "filter", diagnostics: [referenceDiagnostic(reference, message)] }
}

function matchesHasTypeFilter(details: unknown, type: MetadataTypeFilterValue): boolean {
  const typeInfo = objectFieldTypeInfo(details)
  if (typeInfo === undefined) return false
  if (type === "boolean") return typeInfo.kinds.includes("boolean")
  return typeInfoSourceContains(typeInfo, type)
}

function matchesStringIndexedAttributeFilter(details: unknown): boolean {
  if (!isObjectFieldDetails(details)) return false
  if (details.kind !== "attribute" && details.kind !== "standardAttribute") return false
  const typeInfo = details.typeInfo
  if (typeInfo.kinds.includes("unknown")) return true
  if (typeInfo.kinds.includes("boolean")) return true
  return ["string", "decimal", "dateTime", "UUID"].some((type) => typeInfoSourceContains(typeInfo, type))
}

function typeInfoSourceContains(typeInfo: ObjectFieldDetails["typeInfo"], type: string): boolean {
  if (typeInfo.kinds.includes(type)) return true
  return typeInfo.sourceText?.split(" | ").includes(type) === true
}

function formatTypeFilter(type: MetadataTypeFilterValue): string {
  if (type === "boolean") return "Булево"
  return type
}

function objectFieldTypeInfo(details: unknown): ObjectFieldDetails["typeInfo"] | undefined {
  return isObjectFieldDetails(details) ? details.typeInfo : undefined
}

interface ObjectFieldDetails {
  kind: string
  typeInfo: {
    kinds: readonly string[]
    sourceText?: string
  }
}

function styleItemTypeFromDetails(details: unknown): "Color" | "Font" | "Border" | undefined {
  if (typeof details !== "object" || details === null) return undefined
  const record = details as Record<string, unknown>
  const model = record["model"]
  const source = typeof model === "object" && model !== null ? (model as Record<string, unknown>) : record
  const value = source["type"] ?? source["Тип"]
  return value === "Color" || value === "Font" || value === "Border" ? value : undefined
}

function isObjectFieldDetails(details: unknown): details is ObjectFieldDetails {
  if (typeof details !== "object" || details === null) return false
  const record = details as Record<string, unknown>
  const typeInfo = record["typeInfo"]
  if (typeof record["kind"] !== "string" || typeof typeInfo !== "object" || typeInfo === null) return false
  const typeInfoRecord = typeInfo as Record<string, unknown>
  return Array.isArray(typeInfoRecord["kinds"])
}

function lookupEntry(snapshot: ProjectReferenceSnapshot, target: ParsedMetadataTarget) {
  if (target.kind === "object") return snapshot.objectIndexByKey[projectObjectIndexKey(target)]
  if (target.kind === "member") return snapshot.memberIndexByKey[projectMemberIndexKey(target)]
  if (target.kind === "value") return snapshot.valueIndexByKey[projectValueIndexKey(target)]
  return undefined
}

function referenceDiagnostic(
  reference: PendingMetadataTargetReference,
  message: string,
  filePath = reference.filePath
): Diagnostic {
  return {
    filePath,
    line: 1,
    col: 1,
    severity: "error",
    source: "reference",
    message,
  }
}

function formatObjectTarget(target: Extract<ParsedMetadataTarget, { kind: "object" }>): string {
  return [
    rootToYAML[target.root],
    target.objectName,
    ...(target.segments ?? []).flatMap((segment) => [objectSegmentKindToYAML(segment.kind), segment.objectName]),
  ].join(".")
}

function objectSegmentKindToYAML(kind: MetadataRootName | MetadataObjectPathKind): string {
  return rootToYAML[kind as MetadataRootName] ?? objectPathKindToYAML[kind as MetadataObjectPathKind]
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
