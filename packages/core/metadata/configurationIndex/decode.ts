import { hashSection, type Hash128 } from "./hash"
import type {
  ConfigurationIdentity,
  ConfigurationIndexBinding,
  ConfigurationIndexData,
  ConfigurationProjectFile,
  ConfigurationXmlNode,
  ConfigurationXmlValue,
} from "./types"

export interface DecodeConfigurationIndexOptions {
  expectedBaseId?: string
  expectedProducerVersion?: string
}

export class ConfigurationIndexCompatibilityError extends Error {
  readonly code = "configuration_index_incompatible"

  constructor(message: string) {
    super(message)
    this.name = "ConfigurationIndexCompatibilityError"
  }
}

interface ConfigurationIndexHeader {
  directoryOffset: number
  fileLength: number
  directoryChecksum: Hash128
}

interface ConfigurationIndexDirectoryEntry {
  type: SectionType
  offset: bigint
  storedLength: bigint
  recordCount: bigint
  checksum: Hash128
}

interface ConfigurationIndexDirectory {
  entries: readonly ConfigurationIndexDirectoryEntry[]
}

interface DecodedStrings {
  values: readonly string[]
  referencedIds: Set<number>
}

type SectionType = 1 | 2 | 3 | 4 | 5 | 6 | 7
type LogicalValidationStage = 7 | 8 | 9

const HEADER_LENGTH = 64
const DIRECTORY_ENTRY_LENGTH = 64
const SECTION_COUNT = 7
const DIRECTORY_LENGTH = DIRECTORY_ENTRY_LENGTH * SECTION_COUNT
const XML_VALUE_FLAGS = (1 << 7) - 1
const fatalUtf8Decoder = new TextDecoder("utf-8", { fatal: true })
const FORM_SINGLETON_LOGICAL_ADDRESS_SEGMENTS = new Set([
  "АвтоКоманднаяПанель",
  "КоманднаяПанель",
  "КонтекстноеМеню",
  "РасширеннаяПодсказка",
  "СостояниеПросмотра",
  "СтрокаПоиска",
  "Таблица",
  "УправлениеПоиском",
])

export function decodeConfigurationIndex(
  input: Uint8Array,
  options: DecodeConfigurationIndexOptions = {}
): ConfigurationIndexData {
  try {
    const buffer = Buffer.from(input.buffer, input.byteOffset, input.byteLength)
    const header = readAndValidateHeader(buffer)
    const directory = readAndValidateDirectory(buffer, header)
    validateSectionPlacement(buffer, directory)
    validateSectionChecksums(buffer, directory)
    const stringsEntry = directoryEntry(directory, 2)
    const strings = decodeStrings(sectionBytes(buffer, stringsEntry), stringsEntry.recordCount)
    validateLogicalSectionRecords(buffer, directory, strings)
    validateLogicalSectionUniqueness(buffer, directory, strings)
    const data = decodeLogicalSections(buffer, directory, strings)
    validateCrossReferences(data, strings)
    validateExpectations(data.binding, options)
    return data
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
  if (majorVersion !== 1 || minorVersion !== 0) {
    throw new ConfigurationIndexCompatibilityError(
      `Неподдерживаемая версия файла индекса конфигурации ${majorVersion}.${minorVersion}`
    )
  }
  if (buffer.readUInt32LE(12) !== HEADER_LENGTH) throw new Error("неверная длина заголовка")
  if (buffer.readUInt8(16) !== 1) throw new Error("неподдерживаемый порядок байт")
  if (buffer.readUInt8(17) !== 1) throw new Error("неподдерживаемая кодировка строк")
  if (buffer.readUInt8(18) !== 1) throw new Error("неподдерживаемый алгоритм контрольной суммы")
  if (buffer.readUInt8(19) !== 1) throw new Error("неподдерживаемый алгоритм хэша файла")
  if (buffer.readUInt32LE(20) !== DIRECTORY_ENTRY_LENGTH) throw new Error("неверный размер записи каталога")
  if (buffer.readUInt32LE(24) !== SECTION_COUNT) throw new Error("неверное число секций")
  if (buffer.readUInt32LE(28) !== 0) throw new Error("ненулевые флаги заголовка")

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
    if (bytes.readUInt32LE(offset + 12) !== 0) throw new Error(`ненулевое reserved секции ${typeValue}`)

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
    const headerEnd = checkedEnd(section, offset, 4, "заголовок записи STRINGS")
    const byteLength = section.readUInt32LE(offset)
    const valueEnd = checkedEnd(section, headerEnd, byteLength, "строка STRINGS")
    const recordEnd = alignedEnd(section, valueEnd, "запись STRINGS")
    const valueBytes = section.subarray(headerEnd, valueEnd)
    assertZero(section.subarray(valueEnd, recordEnd), "padding STRINGS")
    const value = fatalUtf8Decoder.decode(valueBytes)
    if (value.includes("\0")) throw new Error("строка STRINGS содержит U+0000")
    if (seen.has(value)) throw new Error("строки STRINGS повторяются")
    seen.add(value)
    values.push(value)
    offset = recordEnd
  }
  if (offset !== section.length) throw new Error("recordCount STRINGS не совпадает с длиной секции")
  return { values, referencedIds: new Set() }
}

