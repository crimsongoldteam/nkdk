import { hashSection, type Hash128 } from "./hash"
import type {
  ConfigurationSnapshot,
  ConfigurationSnapshotEntity,
  ConfigurationSnapshotFile,
  ConfigurationSnapshotXml,
} from "./types"

export interface DecodeConfigurationIndexOptions {
  expectedComponentPath?: string
}

export class ConfigurationIndexCompatibilityError extends Error {
  readonly code = "configuration_index_incompatible"

  constructor(message: string) {
    super(message)
    this.name = "ConfigurationIndexCompatibilityError"
  }
}

interface ConfigurationIndexHeader {
  readonly directoryOffset: number
  readonly fileLength: number
  readonly directoryChecksum: Hash128
}

interface ConfigurationIndexDirectoryEntry {
  readonly type: SectionType
  readonly offset: bigint
  readonly storedLength: bigint
  readonly recordCount: bigint
  readonly checksum: Hash128
}

interface ConfigurationIndexDirectory {
  readonly entries: readonly ConfigurationIndexDirectoryEntry[]
}

interface DecodedStrings {
  readonly values: readonly string[]
  readonly referencedIds: Set<number>
}

interface DecodedSnapshotRecord {
  readonly indexGeneration: bigint
  readonly componentPath: string
}

type SectionType = 1 | 2 | 3 | 4

const HEADER_LENGTH = 64
const DIRECTORY_ENTRY_LENGTH = 64
const SECTION_COUNT = 4
const DIRECTORY_LENGTH = DIRECTORY_ENTRY_LENGTH * SECTION_COUNT
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
} as const
const KNOWN_ENTITY_FLAGS = (1 << 11) - 1
const fatalUtf8Decoder = new TextDecoder("utf-8", { fatal: true })

export function decodeConfigurationIndex(
  input: Uint8Array,
  options: DecodeConfigurationIndexOptions = {}
): ConfigurationSnapshot {
  try {
    const buffer = Buffer.from(input.buffer, input.byteOffset, input.byteLength)
    const header = readAndValidateHeader(buffer)
    const directory = readAndValidateDirectory(buffer, header)
    validateSectionPlacement(buffer, directory)
    validateSectionChecksums(buffer, directory)

    const strings = decodeStrings(sectionFor(buffer, directory, 2), directoryEntry(directory, 2).recordCount)
    const snapshot = decodeSnapshot(sectionFor(buffer, directory, 1), directoryEntry(directory, 1).recordCount, strings)
    const files = decodeFiles(sectionFor(buffer, directory, 3), directoryEntry(directory, 3).recordCount, strings)
    const entities = decodeEntities(sectionFor(buffer, directory, 4), directoryEntry(directory, 4).recordCount, strings)

    validateUniqueness(files, entities)
    validateCrossReferences(files, entities, strings)
    validateExpectedComponentPath(snapshot.componentPath, options)
    return {
      specificationVersion: "1.3",
      indexGeneration: snapshot.indexGeneration,
      componentPath: snapshot.componentPath,
      files,
      entities,
    }
  } catch (caught) {
    if (caught instanceof ConfigurationIndexCompatibilityError) throw caught
    throw new Error(`Некорректный файл индекса конфигурации: ${errorMessage(caught)}`)
  }
}

