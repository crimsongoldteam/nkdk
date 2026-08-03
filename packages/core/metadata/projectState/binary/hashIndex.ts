import { ProjectStateHashSlotRecordView } from "./layouts"

export interface BinaryHashIndex {
  readonly slots: SharedArrayBuffer
  readonly byteOffset?: number
  readonly size: number
  readonly capacity: number
}

const MAX_LOAD_FACTOR = 0.8

function capacityFor(size: number): number {
  const minimumCapacity = Math.max(1, Math.ceil(size / MAX_LOAD_FACTOR))
  let capacity = 1

  while (capacity < minimumCapacity) {
    capacity *= 2
  }

  return capacity
}

function initialSlot(hash: bigint, capacity: number): number {
  return Number(hash & BigInt(capacity - 1))
}

function slotOffset(index: BinaryHashIndex, slot: number): number {
  return (index.byteOffset ?? 0) + slot * ProjectStateHashSlotRecordView.viewLength
}

export function buildBinaryHashIndex(
  hashes: BigUint64Array,
  recordIds: Uint32Array,
): BinaryHashIndex {
  if (hashes.length !== recordIds.length) {
    throw new Error("Число хэшей и идентификаторов записей должно совпадать")
  }

  const size = hashes.length
  const capacity = capacityFor(size)
  const slots = new SharedArrayBuffer(capacity * ProjectStateHashSlotRecordView.viewLength)
  const view = new DataView(slots)
  const builtIndex = { slots, byteOffset: 0, size, capacity }

  for (let entryIndex = 0; entryIndex < size; entryIndex += 1) {
    const hash = hashes[entryIndex]
    let slot = initialSlot(hash, capacity)

    while (
      ProjectStateHashSlotRecordView.decode(view, slotOffset(builtIndex, slot)).occupied !== 0
    ) {
      slot = (slot + 1) & (capacity - 1)
    }

    ProjectStateHashSlotRecordView.encode(
      {
        hash,
        recordId: recordIds[entryIndex],
        occupied: 1,
        reserved8: 0,
        reserved16: 0,
      },
      view,
      slotOffset(builtIndex, slot),
    )
  }

  return builtIndex
}

export function findBinaryHashIndex(
  index: BinaryHashIndex,
  hash: bigint,
  keyEquals: (recordId: number) => boolean,
): number | undefined {
  const view = new DataView(index.slots)
  let slot = initialSlot(hash, index.capacity)

  for (let probes = 0; probes < index.capacity; probes += 1) {
    const record = ProjectStateHashSlotRecordView.decode(view, slotOffset(index, slot))

    if (record.occupied === 0) {
      return undefined
    }
    if (record.hash === hash && keyEquals(record.recordId)) {
      return record.recordId
    }

    slot = (slot + 1) & (index.capacity - 1)
  }

  return undefined
}

export function forEachBinaryHashIndexEntry(
  index: BinaryHashIndex,
  visit: (hash: bigint, recordId: number) => void,
): void {
  const view = new DataView(index.slots)
  for (let slot = 0; slot < index.capacity; slot += 1) {
    const record = ProjectStateHashSlotRecordView.decode(view, slotOffset(index, slot))
    if (record.occupied !== 0) visit(record.hash, record.recordId)
  }
}
