import {
  BinaryHashSlotRecordView,
  binaryHashIndexCapacity,
  writeBinaryHashIndex,
  Utf8StringArena,
  type BinaryHashIndex,
} from "@nkdk/runtime"
import {
  ProjectStateStringRecordView,
  ProjectStateStringSectionHeaderView,
} from "./layouts"

export interface BinaryStringPool {
  readonly records: ArrayBufferLike
  readonly recordsByteOffset?: number
  readonly utf8: ArrayBufferLike
  readonly utf8ByteOffset?: number
  readonly utf8ByteLength?: number
  readonly lookup: BinaryHashIndex
  readonly count: number
}

const textDecoder = new TextDecoder()

function bytesEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.byteLength !== right.byteLength) return false
  for (let index = 0; index < left.byteLength; index += 1) {
    if (left[index] !== right[index]) return false
  }
  return true
}

export class BinaryStringPoolBuilder {
  readonly #arena = new Utf8StringArena()
  #closed = false

  intern(value: string): number { this.#assertOpen(); return this.#arena.intern(value) }
  internBytes(hash: bigint, utf8: Uint8Array): number { this.#assertOpen(); return this.#arena.internBytes(hash, utf8) }

  finish(): BinaryStringPool { return openBinaryStringPool(this.finishSection()) }

  finishSection(): SharedArrayBuffer {
    this.#assertOpen()
    this.#closed = true
    try {
      const count = this.#arena.count
      const recordsOffset = ProjectStateStringSectionHeaderView.viewLength
      const utf8Offset = recordsOffset + count * ProjectStateStringRecordView.viewLength
      let utf8ByteLength = 0
      for (let id = 0; id < count; id++) utf8ByteLength += this.#arena.bytes(id).byteLength
      const lookupOffset = utf8Offset + utf8ByteLength
      const lookupCapacity = binaryHashIndexCapacity(count)
      const buffer = new SharedArrayBuffer(lookupOffset + lookupCapacity * BinaryHashSlotRecordView.viewLength)
      const view = new DataView(buffer)
      const bytes = new Uint8Array(buffer)
      ProjectStateStringSectionHeaderView.encode({
        count, recordsOffset, utf8Offset, utf8ByteLength, lookupOffset,
        lookupSize: count, lookupCapacity,
      }, view)
      let offset = 0
      for (let id = 0; id < count; id++) {
        const value = this.#arena.bytes(id)
        ProjectStateStringRecordView.encode({ offset, byteLength: value.byteLength },
          view, recordsOffset + id * ProjectStateStringRecordView.viewLength)
        bytes.set(value, utf8Offset + offset)
        offset += value.byteLength
      }
      writeBinaryHashIndex({ slots: buffer, byteOffset: lookupOffset, size: count, capacity: lookupCapacity },
        id => ({ hash: this.#arena.hash(id), recordId: id }))
      return buffer
    } finally {
      this.#arena.clear()
    }
  }

  #assertOpen(): void {
    if (this.#closed) throw new Error("Накопитель строк закрыт")
  }
}

export function readBinaryStringBytes(pool: BinaryStringPool, id: number): Uint8Array<ArrayBufferLike> {
  if (!Number.isSafeInteger(id) || id < 0 || id >= pool.count) {
    throw new Error(`Неизвестный идентификатор строки: ${id}`)
  }

  const record = ProjectStateStringRecordView.decode(
    new DataView(pool.records),
    (pool.recordsByteOffset ?? 0) + id * ProjectStateStringRecordView.viewLength,
  )
  const utf8ByteOffset = pool.utf8ByteOffset ?? 0
  const utf8ByteLength = pool.utf8ByteLength ?? pool.utf8.byteLength
  if (record.offset + record.byteLength > utf8ByteLength) {
    throw new Error(`Повреждена строка с идентификатором ${id}`)
  }
  return new Uint8Array(pool.utf8, utf8ByteOffset + record.offset, record.byteLength)
}

export function readBinaryString(pool: BinaryStringPool, id: number): string {
  return textDecoder.decode(readBinaryStringBytes(pool, id))
}

export function binaryStringEquals(
  pool: BinaryStringPool,
  id: number,
  utf8: Uint8Array,
): boolean {
  return bytesEqual(readBinaryStringBytes(pool, id), utf8)
}


export function openBinaryStringPool(
  buffer: ArrayBufferLike,
  byteOffset = 0,
  byteLength = buffer.byteLength - byteOffset,
): BinaryStringPool {
  if (byteLength < ProjectStateStringSectionHeaderView.viewLength) {
    throw new Error("Раздел строк оборван")
  }
  const header = ProjectStateStringSectionHeaderView.decode(new DataView(buffer, byteOffset, byteLength))
  const recordsByteLength = header.count * ProjectStateStringRecordView.viewLength
  const lookupByteLength =
    header.lookupCapacity * BinaryHashSlotRecordView.viewLength
  if (
    header.recordsOffset !== ProjectStateStringSectionHeaderView.viewLength ||
    header.utf8Offset !== header.recordsOffset + recordsByteLength ||
    header.lookupOffset !== header.utf8Offset + header.utf8ByteLength ||
    header.lookupOffset + lookupByteLength !== byteLength ||
    header.lookupSize !== header.count ||
    header.lookupCapacity < 1 ||
    (header.lookupCapacity & (header.lookupCapacity - 1)) !== 0
  ) {
    throw new Error("Повреждена структура раздела строк")
  }

  return {
    records: buffer,
    recordsByteOffset: byteOffset + header.recordsOffset,
    utf8: buffer,
    utf8ByteOffset: byteOffset + header.utf8Offset,
    utf8ByteLength: header.utf8ByteLength,
    lookup: {
      slots: buffer,
      byteOffset: byteOffset + header.lookupOffset,
      size: header.lookupSize,
      capacity: header.lookupCapacity,
    },
    count: header.count,
  }
}
