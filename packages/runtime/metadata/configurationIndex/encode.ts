import { hashSection, writeHash128 } from "./hash"
import { createStringPool, type ConfigurationIndexStringPool } from "./stringPool"
import type { ConfigurationSnapshot, ConfigurationSnapshotEntity, ConfigurationSnapshotFile } from "./types"

interface EncodedSection {
  readonly type: SectionType
  readonly recordCount: bigint
  readonly bytes: Buffer
}

interface NormalizedSnapshot {
  readonly snapshot: ConfigurationSnapshot
  readonly strings: ConfigurationIndexStringPool
}

type SectionType = 1 | 2 | 3 | 4

const HEADER_LENGTH = 64
const DIRECTORY_ENTRY_LENGTH = 64
const SECTION_COUNT = 4
const DIRECTORY_LENGTH = DIRECTORY_ENTRY_LENGTH * SECTION_COUNT
const MAX_U64 = (1n << 64n) - 1n
const ENTITY_FLAGS = {
  uuid: 1 << 0,
  xmlId: 1 << 1,
  xmlName: 1 << 2,
  omittedNames: 1 << 3,
  omittedTypedNames: 1 << 4,
  extended: 1 << 5,
  xsiNil: 1 << 6,
  explicitEmpty: 1 << 7,
  xsiType: 1 << 8,
  xmlText: 1 << 9,
  xmlPrefix: 1 << 10,
  present: 1 << 11,
} as const

export function encodeConfigurationIndex(snapshot: ConfigurationSnapshot): Buffer {
  const normalized = normalizeSnapshot(snapshot)
  const sections = [
    encodeSnapshot(normalized),
    encodeStrings(normalized),
    encodeFiles(normalized),
    encodeEntities(normalized),
  ]
  return encodeContainer(sections)
}

function normalizeSnapshot(snapshot: ConfigurationSnapshot): NormalizedSnapshot {
  validateWellFormedStrings(snapshot)
  const files = [...snapshot.files].sort((left, right) => compareUtf8(left.projectPath, right.projectPath))
  const entities = [...snapshot.entities].sort((left, right) => compareUtf8(left.logicalAddress, right.logicalAddress))
  const normalized = { ...snapshot, files, entities }
  validateSnapshot(normalized)
  return {
    snapshot: normalized,
    strings: createStringPool(snapshotStrings(normalized)),
  }
}

function validateWellFormedStrings(snapshot: ConfigurationSnapshot): void {
  for (const value of snapshotStrings(snapshot, true)) {
    if (!value.isWellFormed()) throw new Error(`Некорректная Unicode-строка: ${JSON.stringify(value)}`)
  }
}

function validateSnapshot(snapshot: ConfigurationSnapshot): void {
  if (snapshot.specificationVersion !== "1.4") {
    throw new Error(`Неподдерживаемая specificationVersion: ${snapshot.specificationVersion}`)
  }
  assertU64(snapshot.indexGeneration, "indexGeneration SNAPSHOT")
  if (snapshot.indexGeneration === 0n) throw new Error("indexGeneration SNAPSHOT должен начинаться с 1")
  const componentPathLength = Buffer.byteLength(snapshot.componentPath, "utf8")
  if (componentPathLength < 1 || componentPathLength > 128) {
    throw new Error("Недопустимый componentPath SNAPSHOT")
  }

  const projectPaths = new Set<string>()
  for (const file of snapshot.files) {
    validateProjectPath(file.projectPath)
    assertU64(file.contentHash, `contentHash FILES ${file.projectPath}`)
    if (projectPaths.has(file.projectPath)) throw new Error(`Повторный projectPath в FILES: ${file.projectPath}`)
    projectPaths.add(file.projectPath)
  }

  const logicalAddresses = new Set<string>()
  for (const entity of snapshot.entities) {
    validateEntity(entity)
    if (logicalAddresses.has(entity.logicalAddress)) {
      throw new Error(`Повторный logicalAddress в ENTITIES: ${entity.logicalAddress}`)
    }
    logicalAddresses.add(entity.logicalAddress)
    if (!projectPaths.has(entity.sourceProjectPath)) {
      throw new Error(`sourceProjectPath ENTITIES отсутствует в FILES: ${entity.sourceProjectPath}`)
    }
  }
}

