import type { ParsedMetadataTarget } from "../commonObjects/metadataTargets"
import {
  projectMemberIndexKey,
  projectObjectIndexKey,
  projectValueIndexKey,
  resolvedProjectReferenceResult,
  unresolvedProjectReferenceResult,
  type PendingMetadataTargetReference,
  type ProjectMemberIndexEntry,
  type ProjectObjectIndexEntry,
  type ProjectReferenceIndex,
  type ProjectReferenceIndexResult,
  type ProjectReferenceIndexStats,
  type ProjectValueIndexEntry,
} from "./projectReferenceIndex"
import { validationComponentLayers } from "./componentVisibility"
import type { ProjectValidationGraph } from "./projectValidationTypes"

const MAGIC = 0x4e4b4452
const VERSION = 1
const HEADER_INTS = 9
const ENTRY_INTS = 9
const PROJECT_MAGIC = 0x4e4b5052
const PROJECT_VERSION = 1
const PROJECT_ENTRY_INTS = 11

const SECTION_OBJECT = 0
const SECTION_MEMBER = 1
const SECTION_VALUE = 2

const DETAIL_KIND_ATTRIBUTE = 1 << 0
const DETAIL_KIND_STANDARD_ATTRIBUTE = 1 << 1

const TYPE_UNKNOWN = 1 << 0
const TYPE_BOOLEAN = 1 << 1
const TYPE_STRING = 1 << 2
const TYPE_DECIMAL = 1 << 3
const TYPE_DATE_TIME = 1 << 4
const TYPE_UUID = 1 << 5
const TYPE_DEFINED = 1 << 6

const STYLE_COLOR = 1
const STYLE_FONT = 2
const STYLE_BORDER = 3

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

export interface SharedProjectReferenceSnapshot {
  buffer: SharedArrayBuffer
  stats: {
    objectEntries: number
    memberEntries: number
    valueEntries: number
    conflicts: number
    snapshotBytes: number
  }
}

interface EncodedEntry {
  componentPath?: string
  section: number
  canonical: string
  conflict: boolean
  detailKindFlags: number
  typeFlags: number
  styleItemType: number
  sourceText: string
}

export function createSharedProjectReferenceSnapshotFromGraph(
  graph: ProjectValidationGraph
): SharedProjectReferenceSnapshot {
  const objectEntries = uniqueEntries(
    graph.layers.flatMap(({ componentPath, contribution }) =>
      (contribution.objectIndexEntries ?? []).map((entry) => ({
        ...encodedEntry(SECTION_OBJECT, entry.canonical, entry.result.ok ? entry.result.details : undefined),
        componentPath,
      }))
    )
  )
  const memberEntries = uniqueEntries(
    graph.layers.flatMap(({ componentPath, contribution }) =>
      (contribution.memberIndexEntries ?? []).map((entry) => ({
        ...encodedEntry(SECTION_MEMBER, entry.canonical, entry.result.ok ? entry.result.details : undefined),
        componentPath,
      }))
    )
  )
  const valueEntries = uniqueEntries(
    graph.layers.flatMap(({ componentPath, contribution }) =>
      (contribution.valueIndexEntries ?? []).map((entry) => ({
        ...encodedEntry(SECTION_VALUE, entry.canonical, entry.result.ok ? entry.result.details : undefined),
        componentPath,
      }))
    )
  )
  const entries = [...objectEntries.entries, ...memberEntries.entries, ...valueEntries.entries].sort(
    compareEncodedEntries
  )
  const stringBytes = entries.map((entry) => ({
    component: textEncoder.encode(entry.componentPath ?? ""),
    key: textEncoder.encode(entry.canonical),
    source: textEncoder.encode(entry.sourceText),
  }))
  const stringsLength = stringBytes.reduce(
    (total, item) => total + item.component.byteLength + item.key.byteLength + item.source.byteLength,
    0
  )
  const headerBytes = HEADER_INTS * Int32Array.BYTES_PER_ELEMENT
  const tableBytes = entries.length * PROJECT_ENTRY_INTS * Int32Array.BYTES_PER_ELEMENT
  const stringsOffset = headerBytes + tableBytes
  const buffer = new SharedArrayBuffer(stringsOffset + stringsLength)
  const ints = new Int32Array(buffer, 0, HEADER_INTS + entries.length * PROJECT_ENTRY_INTS)
  const bytes = new Uint8Array(buffer)

  ints[0] = PROJECT_MAGIC
  ints[1] = PROJECT_VERSION
  ints[2] = entries.length
  ints[3] = stringsOffset
  ints[4] = objectEntries.entries.length
  ints[5] = memberEntries.entries.length
  ints[6] = valueEntries.entries.length
  ints[7] = objectEntries.conflicts + memberEntries.conflicts + valueEntries.conflicts
  ints[8] = buffer.byteLength

  let cursor = stringsOffset
  entries.forEach((entry, index) => {
    const encoded = stringBytes[index]
    if (encoded === undefined) return
    const base = HEADER_INTS + index * PROJECT_ENTRY_INTS
    ints[base] = cursor
    ints[base + 1] = encoded.component.byteLength
    bytes.set(encoded.component, cursor)
    cursor += encoded.component.byteLength
    ints[base + 2] = entry.section
    ints[base + 3] = cursor
    ints[base + 4] = encoded.key.byteLength
    bytes.set(encoded.key, cursor)
    cursor += encoded.key.byteLength
    ints[base + 5] = entry.conflict ? 1 : 0
    ints[base + 6] = entry.detailKindFlags
    ints[base + 7] = entry.typeFlags
    ints[base + 8] = entry.styleItemType
    ints[base + 9] = cursor
    ints[base + 10] = encoded.source.byteLength
    bytes.set(encoded.source, cursor)
    cursor += encoded.source.byteLength
  })

  return {
    buffer,
    stats: {
      objectEntries: objectEntries.entries.length,
      memberEntries: memberEntries.entries.length,
      valueEntries: valueEntries.entries.length,
      conflicts: objectEntries.conflicts + memberEntries.conflicts + valueEntries.conflicts,
      snapshotBytes: buffer.byteLength,
    },
  }
}

