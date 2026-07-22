import { describe, expect, it } from "vitest"
import { NKDK_CORE_VERSION } from "../../version"
import { ConfigurationIndexCompatibilityError, decodeConfigurationIndex } from "./decode"
import { encodeConfigurationIndex } from "./encode"
import { hashSection, writeHash128 } from "./hash"
import { sampleIndex } from "./testData"

const HEADER_LENGTH = 64
const DIRECTORY_ENTRY_LENGTH = 64
const SECTION_COUNT = 7
const DIRECTORY_LENGTH = DIRECTORY_ENTRY_LENGTH * SECTION_COUNT

describe("decodeConfigurationIndex", () => {
  it("round-trips every logical section", () => {
    const encoded = encodeConfigurationIndex(sampleIndex())

    expect(
      decodeConfigurationIndex(encoded, {
        expectedBaseId: "default",
        expectedProducerVersion: NKDK_CORE_VERSION,
      })
    ).toEqual(sampleIndex())
  })

  it("round-trips an XML alias named __proto__ as data", () => {
    const data = sampleIndex()
    const aliases = Object.fromEntries([["__proto__", "SourceName"]])
    const encoded = encodeConfigurationIndex({
      ...data,
      xmlNodes: [{ logicalAddress: "Справочник.Товары", aliases }],
    })

    expect(decodeConfigurationIndex(encoded).xmlNodes[0].aliases).toEqual(aliases)
  })

  it("accepts YAML-path logicalAddress in XML_NODES", () => {
    const data = sampleIndex()
    const xmlNode = {
      logicalAddress: "БизнесПроцесс.Задание.Форма.ФормаСписка.Атрибут.Список.Порядок.Элементы[0]",
      present: ["Items"],
    }
    const encoded = encodeConfigurationIndex({
      ...data,
      xmlNodes: [xmlNode],
    })

    expect(decodeConfigurationIndex(encoded).xmlNodes).toEqual([xmlNode])
  })

  it("accepts form singleton identity logicalAddress after a named form element", () => {
    const contextMenuAddress = "Справочник.Товары.Форма.ФормаЭлемента.Элемент.ПолеВвода.КонтекстноеМеню"
    const nestedContextMenuAddress =
      "Справочник.Товары.Форма.ФормаЭлемента.Элемент.ДиаграммаГанта.Таблица.КонтекстноеМеню"
    const encoded = encodeConfigurationIndex({
      ...sampleIndex(),
      identities: [
        {
          logicalAddress: contextMenuAddress,
          kind: "xmlId",
          value: "42",
        },
        {
          logicalAddress: nestedContextMenuAddress,
          kind: "xmlId",
          value: "43",
        },
      ],
    })

    expect(decodeConfigurationIndex(encoded).identities).toEqual([
      {
        logicalAddress: contextMenuAddress,
        kind: "xmlId",
        value: "42",
      },
      {
        logicalAddress: nestedContextMenuAddress,
        kind: "xmlId",
        value: "43",
      },
    ])
  })

  it.each([
    ["magic", (buffer: Buffer) => writeAscii(buffer, "BROKEN!!", 0)],
    ["directory checksum", (buffer: Buffer) => flipByte(buffer, 64)],
    ["section checksum", (buffer: Buffer) => flipByte(buffer, 512)],
  ] as const)("rejects invalid %s", (_name, mutate) => {
    const corrupted = mutate(Buffer.from(encodeConfigurationIndex(sampleIndex())))

    expectCorruption(corrupted)
  })

  it("rejects trailing bytes after accepting the matching fileLength", () => {
    const corrupted = Buffer.concat([encodeConfigurationIndex(sampleIndex()), Buffer.from([0])])
    corrupted.writeBigUInt64LE(BigInt(corrupted.length), 40)

    expectCorruptionMessage(corrupted, "байты после последней секции")
  })

  it.each([
    ["header length", (buffer: Buffer) => writeU32(buffer, 12, 63)],
    ["byte order", (buffer: Buffer) => writeU8(buffer, 16, 2)],
    ["string encoding", (buffer: Buffer) => writeU8(buffer, 17, 2)],
    ["checksum algorithm", (buffer: Buffer) => writeU8(buffer, 18, 2)],
    ["file hash algorithm", (buffer: Buffer) => writeU8(buffer, 19, 2)],
    ["directory entry length", (buffer: Buffer) => writeU32(buffer, 20, 63)],
    ["section count", (buffer: Buffer) => writeU32(buffer, 24, 6)],
    ["header flags", (buffer: Buffer) => writeU32(buffer, 28, 1)],
    ["directory offset", (buffer: Buffer) => writeU64(buffer, 32, 63n)],
    ["file length", (buffer: Buffer) => writeU64(buffer, 40, BigInt(buffer.length - 1))],
  ] as const)("rejects invalid header %s", (_name, mutate) => {
    expectCorruption(mutate(Buffer.from(encodeConfigurationIndex(sampleIndex()))))
  })

  it("separates incompatible container versions from corruption", () => {
    const encoded = Buffer.from(encodeConfigurationIndex(sampleIndex()))
    encoded.writeUInt16LE(2, 8)

    expect(() => decodeConfigurationIndex(encoded)).toThrowError(ConfigurationIndexCompatibilityError)
  })

  it.each([
    ["unsorted section types", (buffer: Buffer) => writeU32(buffer, DIRECTORY_ENTRY_LENGTH, 1)],
    ["section reserved", (buffer: Buffer) => writeU32(buffer, 12, 1)],
    ["logical length", (buffer: Buffer) => writeU64(buffer, 32, 1n)],
    ["missing mandatory flag", (buffer: Buffer) => writeU32(buffer, 8, 0)],
  ] as const)("rejects invalid directory %s", (_name, mutate) => {
    const corrupted = mutateDirectory(encodeConfigurationIndex(sampleIndex()), mutate)

    expectCorruption(corrupted)
  })

  it.each([
    ["section version", (buffer: Buffer) => writeU16(buffer, 4, 2)],
    ["unknown section flag", (buffer: Buffer) => writeU32(buffer, 8, 3)],
  ] as const)("separates incompatible directory %s", (_name, mutate) => {
    const corrupted = mutateDirectory(encodeConfigurationIndex(sampleIndex()), mutate)

    expect(() => decodeConfigurationIndex(corrupted)).toThrowError(ConfigurationIndexCompatibilityError)
  })

  it.each([
    ["unaligned section", (directory: Buffer) => writeU64(directory, 16, 513n)],
    ["overlapping sections", (directory: Buffer) => writeU64(directory, DIRECTORY_ENTRY_LENGTH + 16, 512n)],
    [
      "unsafe section length",
      (directory: Buffer) => {
        const entry = (SECTION_COUNT - 1) * DIRECTORY_ENTRY_LENGTH
        writeU64(directory, entry + 24, (1n << 64n) - 1n)
        return writeU64(directory, entry + 32, (1n << 64n) - 1n)
      },
    ],
  ] as const)("rejects invalid placement %s", (_name, mutate) => {
    expectCorruption(mutateDirectory(encodeConfigurationIndex(sampleIndex()), mutate))
  })

  it.each([
    ["BINDING reserved", 1, (section: Buffer) => flipByte(section, 24)],
    ["STRINGS padding", 2, (section: Buffer) => flipStringPadding(section, "default")],
    ["PROJECT_FILES flags", 3, (section: Buffer) => flipByte(section, 4)],
    ["IDENTITIES flags", 4, (section: Buffer) => flipByte(section, 6)],
    ["XML_ORDERS reserved", 5, (section: Buffer) => flipByte(section, 4)],
    ["XML_NODES padding", 6, (section: Buffer) => flipByte(section, section.length - 1)],
    ["XML_VALUES reserved", 7, (section: Buffer) => flipByte(section, 24)],
  ] as const)("rejects non-zero %s after checksum verification", (_name, sectionType, mutate) => {
    const corrupted = mutateSection(encodeConfigurationIndex(sampleIndex()), sectionType, mutate)

    expectCorruption(corrupted)
  })

  it.each([
    ["invalid UTF-8", (section: Buffer) => writeStringByte(section, "default", 0xff)],
    ["U+0000", (section: Buffer) => writeStringByte(section, "default", 0)],
  ] as const)("rejects invalid STRINGS %s", (_name, mutate) => {
    expectCorruption(mutateSection(encodeConfigurationIndex(sampleIndex()), 2, mutate))
  })

  it.each([
    ["zero indexGeneration", 1, (section: Buffer) => writeU64(section, 0, 0n)],
    ["zero producerVersion stringId", 1, (section: Buffer) => writeU32(section, 8, 0)],
    ["zero project path stringId", 3, (section: Buffer) => writeU32(section, 0, 0)],
    ["unknown identity kind", 4, (section: Buffer) => writeU16(section, 4, 4)],
    ["duplicate order property", 5, duplicateOrderProperty],
    ["alias equal to canonical name", 6, duplicateAliasName],
    ["unknown XML value flag", 7, (section: Buffer) => writeU32(section, 4, 1 << 6)],
    ["missing XML value stringId", 7, (section: Buffer) => writeU32(section, 12, 0)],
  ] as const)("rejects invalid logical record %s", (_name, sectionType, mutate) => {
    expectCorruption(mutateSection(encodeConfigurationIndex(sampleIndex()), sectionType, mutate))
  })

  it("rejects a half-filled confirmed binding", () => {
    const data = sampleIndex()
    const encoded = encodeConfigurationIndex({
      ...data,
      binding: {
        ...data.binding,
        baseFingerprint: Uint8Array.of(1),
        configurationVersion: Uint8Array.of(2),
      },
    })
    const corrupted = mutateSection(encoded, 1, (section) => writeU32(section, 20, 0))

    expectCorruption(corrupted)
  })

  it("rejects recordCount that disagrees with section bytes", () => {
    const corrupted = mutateDirectory(encodeConfigurationIndex(sampleIndex()), (directory) =>
      writeU64(directory, DIRECTORY_ENTRY_LENGTH + 40, 100n)
    )

    expectCorruption(corrupted)
  })

  it("finishes stage 7 for all sections before checking section uniqueness", () => {
    const data = sampleIndex()
    const encoded = encodeConfigurationIndex({
      ...data,
      projectFiles: [...data.projectFiles, { projectPath: "A.yaml", contentHash: 2n }],
    })
    const reordered = mutateSection(encoded, 3, swapFirstRecordIds)
    const corrupted = mutateSection(reordered, 7, (section) => flipByte(section, 24))

    expectCorruptionMessage(corrupted, "ненулевое reserved XML_VALUES")
  })

  it("finishes stage 8 before checking internal record constraints", () => {
    const data = sampleIndex()
    const encoded = encodeConfigurationIndex({
      ...data,
      xmlValues: [...data.xmlValues, { logicalAddress: "Документ.Заказ.name", xsiNil: true }],
    })
    const invalidBinding = mutateSection(encoded, 1, (section) => writeU64(section, 0, 0n))
    const corrupted = mutateSection(invalidBinding, 7, duplicateFirstRecordId)

    expectCorruptionMessage(corrupted, "XML_VALUES повторяются")
  })

  it.each(["Справочник", "Справочник.Товары.Элемент[01]"])("rejects malformed logicalAddress %s", (logicalAddress) => {
    const data = sampleIndex()
    const corrupted = encodeConfigurationIndex({
      ...data,
      identities: [{ ...data.identities[0], logicalAddress }],
    })

    expectCorruptionMessage(corrupted, "некорректный logicalAddress IDENTITIES")
  })

  it.each([
    [
      "IDENTITIES",
      (data: ReturnType<typeof sampleIndex>) => ({
        ...data,
        identities: [{ ...data.identities[0], logicalAddress: "Справочник..Товары" }],
      }),
    ],
    [
      "XML_NODES",
      (data: ReturnType<typeof sampleIndex>) => ({
        ...data,
        xmlNodes: [{ ...data.xmlNodes[0], logicalAddress: "Справочник..Товары" }],
      }),
    ],
    [
      "XML_VALUES",
      (data: ReturnType<typeof sampleIndex>) => ({
        ...data,
        xmlValues: [{ ...data.xmlValues[0], logicalAddress: "Справочник..Товары.synonym" }],
      }),
    ],
  ] as const)("rejects a double dot in %s logicalAddress", (section, corrupt) => {
    const corrupted = encodeConfigurationIndex(corrupt(sampleIndex()))

    expectCorruptionMessage(corrupted, `некорректный logicalAddress ${section}`)
  })

  it.each([
    ["XML_ID", 2, "xmlId"],
    ["XML_NAME", 3, "xmlName"],
  ] as const)("accepts an empty %s value through a non-zero stringId", (_name, kind, expectedKind) => {
    const encoded = encodeConfigurationIndex(sampleIndex())
    const emptyStringId = findStringId(encoded, "")
    const valid = mutateSection(encoded, 4, (section) => {
      section.writeUInt16LE(kind, 4)
      section.writeUInt32LE(emptyStringId, 8)
      section.fill(0, 16, 32)
      return section
    })

    expect(decodeConfigurationIndex(valid).identities).toEqual([
      { logicalAddress: "Справочник.Товары", kind: expectedKind, value: "" },
    ])
  })

  it("rejects unreferenced strings", () => {
    const encoded = encodeConfigurationIndex(sampleIndex())
    const producerVersionStringId = sectionBytes(encoded, 1).readUInt32LE(8)
    const corrupted = mutateSection(encoded, 1, (section) => writeU32(section, 12, producerVersionStringId))

    expectCorruption(corrupted)
  })

  it.each([
    ["baseId", { expectedBaseId: "another" }],
    ["producer version", { expectedProducerVersion: "another" }],
  ] as const)("reports incompatible %s separately", (_name, options) => {
    const encoded = encodeConfigurationIndex(sampleIndex())

    expect(() => decodeConfigurationIndex(encoded, options)).toThrowError(ConfigurationIndexCompatibilityError)
  })
})

