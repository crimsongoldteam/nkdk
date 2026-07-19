import { hashSection, writeHash128 } from "./hash"
import { createStringPool } from "./stringPool"
import type {
  ConfigurationIdentity,
  ConfigurationIndexData,
  ConfigurationXmlNode,
  ConfigurationXmlValue,
} from "./types"

interface EncodedSection {
  type: 1 | 2 | 3 | 4 | 5 | 6 | 7
  recordCount: bigint
  bytes: Buffer
}

interface NormalizedIndex {
  data: ConfigurationIndexData
  orders: readonly (readonly string[])[]
  orderId(order: readonly string[] | undefined): number
  strings: ReturnType<typeof createStringPool>
}

const HEADER_LENGTH = 64
const DIRECTORY_ENTRY_LENGTH = 64
const SECTION_COUNT = 7
const MAX_U64 = (1n << 64n) - 1n

const compareUtf8 = (left: string, right: string): number => Buffer.compare(Buffer.from(left), Buffer.from(right))

export function encodeConfigurationIndex(data: ConfigurationIndexData): Buffer {
  const normalized = normalizeIndex(data)
  const sections: EncodedSection[] = [
    encodeBinding(normalized),
    encodeStrings(normalized),
    encodeProjectFiles(normalized),
    encodeIdentities(normalized),
    encodeXmlOrders(normalized),
    encodeXmlNodes(normalized),
    encodeXmlValues(normalized),
  ]
  return encodeContainer(sections)
}

function normalizeIndex(data: ConfigurationIndexData): NormalizedIndex {
  validateBinding(data)

  const projectFiles = [...data.projectFiles].sort((left, right) => compareUtf8(left.projectPath, right.projectPath))
  for (const file of projectFiles) {
    validateProjectPath(file.projectPath)
    assertU64(file.contentHash, "contentHash PROJECT_FILES")
  }
  rejectAdjacentDuplicates(
    projectFiles,
    (left, right) => compareUtf8(left.projectPath, right.projectPath) === 0,
    "Повторный путь PROJECT_FILES"
  )

  const identities = [...data.identities].sort(
    (left, right) => compareUtf8(left.logicalAddress, right.logicalAddress) || identityKind(left) - identityKind(right)
  )
  for (const identity of identities) validateIdentity(identity)
  rejectAdjacentDuplicates(
    identities,
    (left, right) =>
      compareUtf8(left.logicalAddress, right.logicalAddress) === 0 && identityKind(left) === identityKind(right),
    "Повторная пара logicalAddress + identityKind в IDENTITIES"
  )

  const xmlNodes = [...data.xmlNodes].sort((left, right) => compareUtf8(left.logicalAddress, right.logicalAddress))
  for (const node of xmlNodes) validateXmlNode(node)
  rejectAdjacentDuplicates(
    xmlNodes,
    (left, right) => compareUtf8(left.logicalAddress, right.logicalAddress) === 0,
    "Повторный logicalAddress в XML_NODES"
  )

  const xmlValues = [...data.xmlValues].sort((left, right) => compareUtf8(left.logicalAddress, right.logicalAddress))
  for (const value of xmlValues) validateXmlValue(value)
  rejectAdjacentDuplicates(
    xmlValues,
    (left, right) => compareUtf8(left.logicalAddress, right.logicalAddress) === 0,
    "Повторный logicalAddress в XML_VALUES"
  )

  const normalizedData: ConfigurationIndexData = {
    binding: data.binding,
    projectFiles,
    identities,
    xmlNodes,
    xmlValues,
  }
  const strings = createStringPool(indexStrings(normalizedData))
  const ordersByKey = new Map<string, readonly string[]>()
  for (const node of xmlNodes) {
    if (node.order === undefined) continue
    const ids = node.order.map((propertyKey) => strings.id(propertyKey))
    rejectDuplicateNumbers(ids, "Повторный ключ в XML_ORDERS")
    const key = numberArrayKey(ids)
    if (!ordersByKey.has(key)) ordersByKey.set(key, node.order)
  }
  const orders = [...ordersByKey.values()].sort((left, right) =>
    compareNumberArrays(left.map(strings.id), right.map(strings.id))
  )
  const orderIds = new Map(orders.map((order, index) => [numberArrayKey(order.map(strings.id)), index + 1]))

  return {
    data: normalizedData,
    orders,
    orderId(order) {
      if (order === undefined) return 0
      const id = orderIds.get(numberArrayKey(order.map(strings.id)))
      if (id === undefined) throw new Error("Порядок отсутствует в XML_ORDERS")
      return id
    },
    strings,
  }
}