function decodeLogicalSections(
  buffer: Buffer,
  directory: ConfigurationIndexDirectory,
  strings: DecodedStrings
): ConfigurationIndexData {
  const binding = decodeBinding(sectionFor(buffer, directory, 1), directoryEntry(directory, 1).recordCount, strings, 9)
  if (binding === undefined) throw new Error("BINDING не разобран")
  const projectFiles = decodeProjectFiles(
    sectionFor(buffer, directory, 3),
    directoryEntry(directory, 3).recordCount,
    strings,
    9
  )
  const identities = decodeIdentities(
    sectionFor(buffer, directory, 4),
    directoryEntry(directory, 4).recordCount,
    strings,
    9
  )
  const orders = decodeXmlOrders(sectionFor(buffer, directory, 5), directoryEntry(directory, 5).recordCount, strings, 9)
  const xmlNodes = decodeXmlNodes(
    sectionFor(buffer, directory, 6),
    directoryEntry(directory, 6).recordCount,
    strings,
    orders,
    9
  )
  const xmlValues = decodeXmlValues(
    sectionFor(buffer, directory, 7),
    directoryEntry(directory, 7).recordCount,
    strings,
    9
  )
  return { binding, projectFiles, identities, xmlNodes, xmlValues }
}

function validateLogicalSectionRecords(
  buffer: Buffer,
  directory: ConfigurationIndexDirectory,
  strings: DecodedStrings
): void {
  decodeBinding(sectionFor(buffer, directory, 1), directoryEntry(directory, 1).recordCount, strings, 7)
  decodeProjectFiles(sectionFor(buffer, directory, 3), directoryEntry(directory, 3).recordCount, strings, 7)
  decodeIdentities(sectionFor(buffer, directory, 4), directoryEntry(directory, 4).recordCount, strings, 7)
  decodeXmlOrders(sectionFor(buffer, directory, 5), directoryEntry(directory, 5).recordCount, strings, 7)
  decodeXmlNodes(sectionFor(buffer, directory, 6), directoryEntry(directory, 6).recordCount, strings, [], 7)
  decodeXmlValues(sectionFor(buffer, directory, 7), directoryEntry(directory, 7).recordCount, strings, 7)
}

function validateLogicalSectionUniqueness(
  buffer: Buffer,
  directory: ConfigurationIndexDirectory,
  strings: DecodedStrings
): void {
  decodeProjectFiles(sectionFor(buffer, directory, 3), directoryEntry(directory, 3).recordCount, strings, 8)
  decodeIdentities(sectionFor(buffer, directory, 4), directoryEntry(directory, 4).recordCount, strings, 8)
  decodeXmlOrders(sectionFor(buffer, directory, 5), directoryEntry(directory, 5).recordCount, strings, 8)
  decodeXmlNodes(sectionFor(buffer, directory, 6), directoryEntry(directory, 6).recordCount, strings, [], 8)
  decodeXmlValues(sectionFor(buffer, directory, 7), directoryEntry(directory, 7).recordCount, strings, 8)
}

