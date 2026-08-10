import { xxh3 } from "@node-rs/xxhash"
import {
  BinaryHashSlotRecordView,
  buildBinaryHashIndex,
  findBinaryHashIndex,
  forEachBinaryHashIndexEntry,
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

const MAX_LOAD_FACTOR = 0.8
const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

function bytesEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.byteLength !== right.byteLength) return false
  for (let index = 0; index < left.byteLength; index += 1) {
    if (left[index] !== right[index]) return false
  }
  return true
}

export class BinaryStringPoolBuilder {
  readonly #base?: BinaryStringPool
  readonly #values: Uint8Array[] = []
  readonly #hashes: bigint[] = []
  #slots = new Uint32Array(8)

  constructor(base?: BinaryStringPool) {
    this.#base = base
  }

  intern(value: string): number {
    const utf8 = textEncoder.encode(value)
    return this.internBytes(xxh3.xxh64(utf8), utf8)
  }

  internBytes(hash: bigint, utf8: Uint8Array): number {
    const existing = this.#find(hash, utf8)
    if (existing !== undefined) return this.#baseCount + existing
    if (this.#base !== undefined) {
      const baseId = findBinaryHashIndex(
        this.#base.lookup,
        hash,
        (id) => binaryStringEquals(this.#base!, id, utf8),
      )
      if (baseId !== undefined) return baseId
    }

    if ((this.#values.length + 1) / this.#slots.length > MAX_LOAD_FACTOR) {
      this.#resize(this.#slots.length * 2)
    }

    const id = this.#values.length
    this.#values.push(utf8.slice())
    this.#hashes.push(hash)
    this.#insert(id)
    return this.#baseCount + id
  }

  finish(): BinaryStringPool {
    const baseUtf8Bytes = this.#base?.utf8ByteLength ?? this.#base?.utf8.byteLength ?? 0
    const appendedUtf8Bytes = this.#values.reduce((total, value) => total + value.byteLength, 0)
    const totalUtf8Bytes = baseUtf8Bytes + appendedUtf8Bytes
    const count = this.#baseCount + this.#values.length
    const records = new SharedArrayBuffer(
      count * ProjectStateStringRecordView.viewLength,
    )
    const utf8 = new SharedArrayBuffer(totalUtf8Bytes)
    const recordsView = new DataView(records)
    const utf8View = new Uint8Array(utf8)
    let offset = baseUtf8Bytes

    if (this.#base !== undefined) {
      new Uint8Array(records).set(
        new Uint8Array(
          this.#base.records,
          this.#base.recordsByteOffset ?? 0,
          this.#base.count * ProjectStateStringRecordView.viewLength,
        ),
      )
      utf8View.set(
        new Uint8Array(
          this.#base.utf8,
          this.#base.utf8ByteOffset ?? 0,
          baseUtf8Bytes,
        ),
      )
    }

    this.#values.forEach((value, localId) => {
      const id = this.#baseCount + localId
      utf8View.set(value, offset)
      ProjectStateStringRecordView.encode(
        { offset, byteLength: value.byteLength },
        recordsView,
        id * ProjectStateStringRecordView.viewLength,
      )
      offset += value.byteLength
    })

    return {
      records,
      utf8,
      utf8ByteOffset: 0,
      utf8ByteLength: totalUtf8Bytes,
      lookup: this.#buildLookup(count),
      count,
    }
  }

  get #baseCount(): number {
    return this.#base?.count ?? 0
  }

  #buildLookup(count: number): BinaryHashIndex {
    const hashes = new BigUint64Array(count)
    if (this.#base !== undefined) {
      forEachBinaryHashIndexEntry(this.#base.lookup, (hash, id) => {
        if (id >= this.#baseCount) throw new Error("Повреждён индекс строк исходного снимка")
        hashes[id] = hash
      })
    }
    this.#hashes.forEach((hash, localId) => {
      hashes[this.#baseCount + localId] = hash
    })
    return buildBinaryHashIndex(
      hashes,
      Uint32Array.from({ length: count }, (_, id) => id),
    )
  }

  #find(hash: bigint, utf8: Uint8Array): number | undefined {
    let slot = Number(hash & BigInt(this.#slots.length - 1))

    for (let probes = 0; probes < this.#slots.length; probes += 1) {
      const stored = this.#slots[slot]
      if (stored === 0) return undefined

      const id = stored - 1
      if (this.#hashes[id] === hash && bytesEqual(this.#values[id], utf8)) return id
      slot = (slot + 1) & (this.#slots.length - 1)
    }

    return undefined
  }

  #insert(id: number): void {
    const hash = this.#hashes[id]
    let slot = Number(hash & BigInt(this.#slots.length - 1))
    while (this.#slots[slot] !== 0) slot = (slot + 1) & (this.#slots.length - 1)
    this.#slots[slot] = id + 1
  }

  #resize(capacity: number): void {
    this.#slots = new Uint32Array(capacity)
    for (let id = 0; id < this.#values.length; id += 1) this.#insert(id)
  }
}

function readStringBytes(pool: BinaryStringPool, id: number): Uint8Array<ArrayBufferLike> {
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
  return textDecoder.decode(readStringBytes(pool, id))
}

export function binaryStringEquals(
  pool: BinaryStringPool,
  id: number,
  utf8: Uint8Array,
): boolean {
  return bytesEqual(readStringBytes(pool, id), utf8)
}

export function packBinaryStringPool(pool: BinaryStringPool): SharedArrayBuffer {
  const recordsByteLength = pool.count * ProjectStateStringRecordView.viewLength
  const utf8ByteLength = pool.utf8ByteLength ?? pool.utf8.byteLength
  const lookupByteLength =
    pool.lookup.capacity * BinaryHashSlotRecordView.viewLength
  const recordsOffset = ProjectStateStringSectionHeaderView.viewLength
  const utf8Offset = recordsOffset + recordsByteLength
  const lookupOffset = utf8Offset + utf8ByteLength
  const buffer = new SharedArrayBuffer(lookupOffset + lookupByteLength)
  const bytes = new Uint8Array(buffer)

  bytes.set(
    new Uint8Array(
      pool.records,
      pool.recordsByteOffset ?? 0,
      recordsByteLength,
    ),
    recordsOffset,
  )
  bytes.set(
    new Uint8Array(
      pool.utf8,
      pool.utf8ByteOffset ?? 0,
      utf8ByteLength,
    ),
    utf8Offset,
  )
  bytes.set(
    new Uint8Array(
      pool.lookup.slots,
      pool.lookup.byteOffset ?? 0,
      lookupByteLength,
    ),
    lookupOffset,
  )
  ProjectStateStringSectionHeaderView.encode(
    {
      count: pool.count,
      recordsOffset,
      utf8Offset,
      utf8ByteLength,
      lookupOffset,
      lookupSize: pool.lookup.size,
      lookupCapacity: pool.lookup.capacity,
    },
    new DataView(buffer),
  )
  return buffer
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
