import {
  createSharedStringPool,
  createSharedStringPoolView,
  type SharedStringPool,
} from "../validation/sharedStringPool"
import type { FullXmlSyncAssignment } from "./types"

const COMPOSITION_MAGIC = 0x4e4b434d
const COMPOSITION_VERSION = 1
const HEADER_INTS = 5
const ENTRY_INTS = 7
const EMPTY = ""

export interface FullXmlSyncSharedCompositionSnapshot {
  readonly strings: Pick<SharedStringPool, "buffer" | "count" | "bytes">
  readonly table: SharedArrayBuffer
  readonly bytes: number
  readonly assignments: number
}

export interface FullXmlSyncCompositionEntry {
  readonly id: string
  readonly sourceProjectPath: string
  readonly role: FullXmlSyncAssignment["role"]
  readonly itemType: string
  readonly itemName: string
  readonly logicalAddress: string
  readonly ownerLogicalAddress?: string
}

export interface FullXmlSyncCompositionReader {
  assignment(id: string): FullXmlSyncCompositionEntry | undefined
  assignmentsByOwner(ownerLogicalAddress: string): FullXmlSyncCompositionEntry[]
  assignments(): FullXmlSyncCompositionEntry[]
}

export function createFullXmlSyncCompositionSnapshot(
  assignments: readonly FullXmlSyncAssignment[]
): FullXmlSyncSharedCompositionSnapshot {
  const entries = [...assignments].sort((left, right) => Buffer.compare(Buffer.from(left.id), Buffer.from(right.id)))
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

  return { strings, table, bytes: table.byteLength + strings.bytes, assignments: entries.length }
}

export function createFullXmlSyncCompositionReader(
  snapshot: FullXmlSyncSharedCompositionSnapshot
): FullXmlSyncCompositionReader {
  const header = new Int32Array(snapshot.table, 0, HEADER_INTS)
  if (header[0] !== COMPOSITION_MAGIC || header[1] !== COMPOSITION_VERSION) {
    throw new Error("Некорректный shared composition snapshot")
  }
  const count = header[2] ?? 0
  const rowsOffset = header[3] ?? HEADER_INTS
  const ints = new Int32Array(snapshot.table)
  const strings = createSharedStringPoolView(snapshot.strings)
  const cache = new Map<number, FullXmlSyncCompositionEntry>()

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
    assignmentsByOwner(ownerLogicalAddress) {
      const result: FullXmlSyncCompositionEntry[] = []
      for (let index = 0; index < count; index += 1) {
        const entry = entryAt(index)
        if (entry.ownerLogicalAddress === ownerLogicalAddress) result.push(entry)
      }
      return result
    },
    assignments() {
      const result: FullXmlSyncCompositionEntry[] = []
      for (let index = 0; index < count; index += 1) result.push(entryAt(index))
      return result
    },
  }
}