function validateEntity(entity: ConfigurationSnapshotEntity): void {
  if (entity.logicalAddress.length === 0) throw new Error("Пустой logicalAddress в ENTITIES")
  validateProjectPath(entity.sourceProjectPath)

  const identities = entity.identities
  if (identities?.uuid !== undefined && !isUuid(identities.uuid)) {
    throw new Error(`Некорректный UUID в ENTITIES: ${identities.uuid}`)
  }
  if (identities?.xmlId !== undefined && identities.xmlId.length === 0) {
    throw new Error("Пустой xmlId в ENTITIES")
  }

  const omitted = entity.omittedChildren
  if (omitted !== undefined) {
    const count = omitted.kind === "names" ? omitted.names.length : omitted.items.length
    if (count === 0) throw new Error("Пустой список omittedChildren в ENTITIES")
    assertU32(count, "omittedCount ENTITIES")
  }

  const mask = entityFieldMask(entity)
  if (mask === 0) throw new Error(`Пустая entity ENTITIES: ${entity.logicalAddress}`)
}

function* snapshotStrings(snapshot: ConfigurationSnapshot, includeBinaryUuid = false): Iterable<string> {
  yield snapshot.componentPath
  for (const file of snapshot.files) yield file.projectPath
  for (const entity of snapshot.entities) {
    yield entity.logicalAddress
    yield entity.sourceProjectPath
    if (includeBinaryUuid && entity.identities?.uuid !== undefined) yield entity.identities.uuid
    if (entity.identities?.xmlId !== undefined) yield entity.identities.xmlId
    if (entity.identities?.xmlName !== undefined) yield entity.identities.xmlName
    if (entity.omittedChildren?.kind === "names") {
      yield* entity.omittedChildren.names
    } else if (entity.omittedChildren?.kind === "typedNames") {
      for (const item of entity.omittedChildren.items) {
        yield item.xmlName
        yield item.name
      }
    }
    if (entity.xml?.xsiType !== undefined) yield entity.xml.xsiType
    if (entity.xml?.xmlText !== undefined) yield entity.xml.xmlText
    if (entity.xml?.xmlPrefix !== undefined) yield entity.xml.xmlPrefix
  }
}

function encodeSnapshot(normalized: NormalizedSnapshot): EncodedSection {
  const bytes = Buffer.alloc(16)
  bytes.writeBigUInt64LE(normalized.snapshot.indexGeneration, 0)
  bytes.writeUInt32LE(normalized.strings.id(normalized.snapshot.componentPath), 8)
  return { type: 1, recordCount: 1n, bytes }
}

function encodeStrings(normalized: NormalizedSnapshot): EncodedSection {
  const records = normalized.strings.strings.map((value) => {
    const valueBytes = Buffer.from(value, "utf8")
    assertU32(valueBytes.length, "byteLength STRINGS")
    const record = Buffer.alloc(align8(4 + valueBytes.length))
    record.writeUInt32LE(valueBytes.length, 0)
    valueBytes.copy(record, 4)
    return record
  })
  return {
    type: 2,
    recordCount: BigInt(records.length),
    bytes: Buffer.concat(records),
  }
}

function encodeFiles(normalized: NormalizedSnapshot): EncodedSection {
  assertU32(normalized.snapshot.files.length, "recordCount FILES")
  const bytes = Buffer.alloc(normalized.snapshot.files.length * 16)
  normalized.snapshot.files.forEach((file, index) => writeFile(bytes, index * 16, file, normalized.strings))
  return {
    type: 3,
    recordCount: BigInt(normalized.snapshot.files.length),
    bytes,
  }
}

function writeFile(
  bytes: Buffer,
  offset: number,
  file: ConfigurationSnapshotFile,
  strings: ConfigurationIndexStringPool
): void {
  bytes.writeUInt32LE(strings.id(file.projectPath), offset)
  bytes.writeBigUInt64LE(file.contentHash, offset + 8)
}

