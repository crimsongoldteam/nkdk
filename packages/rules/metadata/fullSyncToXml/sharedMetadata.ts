import { xxh3 } from "@node-rs/xxhash"
import { fileBackedMemberPath } from "../resourceTopology/core/fileBackedMemberPath"
import {
  buildBinaryHashIndex,
  findBinaryHashIndex,
  forEachBinaryHashIndexEntry,
  openBinaryHashIndex,
} from "@nkdk/runtime"
import {
  createSharedStringPool,
  createSharedStringPoolView,
} from "../validation/sharedStringPool"
import type { FullXmlSyncAssignment } from "./types"
import type {
  FullXmlSyncCompositionChild,
  FullXmlSyncCompositionEntry,
  FullXmlSyncCompositionReader,
  FullXmlSyncSharedCompositionSnapshot,
} from "./sharedMetadataTypes"
import type { FullXmlSyncExternalFile } from "./types"
export type {
  FullXmlSyncCompositionChild,
  FullXmlSyncCompositionEntry,
  FullXmlSyncCompositionReader,
  FullXmlSyncSharedCompositionSnapshot,
} from "./sharedMetadataTypes"

const COMPOSITION_MAGIC = 0x4e4b434d
const COMPOSITION_VERSION = 2
const HEADER_INTS = 6
const ENTRY_INTS = 7
const EMPTY = ""

interface FullXmlSyncCompositionHashOptions {
  readonly hashOwner?: (ownerLogicalAddress: string) => bigint
  readonly externalFiles?: readonly FullXmlSyncExternalFile[]
}

interface CompositionSnapshotRow {
  readonly id: string
  readonly sourceProjectPath: string
  readonly role: FullXmlSyncAssignment["role"]
  readonly itemType: string
  readonly itemName: string
  readonly logicalAddress: string
  readonly owner?: { readonly logicalAddress: string }
}

export function createFullXmlSyncCompositionSnapshot(
  assignments: readonly FullXmlSyncAssignment[],
  options: FullXmlSyncCompositionHashOptions = {},
): FullXmlSyncSharedCompositionSnapshot {
  const assignmentEntries: CompositionSnapshotRow[] = [...assignments]
  const entries = [
    ...assignmentEntries,
    ...fileBackedCompositionRows(assignments, options.externalFiles ?? []),
  ].sort((left, right) => Buffer.compare(Buffer.from(left.id), Buffer.from(right.id)))
  const rootLogicalAddress = entries.find(({ role }) => role === "configuration")?.logicalAddress
  const stringValues = [EMPTY]
  for (const assignment of entries) {
    stringValues.push(
      assignment.id,
      assignment.sourceProjectPath,
      assignment.role,
      assignment.itemType,
      assignment.itemName,
      assignment.logicalAddress,
      assignment.owner?.logicalAddress ?? EMPTY
    )
  }
  const strings = createSharedStringPool(stringValues)
  const stringId = (value: string) => strings.idByValue.get(value) ?? 0
  const table = new SharedArrayBuffer((HEADER_INTS + entries.length * ENTRY_INTS) * Int32Array.BYTES_PER_ELEMENT)
  const ints = new Int32Array(table)
  ints[0] = COMPOSITION_MAGIC
  ints[1] = COMPOSITION_VERSION
  ints[2] = entries.length
  ints[3] = HEADER_INTS
  ints[4] = table.byteLength + strings.bytes
  ints[5] = stringId(rootLogicalAddress ?? EMPTY)

  entries.forEach((assignment, index) => {
    const base = HEADER_INTS + index * ENTRY_INTS
    ints[base] = stringId(assignment.id)
    ints[base + 1] = stringId(assignment.sourceProjectPath)
    ints[base + 2] = stringId(assignment.role)
    ints[base + 3] = stringId(assignment.itemType)
    ints[base + 4] = stringId(assignment.itemName)
    ints[base + 5] = stringId(assignment.logicalAddress)
    ints[base + 6] = stringId(assignment.owner?.logicalAddress ?? EMPTY)
  })

  const childEntries = entries.flatMap((assignment, entryId) => {
    const ownerLogicalAddress = assignment.owner?.logicalAddress
      ?? (assignment.role === "configuration" ? undefined : rootLogicalAddress)
    return ownerLogicalAddress === undefined
      ? []
      : [{ ownerLogicalAddress, ownerStringId: stringId(ownerLogicalAddress), entryId }]
  }).sort((left, right) => left.ownerStringId - right.ownerStringId || left.entryId - right.entryId)
  const childEntryIds = new Uint32Array(new SharedArrayBuffer(
    childEntries.length * Uint32Array.BYTES_PER_ELEMENT,
  ))
  const ranges: Array<{ ownerLogicalAddress: string; start: number; count: number }> = []
  for (let start = 0; start < childEntries.length;) {
    let end = start + 1
    while (
      end < childEntries.length
      && childEntries[end]!.ownerStringId === childEntries[start]!.ownerStringId
    ) end += 1
    for (let index = start; index < end; index += 1) {
      childEntryIds[index] = childEntries[index]!.entryId
    }
    ranges.push({
      ownerLogicalAddress: childEntries[start]!.ownerLogicalAddress,
      start,
      count: end - start,
    })
    start = end
  }
  const ownerRanges = new Uint32Array(new SharedArrayBuffer(
    ranges.length * 2 * Uint32Array.BYTES_PER_ELEMENT,
  ))
  ranges.forEach((range, rangeId) => {
    ownerRanges[rangeId * 2] = range.start
    ownerRanges[rangeId * 2 + 1] = range.count
  })
  const hashOwner = options.hashOwner ?? defaultHashOwner
  const ownerLookup = buildBinaryHashIndex(
    BigUint64Array.from(ranges, ({ ownerLogicalAddress }) => hashOwner(ownerLogicalAddress)),
    Uint32Array.from(ranges, (_, rangeId) => rangeId),
  )

  return {
    strings,
    table,
    childEntryIds: childEntryIds.buffer as SharedArrayBuffer,
    ownerRanges: ownerRanges.buffer as SharedArrayBuffer,
    ownerLookup,
    bytes:
      table.byteLength
      + strings.bytes
      + childEntryIds.byteLength
      + ownerRanges.byteLength
      + ownerLookup.slots.byteLength,
    assignments: assignments.length,
  }
}

