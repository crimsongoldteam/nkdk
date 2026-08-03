import { xxh3 } from "@node-rs/xxhash"
import { buildBinaryHashIndex, type BinaryHashIndex } from "./hashIndex"
import { ProjectStateStringRecordView } from "./layouts"

export interface BinaryStringPool {
  readonly records: SharedArrayBuffer
  readonly utf8: SharedArrayBuffer
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
  readonly #values: Uint8Array[] = []
  readonly #hashes: bigint[] = []
  #slots = new Uint32Array(8)

  intern(value: string): number {
    const utf8 = textEncoder.encode(value)
    const hash = xxh3.xxh64(utf8)
    const existing = this.#find(hash, utf8)
    if (existing !== undefined) return existing

    if ((this.#values.length + 1) / this.#slots.length > MAX_LOAD_FACTOR) {
      this.#resize(this.#slots.length * 2)
    }

    const id = this.#values.length
    this.#values.push(utf8)
    this.#hashes.push(hash)
    this.#insert(id)
    return id
  }

  finish(): BinaryStringPool {
    const totalUtf8Bytes = this.#values.reduce((total, value) => total + value.byteLength, 0)
    const records = new SharedArrayBuffer(
      this.#values.length * ProjectStateStringRecordView.viewLength,
    )
    const utf8 = new SharedArrayBuffer(totalUtf8Bytes)
    const recordsView = new DataView(records)
    const utf8View = new Uint8Array(utf8)
    let offset = 0

    this.#values.forEach((value, id) => {
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
      lookup: buildBinaryHashIndex(
        BigUint64Array.from(this.#hashes),
        Uint32Array.from({ length: this.#values.length }, (_, id) => id),
      ),
      count: this.#values.length,
    }
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

function readStringBytes(pool: BinaryStringPool, id: number): Uint8Array<SharedArrayBuffer> {
  if (!Number.isSafeInteger(id) || id < 0 || id >= pool.count) {
    throw new Error(`Неизвестный идентификатор строки: ${id}`)
  }

  const record = ProjectStateStringRecordView.decode(
    new DataView(pool.records),
    id * ProjectStateStringRecordView.viewLength,
  )
  if (record.offset + record.byteLength > pool.utf8.byteLength) {
    throw new Error(`Повреждена строка с идентификатором ${id}`)
  }
  return new Uint8Array(pool.utf8, record.offset, record.byteLength)
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