export function createSharedProjectReferenceSnapshot(params: {
  objectIndexEntries: readonly ProjectObjectIndexEntry[]
  memberIndexEntries: readonly ProjectMemberIndexEntry[]
  valueIndexEntries: readonly ProjectValueIndexEntry[]
}): SharedProjectReferenceSnapshot {
  const objectEntries = uniqueEntries(
    params.objectIndexEntries.map((entry) =>
      encodedEntry(SECTION_OBJECT, entry.canonical, entry.result.ok ? entry.result.details : undefined)
    )
  )
  const memberEntries = uniqueEntries(
    params.memberIndexEntries.map((entry) =>
      encodedEntry(SECTION_MEMBER, entry.canonical, entry.result.ok ? entry.result.details : undefined)
    )
  )
  const valueEntries = uniqueEntries(
    params.valueIndexEntries.map((entry) =>
      encodedEntry(SECTION_VALUE, entry.canonical, entry.result.ok ? entry.result.details : undefined)
    )
  )
  const entries = [...objectEntries.entries, ...memberEntries.entries, ...valueEntries.entries].sort(
    compareEncodedEntries
  )
  const stringBytes = entries.map((entry) => ({
    key: textEncoder.encode(entry.canonical),
    source: textEncoder.encode(entry.sourceText),
  }))
  const stringsLength = stringBytes.reduce((total, item) => total + item.key.byteLength + item.source.byteLength, 0)
  const headerBytes = HEADER_INTS * Int32Array.BYTES_PER_ELEMENT
  const tableBytes = entries.length * ENTRY_INTS * Int32Array.BYTES_PER_ELEMENT
  const stringsOffset = headerBytes + tableBytes
  const buffer = new SharedArrayBuffer(stringsOffset + stringsLength)
  const ints = new Int32Array(buffer, 0, HEADER_INTS + entries.length * ENTRY_INTS)
  const bytes = new Uint8Array(buffer)

  ints[0] = MAGIC
  ints[1] = VERSION
  ints[2] = entries.length
  ints[3] = stringsOffset
  ints[4] = objectEntries.entries.length
  ints[5] = memberEntries.entries.length
  ints[6] = valueEntries.entries.length
  ints[7] = objectEntries.conflicts + memberEntries.conflicts + valueEntries.conflicts
  ints[8] = buffer.byteLength

  let cursor = stringsOffset
  entries.forEach((entry, index) => {
    const encoded = stringBytes[index]
    if (encoded === undefined) return
    const base = HEADER_INTS + index * ENTRY_INTS
    ints[base] = entry.section
    ints[base + 1] = cursor
    ints[base + 2] = encoded.key.byteLength
    bytes.set(encoded.key, cursor)
    cursor += encoded.key.byteLength
    ints[base + 3] = entry.conflict ? 1 : 0
    ints[base + 4] = entry.detailKindFlags
    ints[base + 5] = entry.typeFlags
    ints[base + 6] = entry.styleItemType
    ints[base + 7] = cursor
    ints[base + 8] = encoded.source.byteLength
    bytes.set(encoded.source, cursor)
    cursor += encoded.source.byteLength
  })

  return {
    buffer,
    stats: {
      objectEntries: objectEntries.entries.length,
      memberEntries: memberEntries.entries.length,
      valueEntries: valueEntries.entries.length,
      conflicts: objectEntries.conflicts + memberEntries.conflicts + valueEntries.conflicts,
      snapshotBytes: buffer.byteLength,
    },
  }
}