export function createFullXmlSyncCompositionReader(
  snapshot: FullXmlSyncSharedCompositionSnapshot,
  options: FullXmlSyncCompositionHashOptions = {},
): FullXmlSyncCompositionReader {
  const header = new Int32Array(snapshot.table, 0, HEADER_INTS)
  if (header[0] !== COMPOSITION_MAGIC || header[1] !== COMPOSITION_VERSION) {
    throw new Error("Некорректный shared composition snapshot")
  }
  const count = header[2] ?? 0
  const rowsOffset = header[3] ?? HEADER_INTS
  const ints = new Int32Array(snapshot.table)
  const strings = createSharedStringPoolView(snapshot.strings)
  const rootLogicalAddress = strings.get(header[5] ?? 0)
  const childEntryIds = new Uint32Array(snapshot.childEntryIds)
  const ownerRanges = new Uint32Array(snapshot.ownerRanges)
  const ownerLookup = openBinaryHashIndex(snapshot.ownerLookup)
  const rangeCount = ownerRanges.length / 2
  if (
    snapshot.table.byteLength !== (rowsOffset + count * ENTRY_INTS) * Int32Array.BYTES_PER_ELEMENT
    || snapshot.ownerRanges.byteLength % (2 * Uint32Array.BYTES_PER_ELEMENT) !== 0
    || ownerLookup.size !== rangeCount
  ) throw new Error("Повреждён shared composition snapshot")
  for (const entryId of childEntryIds) {
    if (entryId >= count) throw new Error("Повреждён shared composition snapshot")
  }
  for (let rangeId = 0; rangeId < rangeCount; rangeId += 1) {
    const start = ownerRanges[rangeId * 2]!
    const rangeLength = ownerRanges[rangeId * 2 + 1]!
    if (rangeLength === 0 || start + rangeLength > childEntryIds.length) {
      throw new Error("Повреждён shared composition snapshot")
    }
  }
  forEachBinaryHashIndexEntry(ownerLookup, (_hash, rangeId) => {
    if (rangeId >= rangeCount) throw new Error("Повреждён shared composition snapshot")
  })
  const cache = new Map<number, FullXmlSyncCompositionEntry>()
  const hashOwner = options.hashOwner ?? defaultHashOwner

  function entryAt(index: number): FullXmlSyncCompositionEntry {
    const existing = cache.get(index)
    if (existing !== undefined) return existing

    const base = rowsOffset + index * ENTRY_INTS
    const ownerLogicalAddress = strings.get(ints[base + 6] ?? 0)
    const entry = {
      id: strings.get(ints[base] ?? 0),
      sourceProjectPath: strings.get(ints[base + 1] ?? 0),
      role: strings.get(ints[base + 2] ?? 0) as FullXmlSyncAssignment["role"],
      itemType: strings.get(ints[base + 3] ?? 0),
      itemName: strings.get(ints[base + 4] ?? 0),
      logicalAddress: strings.get(ints[base + 5] ?? 0),
      ...(ownerLogicalAddress.length === 0 ? {} : { ownerLogicalAddress }),
    }
    cache.set(index, entry)
    return entry
  }

  return {
    assignment(id) {
      for (let index = 0; index < count; index += 1) {
        const entry = entryAt(index)
        if (entry.id === id) return entry
      }
      return undefined
    },
    children(ownerLogicalAddress) {
      const rangeId = findBinaryHashIndex(
        ownerLookup,
        hashOwner(ownerLogicalAddress),
        (candidateRangeId) => ownerAt(candidateRangeId) === ownerLogicalAddress,
      )
      if (rangeId === undefined) return []
      const start = ownerRanges[rangeId * 2]!
      const rangeLength = ownerRanges[rangeId * 2 + 1]!
      return Array.from(
        { length: rangeLength },
        (_, index) => capabilityEntryAt(childEntryIds[start + index]!),
      )
    },
    itemTypeByYamlDir() {
      const result: Record<string, string> = {}
      for (let index = 0; index < count; index += 1) {
        const base = rowsOffset + index * ENTRY_INTS
        if (strings.get(ints[base + 2] ?? 0) === "configuration") continue
        const sourceProjectPath = strings.get(ints[base + 1] ?? 0)
        const itemType = strings.get(ints[base + 3] ?? 0)
        if (itemType.length === 0) continue
        const yamlDir = sourceProjectPath.split("/", 1)[0] ?? EMPTY
        if (yamlDir.length > 0) result[yamlDir] = itemType
      }
      return result
    },
  }

  function ownerAt(rangeId: number): string {
    const start = ownerRanges[rangeId * 2]!
    const entryId = childEntryIds[start]!
    const base = rowsOffset + entryId * ENTRY_INTS
    const explicitOwner = strings.get(ints[base + 6] ?? 0)
    return explicitOwner.length > 0 ? explicitOwner : rootLogicalAddress
  }

  function capabilityEntryAt(entryId: number): FullXmlSyncCompositionChild {
    const entry = entryAt(entryId)
    return {
      sourceProjectPath: entry.sourceProjectPath,
      itemType: entry.itemType,
      itemName: entry.itemName,
      logicalAddress: entry.logicalAddress,
      assignmentRole: entry.role === "form" ? "fileItem" : entry.role,
      ...(entry.ownerLogicalAddress === undefined
        ? {}
        : { ownerLogicalAddress: entry.ownerLogicalAddress }),
    }
  }
}

function fileBackedCompositionRows(
  assignments: readonly FullXmlSyncAssignment[],
  externalFiles: readonly FullXmlSyncExternalFile[],
): CompositionSnapshotRow[] {
  const assignmentsById = new Map(assignments.map((assignment) => [assignment.id, assignment]))
  const rows = new Map<string, CompositionSnapshotRow>()
  for (const file of externalFiles) {
    if (file.assignmentId === undefined) continue
    const owner = assignmentsById.get(file.assignmentId)
    if (owner === undefined) continue
    const member = fileBackedMemberPath(owner.sourceProjectPath, file.sourceProjectPath)
    if (member === undefined) continue
    const key = `${owner.logicalAddress}\0${member.projectPath}`
    rows.set(key, {
      id: `\0external\0${key}`,
      sourceProjectPath: member.projectPath,
      role: "form",
      itemType: "",
      itemName: member.itemName,
      logicalAddress: `${owner.logicalAddress}.__external__.${member.collectionName}.${member.itemName}`,
      owner: { logicalAddress: owner.logicalAddress },
    })
  }
  return [...rows.values()]
}

function defaultHashOwner(ownerLogicalAddress: string): bigint {
  return xxh3.xxh64(Buffer.from(ownerLogicalAddress))
}
