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

export interface ProjectMetadataReferenceDetails {
  readonly kind?: "attribute" | "standardAttribute"
  readonly typeInfo?: {
    readonly kinds: readonly string[]
    readonly sourceText?: string
    readonly definedTypes?: readonly string[]
  }
  readonly styleItemType?: "Color" | "Font" | "Border"
}

export function projectMetadataReferenceDetails(details: unknown): ProjectMetadataReferenceDetails | undefined {
  if (typeof details !== "object" || details === null) return undefined
  const record = details as Record<string, unknown>
  const kind = record["kind"] === "attribute" || record["kind"] === "standardAttribute"
    ? record["kind"]
    : undefined
  const typeInfoRecord = typeof record["typeInfo"] === "object" && record["typeInfo"] !== null
    ? record["typeInfo"] as Record<string, unknown>
    : undefined
  const kinds = Array.isArray(typeInfoRecord?.["kinds"])
    ? typeInfoRecord["kinds"].filter((value): value is string => typeof value === "string")
    : []
  const sourceText = typeof typeInfoRecord?.["sourceText"] === "string" ? typeInfoRecord["sourceText"] : undefined
  const definedTypes = Array.isArray(typeInfoRecord?.["definedTypes"]) && typeInfoRecord["definedTypes"].length > 0
    ? ["defined"]
    : undefined
  const model = typeof record["model"] === "object" && record["model"] !== null
    ? record["model"] as Record<string, unknown>
    : undefined
  const styleType = model?.["type"] ?? model?.["Тип"] ?? record["type"] ?? record["Тип"]
  const styleItemType = styleType === "Color" || styleType === "Font" || styleType === "Border"
    ? styleType
    : undefined
  if (kind === undefined && kinds.length === 0 && sourceText === undefined && definedTypes === undefined && styleItemType === undefined) {
    return undefined
  }
  return {
    ...(kind === undefined ? {} : { kind }),
    ...(kinds.length === 0 && sourceText === undefined && definedTypes === undefined
      ? {}
      : {
          typeInfo: {
            kinds,
            ...(sourceText === undefined ? {} : { sourceText }),
            ...(definedTypes === undefined ? {} : { definedTypes }),
          },
        }),
    ...(styleItemType === undefined ? {} : { styleItemType }),
  }
}

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