function mutateDirectory(source: Uint8Array, mutate: (directory: Buffer) => Buffer): Buffer {
  const buffer = Buffer.from(source)
  const directory = buffer.subarray(HEADER_LENGTH, HEADER_LENGTH + DIRECTORY_LENGTH)
  mutate(directory)
  writeHash128(buffer, 48, hashSection(directory))
  return buffer
}

function mutateSection(source: Uint8Array, sectionType: number, mutate: (section: Buffer) => Buffer): Buffer {
  const buffer = Buffer.from(source)
  const entryOffset = HEADER_LENGTH + (sectionType - 1) * DIRECTORY_ENTRY_LENGTH
  const offset = Number(buffer.readBigUInt64LE(entryOffset + 16))
  const length = Number(buffer.readBigUInt64LE(entryOffset + 24))
  const section = buffer.subarray(offset, offset + length)
  mutate(section)
  writeHash128(buffer, entryOffset + 48, hashSection(section))
  const directory = buffer.subarray(HEADER_LENGTH, HEADER_LENGTH + DIRECTORY_LENGTH)
  writeHash128(buffer, 48, hashSection(directory))
  return buffer
}

function sectionBytes(source: Uint8Array, sectionType: number): Buffer {
  const buffer = Buffer.from(source.buffer, source.byteOffset, source.byteLength)
  const entryOffset = HEADER_LENGTH + (sectionType - 1) * DIRECTORY_ENTRY_LENGTH
  const offset = Number(buffer.readBigUInt64LE(entryOffset + 16))
  const length = Number(buffer.readBigUInt64LE(entryOffset + 24))
  return buffer.subarray(offset, offset + length)
}