function encodeEntities(normalized: NormalizedSnapshot): EncodedSection {
  assertU32(normalized.snapshot.entities.length, "recordCount ENTITIES")
  const records = normalized.snapshot.entities.map((entity) => encodeEntity(entity, normalized.strings))
  return {
    type: 4,
    recordCount: BigInt(records.length),
    bytes: Buffer.concat(records),
  }
}

function encodeEntity(entity: ConfigurationSnapshotEntity, strings: ConfigurationIndexStringPool): Buffer {
  const byteLength = entityByteLength(entity)
  const bytes = Buffer.alloc(align8(4 + byteLength))
  bytes.writeUInt32LE(byteLength, 0)
  bytes.writeUInt32LE(strings.id(entity.logicalAddress), 4)
  bytes.writeUInt32LE(strings.id(entity.sourceProjectPath), 8)
  bytes.writeUInt32LE(entityFieldMask(entity), 12)
  let offset = 16

  if (entity.identities?.uuid !== undefined) {
    Buffer.from(entity.identities.uuid.replaceAll("-", ""), "hex").copy(bytes, offset)
    offset += 16
  }
  if (entity.identities?.xmlId !== undefined) {
    bytes.writeUInt32LE(strings.id(entity.identities.xmlId), offset)
    offset += 4
  }
  if (entity.identities?.xmlName !== undefined) {
    bytes.writeUInt32LE(strings.id(entity.identities.xmlName), offset)
    offset += 4
  }
  if (entity.omittedChildren !== undefined) {
    const count =
      entity.omittedChildren.kind === "names"
        ? entity.omittedChildren.names.length
        : entity.omittedChildren.items.length
    bytes.writeUInt32LE(count, offset)
    offset += 8
    if (entity.omittedChildren.kind === "names") {
      for (const name of entity.omittedChildren.names) {
        bytes.writeUInt32LE(strings.id(name), offset)
        offset += 4
      }
    } else {
      for (const item of entity.omittedChildren.items) {
        bytes.writeUInt32LE(strings.id(item.xmlName), offset)
        bytes.writeUInt32LE(strings.id(item.name), offset + 4)
        offset += 8
      }
    }
  }
  for (const value of [entity.xml?.xsiType, entity.xml?.xmlText, entity.xml?.xmlPrefix]) {
    if (value !== undefined) {
      bytes.writeUInt32LE(strings.id(value), offset)
      offset += 4
    }
  }
  if (offset !== 4 + byteLength) throw new Error("Внутренняя ошибка длины ENTITIES")
  return bytes
}

function entityByteLength(entity: ConfigurationSnapshotEntity): number {
  let result = 12
  if (entity.identities?.uuid !== undefined) result += 16
  if (entity.identities?.xmlId !== undefined) result += 4
  if (entity.identities?.xmlName !== undefined) result += 4
  if (entity.omittedChildren?.kind === "names") result += 8 + entity.omittedChildren.names.length * 4
  if (entity.omittedChildren?.kind === "typedNames") result += 8 + entity.omittedChildren.items.length * 8
  if (entity.xml?.xsiType !== undefined) result += 4
  if (entity.xml?.xmlText !== undefined) result += 4
  if (entity.xml?.xmlPrefix !== undefined) result += 4
  assertU32(result, "byteLength ENTITIES")
  return result
}

function entityFieldMask(entity: ConfigurationSnapshotEntity): number {
  let mask = 0
  if (entity.identities?.uuid !== undefined) mask |= ENTITY_FLAGS.uuid
  if (entity.identities?.xmlId !== undefined) mask |= ENTITY_FLAGS.xmlId
  if (entity.identities?.xmlName !== undefined) mask |= ENTITY_FLAGS.xmlName
  if (entity.omittedChildren?.kind === "names") mask |= ENTITY_FLAGS.omittedNames
  if (entity.omittedChildren?.kind === "typedNames") mask |= ENTITY_FLAGS.omittedTypedNames
  if (entity.xml?.extended === true) mask |= ENTITY_FLAGS.extended
  if (entity.xml?.xsiNil === true) mask |= ENTITY_FLAGS.xsiNil
  if (entity.xml?.explicitEmpty === true) mask |= ENTITY_FLAGS.explicitEmpty
  if (entity.xml?.xsiType !== undefined) mask |= ENTITY_FLAGS.xsiType
  if (entity.xml?.xmlText !== undefined) mask |= ENTITY_FLAGS.xmlText
  if (entity.xml?.xmlPrefix !== undefined) mask |= ENTITY_FLAGS.xmlPrefix
  if (entity.xml?.present === true) mask |= ENTITY_FLAGS.present
  return mask
}