function validateBinding({ binding }: ConfigurationIndexData): void {
  assertU64(binding.indexGeneration, "indexGeneration BINDING")
  if (binding.indexGeneration === 0n) {
    throw new Error("indexGeneration BINDING должен начинаться с 1")
  }
  if (binding.producerVersion.length === 0) {
    throw new Error("producerVersion BINDING не должен быть пустым")
  }
  const baseIdLength = Buffer.byteLength(binding.baseId)
  if (baseIdLength < 1 || baseIdLength > 128 || !/^[A-Za-z0-9._-]+$/.test(binding.baseId)) {
    throw new Error("Недопустимый baseId BINDING")
  }
  const hasFingerprint = binding.baseFingerprint.length > 0
  const hasConfigurationVersion = binding.configurationVersion.length > 0
  if (hasFingerprint !== hasConfigurationVersion) {
    throw new Error("baseFingerprint и configurationVersion BINDING должны быть заполнены вместе")
  }
  assertU32(binding.baseFingerprint.length, "baseFingerprintLength BINDING")
  assertU32(binding.configurationVersion.length, "configurationVersionLength BINDING")
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
    throw new Error(`Недопустимый путь PROJECT_FILES: ${projectPath}`)
  }
}

function validateIdentity(identity: ConfigurationIdentity): void {
  if (identity.logicalAddress.length === 0 || identity.value.length === 0) {
    throw new Error("Пустая строка в IDENTITIES")
  }
  if (
    identity.kind === "uuid" &&
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(identity.value)
  ) {
    throw new Error(`Некорректный UUID в IDENTITIES: ${identity.value}`)
  }
}

function validateXmlNode(node: ConfigurationXmlNode): void {
  if (node.logicalAddress.length === 0) {
    throw new Error("Пустой logicalAddress в XML_NODES")
  }
  if (node.order !== undefined && node.order.length === 0) {
    throw new Error("Пустой порядок XML_ORDERS")
  }
  const aliasCount = Object.keys(node.aliases ?? {}).length
  const presentCount = node.present?.length ?? 0
  if (node.order === undefined && aliasCount === 0 && presentCount === 0) {
    throw new Error("Пустая запись XML_NODES")
  }
}

function validateXmlValue(value: ConfigurationXmlValue): void {
  if (value.logicalAddress.length === 0) {
    throw new Error("Пустой logicalAddress в XML_VALUES")
  }
  if (xmlValueFlags(value) === 0) {
    throw new Error("Запись XML_VALUES без флагов")
  }
}

function* indexStrings(data: ConfigurationIndexData): Iterable<string> {
  yield data.binding.producerVersion
  yield data.binding.baseId
  for (const file of data.projectFiles) yield file.projectPath
  for (const identity of data.identities) {
    yield identity.logicalAddress
    if (identity.kind !== "uuid") yield identity.value
  }
  for (const node of data.xmlNodes) {
    yield node.logicalAddress
    if (node.order !== undefined) yield* node.order
    for (const [propertyKey, sourceXmlKey] of Object.entries(node.aliases ?? {})) {
      yield propertyKey
      yield sourceXmlKey
    }
    if (node.present !== undefined) yield* node.present
  }
  for (const value of data.xmlValues) {
    yield value.logicalAddress
    if (value.xsiType !== undefined) yield value.xsiType
    if (value.xmlText !== undefined) yield value.xmlText
    if (value.xmlPrefix !== undefined) yield value.xmlPrefix
    if (value.userSettingsId !== undefined) yield value.userSettingsId
  }
}