function readAndValidateHeader(buffer: Buffer): ConfigurationIndexHeader {
  checkedEnd(buffer, 0, HEADER_LENGTH, "заголовок")
  if (!buffer.subarray(0, 8).equals(Buffer.from("NKDK1CIX", "ascii"))) {
    throw new Error("неверный magic")
  }

  const majorVersion = buffer.readUInt16LE(8)
  const minorVersion = buffer.readUInt16LE(10)
  if (majorVersion !== 1 || minorVersion !== 3) {
    throw new ConfigurationIndexCompatibilityError(
      `Неподдерживаемая версия файла индекса конфигурации ${majorVersion}.${minorVersion}; требуется повторный import`
    )
  }
  if (buffer.readUInt32LE(12) !== HEADER_LENGTH) throw new Error("неверная длина заголовка")
  if (buffer.readUInt8(16) !== 1) throw new Error("неподдерживаемый порядок байт")
  if (buffer.readUInt8(17) !== 1) throw new Error("неподдерживаемая кодировка строк")
  if (buffer.readUInt8(18) !== 1) throw new Error("неподдерживаемый алгоритм контрольной суммы")
  if (buffer.readUInt8(19) !== 1) throw new Error("неподдерживаемый алгоритм хэша файла")
  if (buffer.readUInt32LE(20) !== DIRECTORY_ENTRY_LENGTH) {
    throw new Error("неверный размер записи каталога")
  }
  if (buffer.readUInt32LE(24) !== SECTION_COUNT) throw new Error("неверное число секций")
  if (buffer.readUInt32LE(28) !== 0) throw new Error("ненулевые reserved заголовка")

  const directoryOffset = safeNumber(buffer.readBigUInt64LE(32), "смещение каталога")
  if (directoryOffset !== HEADER_LENGTH) throw new Error("неверное смещение каталога")
  const fileLength = safeNumber(buffer.readBigUInt64LE(40), "длина файла")
  if (fileLength !== buffer.length) throw new Error("длина файла не совпадает с заголовком")
  return {
    directoryOffset,
    fileLength,
    directoryChecksum: readHash128(buffer, 48),
  }
}

function readAndValidateDirectory(buffer: Buffer, header: ConfigurationIndexHeader): ConfigurationIndexDirectory {
  const directoryEnd = checkedEnd(buffer, header.directoryOffset, DIRECTORY_LENGTH, "каталог секций")
  const bytes = buffer.subarray(header.directoryOffset, directoryEnd)
  if (!hashEquals(hashSection(bytes), header.directoryChecksum)) {
    throw new Error("не совпадает контрольная сумма каталога")
  }

  const entries: ConfigurationIndexDirectoryEntry[] = []
  let previousType = 0
  for (let index = 0; index < SECTION_COUNT; index += 1) {
    const offset = index * DIRECTORY_ENTRY_LENGTH
    const typeValue = bytes.readUInt32LE(offset)
    const sectionFlags = bytes.readUInt32LE(offset + 8)
    if (typeValue < 1 || typeValue > SECTION_COUNT) {
      if ((sectionFlags & 1) !== 0) {
        throw new ConfigurationIndexCompatibilityError(`Неизвестная обязательная секция ${typeValue}`)
      }
      throw new Error(`неизвестная секция ${typeValue}`)
    }
    if (typeValue <= previousType) throw new Error("секции не отсортированы или повторяются")
    previousType = typeValue

    const sectionMajorVersion = bytes.readUInt16LE(offset + 4)
    const sectionMinorVersion = bytes.readUInt16LE(offset + 6)
    if (sectionMajorVersion !== 1 || sectionMinorVersion !== 0) {
      throw new ConfigurationIndexCompatibilityError(
        `Неподдерживаемая версия секции ${typeValue}: ${sectionMajorVersion}.${sectionMinorVersion}`
      )
    }
    if ((sectionFlags & ~1) !== 0) {
      throw new ConfigurationIndexCompatibilityError(`Неизвестные флаги секции ${typeValue}`)
    }
    if ((sectionFlags & 1) === 0) throw new Error(`секция ${typeValue} не отмечена обязательной`)
    if (bytes.readUInt32LE(offset + 12) !== 0) {
      throw new Error(`ненулевое reserved секции ${typeValue}`)
    }

    const storedLength = bytes.readBigUInt64LE(offset + 24)
    if (bytes.readBigUInt64LE(offset + 32) !== storedLength) {
      throw new Error(`logicalLength секции ${typeValue} не равна storedLength`)
    }
    entries.push({
      type: typeValue as SectionType,
      offset: bytes.readBigUInt64LE(offset + 16),
      storedLength,
      recordCount: bytes.readBigUInt64LE(offset + 40),
      checksum: readHash128(bytes, offset + 48),
    })
  }
  for (let index = 0; index < SECTION_COUNT; index += 1) {
    if (entries[index]?.type !== index + 1) throw new Error("отсутствует обязательная секция")
  }
  return { entries }
}

