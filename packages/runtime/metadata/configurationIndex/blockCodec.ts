import type {
  ConfigurationIndexBlock,
  ConfigurationIndexBlockEntity,
  ConfigurationIndexChild,
} from "./types"

const UUID_FLAG = 1
const XML_ID_FLAG = 2
const CHILDREN_FLAG = 4
const KNOWN_FLAGS = UUID_FLAG | XML_ID_FLAG | CHILDREN_FLAG
const MAX_U32 = 0xffff_ffff
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
const textDecoder = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true })

export type ConfigurationIndexPendingValue =
  | { readonly kind: "delete" }
  | { readonly kind: "put"; readonly value: Uint8Array }

export function encodeConfigurationIndexBlock(block: ConfigurationIndexBlock): Uint8Array {
  assertU32(block.entities.length, "Количество entity")
  const entities = [...block.entities].sort((left, right) => compareUtf8(left.logicalAddress, right.logicalAddress))
  const addresses = new Set<string>()
  const chunks: Buffer[] = [encodeU32(entities.length)]

  for (const entity of entities) {
    validateEntity(entity)
    if (addresses.has(entity.logicalAddress)) {
      throw new Error(`Повтор logicalAddress: ${entity.logicalAddress}`)
    }
    addresses.add(entity.logicalAddress)
    chunks.push(encodeString(entity.logicalAddress), Buffer.of(entityFlags(entity)))
    if (entity.uuid !== undefined) chunks.push(encodeUuid(entity.uuid))
    if (entity.xmlId !== undefined) chunks.push(encodeString(entity.xmlId))
    if (entity.children !== undefined) chunks.push(encodeChildren(entity.children))
  }

  return Buffer.concat(chunks)
}

export function decodeConfigurationIndexBlock(bytes: Uint8Array): ConfigurationIndexBlock {
  const reader = new BinaryReader(bytes)
  const count = reader.u32()
  const entities: ConfigurationIndexBlockEntity[] = []
  const addresses = new Set<string>()

  for (let index = 0; index < count; index += 1) {
    const logicalAddress = reader.string()
    const flags = reader.u8()
    if ((flags & ~KNOWN_FLAGS) !== 0) throw new Error(`Неизвестные флаги entity: ${flags}`)
    if (flags === 0) throw new Error(`Пустая entity: ${logicalAddress}`)
    if (addresses.has(logicalAddress)) throw new Error(`Повтор logicalAddress: ${logicalAddress}`)
    addresses.add(logicalAddress)

    const uuid = (flags & UUID_FLAG) !== 0 ? reader.uuid() : undefined
    const xmlId = (flags & XML_ID_FLAG) !== 0 ? reader.string() : undefined
    const children = (flags & CHILDREN_FLAG) !== 0 ? reader.children() : undefined
    const entity = { logicalAddress, uuid, xmlId, children }
    validateEntity(entity)
    entities.push(copyConfigurationIndexBlockEntity(entity))
  }

  reader.finish()
  return { entities }
}

export function encodeContentHash(value: bigint): Uint8Array {
  if (value < 0n || value > 0xffff_ffff_ffff_ffffn) throw new Error(`Хэш вне диапазона u64: ${value}`)
  const bytes = Buffer.allocUnsafe(8)
  bytes.writeBigUInt64LE(value)
  return bytes
}

export function decodeContentHash(bytes: Uint8Array): bigint {
  if (bytes.byteLength !== 8) throw new Error(`Хэш должен занимать 8 байт, получено: ${bytes.byteLength}`)
  return Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength).readBigUInt64LE()
}

export function encodePendingPut(value: Uint8Array): Uint8Array {
  if (value.byteLength === 0) throw new Error("Pending put не может содержать пустое значение")
  const result = new Uint8Array(value.byteLength + 1)
  result[0] = 1
  result.set(value, 1)
  return result
}

export function encodePendingDelete(): Uint8Array {
  return Uint8Array.of(0)
}

export function decodePendingValue(bytes: Uint8Array): ConfigurationIndexPendingValue {
  if (bytes.byteLength === 1 && bytes[0] === 0) return { kind: "delete" }
  if (bytes.byteLength > 1 && bytes[0] === 1) return { kind: "put", value: bytes.slice(1) }
  throw new Error("Некорректное pending-значение")
}