function encodeBinding(normalized: NormalizedIndex): EncodedSection {
  const { binding } = normalized.data
  const contentLength = HEADER_LENGTH + binding.baseFingerprint.length + binding.configurationVersion.length
  const bytes = Buffer.alloc(align8(contentLength))
  bytes.writeBigUInt64LE(binding.indexGeneration, 0)
  bytes.writeUInt32LE(normalized.strings.id(binding.producerVersion), 8)
  bytes.writeUInt32LE(normalized.strings.id(binding.baseId), 12)
  bytes.writeUInt32LE(binding.baseFingerprint.length, 16)
  bytes.writeUInt32LE(binding.configurationVersion.length, 20)
  Buffer.from(binding.baseFingerprint).copy(bytes, HEADER_LENGTH)
  Buffer.from(binding.configurationVersion).copy(bytes, HEADER_LENGTH + binding.baseFingerprint.length)
  return { type: 1, recordCount: 1n, bytes }
}

function encodeStrings(normalized: NormalizedIndex): EncodedSection {
  const records = normalized.strings.strings.map((value) => {
    const valueBytes = Buffer.from(value, "utf8")
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

function encodeProjectFiles(normalized: NormalizedIndex): EncodedSection {
  const bytes = Buffer.alloc(normalized.data.projectFiles.length * 16)
  normalized.data.projectFiles.forEach((file, index) => {
    const offset = index * 16
    bytes.writeUInt32LE(normalized.strings.id(file.projectPath), offset)
    bytes.writeBigUInt64LE(file.contentHash, offset + 8)
  })
  return {
    type: 3,
    recordCount: BigInt(normalized.data.projectFiles.length),
    bytes,
  }
}

function encodeIdentities(normalized: NormalizedIndex): EncodedSection {
  const bytes = Buffer.alloc(normalized.data.identities.length * 32)
  normalized.data.identities.forEach((identity, index) => {
    const offset = index * 32
    const kind = identityKind(identity)
    bytes.writeUInt32LE(normalized.strings.id(identity.logicalAddress), offset)
    bytes.writeUInt16LE(kind, offset + 4)
    if (kind === 1) {
      Buffer.from(identity.value.replaceAll("-", ""), "hex").copy(bytes, offset + 16)
    } else {
      bytes.writeUInt32LE(normalized.strings.id(identity.value), offset + 8)
    }
  })
  return {
    type: 4,
    recordCount: BigInt(normalized.data.identities.length),
    bytes,
  }
}

function encodeXmlOrders(normalized: NormalizedIndex): EncodedSection {
  const records = normalized.orders.map((order) => {
    const record = Buffer.alloc(align8(8 + order.length * 4))
    record.writeUInt32LE(order.length, 0)
    order.forEach((propertyKey, index) => {
      record.writeUInt32LE(normalized.strings.id(propertyKey), 8 + index * 4)
    })
    return record
  })
  return {
    type: 5,
    recordCount: BigInt(records.length),
    bytes: Buffer.concat(records),
  }
}

function encodeXmlNodes(normalized: NormalizedIndex): EncodedSection {
  const records = normalized.data.xmlNodes.map((node) => {
    const aliases = normalizeAliases(node, normalized)
    const present = normalizePresent(node, normalized)
    const record = Buffer.alloc(align8(16 + aliases.length * 8 + present.length * 4))
    record.writeUInt32LE(normalized.strings.id(node.logicalAddress), 0)
    record.writeUInt32LE(normalized.orderId(node.order), 4)
    record.writeUInt32LE(aliases.length, 8)
    record.writeUInt32LE(present.length, 12)
    let offset = 16
    for (const alias of aliases) {
      record.writeUInt32LE(alias.propertyKeyId, offset)
      record.writeUInt32LE(alias.sourceXmlKeyId, offset + 4)
      offset += 8
    }
    for (const propertyKeyId of present) {
      record.writeUInt32LE(propertyKeyId, offset)
      offset += 4
    }
    return record
  })
  return {
    type: 6,
    recordCount: BigInt(records.length),
    bytes: Buffer.concat(records),
  }
}

function normalizeAliases(
  node: ConfigurationXmlNode,
  normalized: NormalizedIndex
): { propertyKeyId: number; sourceXmlKeyId: number }[] {
  const aliases = Object.entries(node.aliases ?? {}).map(([propertyKey, sourceXmlKey]) => ({
    propertyKeyId: normalized.strings.id(propertyKey),
    sourceXmlKeyId: normalized.strings.id(sourceXmlKey),
  }))
  aliases.sort((left, right) => left.propertyKeyId - right.propertyKeyId)
  for (let index = 0; index < aliases.length; index += 1) {
    const alias = aliases[index]
    if (alias.propertyKeyId === alias.sourceXmlKeyId) {
      throw new Error("Псевдоним XML_NODES совпадает с каноническим именем")
    }
    if (index > 0 && aliases[index - 1].propertyKeyId === alias.propertyKeyId) {
      throw new Error("Повторный ключ псевдонима в XML_NODES")
    }
  }
  return aliases
}

function normalizePresent(node: ConfigurationXmlNode, normalized: NormalizedIndex): number[] {
  const present = (node.present ?? []).map((propertyKey) => normalized.strings.id(propertyKey))
  present.sort((left, right) => left - right)
  rejectDuplicateNumbers(present, "Повторный ключ присутствия в XML_NODES")
  return present
}

function encodeXmlValues(normalized: NormalizedIndex): EncodedSection {
  const bytes = Buffer.alloc(normalized.data.xmlValues.length * 32)
  normalized.data.xmlValues.forEach((value, index) => {
    const offset = index * 32
    bytes.writeUInt32LE(normalized.strings.id(value.logicalAddress), offset)
    bytes.writeUInt32LE(xmlValueFlags(value), offset + 4)
    writeOptionalStringId(bytes, offset + 8, value.xsiType, normalized)
    writeOptionalStringId(bytes, offset + 12, value.xmlText, normalized)
    writeOptionalStringId(bytes, offset + 16, value.xmlPrefix, normalized)
    writeOptionalStringId(bytes, offset + 20, value.userSettingsId, normalized)
  })
  return {
    type: 7,
    recordCount: BigInt(normalized.data.xmlValues.length),
    bytes,
  }
}

function writeOptionalStringId(
  bytes: Buffer,
  offset: number,
  value: string | undefined,
  normalized: NormalizedIndex
): void {
  if (value !== undefined) bytes.writeUInt32LE(normalized.strings.id(value), offset)
}

function xmlValueFlags(value: ConfigurationXmlValue): number {
  let flags = 0
  if (value.xsiNil === true) flags |= 1 << 0
  if (value.explicitEmpty === true) flags |= 1 << 1
  if (value.xsiType !== undefined) flags |= 1 << 2
  if (value.xmlText !== undefined) flags |= 1 << 3
  if (value.xmlPrefix !== undefined) flags |= 1 << 4
  if (value.userSettingsId !== undefined) flags |= 1 << 5
  return flags
}

function encodeContainer(sections: EncodedSection[]): Buffer {
  const firstSectionOffset = align8(HEADER_LENGTH + DIRECTORY_ENTRY_LENGTH * SECTION_COUNT)
  let nextOffset = firstSectionOffset
  const placements = sections.map((section) => {
    const offset = nextOffset
    nextOffset = align8(offset + section.bytes.length)
    return { section, offset }
  })
  const lastPlacement = placements.at(-1)
  if (lastPlacement === undefined) throw new Error("Контейнер не содержит секций")
  const fileLength = lastPlacement.offset + lastPlacement.section.bytes.length
  const directory = encodeDirectory(placements)
  const result = Buffer.alloc(fileLength)
  encodeHeader(result, {
    fileLength,
    directoryChecksum: hashSection(directory),
  })
  directory.copy(result, HEADER_LENGTH)
  for (const placement of placements) {
    placement.section.bytes.copy(result, placement.offset)
  }
  return result
}

function encodeDirectory(placements: readonly { section: EncodedSection; offset: number }[]): Buffer {
  const directory = Buffer.alloc(DIRECTORY_ENTRY_LENGTH * placements.length)
  placements.forEach(({ section, offset }, index) => {
    const entryOffset = index * DIRECTORY_ENTRY_LENGTH
    directory.writeUInt32LE(section.type, entryOffset)
    directory.writeUInt16LE(1, entryOffset + 4)
    directory.writeUInt16LE(0, entryOffset + 6)
    directory.writeUInt32LE(1, entryOffset + 8)
    directory.writeBigUInt64LE(BigInt(offset), entryOffset + 16)
    directory.writeBigUInt64LE(BigInt(section.bytes.length), entryOffset + 24)
    directory.writeBigUInt64LE(BigInt(section.bytes.length), entryOffset + 32)
    directory.writeBigUInt64LE(section.recordCount, entryOffset + 40)
    writeHash128(directory, entryOffset + 48, hashSection(section.bytes))
  })
  return directory
}

function encodeHeader(
  result: Buffer,
  options: {
    fileLength: number
    directoryChecksum: ReturnType<typeof hashSection>
  }
): void {
  result.write("NKDK1CIX", 0, "ascii")
  result.writeUInt16LE(1, 8)
  result.writeUInt16LE(0, 10)
  result.writeUInt32LE(HEADER_LENGTH, 12)
  result.writeUInt8(1, 16)
  result.writeUInt8(1, 17)
  result.writeUInt8(1, 18)
  result.writeUInt8(1, 19)
  result.writeUInt32LE(DIRECTORY_ENTRY_LENGTH, 20)
  result.writeUInt32LE(SECTION_COUNT, 24)
  result.writeBigUInt64LE(BigInt(HEADER_LENGTH), 32)
  result.writeBigUInt64LE(BigInt(options.fileLength), 40)
  writeHash128(result, 48, options.directoryChecksum)
}

function identityKind(identity: ConfigurationIdentity): 1 | 2 | 3 {
  switch (identity.kind) {
    case "uuid":
      return 1
    case "xmlId":
      return 2
    case "xmlName":
      return 3
  }
}

function rejectAdjacentDuplicates<T>(
  values: readonly T[],
  isDuplicate: (left: T, right: T) => boolean,
  message: string
): void {
  for (let index = 1; index < values.length; index += 1) {
    if (isDuplicate(values[index - 1], values[index])) throw new Error(message)
  }
}

function rejectDuplicateNumbers(values: readonly number[], message: string): void {
  const sorted = [...values].sort((left, right) => left - right)
  for (let index = 1; index < sorted.length; index += 1) {
    if (sorted[index - 1] === sorted[index]) throw new Error(message)
  }
}

function compareNumberArrays(left: readonly number[], right: readonly number[]): number {
  const commonLength = Math.min(left.length, right.length)
  for (let index = 0; index < commonLength; index += 1) {
    if (left[index] !== right[index]) return left[index] - right[index]
  }
  return left.length - right.length
}

function numberArrayKey(values: readonly number[]): string {
  return values.join(",")
}

function align8(value: number): number {
  return Math.ceil(value / 8) * 8
}

function assertU32(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 0 || value > 0xffff_ffff) {
    throw new Error(`${label} не помещается в u32`)
  }
}

function assertU64(value: bigint, label: string): void {
  if (value < 0n || value > MAX_U64) throw new Error(`${label} не помещается в u64`)
}
