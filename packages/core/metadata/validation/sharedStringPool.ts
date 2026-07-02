const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

const MAGIC = 0x4e4b4453
const VERSION = 1
const HEADER_INTS = 4
const ENTRY_INTS = 2

export interface SharedStringPool {
  buffer: SharedArrayBuffer
  count: number
  bytes: number
  idByValue: Map<string, number>
}

export interface SharedStringPoolView {
  get(id: number): string
}

export function createSharedStringPool(values: readonly string[]): SharedStringPool {
  const idByValue = new Map<string, number>()
  const unique: string[] = []

  for (const value of values) {
    if (idByValue.has(value)) continue
    idByValue.set(value, unique.length)
    unique.push(value)
  }

  const encoded = unique.map((value) => textEncoder.encode(value))
  const headerBytes = HEADER_INTS * Int32Array.BYTES_PER_ELEMENT
  const tableBytes = unique.length * ENTRY_INTS * Int32Array.BYTES_PER_ELEMENT
  const stringsOffset = headerBytes + tableBytes
  const stringBytes = encoded.reduce((total, item) => total + item.byteLength, 0)
  const buffer = new SharedArrayBuffer(stringsOffset + stringBytes)
  const ints = new Int32Array(buffer, 0, HEADER_INTS + unique.length * ENTRY_INTS)
  const bytes = new Uint8Array(buffer)

  ints[0] = MAGIC
  ints[1] = VERSION
  ints[2] = unique.length
  ints[3] = stringsOffset

  let cursor = stringsOffset
  encoded.forEach((value, index) => {
    const base = HEADER_INTS + index * ENTRY_INTS
    ints[base] = cursor
    ints[base + 1] = value.byteLength
    bytes.set(value, cursor)
    cursor += value.byteLength
  })

  return { buffer, count: unique.length, bytes: buffer.byteLength, idByValue }
}

export function createSharedStringPoolView(pool: Pick<SharedStringPool, "buffer" | "count">): SharedStringPoolView {
  const header = new Int32Array(pool.buffer, 0, HEADER_INTS)
  if (header[0] !== MAGIC || header[1] !== VERSION) throw new Error("Некорректный shared string pool")
  const count = header[2] ?? 0
  const ints = new Int32Array(pool.buffer, 0, HEADER_INTS + count * ENTRY_INTS)
  const bytes = new Uint8Array(pool.buffer)

  return {
    get(id) {
      if (!Number.isInteger(id) || id < 0 || id >= count) throw new Error(`Некорректный string id ${id}`)
      const base = HEADER_INTS + id * ENTRY_INTS
      const offset = ints[base] ?? 0
      const length = ints[base + 1] ?? 0
      return textDecoder.decode(bytes.subarray(offset, offset + length))
    },
  }
}