function stringRecord(section: Buffer, value: string): { start: number; byteLength: number } {
  let offset = 0
  while (offset < section.length) {
    const byteLength = section.readUInt32LE(offset)
    const valueStart = offset + 4
    const valueEnd = valueStart + byteLength
    if (section.subarray(valueStart, valueEnd).toString("utf8") === value) return { start: offset, byteLength }
    offset = Math.ceil(valueEnd / 8) * 8
  }
  throw new Error(`Строка отсутствует в тестовой секции: ${value}`)
}

function flipStringPadding(section: Buffer, value: string): Buffer {
  const record = stringRecord(section, value)
  const valueEnd = record.start + 4 + record.byteLength
  const recordEnd = Math.ceil(valueEnd / 8) * 8
  if (recordEnd === valueEnd) throw new Error(`У строки ${value} нет padding`)
  return flipByte(section, valueEnd)
}

function writeStringByte(section: Buffer, value: string, byte: number): Buffer {
  const record = stringRecord(section, value)
  return writeU8(section, record.start + 4, byte)
}

function duplicateOrderProperty(section: Buffer): Buffer {
  return writeU32(section, 12, section.readUInt32LE(8))
}

function duplicateAliasName(section: Buffer): Buffer {
  return writeU32(section, 20, section.readUInt32LE(16))
}

