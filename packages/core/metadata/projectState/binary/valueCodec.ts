import type { BinaryStringPool } from "./stringPool"
import { BinaryStringPoolBuilder, readBinaryString } from "./stringPool"

const enum ValueTag {
  Undefined = 0,
  Null = 1,
  False = 2,
  True = 3,
  Integer = 4,
  Float = 5,
  BigInt = 6,
  String = 7,
  Array = 8,
  Object = 9,
}

class BinaryValueWriter {
  #bytes = new Uint8Array(128)
  #length = 0

  finish(): Uint8Array<ArrayBuffer> {
    return new Uint8Array(this.#bytes.buffer.slice(0, this.#length))
  }

  writeUint8(value: number): void {
    this.#reserve(1)
    this.#bytes[this.#length] = value
    this.#length += 1
  }

  writeUint32(value: number): void {
    this.#reserve(4)
    new DataView(this.#bytes.buffer).setUint32(this.#length, value, true)
    this.#length += 4
  }

  writeBigInt64(value: bigint): void {
    this.#reserve(8)
    new DataView(this.#bytes.buffer).setBigInt64(this.#length, value, true)
    this.#length += 8
  }

  writeFloat64(value: number): void {
    this.#reserve(8)
    new DataView(this.#bytes.buffer).setFloat64(this.#length, value, true)
    this.#length += 8
  }

  writeBytes(value: Uint8Array): void {
    this.#reserve(value.byteLength)
    this.#bytes.set(value, this.#length)
    this.#length += value.byteLength
  }

  #reserve(additional: number): void {
    const required = this.#length + additional
    if (required <= this.#bytes.byteLength) return

    let capacity = this.#bytes.byteLength
    while (capacity < required) capacity *= 2
    const grown = new Uint8Array(capacity)
    grown.set(this.#bytes)
    this.#bytes = grown
  }
}

class BinaryValueReader {
  readonly #view: DataView
  #offset = 0

  constructor(readonly bytes: Uint8Array) {
    this.#view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  }

  get finished(): boolean {
    return this.#offset === this.bytes.byteLength
  }

  readUint8(): number {
    this.#ensure(1)
    const value = this.#view.getUint8(this.#offset)
    this.#offset += 1
    return value
  }

  readUint32(): number {
    this.#ensure(4)
    const value = this.#view.getUint32(this.#offset, true)
    this.#offset += 4
    return value
  }

  readBigInt64(): bigint {
    this.#ensure(8)
    const value = this.#view.getBigInt64(this.#offset, true)
    this.#offset += 8
    return value
  }

  readFloat64(): number {
    this.#ensure(8)
    const value = this.#view.getFloat64(this.#offset, true)
    this.#offset += 8
    return value
  }

  readBytes(byteLength: number): Uint8Array {
    this.#ensure(byteLength)
    const value = this.bytes.subarray(this.#offset, this.#offset + byteLength)
    this.#offset += byteLength
    return value
  }

  #ensure(byteLength: number): void {
    if (this.#offset + byteLength > this.bytes.byteLength) {
      throw new Error("Двоичное значение оборвано")
    }
  }
}

function assertUint32(value: number, field: string): void {
  if (!Number.isSafeInteger(value) || value < 0 || value > 0xffff_ffff) {
    throw new Error(`${field} не помещается в uint32`)
  }
}

function encodeValue(
  value: unknown,
  strings: BinaryStringPoolBuilder,
  writer: BinaryValueWriter,
  ancestors: Set<object>,
): void {
  if (value === undefined) return writer.writeUint8(ValueTag.Undefined)
  if (value === null) return writer.writeUint8(ValueTag.Null)
  if (value === false) return writer.writeUint8(ValueTag.False)
  if (value === true) return writer.writeUint8(ValueTag.True)

  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("Двоичное значение содержит не конечное число")
    if (Number.isSafeInteger(value)) {
      writer.writeUint8(ValueTag.Integer)
      writer.writeBigInt64(BigInt(value))
    } else {
      writer.writeUint8(ValueTag.Float)
      writer.writeFloat64(value)
    }
    return
  }

  if (typeof value === "bigint") {
    writer.writeUint8(ValueTag.BigInt)
    writer.writeUint8(value < 0n ? 1 : 0)
    let magnitude = value < 0n ? -value : value
    const bytes: number[] = []
    while (magnitude !== 0n) {
      bytes.push(Number(magnitude & 0xffn))
      magnitude >>= 8n
    }
    assertUint32(bytes.length, "Размер bigint")
    writer.writeUint32(bytes.length)
    writer.writeBytes(Uint8Array.from(bytes))
    return
  }

  if (typeof value === "string") {
    const id = strings.intern(value)
    assertUint32(id, "Идентификатор строки")
    writer.writeUint8(ValueTag.String)
    writer.writeUint32(id)
    return
  }

  if (typeof value !== "object" || typeof value === "function" || typeof value === "symbol") {
    throw new Error("Двоичное значение содержит непереносимое значение")
  }
  if (ancestors.has(value)) throw new Error("Двоичное значение содержит циклическую ссылку")
  ancestors.add(value)

  if (Array.isArray(value)) {
    if (Object.getPrototypeOf(value) !== Array.prototype) {
      throw new Error("Двоичное значение содержит нестандартный массив")
    }
    assertUint32(value.length, "Длина массива")
    writer.writeUint8(ValueTag.Array)
    writer.writeUint32(value.length)
    for (let index = 0; index < value.length; index += 1) {
      if (!Object.hasOwn(value, index)) throw new Error("Разреженные массивы не поддерживаются")
      encodeValue(value[index], strings, writer, ancestors)
    }
    ancestors.delete(value)
    return
  }

  if (Object.getPrototypeOf(value) !== Object.prototype) {
    throw new Error("Двоичное значение содержит объект с нестандартным прототипом")
  }
  const keys = Reflect.ownKeys(value)
  if (keys.some((key) => typeof key === "symbol")) {
    throw new Error("Двоичное значение содержит symbol-поле")
  }
  const stringKeys = (keys as string[]).sort()
  assertUint32(stringKeys.length, "Число полей объекта")
  writer.writeUint8(ValueTag.Object)
  writer.writeUint32(stringKeys.length)
  for (const key of stringKeys) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key)
    if (descriptor === undefined || !("value" in descriptor) || !descriptor.enumerable) {
      throw new Error(`Поле ${key} должно быть перечислимым data property`)
    }
    const keyId = strings.intern(key)
    assertUint32(keyId, "Идентификатор ключа")
    writer.writeUint32(keyId)
    encodeValue(descriptor.value, strings, writer, ancestors)
  }
  ancestors.delete(value)
}

function decodeValue(reader: BinaryValueReader, strings: BinaryStringPool): unknown {
  const tag = reader.readUint8()
  switch (tag) {
    case ValueTag.Undefined:
      return undefined
    case ValueTag.Null:
      return null
    case ValueTag.False:
      return false
    case ValueTag.True:
      return true
    case ValueTag.Integer:
      return Number(reader.readBigInt64())
    case ValueTag.Float:
      return reader.readFloat64()
    case ValueTag.BigInt:
    {
      const sign = reader.readUint8()
      if (sign > 1) throw new Error(`Неизвестный знак bigint: ${sign}`)
      const bytes = reader.readBytes(reader.readUint32())
      let magnitude = 0n
      for (let index = bytes.byteLength - 1; index >= 0; index -= 1) {
        magnitude = (magnitude << 8n) | BigInt(bytes[index])
      }
      if (sign === 1 && magnitude === 0n) throw new Error("Неканонический отрицательный ноль bigint")
      return sign === 1 ? -magnitude : magnitude
    }
    case ValueTag.String:
      return readBinaryString(strings, reader.readUint32())
    case ValueTag.Array: {
      const length = reader.readUint32()
      return Array.from({ length }, () => decodeValue(reader, strings))
    }
    case ValueTag.Object: {
      const fields = reader.readUint32()
      const result: Record<string, unknown> = {}
      for (let index = 0; index < fields; index += 1) {
        const key = readBinaryString(strings, reader.readUint32())
        if (Object.hasOwn(result, key)) throw new Error(`Повторяющийся ключ двоичного значения: ${key}`)
        Object.defineProperty(result, key, {
          value: decodeValue(reader, strings),
          enumerable: true,
          configurable: true,
          writable: true,
        })
      }
      return result
    }
    default:
      throw new Error(`Неизвестный тег двоичного значения: ${tag}`)
  }
}

export function encodeBinaryValue(
  value: unknown,
  strings: BinaryStringPoolBuilder,
): Uint8Array<ArrayBuffer> {
  const writer = new BinaryValueWriter()
  encodeValue(value, strings, writer, new Set())
  return writer.finish()
}

export function decodeBinaryValue(bytes: Uint8Array, strings: BinaryStringPool): unknown {
  const reader = new BinaryValueReader(bytes)
  const value = decodeValue(reader, strings)
  if (!reader.finished) throw new Error("После двоичного значения остались лишние байты")
  return value
}