function decodeBinding(
  section: Buffer,
  recordCount: bigint,
  strings: DecodedStrings,
  stage: LogicalValidationStage
): ConfigurationIndexBinding | undefined {
  if (recordCount !== 1n) throw new Error("BINDING должен содержать одну запись")
  checkedEnd(section, 0, HEADER_LENGTH, "заголовок BINDING")
  const indexGeneration = section.readBigUInt64LE(0)
  const producerVersion = requiredString(strings, section.readUInt32LE(8), "producerVersion BINDING")
  const baseId = requiredString(strings, section.readUInt32LE(12), "baseId BINDING")
  const baseFingerprintLength = section.readUInt32LE(16)
  const configurationVersionLength = section.readUInt32LE(20)
  assertZero(section.subarray(24, HEADER_LENGTH), "reserved BINDING")

  const baseFingerprintEnd = checkedEnd(section, HEADER_LENGTH, baseFingerprintLength, "baseFingerprint BINDING")
  const configurationVersionEnd = checkedEnd(
    section,
    baseFingerprintEnd,
    configurationVersionLength,
    "configurationVersion BINDING"
  )
  const recordEnd = alignedEnd(section, configurationVersionEnd, "BINDING")
  if (recordEnd !== section.length) throw new Error("длина BINDING не совпадает с данными")
  assertZero(section.subarray(configurationVersionEnd, recordEnd), "padding BINDING")
  if (stage !== 9) return undefined

  if (indexGeneration === 0n) throw new Error("indexGeneration BINDING должен начинаться с 1")
  if (producerVersion.length === 0) throw new Error("producerVersion BINDING не должен быть пустым")
  const baseIdLength = Buffer.byteLength(baseId)
  if (baseIdLength < 1 || baseIdLength > 128 || !/^[A-Za-z0-9._-]+$/.test(baseId)) {
    throw new Error("недопустимый baseId BINDING")
  }
  if ((baseFingerprintLength === 0) !== (configurationVersionLength === 0)) {
    throw new Error("baseFingerprint и configurationVersion BINDING должны быть заполнены вместе")
  }

  return {
    indexGeneration,
    producerVersion,
    baseId,
    baseFingerprint: Uint8Array.from(section.subarray(HEADER_LENGTH, baseFingerprintEnd)),
    configurationVersion: Uint8Array.from(section.subarray(baseFingerprintEnd, configurationVersionEnd)),
  }
}

function decodeProjectFiles(
  section: Buffer,
  recordCountValue: bigint,
  strings: DecodedStrings,
  stage: LogicalValidationStage
): ConfigurationProjectFile[] {
  const recordCount = fixedRecordCount(section, recordCountValue, 16, "PROJECT_FILES")
  const result: ConfigurationProjectFile[] = []
  const seenPathIds = new Set<number>()
  for (let index = 0; index < recordCount; index += 1) {
    const offset = index * 16
    const projectPathId = section.readUInt32LE(offset)
    const projectPath = requiredString(strings, projectPathId, "projectPath PROJECT_FILES")
    if (stage === 8 && seenPathIds.has(projectPathId)) throw new Error("PROJECT_FILES повторяются")
    seenPathIds.add(projectPathId)
    if (section.readUInt32LE(offset + 4) !== 0) throw new Error("ненулевые флаги PROJECT_FILES")
    if (stage === 9) {
      validateProjectPath(projectPath)
      result.push({ projectPath, contentHash: section.readBigUInt64LE(offset + 8) })
    }
  }
  return result
}