function validateSectionPlacement(buffer: Buffer, directory: ConfigurationIndexDirectory): void {
  let previousEnd = HEADER_LENGTH + DIRECTORY_LENGTH
  for (const entry of directory.entries) {
    const offset = safeNumber(entry.offset, `смещение секции ${entry.type}`)
    if (offset % 8 !== 0) throw new Error(`секция ${entry.type} не выровнена`)
    const end = checkedEnd(buffer, entry.offset, entry.storedLength, `секция ${entry.type}`)
    if (offset < previousEnd) throw new Error(`секция ${entry.type} пересекает предыдущую структуру`)
    assertZero(buffer.subarray(previousEnd, offset), `padding перед секцией ${entry.type}`)
    previousEnd = end
  }
  if (previousEnd !== buffer.length) throw new Error("байты после последней секции")
}

function validateSectionChecksums(buffer: Buffer, directory: ConfigurationIndexDirectory): void {
  for (const entry of directory.entries) {
    if (!hashEquals(hashSection(sectionBytes(buffer, entry)), entry.checksum)) {
      throw new Error(`не совпадает контрольная сумма секции ${entry.type}`)
    }
  }
}

function decodeStrings(section: Buffer, recordCountValue: bigint): DecodedStrings {
  const recordCount = variableRecordCount(section, recordCountValue, 8, "STRINGS")
  const values: string[] = []
  const seen = new Set<string>()
  let offset = 0
  for (let index = 0; index < recordCount; index += 1) {
    const contentOffset = checkedEnd(section, offset, 4, "заголовок записи STRINGS")
    const byteLength = section.readUInt32LE(offset)
    const contentEnd = checkedEnd(section, contentOffset, byteLength, "строка STRINGS")
    const recordEnd = alignedEnd(section, contentEnd, "запись STRINGS")
    assertZero(section.subarray(contentEnd, recordEnd), "padding STRINGS")
    const value = fatalUtf8Decoder.decode(section.subarray(contentOffset, contentEnd))
    if (value.includes("\0")) throw new Error("строка STRINGS содержит U+0000")
    if (seen.has(value)) throw new Error("строки STRINGS повторяются")
    seen.add(value)
    values.push(value)
    offset = recordEnd
  }
  if (offset !== section.length) throw new Error("recordCount STRINGS не совпадает с длиной секции")
  return { values, referencedIds: new Set() }
}

function decodeSnapshot(section: Buffer, recordCount: bigint, strings: DecodedStrings): DecodedSnapshotRecord {
  if (recordCount !== 1n) throw new Error("SNAPSHOT должен содержать одну запись")
  if (section.length !== 16) throw new Error("неверная длина SNAPSHOT")
  const indexGeneration = section.readBigUInt64LE(0)
  if (indexGeneration === 0n) throw new Error("indexGeneration SNAPSHOT должен начинаться с 1")
  const componentPath = requiredString(strings, section.readUInt32LE(8), "componentPath SNAPSHOT")
  const componentPathLength = Buffer.byteLength(componentPath, "utf8")
  if (componentPathLength < 1 || componentPathLength > 128) {
    throw new Error("недопустимый componentPath SNAPSHOT")
  }
  assertZero(section.subarray(12), "reserved SNAPSHOT")
  return { indexGeneration, componentPath }
}

function decodeFiles(section: Buffer, recordCountValue: bigint, strings: DecodedStrings): ConfigurationSnapshotFile[] {
  const recordCount = fixedRecordCount(section, recordCountValue, 16, "FILES")
  const result: ConfigurationSnapshotFile[] = []
  for (let index = 0; index < recordCount; index += 1) {
    const offset = index * 16
    const projectPath = requiredString(strings, section.readUInt32LE(offset), "projectPath FILES")
    validateProjectPath(projectPath)
    if (section.readUInt32LE(offset + 4) !== 0) throw new Error("ненулевое reserved FILES")
    result.push({ projectPath, contentHash: section.readBigUInt64LE(offset + 8) })
  }
  return result
}

