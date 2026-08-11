import { View } from "structurae"

interface BinaryHashSlotRecord {
  readonly hash: bigint
  readonly recordId: number
  readonly occupied: number
  readonly reserved8: number
  readonly reserved16: number
}

export interface BinaryHashIndex {
  readonly slots: ArrayBufferLike
  readonly byteOffset?: number
  readonly size: number
  readonly capacity: number
}

export const BinaryHashSlotRecordView = new View().create<BinaryHashSlotRecord>({
  $id: "BinaryHashSlotRecord",
  type: "object",
  properties: {
    hash: { type: "number", btype: "biguint64" },
    recordId: { type: "integer", btype: "uint32" },
    occupied: { type: "integer", btype: "uint8" },
    reserved8: { type: "integer", btype: "uint8" },
    reserved16: { type: "integer", btype: "uint16" },
  },
})

const MAX_LOAD_FACTOR = 0.8

function capacityFor(size: number): number {
  const minimumCapacity = Math.max(1, Math.ceil(size / MAX_LOAD_FACTOR))
  let capacity = 1

  while (capacity < minimumCapacity) capacity *= 2
  return capacity
}

function initialSlot(hash: bigint, capacity: number): number {
  return Number(hash & BigInt(capacity - 1))
}

function slotOffset(index: BinaryHashIndex, slot: number): number {
  return (index.byteOffset ?? 0) + slot * BinaryHashSlotRecordView.viewLength
}

export function openBinaryHashIndex(index: BinaryHashIndex): BinaryHashIndex {
  const byteOffset = index.byteOffset ?? 0
  if (
    !Number.isSafeInteger(index.size)
    || index.size < 0
    || !Number.isSafeInteger(index.capacity)
    || index.capacity < 1
    || (index.capacity & (index.capacity - 1)) !== 0
    || index.size > index.capacity
    || index.size / index.capacity > MAX_LOAD_FACTOR
    || !Number.isSafeInteger(byteOffset)
    || byteOffset < 0
    || byteOffset + index.capacity * BinaryHashSlotRecordView.viewLength > index.slots.byteLength
  ) {
    throw new Error("Повреждён двоичный hash-index")
  }
  return index
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
  const slots = new SharedArrayBuffer(capacity * BinaryHashSlotRecordView.viewLength)
  const view = new DataView(slots)
  const builtIndex = { slots, byteOffset: 0, size, capacity }

  for (let entryIndex = 0; entryIndex < size; entryIndex += 1) {
    const hash = hashes[entryIndex]
    let slot = initialSlot(hash, capacity)

    while (
      BinaryHashSlotRecordView.decode(view, slotOffset(builtIndex, slot)).occupied !== 0
    ) {
      slot = (slot + 1) & (capacity - 1)
    }

    BinaryHashSlotRecordView.encode(
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
  openBinaryHashIndex(index)
  const view = new DataView(index.slots)
  let slot = initialSlot(hash, index.capacity)

  for (let probes = 0; probes < index.capacity; probes += 1) {
    const record = BinaryHashSlotRecordView.decode(view, slotOffset(index, slot))

    if (record.occupied === 0) return undefined
    if (record.hash === hash && keyEquals(record.recordId)) return record.recordId

    slot = (slot + 1) & (index.capacity - 1)
  }

  return undefined
}

export function forEachBinaryHashIndexEntry(
  index: BinaryHashIndex,
  visit: (hash: bigint, recordId: number) => void,
): void {
  openBinaryHashIndex(index)
  const view = new DataView(index.slots)
  for (let slot = 0; slot < index.capacity; slot += 1) {
    const record = BinaryHashSlotRecordView.decode(view, slotOffset(index, slot))
    if (record.occupied !== 0) visit(record.hash, record.recordId)
  }
}