export function createSharedProjectReferenceIndex(params: {
  projectDir: string
  componentPath?: string
  snapshot: SharedProjectReferenceSnapshot
  resolveObjectFilePath?: (target: Extract<ParsedMetadataTarget, { kind: "object" }>) => string | undefined
}): ProjectReferenceIndex {
  const view = sharedSnapshotView(params.snapshot)
  const stats: ProjectReferenceIndexStats = {
    hits: 0,
    misses: 0,
    conflicts: 0,
    filterFailures: 0,
    unsupported: 0,
    fallbacks: 0,
  }

  return {
    resolve(reference) {
      const result = resolveSharedReference({ ...params, view }, reference)
      if (result.ok) stats.hits += 1
      else if (result.reason === "notFound") stats.misses += 1
      else if (result.reason === "conflict") stats.conflicts += 1
      else if (result.reason === "filter") stats.filterFailures += 1
      else stats.unsupported += 1
      return result
    },
    stats() {
      return { ...stats }
    },
  }
}

function resolveSharedReference(
  params: {
    view: SharedSnapshotView
    componentPath?: string
    resolveObjectFilePath?: (target: Extract<ParsedMetadataTarget, { kind: "object" }>) => string | undefined
  },
  reference: PendingMetadataTargetReference
): ProjectReferenceIndexResult {
  let entry: SharedEntryView | undefined
  if (params.view.project) {
    if (params.componentPath === undefined) {
      throw new Error("Не указан validation componentPath для shared project reference index")
    }
    for (const layer of validationComponentLayers(params.componentPath)) {
      entry = lookupSharedEntry(params.view, layer, reference.target)
      if (entry !== undefined) break
    }
  } else {
    entry = lookupSharedEntry(params.view, undefined, reference.target)
  }
  if (entry === undefined) {
    return unresolvedProjectReferenceResult(
      reference,
      "missing",
      reference.target.kind === "object" ? params.resolveObjectFilePath?.(reference.target) : undefined,
    )
  }
  if (entry.conflict) return unresolvedProjectReferenceResult(reference, "ambiguous")
  return resolvedProjectReferenceResult(reference, sharedEntryDetails(entry))
}

interface SharedSnapshotView {
  ints: Int32Array
  bytes: Uint8Array
  entryCount: number
  project: boolean
}

interface SharedEntryView {
  section: number
  conflict: boolean
  detailKindFlags: number
  typeFlags: number
  styleItemType: number
  sourceText: string
}

function sharedSnapshotView(snapshot: SharedProjectReferenceSnapshot): SharedSnapshotView {
  const header = new Int32Array(snapshot.buffer, 0, HEADER_INTS)
  const project = header[0] === PROJECT_MAGIC && header[1] === PROJECT_VERSION
  if (!project && (header[0] !== MAGIC || header[1] !== VERSION)) {
    throw new Error("Некорректный shared reference index")
  }
  const entryCount = header[2] ?? 0
  return {
    ints: new Int32Array(snapshot.buffer, 0, HEADER_INTS + entryCount * (project ? PROJECT_ENTRY_INTS : ENTRY_INTS)),
    bytes: new Uint8Array(snapshot.buffer),
    entryCount,
    project,
  }
}