function decodeIdentities(
  section: Buffer,
  recordCountValue: bigint,
  strings: DecodedStrings,
  stage: LogicalValidationStage
): ConfigurationIdentity[] {
  const recordCount = fixedRecordCount(section, recordCountValue, 32, "IDENTITIES")
  const result: ConfigurationIdentity[] = []
  const seenIdentityKeys = new Set<string>()
  for (let index = 0; index < recordCount; index += 1) {
    const offset = index * 32
    const logicalAddressId = section.readUInt32LE(offset)
    const logicalAddress = requiredString(strings, logicalAddressId, "logicalAddress IDENTITIES")
    const kind = section.readUInt16LE(offset + 4)
    if (section.readUInt16LE(offset + 6) !== 0) throw new Error("ненулевые флаги IDENTITIES")
    if (section.readUInt32LE(offset + 12) !== 0) throw new Error("ненулевое reserved IDENTITIES")
    const identityKey = `${logicalAddressId}\0${kind}`
    if (stage === 8 && seenIdentityKeys.has(identityKey)) throw new Error("IDENTITIES повторяются")
    seenIdentityKeys.add(identityKey)

    const valueStringId = section.readUInt32LE(offset + 8)
    if (valueStringId !== 0) requiredString(strings, valueStringId, "value IDENTITIES")
    const uuidBytes = section.subarray(offset + 16, offset + 32)
    if (stage !== 9) continue

    validateLogicalAddress(logicalAddress, "IDENTITIES")
    if (kind < 1 || kind > 3) throw new Error(`неизвестный identityKind ${kind}`)
    if (kind === 1) {
      if (valueStringId !== 0) throw new Error("UUID IDENTITIES содержит valueStringId")
      result.push({ logicalAddress, kind: "uuid", value: formatUuid(uuidBytes) })
    } else {
      if (!uuidBytes.every((byte) => byte === 0)) throw new Error("строковый IDENTITIES содержит UUID")
      const value = requiredString(strings, valueStringId, "value IDENTITIES")
      result.push({ logicalAddress, kind: kind === 2 ? "xmlId" : "xmlName", value })
    }
  }
  return result
}

function decodeXmlOrders(
  section: Buffer,
  recordCountValue: bigint,
  strings: DecodedStrings,
  stage: LogicalValidationStage
): string[][] {
  const recordCount = variableRecordCount(section, recordCountValue, 8, "XML_ORDERS")
  const result: string[][] = []
  const seenOrders = new Set<string>()
  let offset = 0
  for (let index = 0; index < recordCount; index += 1) {
    const headerEnd = checkedEnd(section, offset, 8, "заголовок XML_ORDERS")
    const propertyCount = section.readUInt32LE(offset)
    if (section.readUInt32LE(offset + 4) !== 0) throw new Error("ненулевое reserved XML_ORDERS")
    const propertiesEnd = checkedEnd(section, headerEnd, BigInt(propertyCount) * 4n, "свойства XML_ORDERS")
    const recordEnd = alignedEnd(section, propertiesEnd, "запись XML_ORDERS")
    assertZero(section.subarray(propertiesEnd, recordEnd), "padding XML_ORDERS")
    const ids: number[] = []
    const seen = new Set<number>()
    for (let propertyIndex = 0; propertyIndex < propertyCount; propertyIndex += 1) {
      const id = section.readUInt32LE(headerEnd + propertyIndex * 4)
      requiredString(strings, id, "propertyKey XML_ORDERS")
      if (stage === 8 && seen.has(id)) throw new Error("повторный ключ в XML_ORDERS")
      seen.add(id)
      ids.push(id)
    }
    const orderKey = numberArrayKey(ids)
    if (stage === 8 && seenOrders.has(orderKey)) throw new Error("XML_ORDERS повторяются")
    seenOrders.add(orderKey)
    if (stage === 9) {
      if (propertyCount === 0) throw new Error("пустой порядок XML_ORDERS")
      result.push(ids.map((id) => strings.values[id - 1]))
    }
    offset = recordEnd
  }
  if (offset !== section.length) throw new Error("recordCount XML_ORDERS не совпадает с длиной секции")
  return result
}