function decodeEntities(
  section: Buffer,
  recordCountValue: bigint,
  strings: DecodedStrings
): ConfigurationSnapshotEntity[] {
  const recordCount = variableRecordCount(section, recordCountValue, 16, "ENTITIES")
  const result: ConfigurationSnapshotEntity[] = []
  let recordOffset = 0
  for (let index = 0; index < recordCount; index += 1) {
    const fieldsOffset = checkedEnd(section, recordOffset, 4, "заголовок записи ENTITIES")
    const byteLength = section.readUInt32LE(recordOffset)
    if (byteLength < 12) throw new Error("byteLength ENTITIES меньше обязательных полей")
    const fieldsEnd = checkedEnd(section, fieldsOffset, byteLength, "поля записи ENTITIES")
    const recordEnd = alignedEnd(section, fieldsEnd, "запись ENTITIES")
    const entity = decodeEntity(section.subarray(fieldsOffset, fieldsEnd), strings)
    assertZero(section.subarray(fieldsEnd, recordEnd), "padding ENTITIES")
    result.push(entity)
    recordOffset = recordEnd
  }
  if (recordOffset !== section.length) throw new Error("recordCount ENTITIES не совпадает с длиной секции")
  return result
}

function decodeEntity(fields: Buffer, strings: DecodedStrings): ConfigurationSnapshotEntity {
  checkedEnd(fields, 0, 12, "обязательные поля ENTITIES")
  const logicalAddress = requiredString(strings, fields.readUInt32LE(0), "logicalAddress ENTITIES")
  const sourceProjectPath = requiredString(strings, fields.readUInt32LE(4), "sourceProjectPath ENTITIES")
  const fieldMask = fields.readUInt32LE(8)
  if ((fieldMask & ~KNOWN_ENTITY_FLAGS) !== 0) throw new Error("неизвестный бит fieldMask ENTITIES")
  if ((fieldMask & ENTITY_FLAGS.omittedNames) !== 0 && (fieldMask & ENTITY_FLAGS.omittedTypedNames) !== 0) {
    throw new Error("одновременно заданы omittedNames и omittedTypedNames ENTITIES")
  }
  if (fieldMask === 0) throw new Error("Пустая entity ENTITIES")
  if (logicalAddress.length === 0) throw new Error("Пустой logicalAddress в ENTITIES")
  validateProjectPath(sourceProjectPath)

  let offset = 12
  let uuid: string | undefined
  let xmlId: string | undefined
  let xmlName: string | undefined
  if (hasFlag(fieldMask, ENTITY_FLAGS.uuid)) {
    const end = checkedEnd(fields, offset, 16, "uuid ENTITIES")
    uuid = formatUuid(fields.subarray(offset, end))
    offset = end
  }
  if (hasFlag(fieldMask, ENTITY_FLAGS.xmlId)) {
    const end = checkedEnd(fields, offset, 4, "xmlId ENTITIES")
    xmlId = requiredString(strings, fields.readUInt32LE(offset), "xmlId ENTITIES")
    if (xmlId.length === 0) throw new Error("Пустой xmlId в ENTITIES")
    offset = end
  }
  if (hasFlag(fieldMask, ENTITY_FLAGS.xmlName)) {
    const end = checkedEnd(fields, offset, 4, "xmlName ENTITIES")
    xmlName = requiredString(strings, fields.readUInt32LE(offset), "xmlName ENTITIES")
    offset = end
  }

  const omittedNames = hasFlag(fieldMask, ENTITY_FLAGS.omittedNames)
  const omittedTypedNames = hasFlag(fieldMask, ENTITY_FLAGS.omittedTypedNames)
  let omittedChildren: ConfigurationSnapshotEntity["omittedChildren"]
  if (omittedNames || omittedTypedNames) {
    const headerEnd = checkedEnd(fields, offset, 8, "заголовок omittedChildren ENTITIES")
    const count = fields.readUInt32LE(offset)
    if (count === 0) throw new Error("Пустой список omittedChildren в ENTITIES")
    if (fields.readUInt32LE(offset + 4) !== 0) {
      throw new Error("ненулевое reserved omittedChildren ENTITIES")
    }
    offset = headerEnd
    if (omittedNames) {
      const names: string[] = []
      for (let index = 0; index < count; index += 1) {
        const end = checkedEnd(fields, offset, 4, "имя omittedChildren ENTITIES")
        names.push(requiredString(strings, fields.readUInt32LE(offset), "omitted name ENTITIES"))
        offset = end
      }
      omittedChildren = { kind: "names", names }
    } else {
      const items: Array<{ xmlName: string; name: string }> = []
      for (let index = 0; index < count; index += 1) {
        const end = checkedEnd(fields, offset, 8, "typed name omittedChildren ENTITIES")
        items.push({
          xmlName: requiredString(strings, fields.readUInt32LE(offset), "omitted xmlName ENTITIES"),
          name: requiredString(strings, fields.readUInt32LE(offset + 4), "omitted name ENTITIES"),
        })
        offset = end
      }
      omittedChildren = { kind: "typedNames", items }
    }
  }

  const xml: ConfigurationSnapshotXml = {
    ...(hasFlag(fieldMask, ENTITY_FLAGS.extended) ? { extended: true } : {}),
    ...(hasFlag(fieldMask, ENTITY_FLAGS.xsiNil) ? { xsiNil: true } : {}),
    ...(hasFlag(fieldMask, ENTITY_FLAGS.explicitEmpty) ? { explicitEmpty: true } : {}),
    ...(hasFlag(fieldMask, ENTITY_FLAGS.xsiType)
      ? { xsiType: readEntityString(fields, strings, offset, "xsiType ENTITIES") }
      : {}),
  }
  if (hasFlag(fieldMask, ENTITY_FLAGS.xsiType)) offset = checkedEnd(fields, offset, 4, "xsiType ENTITIES")
  if (hasFlag(fieldMask, ENTITY_FLAGS.xmlText)) {
    Object.assign(xml, { xmlText: readEntityString(fields, strings, offset, "xmlText ENTITIES") })
    offset = checkedEnd(fields, offset, 4, "xmlText ENTITIES")
  }
  if (hasFlag(fieldMask, ENTITY_FLAGS.xmlPrefix)) {
    Object.assign(xml, { xmlPrefix: readEntityString(fields, strings, offset, "xmlPrefix ENTITIES") })
    offset = checkedEnd(fields, offset, 4, "xmlPrefix ENTITIES")
  }
  if (offset !== fields.length) throw new Error("byteLength ENTITIES не совпадает со структурой записи")

  const hasIdentities = uuid !== undefined || xmlId !== undefined || xmlName !== undefined
  const hasXml = Object.keys(xml).length > 0
  return {
    logicalAddress,
    sourceProjectPath,
    ...(hasIdentities
      ? {
          identities: {
            ...(uuid === undefined ? {} : { uuid }),
            ...(xmlId === undefined ? {} : { xmlId }),
            ...(xmlName === undefined ? {} : { xmlName }),
          },
        }
      : {}),
    ...(omittedChildren === undefined ? {} : { omittedChildren }),
    ...(hasXml ? { xml } : {}),
  }
}