function lookupSharedEntry(
  view: SharedSnapshotView,
  componentPath: string | undefined,
  target: ParsedMetadataTarget
): SharedEntryView | undefined {
  const section = sectionForTarget(target)
  const canonical = keyForTarget(target)
  let left = 0
  let right = view.entryCount - 1
  while (left <= right) {
    const middle = Math.floor((left + right) / 2)
    const current = entryAt(view, middle)
    const order = view.project
      ? compareComponentSectionAndKey(
          current.componentPath ?? "",
          current.section,
          current.canonical,
          componentPath ?? "",
          section,
          canonical
        )
      : compareSectionAndKey(current.section, current.canonical, section, canonical)
    if (order === 0) return current
    if (order < 0) left = middle + 1
    else right = middle - 1
  }
  return undefined
}

function entryAt(
  view: SharedSnapshotView,
  index: number
): SharedEntryView & { componentPath?: string; canonical: string } {
  if (view.project) {
    const base = HEADER_INTS + index * PROJECT_ENTRY_INTS
    return {
      componentPath: decodeString(view, view.ints[base] ?? 0, view.ints[base + 1] ?? 0),
      section: view.ints[base + 2] ?? 0,
      canonical: decodeString(view, view.ints[base + 3] ?? 0, view.ints[base + 4] ?? 0),
      conflict: view.ints[base + 5] === 1,
      detailKindFlags: view.ints[base + 6] ?? 0,
      typeFlags: view.ints[base + 7] ?? 0,
      styleItemType: view.ints[base + 8] ?? 0,
      sourceText: decodeString(view, view.ints[base + 9] ?? 0, view.ints[base + 10] ?? 0),
    }
  }
  const base = HEADER_INTS + index * ENTRY_INTS
  return {
    section: view.ints[base] ?? 0,
    canonical: decodeString(view, view.ints[base + 1] ?? 0, view.ints[base + 2] ?? 0),
    conflict: view.ints[base + 3] === 1,
    detailKindFlags: view.ints[base + 4] ?? 0,
    typeFlags: view.ints[base + 5] ?? 0,
    styleItemType: view.ints[base + 6] ?? 0,
    sourceText: decodeString(view, view.ints[base + 7] ?? 0, view.ints[base + 8] ?? 0),
  }
}

function decodeString(view: SharedSnapshotView, offset: number, length: number): string {
  return textDecoder.decode(view.bytes.subarray(offset, offset + length))
}

function keyForTarget(target: ParsedMetadataTarget): string {
  if (target.kind === "object") return projectObjectIndexKey(target)
  if (target.kind === "member") return projectMemberIndexKey(target)
  if (target.kind === "value") return projectValueIndexKey(target)
  return ""
}

function sectionForTarget(target: ParsedMetadataTarget): number {
  if (target.kind === "object") return SECTION_OBJECT
  if (target.kind === "member") return SECTION_MEMBER
  if (target.kind === "value") return SECTION_VALUE
  return -1
}

function sharedEntryDetails(entry: SharedEntryView): unknown {
  const kind = (entry.detailKindFlags & DETAIL_KIND_STANDARD_ATTRIBUTE) !== 0
    ? "standardAttribute"
    : (entry.detailKindFlags & DETAIL_KIND_ATTRIBUTE) !== 0
      ? "attribute"
      : undefined
  const typeKinds: readonly (readonly [flag: number, value: string])[] = [
    [TYPE_UNKNOWN, "unknown"],
    [TYPE_BOOLEAN, "boolean"],
    [TYPE_STRING, "string"],
    [TYPE_DECIMAL, "decimal"],
    [TYPE_DATE_TIME, "dateTime"],
    [TYPE_UUID, "UUID"],
  ]
  const kinds = typeKinds.flatMap(([flag, value]) => (entry.typeFlags & flag) !== 0 ? [value] : [])
  const hasTypeInfo = kind !== undefined || kinds.length > 0 || entry.sourceText.length > 0
    || (entry.typeFlags & TYPE_DEFINED) !== 0
  const styleItemType = styleItemTypeFromCode(entry.styleItemType)
  if (kind === undefined && !hasTypeInfo && styleItemType === undefined) return undefined
  return {
    ...(kind === undefined ? {} : { kind }),
    ...(hasTypeInfo
      ? {
          typeInfo: {
            kinds,
            ...(entry.sourceText.length === 0 ? {} : { sourceText: entry.sourceText }),
            ...((entry.typeFlags & TYPE_DEFINED) === 0 ? {} : { definedTypes: ["defined"] }),
          },
        }
      : {}),
    ...(styleItemType === undefined ? {} : { styleItemType }),
  }
}