function decodeXmlNodes(
  section: Buffer,
  recordCountValue: bigint,
  strings: DecodedStrings,
  orders: readonly (readonly string[])[],
  stage: LogicalValidationStage
): ConfigurationXmlNode[] {
  const recordCount = variableRecordCount(section, recordCountValue, 16, "XML_NODES")
  const result: ConfigurationXmlNode[] = []
  const seenAddressIds = new Set<number>()
  let offset = 0
  for (let index = 0; index < recordCount; index += 1) {
    const headerEnd = checkedEnd(section, offset, 16, "заголовок XML_NODES")
    const logicalAddressId = section.readUInt32LE(offset)
    const logicalAddress = requiredString(strings, logicalAddressId, "logicalAddress XML_NODES")
    if (stage === 8 && seenAddressIds.has(logicalAddressId)) throw new Error("XML_NODES повторяются")
    seenAddressIds.add(logicalAddressId)

    const orderId = section.readUInt32LE(offset + 4)
    const aliasCount = section.readUInt32LE(offset + 8)
    const presentCount = section.readUInt32LE(offset + 12)
    const dataLength = BigInt(aliasCount) * 8n + BigInt(presentCount) * 4n
    const dataEnd = checkedEnd(section, headerEnd, dataLength, "данные XML_NODES")
    const recordEnd = alignedEnd(section, dataEnd, "запись XML_NODES")
    assertZero(section.subarray(dataEnd, recordEnd), "padding XML_NODES")

    const aliasEntries: [string, string][] = []
    const seenAliasPropertyKeyIds = new Set<number>()
    let cursor = headerEnd
    for (let aliasIndex = 0; aliasIndex < aliasCount; aliasIndex += 1) {
      const propertyKeyId = section.readUInt32LE(cursor)
      const sourceXmlKeyId = section.readUInt32LE(cursor + 4)
      const propertyKey = requiredString(strings, propertyKeyId, "propertyKey XML_NODES")
      const sourceXmlKey = requiredString(strings, sourceXmlKeyId, "sourceXmlKey XML_NODES")
      if (stage === 8 && seenAliasPropertyKeyIds.has(propertyKeyId)) throw new Error("псевдонимы XML_NODES повторяются")
      seenAliasPropertyKeyIds.add(propertyKeyId)
      if (stage === 9 && propertyKeyId === sourceXmlKeyId) {
        throw new Error("псевдоним XML_NODES совпадает с каноническим именем")
      }
      aliasEntries.push([propertyKey, sourceXmlKey])
      cursor += 8
    }

    const present: string[] = []
    const seenPresentPropertyKeyIds = new Set<number>()
    for (let presentIndex = 0; presentIndex < presentCount; presentIndex += 1) {
      const propertyKeyId = section.readUInt32LE(cursor)
      const propertyKey = requiredString(strings, propertyKeyId, "present XML_NODES")
      if (stage === 8 && seenPresentPropertyKeyIds.has(propertyKeyId)) throw new Error("present XML_NODES повторяется")
      seenPresentPropertyKeyIds.add(propertyKeyId)
      present.push(propertyKey)
      cursor += 4
    }

    if (stage === 9) {
      validateLogicalAddress(logicalAddress, "XML_NODES")
      if (orderId > orders.length) throw new Error("orderId XML_NODES не существует")
      if (orderId === 0 && aliasCount === 0 && presentCount === 0) throw new Error("пустая запись XML_NODES")
      result.push({
        logicalAddress,
        ...(orderId === 0 ? {} : { order: orders[orderId - 1] }),
        ...(aliasCount === 0 ? {} : { aliases: Object.fromEntries(aliasEntries) }),
        ...(presentCount === 0 ? {} : { present }),
      })
    }
    offset = recordEnd
  }
  if (offset !== section.length) throw new Error("recordCount XML_NODES не совпадает с длиной секции")
  return result
}