function swapFirstRecordIds(section: Buffer): Buffer {
  const first = section.readUInt32LE(0)
  const second = section.readUInt32LE(section.length / 2)
  section.writeUInt32LE(second, 0)
  section.writeUInt32LE(first, section.length / 2)
  return section
}

function duplicateFirstRecordId(section: Buffer): Buffer {
  return writeU32(section, 0, section.readUInt32LE(section.length / 2))
}

function findStringId(source: Uint8Array, value: string): number {
  const strings = sectionBytes(source, 2)
  let offset = 0
  let id = 1
  while (offset < strings.length) {
    const byteLength = strings.readUInt32LE(offset)
    const valueStart = offset + 4
    const valueEnd = valueStart + byteLength
    if (strings.subarray(valueStart, valueEnd).toString("utf8") === value) return id
    offset = Math.ceil(valueEnd / 8) * 8
    id += 1
  }
  throw new Error(`Строка отсутствует в тестовой секции: ${value}`)
}

function expectCorruption(buffer: Uint8Array): void {
  expect(() => decodeConfigurationIndex(buffer)).toThrow("Некорректный файл индекса конфигурации")
}

function expectCorruptionMessage(buffer: Uint8Array, message: string): void {
  expect(() => decodeConfigurationIndex(buffer)).toThrow(message)
}

function flipByte(buffer: Buffer, offset: number): Buffer {
  buffer.writeUInt8(buffer.readUInt8(offset) ^ 1, offset)
  return buffer
}

function writeAscii(buffer: Buffer, value: string, offset: number): Buffer {
  buffer.write(value, offset, value.length, "ascii")
  return buffer
}

function writeU8(buffer: Buffer, offset: number, value: number): Buffer {
  buffer.writeUInt8(value, offset)
  return buffer
}

function writeU16(buffer: Buffer, offset: number, value: number): Buffer {
  buffer.writeUInt16LE(value, offset)
  return buffer
}

function writeU32(buffer: Buffer, offset: number, value: number): Buffer {
  buffer.writeUInt32LE(value, offset)
  return buffer
}

function writeU64(buffer: Buffer, offset: number, value: bigint): Buffer {
  buffer.writeBigUInt64LE(value, offset)
  return buffer
}