function encodedEntry(section: number, canonical: string, details: unknown): EncodedEntry {
  const detail = compactDetails(details)
  return {
    section,
    canonical,
    conflict: false,
    detailKindFlags: detail.detailKindFlags,
    typeFlags: detail.typeFlags,
    styleItemType: detail.styleItemType,
    sourceText: detail.sourceText,
  }
}

function compactDetails(details: unknown): Omit<EncodedEntry, "section" | "canonical" | "conflict"> {
  const record = objectRecord(details)
  const kind = typeof record["kind"] === "string" ? record["kind"] : undefined
  const typeInfo = objectRecord(record["typeInfo"])
  const kinds = Array.isArray(typeInfo["kinds"])
    ? typeInfo["kinds"].filter((item): item is string => typeof item === "string")
    : []
  const definedTypes = Array.isArray(typeInfo["definedTypes"]) ? typeInfo["definedTypes"] : []
  const sourceText = typeof typeInfo["sourceText"] === "string" ? typeInfo["sourceText"] : ""
  return {
    detailKindFlags:
      (kind === "attribute" ? DETAIL_KIND_ATTRIBUTE : 0) |
      (kind === "standardAttribute" ? DETAIL_KIND_STANDARD_ATTRIBUTE : 0),
    typeFlags: kinds.reduce((flags, item) => flags | typeFlag(item), 0) | (definedTypes.length > 0 ? TYPE_DEFINED : 0),
    styleItemType: styleItemTypeCode(details),
    sourceText,
  }
}

function typeFlag(type: string): number {
  if (type === "unknown") return TYPE_UNKNOWN
  if (type === "boolean") return TYPE_BOOLEAN
  if (type === "string") return TYPE_STRING
  if (type === "decimal") return TYPE_DECIMAL
  if (type === "dateTime") return TYPE_DATE_TIME
  if (type === "UUID") return TYPE_UUID
  return 0
}

function styleItemTypeCode(details: unknown): number {
  const record = objectRecord(details)
  const model = objectRecord(record["model"])
  const value = model["type"] ?? model["Тип"] ?? record["type"] ?? record["Тип"]
  if (value === "Color") return STYLE_COLOR
  if (value === "Font") return STYLE_FONT
  if (value === "Border") return STYLE_BORDER
  return 0
}

function styleItemTypeFromCode(code: number): "Color" | "Font" | "Border" | undefined {
  if (code === STYLE_COLOR) return "Color"
  if (code === STYLE_FONT) return "Font"
  if (code === STYLE_BORDER) return "Border"
  return undefined
}

function uniqueEntries(entries: readonly EncodedEntry[]): { entries: EncodedEntry[]; conflicts: number } {
  const byKey = new Map<string, EncodedEntry>()
  for (const entry of entries) {
    const key = `${entry.componentPath ?? ""}\0${entry.section}\0${entry.canonical}`
    const existing = byKey.get(key)
    if (existing === undefined) {
      byKey.set(key, entry)
      continue
    }
    byKey.set(key, { ...existing, conflict: true })
  }
  const materialized = [...byKey.values()]
  return { entries: materialized, conflicts: materialized.filter((entry) => entry.conflict).length }
}

function compareEncodedEntries(left: EncodedEntry, right: EncodedEntry): number {
  return compareComponentSectionAndKey(
    left.componentPath ?? "",
    left.section,
    left.canonical,
    right.componentPath ?? "",
    right.section,
    right.canonical
  )
}

function compareComponentSectionAndKey(
  leftComponentPath: string,
  leftSection: number,
  leftKey: string,
  rightComponentPath: string,
  rightSection: number,
  rightKey: string
): number {
  return (
    (leftComponentPath < rightComponentPath ? -1 : leftComponentPath > rightComponentPath ? 1 : 0) ||
    compareSectionAndKey(leftSection, leftKey, rightSection, rightKey)
  )
}

function compareSectionAndKey(leftSection: number, leftKey: string, rightSection: number, rightKey: string): number {
  return leftSection - rightSection || (leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0)
}

function objectRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {}
}