function readEntityString(fields: Buffer, strings: DecodedStrings, offset: number, label: string): string {
  checkedEnd(fields, offset, 4, label)
  return requiredString(strings, fields.readUInt32LE(offset), label)
}

function validateUniqueness(
  files: readonly ConfigurationSnapshotFile[],
  entities: readonly ConfigurationSnapshotEntity[]
): void {
  const projectPaths = new Set<string>()
  let previousProjectPath: string | undefined
  for (const file of files) {
    if (projectPaths.has(file.projectPath)) throw new Error(`Повторный projectPath в FILES: ${file.projectPath}`)
    if (previousProjectPath !== undefined && compareUtf8(file.projectPath, previousProjectPath) < 0) {
      throw new Error("FILES не отсортирован по projectPath")
    }
    projectPaths.add(file.projectPath)
    previousProjectPath = file.projectPath
  }

  const logicalAddresses = new Set<string>()
  let previousLogicalAddress: string | undefined
  for (const entity of entities) {
    if (logicalAddresses.has(entity.logicalAddress)) {
      throw new Error(`Повторный logicalAddress в ENTITIES: ${entity.logicalAddress}`)
    }
    if (previousLogicalAddress !== undefined && compareUtf8(entity.logicalAddress, previousLogicalAddress) < 0) {
      throw new Error("ENTITIES не отсортирован по logicalAddress")
    }
    logicalAddresses.add(entity.logicalAddress)
    previousLogicalAddress = entity.logicalAddress
  }
}

function validateCrossReferences(
  files: readonly ConfigurationSnapshotFile[],
  entities: readonly ConfigurationSnapshotEntity[],
  strings: DecodedStrings
): void {
  const projectPaths = new Set(files.map((file) => file.projectPath))
  for (const entity of entities) {
    if (!projectPaths.has(entity.sourceProjectPath)) {
      throw new Error(`sourceProjectPath ENTITIES отсутствует в FILES: ${entity.sourceProjectPath}`)
    }
  }
  if (strings.referencedIds.size !== strings.values.length) {
    throw new Error("STRINGS содержит строки без ссылок")
  }
}