function encodeContainer(sections: readonly EncodedSection[]): Buffer {
  let fileLength = HEADER_LENGTH + DIRECTORY_LENGTH
  for (const section of sections) fileLength = checkedAdd(fileLength, section.bytes.length, "длина файла")

  const buffer = Buffer.alloc(fileLength)
  buffer.write("NKDK1CIX", 0, "ascii")
  buffer.writeUInt16LE(1, 8)
  buffer.writeUInt16LE(4, 10)
  buffer.writeUInt32LE(HEADER_LENGTH, 12)
  buffer.writeUInt8(1, 16)
  buffer.writeUInt8(1, 17)
  buffer.writeUInt8(1, 18)
  buffer.writeUInt8(1, 19)
  buffer.writeUInt32LE(DIRECTORY_ENTRY_LENGTH, 20)
  buffer.writeUInt32LE(SECTION_COUNT, 24)
  buffer.writeBigUInt64LE(BigInt(HEADER_LENGTH), 32)
  buffer.writeBigUInt64LE(BigInt(fileLength), 40)

  let sectionOffset = HEADER_LENGTH + DIRECTORY_LENGTH
  for (const section of sections) {
    const directoryOffset = HEADER_LENGTH + (section.type - 1) * DIRECTORY_ENTRY_LENGTH
    buffer.writeUInt32LE(section.type, directoryOffset)
    buffer.writeUInt16LE(1, directoryOffset + 4)
    buffer.writeUInt16LE(0, directoryOffset + 6)
    buffer.writeUInt32LE(1, directoryOffset + 8)
    buffer.writeBigUInt64LE(BigInt(sectionOffset), directoryOffset + 16)
    buffer.writeBigUInt64LE(BigInt(section.bytes.length), directoryOffset + 24)
    buffer.writeBigUInt64LE(BigInt(section.bytes.length), directoryOffset + 32)
    buffer.writeBigUInt64LE(section.recordCount, directoryOffset + 40)
    writeHash128(buffer, directoryOffset + 48, hashSection(section.bytes))
    section.bytes.copy(buffer, sectionOffset)
    sectionOffset += section.bytes.length
  }
  writeHash128(buffer, 48, hashSection(buffer.subarray(HEADER_LENGTH, HEADER_LENGTH + DIRECTORY_LENGTH)))
  return buffer
}

function validateProjectPath(projectPath: string): void {
  const segments = projectPath.split("/")
  if (
    projectPath.length === 0 ||
    projectPath.startsWith("/") ||
    projectPath.endsWith("/") ||
    projectPath.includes("\\") ||
    /^[A-Za-z]:\//.test(projectPath) ||
    segments.some((segment) => segment === "" || segment === "." || segment === "..") ||
    segments[0] === ".nkdk"
  ) {
    throw new Error(`Недопустимый projectPath: ${projectPath}`)
  }
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu.test(value)
}

function compareUtf8(left: string, right: string): number {
  return Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"))
}

function align8(value: number): number {
  return Math.ceil(value / 8) * 8
}

function checkedAdd(left: number, right: number, label: string): number {
  const result = left + right
  if (!Number.isSafeInteger(result) || result < left) throw new Error(`${label} вне безопасного диапазона`)
  return result
}

function assertU32(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 0 || value > 0xffff_ffff) {
    throw new Error(`${label} не помещается в u32`)
  }
}

function assertU64(value: bigint, label: string): void {
  if (value < 0n || value > MAX_U64) throw new Error(`${label} не помещается в u64`)
}