function validateEntity(entity: ConfigurationIndexBlockEntity): void {
  const keys = Object.keys(entity)
  if (keys.some((key) => !["logicalAddress", "uuid", "xmlId", "children"].includes(key))) {
    throw new Error(`Неизвестное поле entity: ${keys.join(", ")}`)
  }
  validateString(entity.logicalAddress, "logicalAddress")
  if (entity.uuid !== undefined && !UUID_PATTERN.test(entity.uuid)) throw new Error(`Некорректный UUID: ${entity.uuid}`)
  if (entity.xmlId !== undefined) validateString(entity.xmlId, "xmlId")
  if (entity.children !== undefined) {
    if (entity.children.length === 0) throw new Error("children не может быть пустым")
    assertU32(entity.children.length, "Количество children")
    for (const child of entity.children) {
      validateString(child.xmlName, "children.xmlName")
      validateString(child.name, "children.name")
    }
  }
  if (entity.uuid === undefined && entity.xmlId === undefined && entity.children === undefined) {
    throw new Error(`Entity ${entity.logicalAddress} не содержит данных`)
  }
}

function entityFlags(entity: ConfigurationIndexBlockEntity): number {
  return (entity.uuid === undefined ? 0 : UUID_FLAG)
    | (entity.xmlId === undefined ? 0 : XML_ID_FLAG)
    | (entity.children === undefined ? 0 : CHILDREN_FLAG)
}

function encodeUuid(uuid: string): Buffer {
  return Buffer.from(uuid.replaceAll("-", ""), "hex")
}

function encodeChildren(children: readonly ConfigurationIndexChild[]): Buffer {
  return Buffer.concat([
    encodeU32(children.length),
    ...children.flatMap((child) => [encodeString(child.xmlName), encodeString(child.name)]),
  ])
}

function encodeString(value: string): Buffer {
  validateString(value, "Строка")
  const encoded = Buffer.from(value, "utf8")
  assertU32(encoded.byteLength, "Длина строки")
  return Buffer.concat([encodeU32(encoded.byteLength), encoded])
}

function encodeU32(value: number): Buffer {
  assertU32(value, "Значение")
  const bytes = Buffer.allocUnsafe(4)
  bytes.writeUInt32LE(value)
  return bytes
}

function assertU32(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 0 || value > MAX_U32) throw new Error(`${label} вне диапазона u32: ${value}`)
}

function validateString(value: string, label: string): void {
  if (typeof value !== "string" || value.length === 0) throw new Error(`${label} не может быть пустой строкой`)
  if (value.includes("\0")) throw new Error(`${label} содержит NUL`)
}

function compareUtf8(left: string, right: string): number {
  return Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"))
}

export function copyConfigurationIndexBlockEntity(entity: {
  readonly logicalAddress: string
  readonly uuid: string | undefined
  readonly xmlId: string | undefined
  readonly children: readonly ConfigurationIndexChild[] | undefined
}): ConfigurationIndexBlockEntity {
  return {
    logicalAddress: entity.logicalAddress,
    ...(entity.uuid === undefined ? {} : { uuid: entity.uuid }),
    ...(entity.xmlId === undefined ? {} : { xmlId: entity.xmlId }),
    ...(entity.children === undefined ? {} : { children: entity.children }),
  }
}

class BinaryReader {
  private offset = 0

  constructor(private readonly bytes: Uint8Array) {}

  u8(): number {
    return this.take(1)[0]!
  }

  u32(): number {
    return Buffer.from(this.take(4)).readUInt32LE()
  }

  string(): string {
    const length = this.u32()
    if (length === 0) throw new Error("Строка не может быть пустой")
    return textDecoder.decode(this.take(length))
  }

  uuid(): string {
    const hex = Buffer.from(this.take(16)).toString("hex")
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
  }

  children(): readonly ConfigurationIndexChild[] {
    const count = this.u32()
    if (count === 0) throw new Error("children не может быть пустым")
    return Array.from({ length: count }, () => ({ xmlName: this.string(), name: this.string() }))
  }

  finish(): void {
    if (this.offset !== this.bytes.byteLength) throw new Error("После блока остались лишние байты")
  }

  private take(length: number): Uint8Array {
    if (length > this.bytes.byteLength - this.offset) throw new Error("Оборванное двоичное значение")
    const result = this.bytes.subarray(this.offset, this.offset + length)
    this.offset += length
    return result
  }
}