function validateExpectedComponentPath(componentPath: string, options: DecodeConfigurationIndexOptions): void {
  if (options.expectedComponentPath !== undefined && componentPath !== options.expectedComponentPath) {
    throw new ConfigurationIndexCompatibilityError(
      `Ожидалась привязка ${options.expectedComponentPath}, получена ${componentPath}`
    )
  }
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

function directoryEntry(directory: ConfigurationIndexDirectory, type: SectionType): ConfigurationIndexDirectoryEntry {
  const entry = directory.entries[type - 1]
  if (entry?.type !== type) throw new Error(`отсутствует секция ${type}`)
  return entry
}

function sectionFor(buffer: Buffer, directory: ConfigurationIndexDirectory, type: SectionType): Buffer {
  return sectionBytes(buffer, directoryEntry(directory, type))
}

function sectionBytes(buffer: Buffer, entry: ConfigurationIndexDirectoryEntry): Buffer {
  const offset = safeNumber(entry.offset, `смещение секции ${entry.type}`)
  const end = checkedEnd(buffer, entry.offset, entry.storedLength, `секция ${entry.type}`)
  return buffer.subarray(offset, end)
}

function requiredString(strings: DecodedStrings, id: number, label: string): string {
  if (id === 0 || id > strings.values.length) throw new Error(`неверный stringId ${label}`)
  strings.referencedIds.add(id)
  return strings.values[id - 1]!
}

function fixedRecordCount(section: Buffer, count: bigint, recordLength: number, label: string): number {
  const expectedLength = BigInt(recordLength) * count
  checkedEnd(section, 0, expectedLength, label)
  if (expectedLength !== BigInt(section.length)) {
    throw new Error(`recordCount ${label} не совпадает с длиной секции`)
  }
  return safeNumber(count, `recordCount ${label}`)
}

function variableRecordCount(section: Buffer, count: bigint, minimumLength: number, label: string): number {
  const result = safeNumber(count, `recordCount ${label}`)
  if (result > Math.floor(section.length / minimumLength)) {
    throw new Error(`recordCount ${label} не помещается в секции`)
  }
  return result
}

function checkedEnd(
  buffer: Uint8Array,
  offsetValue: number | bigint,
  lengthValue: number | bigint,
  label: string
): number {
  const offset = safeNumber(offsetValue, `${label}: offset`)
  const length = safeNumber(lengthValue, `${label}: length`)
  const end = offset + length
  if (!Number.isSafeInteger(end) || end < offset || end > buffer.length) {
    throw new Error(`${label} выходит за границы файла`)
  }
  return end
}

function safeNumber(value: number | bigint, label: string): number {
  if (typeof value === "bigint") {
    if (value < 0n || value > BigInt(Number.MAX_SAFE_INTEGER)) {
      throw new Error(`${label} вне безопасного диапазона`)
    }
    return Number(value)
  }
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${label} вне безопасного диапазона`)
  }
  return value
}

function alignedEnd(buffer: Uint8Array, value: number, label: string): number {
  const aligned = Math.ceil(value / 8) * 8
  checkedEnd(buffer, value, aligned - value, `${label}: padding`)
  return aligned
}

function readHash128(buffer: Buffer, offset: number): Hash128 {
  checkedEnd(buffer, offset, 16, "контрольная сумма")
  return {
    low: buffer.readBigUInt64LE(offset),
    high: buffer.readBigUInt64LE(offset + 8),
  }
}

function hashEquals(left: Hash128, right: Hash128): boolean {
  return left.low === right.low && left.high === right.high
}

function assertZero(bytes: Uint8Array, label: string): void {
  if (!bytes.every((byte) => byte === 0)) throw new Error(`${label} содержит ненулевые байты`)
}

function hasFlag(mask: number, flag: number): boolean {
  return (mask & flag) !== 0
}

function formatUuid(bytes: Uint8Array): string {
  const hex = Buffer.from(bytes).toString("hex")
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

function compareUtf8(left: string, right: string): number {
  return Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"))
}

function errorMessage(caught: unknown): string {
  return caught instanceof Error ? caught.message : String(caught)
}