function decodeXmlValues(
  section: Buffer,
  recordCountValue: bigint,
  strings: DecodedStrings,
  stage: LogicalValidationStage
): ConfigurationXmlValue[] {
  const recordCount = fixedRecordCount(section, recordCountValue, 32, "XML_VALUES")
  const result: ConfigurationXmlValue[] = []
  const seenAddressIds = new Set<number>()
  for (let index = 0; index < recordCount; index += 1) {
    const offset = index * 32
    const logicalAddressId = section.readUInt32LE(offset)
    const logicalAddress = requiredString(strings, logicalAddressId, "logicalAddress XML_VALUES")
    if (stage === 8 && seenAddressIds.has(logicalAddressId)) throw new Error("XML_VALUES повторяются")
    seenAddressIds.add(logicalAddressId)
    const flags = section.readUInt32LE(offset + 4)
    if (section.readBigUInt64LE(offset + 24) !== 0n) throw new Error("ненулевое reserved XML_VALUES")

    const xsiTypeId = section.readUInt32LE(offset + 8)
    const xmlTextId = section.readUInt32LE(offset + 12)
    const xmlPrefixId = section.readUInt32LE(offset + 16)
    const userSettingsIdId = section.readUInt32LE(offset + 20)
    referenceStringIfPresent(strings, xsiTypeId, "xsiType XML_VALUES")
    referenceStringIfPresent(strings, xmlTextId, "xmlText XML_VALUES")
    referenceStringIfPresent(strings, xmlPrefixId, "xmlPrefix XML_VALUES")
    referenceStringIfPresent(strings, userSettingsIdId, "userSettingsId XML_VALUES")
    if (stage !== 9) continue

    validateLogicalAddress(logicalAddress, "XML_VALUES")
    if (flags === 0 || (flags & ~XML_VALUE_FLAGS) !== 0) throw new Error("недопустимые флаги XML_VALUES")
    const xsiType = optionalFlaggedString(strings, xsiTypeId, flags, 2, "xsiType")
    const xmlText = optionalFlaggedString(strings, xmlTextId, flags, 3, "xmlText")
    const xmlPrefix = optionalFlaggedString(strings, xmlPrefixId, flags, 4, "xmlPrefix")
    const userSettingsId = optionalFlaggedString(strings, userSettingsIdId, flags, 5, "userSettingsId")
    result.push({
      logicalAddress,
      ...((flags & (1 << 0)) === 0 ? {} : { xsiNil: true as const }),
      ...((flags & (1 << 1)) === 0 ? {} : { explicitEmpty: true as const }),
      ...((flags & (1 << 6)) === 0 ? {} : { excludedEqualName: true as const }),
      ...(xsiType === undefined ? {} : { xsiType }),
      ...(xmlText === undefined ? {} : { xmlText }),
      ...(xmlPrefix === undefined ? {} : { xmlPrefix }),
      ...(userSettingsId === undefined ? {} : { userSettingsId }),
    })
  }
  return result
}

function validateCrossReferences(_data: ConfigurationIndexData, strings: DecodedStrings): void {
  if (strings.referencedIds.size !== strings.values.length) {
    throw new Error("STRINGS содержит строки без ссылок")
  }
}

function validateExpectations(binding: ConfigurationIndexBinding, options: DecodeConfigurationIndexOptions): void {
  if (options.expectedBaseId !== undefined && binding.baseId !== options.expectedBaseId) {
    throw new ConfigurationIndexCompatibilityError(
      `Ожидалась привязка ${options.expectedBaseId}, получена ${binding.baseId}`
    )
  }
  if (options.expectedProducerVersion !== undefined && binding.producerVersion !== options.expectedProducerVersion) {
    throw new ConfigurationIndexCompatibilityError(
      "Файл индекса создан другой версией NKDK; требуется повторный import"
    )
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
  return strings.values[id - 1]
}

function referenceStringIfPresent(strings: DecodedStrings, id: number, label: string): void {
  if (id !== 0) requiredString(strings, id, label)
}

function optionalFlaggedString(
  strings: DecodedStrings,
  id: number,
  flags: number,
  bit: number,
  label: string
): string | undefined {
  const present = (flags & (1 << bit)) !== 0
  if (present !== (id !== 0)) throw new Error(`флаг и stringId ${label} XML_VALUES не совпадают`)
  return present ? requiredString(strings, id, `${label} XML_VALUES`) : undefined
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
    throw new Error(`недопустимый путь PROJECT_FILES: ${projectPath}`)
  }
}

