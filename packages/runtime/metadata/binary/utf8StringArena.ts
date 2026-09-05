import { xxh3 } from "@node-rs/xxhash"
import { View } from "structurae"
import { BinaryRecordBuffer } from "./recordBuffer"

interface StringRange {
  bufferId: number
  offset: number
  byteLength: number
  hash: bigint
}

const rangeCodec = new View().create<StringRange>({
  $id: "Utf8StringRange",
  type: "object",
  properties: {
    bufferId: { type: "integer", btype: "uint32" },
    offset: { type: "integer", btype: "uint32" },
    byteLength: { type: "integer", btype: "uint32" },
    hash: { type: "number", btype: "biguint64" },
  },
})
const encoder = new TextEncoder()

/** Числовые адреса строк; готовые входные диапазоны должны оставаться неизменными. */
export class Utf8StringArena {
  readonly #records = new BinaryRecordBuffer(rangeCodec)
  readonly #buffers: ArrayBufferLike[] = []
  readonly #bufferIds = new Map<ArrayBufferLike, number>()
  #slots = new Uint32Array(8)
  #scratch = new Uint8Array(0)
  #owned = new Uint8Array(0)
  #used = 0

  constructor(private readonly hashString: (bytes: Uint8Array) => bigint = xxh3.xxh64) {}

  get count(): number { return this.#records.length }

  intern(value: string): number {
    const maximumBytes = value.length * 3
    if (this.#scratch.byteLength < maximumBytes) this.#scratch = new Uint8Array(maximumBytes)
    const { written } = encoder.encodeInto(value, this.#scratch)
    return this.#intern(this.hashString(this.#scratch.subarray(0, written)),
      this.#scratch.subarray(0, written), true)
  }

  /** Заимствует immutable байты до clear(), без decode/encode и копии каждой строки. */
  internBytes(hash: bigint, bytes: Uint8Array<ArrayBufferLike>): number {
    return this.#intern(hash, bytes, false)
  }

  bytes(id: number): Uint8Array<ArrayBufferLike> {
    const range = this.#records.read(id)
    return new Uint8Array(this.#buffers[range.bufferId]!, range.offset, range.byteLength)
  }

  hash(id: number): bigint { return this.#records.read(id).hash }

  clear(): void {
    this.#records.clear()
    this.#buffers.length = 0
    this.#bufferIds.clear()
    this.#slots = new Uint32Array(8)
    this.#scratch = new Uint8Array(0)
    this.#owned = new Uint8Array(0)
    this.#used = 0
  }

  #intern(hash: bigint, input: Uint8Array<ArrayBufferLike>, copy: boolean): number {
    if (hash < 0n || hash > 0xffffffffffffffffn || input.byteOffset > 0xffffffff || input.byteLength > 0xffffffff) {
      throw new RangeError("Строковый диапазон не помещается в двоичный формат")
    }
    let slot = this.#slot(hash)
    while (this.#slots[slot] !== 0) {
      const id = this.#slots[slot]! - 1
      if (this.hash(id) === hash && equalBytes(this.bytes(id), input)) return id
      slot = (slot + 1) & (this.#slots.length - 1)
    }
    if ((this.count + 1) / this.#slots.length > 0.8) {
      this.#slots = new Uint32Array(this.#slots.length * 2)
      for (let id = 0; id < this.count; id++) this.#insert(id)
    }
    if (this.count >= 0xffffffff || this.#buffers.length > 0xffffffff) {
      throw new RangeError("Переполнение идентификатора строкового диапазона")
    }
    let bytes = input
    if (copy) {
      if (this.#owned.byteLength - this.#used < input.byteLength) {
        this.#owned = new Uint8Array(Math.max(4096, input.byteLength))
        this.#used = 0
      }
      this.#owned.set(input, this.#used)
      bytes = this.#owned.subarray(this.#used, this.#used + input.byteLength)
      this.#used += input.byteLength
    }
    let bufferId = this.#bufferIds.get(bytes.buffer)
    if (bufferId === undefined) {
      bufferId = this.#buffers.length
      this.#bufferIds.set(bytes.buffer, bufferId)
      this.#buffers.push(bytes.buffer)
    }
    const id = this.#records.append({ bufferId, offset: bytes.byteOffset, byteLength: bytes.byteLength, hash })
    this.#insert(id)
    return id
  }

  #slot(hash: bigint): number { return Number(hash & BigInt(this.#slots.length - 1)) }

  #insert(id: number): void {
    let slot = this.#slot(this.hash(id))
    while (this.#slots[slot] !== 0) slot = (slot + 1) & (this.#slots.length - 1)
    this.#slots[slot] = id + 1
  }
}

function equalBytes(left: Uint8Array<ArrayBufferLike>, right: Uint8Array<ArrayBufferLike>): boolean {
  if (left.byteLength !== right.byteLength) return false
  for (let index = 0; index < left.byteLength; index++) if (left[index] !== right[index]) return false
  return true
}
