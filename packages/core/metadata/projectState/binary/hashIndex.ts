import { ProjectStateHashSlotRecordView } from "./layouts"

export interface BinaryHashIndex {
  readonly slots: SharedArrayBuffer
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

function slotOffset(slot: number): number {
  return slot * ProjectStateHashSlotRecordView.viewLength
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

  for (let index = 0; index < size; index += 1) {
    const hash = hashes[index]
    let slot = initialSlot(hash, capacity)

    while (
      ProjectStateHashSlotRecordView.decode(view, slotOffset(slot)).occupied !== 0
    ) {
      slot = (slot + 1) & (capacity - 1)
    }

    ProjectStateHashSlotRecordView.encode(
      {
        hash,
        recordId: recordIds[index],
        occupied: 1,
        reserved8: 0,
        reserved16: 0,
      },
      view,
      slotOffset(slot),
    )
  }

  return { slots, size, capacity }
}

export function findBinaryHashIndex(
  index: BinaryHashIndex,
  hash: bigint,
  keyEquals: (recordId: number) => boolean,
): number | undefined {
  const view = new DataView(index.slots)
  let slot = initialSlot(hash, index.capacity)

  for (let probes = 0; probes < index.capacity; probes += 1) {
    const record = ProjectStateHashSlotRecordView.decode(view, slotOffset(slot))

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