function validateLogicalAddress(value: string, section: "IDENTITIES" | "XML_NODES" | "XML_VALUES"): void {
  const segments = value.split(".")
  let offset: number
  if (segments[0] === "Конфигурация") {
    offset = 1
  } else {
    if (
      segments.length < 2 ||
      !isPlainLogicalAddressSegment(segments[0]) ||
      !isPlainLogicalAddressSegment(segments[1])
    ) {
      throw new Error(`некорректный logicalAddress ${section}: ${value}`)
    }
    offset = 2
  }

  if (section !== "IDENTITIES") {
    while (offset < segments.length) {
      if (!isPlainLogicalAddressSegment(segments[offset]) && !isIndexedLogicalAddressSegment(segments[offset])) {
        throw new Error(`некорректный logicalAddress ${section}: ${value}`)
      }
      offset += 1
    }
    return
  }

  while (offset < segments.length) {
    if (isIndexedLogicalAddressSegment(segments[offset])) {
      offset += 1
      continue
    }
    if (
      offset > 0 &&
      (segments[offset - 2] === "Элемент" || isFormSingletonLogicalAddressSegment(segments[offset - 1])) &&
      isFormSingletonLogicalAddressSegment(segments[offset])
    ) {
      offset += 1
      continue
    }
    if (
      offset + 1 >= segments.length ||
      !isPlainLogicalAddressSegment(segments[offset]) ||
      !isPlainLogicalAddressSegment(segments[offset + 1])
    ) {
      throw new Error(`некорректный logicalAddress ${section}: ${value}`)
    }
    offset += 2
  }
}

function isPlainLogicalAddressSegment(value: string | undefined): value is string {
  return value !== undefined && value.length > 0 && !value.includes("[") && !value.includes("]")
}

function isFormSingletonLogicalAddressSegment(value: string | undefined): value is string {
  return value !== undefined && FORM_SINGLETON_LOGICAL_ADDRESS_SEGMENTS.has(value)
}

function isIndexedLogicalAddressSegment(value: string | undefined): boolean {
  if (value === undefined) return false
  const match = /^([^\[\]]+)\[(0|[1-9][0-9]*)\]$/.exec(value)
  return match !== null && BigInt(match[2]) <= BigInt(Number.MAX_SAFE_INTEGER)
}

function fixedRecordCount(section: Buffer, count: bigint, recordLength: number, label: string): number {
  const expectedLength = BigInt(recordLength) * count
  checkedEnd(section, 0, expectedLength, label)
  if (expectedLength !== BigInt(section.length)) throw new Error(`recordCount ${label} не совпадает с длиной секции`)
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
    if (value < 0n || value > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error(`${label} вне безопасного диапазона`)
    return Number(value)
  }
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(`${label} вне безопасного диапазона`)
  return value
}

function alignedEnd(buffer: Uint8Array, value: number, label: string): number {
  const aligned = Math.ceil(value / 8) * 8
  checkedEnd(buffer, value, aligned - value, `${label}: padding`)
  return aligned
}

function readHash128(buffer: Buffer, offset: number): Hash128 {
  checkedEnd(buffer, offset, 16, "контрольная сумма")
  return { low: buffer.readBigUInt64LE(offset), high: buffer.readBigUInt64LE(offset + 8) }
}

function hashEquals(left: Hash128, right: Hash128): boolean {
  return left.low === right.low && left.high === right.high
}

function assertZero(bytes: Uint8Array, label: string): void {
  if (!bytes.every((byte) => byte === 0)) throw new Error(`${label} содержит ненулевые байты`)
}

function numberArrayKey(values: readonly number[]): string {
  return values.join(",")
}

function formatUuid(bytes: Uint8Array): string {
  const hex = Buffer.from(bytes).toString("hex")
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

function errorMessage(caught: unknown): string {
  return caught instanceof Error ? caught.message : String(caught)
}
