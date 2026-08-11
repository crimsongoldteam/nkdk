import { describe, expect, it } from "vitest"
import { ConfigurationIndexCompatibilityError, decodeConfigurationIndex } from "./decode"
import { encodeConfigurationIndex } from "./encode"
import { hashSection, writeHash128 } from "./hash"
import { sampleSnapshot } from "./testData"
import type { ConfigurationSnapshot } from "./types"

const HEADER_LENGTH = 64
const DIRECTORY_ENTRY_LENGTH = 64
const SECTION_COUNT = 4
const DIRECTORY_LENGTH = DIRECTORY_ENTRY_LENGTH * SECTION_COUNT

describe("decodeConfigurationIndex", () => {
  it("полностью декодирует снимок 1.4 и нормализованный порядок", () => {
    const source = sampleSnapshot()

    expect(
      decodeConfigurationIndex(encodeConfigurationIndex(source), {
        expectedComponentPath: "cf",
      })
    ).toEqual(normalized(source))
  })

  it("сохраняет пустой xmlName через ненулевой stringId", () => {
    const decoded = decodeConfigurationIndex(encodeConfigurationIndex(sampleSnapshot()))

    expect(decoded.entities[0]!.identities).toMatchObject({ xmlName: "" })
  })

  it("сохраняет начальный U+FEFF в строковом значении", () => {
    const source = sampleSnapshot()
    const encoded = encodeConfigurationIndex({
      ...source,
      entities: source.entities.map((entity) =>
        entity.logicalAddress === "Документ.Заказ"
          ? { ...entity, xml: { ...entity.xml, xmlText: "\uFEFFтекст" } }
          : entity
      ),
    })

    expect(decodeConfigurationIndex(encoded).entities[0]!.xml?.xmlText).toBe("\uFEFFтекст")
  })

  it.each([
    ["magic", (buffer: Buffer) => writeAscii(buffer, "BROKEN!!", 0)],
    ["header length", (buffer: Buffer) => writeU32(buffer, 12, 63)],
    ["byte order", (buffer: Buffer) => writeU8(buffer, 16, 2)],
    ["string encoding", (buffer: Buffer) => writeU8(buffer, 17, 2)],
    ["checksum algorithm", (buffer: Buffer) => writeU8(buffer, 18, 2)],
    ["file hash algorithm", (buffer: Buffer) => writeU8(buffer, 19, 2)],
    ["directory entry length", (buffer: Buffer) => writeU32(buffer, 20, 63)],
    ["section count", (buffer: Buffer) => writeU32(buffer, 24, 12)],
    ["header reserved", (buffer: Buffer) => writeU32(buffer, 28, 1)],
    ["directory offset", (buffer: Buffer) => writeU64(buffer, 32, 63n)],
    ["file length", (buffer: Buffer) => writeU64(buffer, 40, BigInt(buffer.length - 1))],
  ] as const)("отклоняет повреждённый заголовок: %s", (_name, mutate) => {
    expectCorruption(mutate(Buffer.from(encodeConfigurationIndex(sampleSnapshot()))))
  })

  it("отделяет старую версию 2.0 от повреждения файла", () => {
    const old20Header = Buffer.alloc(HEADER_LENGTH)
    old20Header.write("NKDK1CIX", 0, "ascii")
    old20Header.writeUInt16LE(2, 8)
    old20Header.writeUInt16LE(0, 10)

    expect(() => decodeConfigurationIndex(old20Header)).toThrowError(ConfigurationIndexCompatibilityError)
    expect(() => decodeConfigurationIndex(old20Header)).toThrow("требуется повторный import")
  })

  it.each([
    ["catalog checksum", (buffer: Buffer) => flipByte(buffer, HEADER_LENGTH)],
    ["section checksum", (buffer: Buffer) => flipByte(buffer, sectionOffset(buffer, 2) + 4)],
  ] as const)("отклоняет неверный %s", (_name, mutate) => {
    expectCorruption(mutate(Buffer.from(encodeConfigurationIndex(sampleSnapshot()))))
  })

  it.each([
    ["unsorted section types", (directory: Buffer) => writeU32(directory, DIRECTORY_ENTRY_LENGTH, 1)],
    ["section reserved", (directory: Buffer) => writeU32(directory, 12, 1)],
    ["logical length", (directory: Buffer) => writeU64(directory, 32, 1n)],
    ["missing mandatory flag", (directory: Buffer) => writeU32(directory, 8, 0)],
  ] as const)("отклоняет повреждённый каталог: %s", (_name, mutate) => {
    expectCorruption(mutateDirectory(encodeConfigurationIndex(sampleSnapshot()), mutate))
  })

  it.each([
    ["section version", (directory: Buffer) => writeU16(directory, 4, 2)],
    ["unknown section flag", (directory: Buffer) => writeU32(directory, 8, 3)],
  ] as const)("отделяет несовместимый каталог: %s", (_name, mutate) => {
    const corrupted = mutateDirectory(encodeConfigurationIndex(sampleSnapshot()), mutate)
    expect(() => decodeConfigurationIndex(corrupted)).toThrowError(ConfigurationIndexCompatibilityError)
  })

  it.each([
    ["unaligned section offset", (directory: Buffer) => writeU64(directory, 16, 319n)],
    ["overlapping section offset", (directory: Buffer) => writeU64(directory, DIRECTORY_ENTRY_LENGTH + 16, 320n)],
    [
      "unsafe section length",
      (directory: Buffer) => {
        const entry = (SECTION_COUNT - 1) * DIRECTORY_ENTRY_LENGTH
        writeU64(directory, entry + 24, (1n << 64n) - 1n)
        return writeU64(directory, entry + 32, (1n << 64n) - 1n)
      },
    ],
    ["non-zero placement padding", (directory: Buffer) => writeU64(directory, 16, 328n)],
  ] as const)("отклоняет повреждённое размещение: %s", (_name, mutate) => {
    expectCorruption(mutateDirectory(encodeConfigurationIndex(sampleSnapshot()), mutate))
  })

  it("отклоняет байты после последней секции", () => {
    const corrupted = Buffer.concat([encodeConfigurationIndex(sampleSnapshot()), Buffer.of(0)])
    corrupted.writeBigUInt64LE(BigInt(corrupted.length), 40)

    expectCorruptionMessage(corrupted, "байты после последней секции")
  })

  it.each([
    ["invalid UTF-8", (section: Buffer) => writeU8(section, 4, 0xff)],
    ["U+0000", (section: Buffer) => writeU8(section, 4, 0)],
    ["padding STRINGS", (section: Buffer) => writeU8(section, 6, 1)],
  ] as const)("отклоняет повреждённый STRINGS: %s", (_name, mutate) => {
    expectCorruption(mutateSection(encodeConfigurationIndex(sampleSnapshot()), 2, mutate))
  })

  it("отклоняет повторную строку STRINGS", () => {
    const corrupted = mutateSection(encodeConfigurationIndex(sampleSnapshot()), 2, (section) => {
      const xsOffset = findStringRecord(section, "xs")
      section.write("cf", xsOffset + 4, "utf8")
      return section
    })

    expectCorruptionMessage(corrupted, "строки STRINGS повторяются")
  })

  it.each([
    ["SNAPSHOT reserved", 1, (section: Buffer) => writeU32(section, 12, 1)],
    ["FILES reserved", 3, (section: Buffer) => writeU32(section, 4, 1)],
    ["ENTITIES omitted reserved", 4, (section: Buffer) => writeU32(section, 44, 1)],
    ["ENTITIES padding", 4, (section: Buffer) => writeU8(section, 68, 1)],
  ] as const)("отклоняет ненулевой %s после проверки хэшей", (_name, type, mutate) => {
    expectCorruption(mutateSection(encodeConfigurationIndex(sampleSnapshot()), type, mutate))
  })

  it.each([
    ["zero indexGeneration", 1, (section: Buffer) => writeU64(section, 0, 0n)],
    ["zero componentPath stringId", 1, (section: Buffer) => writeU32(section, 8, 0)],
    ["zero projectPath stringId", 3, (section: Buffer) => writeU32(section, 0, 0)],
    ["zero entity logicalAddress stringId", 4, (section: Buffer) => writeU32(section, 4, 0)],
    ["unknown entity bit", 4, (section: Buffer) => writeU32(section, 12, section.readUInt32LE(12) | (1 << 12))],
    [
      "conflicting omitted variants",
      4,
      (section: Buffer) => writeU32(section, 12, section.readUInt32LE(12) | (1 << 4)),
    ],
    ["empty entity fieldMask", 4, (section: Buffer) => writeU32(section, 12, 0)],
    ["zero omittedCount", 4, (section: Buffer) => writeU32(section, 40, 0)],
    ["short entity byteLength", 4, (section: Buffer) => writeU32(section, 0, 8)],
    ["long entity byteLength", 4, (section: Buffer) => writeU32(section, 0, 72)],
  ] as const)("отклоняет повреждённую логическую запись: %s", (_name, type, mutate) => {
    expectCorruption(mutateSection(encodeConfigurationIndex(sampleSnapshot()), type, mutate))
  })

  it.each([
    [1, 0n, "SNAPSHOT"],
    [2, 100n, "STRINGS"],
    [3, 1n, "FILES"],
    [4, 1n, "ENTITIES"],
  ] as const)("отклоняет recordCount секции %s, не совпадающий с байтами", (type, count, label) => {
    const corrupted = mutateDirectory(encodeConfigurationIndex(sampleSnapshot()), (directory) =>
      writeU64(directory, (type - 1) * DIRECTORY_ENTRY_LENGTH + 40, count)
    )

    expectCorruptionMessage(corrupted, label)
  })

  it("отклоняет повторный logicalAddress после разбора всех записей", () => {
    const corrupted = mutateSection(encodeConfigurationIndex(sampleSnapshot()), 4, (section) => {
      section.writeUInt32LE(section.readUInt32LE(4), 72 + 4)
      return section
    })

    expectCorruptionMessage(corrupted, "Повторный logicalAddress")
  })

  it("отклоняет sourceProjectPath entity, отсутствующий в FILES", () => {
    const corrupted = mutateSection(encodeConfigurationIndex(sampleSnapshot()), 4, (section) => writeU32(section, 8, 1))

    expectCorruptionMessage(corrupted, "sourceProjectPath ENTITIES отсутствует в FILES")
  })

  it("отклоняет строки без ссылок", () => {
    const corrupted = mutateSection(encodeConfigurationIndex(sampleSnapshot()), 4, (section) =>
      writeU32(section, 64, 9)
    )

    expectCorruptionMessage(corrupted, "STRINGS содержит строки без ссылок")
  })

  it("проверяет хэш секции до разбора UTF-8", () => {
    const corrupted = Buffer.from(encodeConfigurationIndex(sampleSnapshot()))
    writeU8(corrupted, sectionOffset(corrupted, 2) + 4, 0xff)

    expectCorruptionMessage(corrupted, "контрольная сумма секции 2")
  })

  it("отделяет несовпадающий componentPath от повреждения", () => {
    expect(() =>
      decodeConfigurationIndex(encodeConfigurationIndex(sampleSnapshot()), {
        expectedComponentPath: "cfe",
      })
    ).toThrowError(ConfigurationIndexCompatibilityError)
  })
})

function normalized(snapshot: ConfigurationSnapshot): ConfigurationSnapshot {
  return {
    ...snapshot,
    files: [...snapshot.files].sort((left, right) => compareUtf8(left.projectPath, right.projectPath)),
    entities: [...snapshot.entities].sort((left, right) => compareUtf8(left.logicalAddress, right.logicalAddress)),
  }
}

function compareUtf8(left: string, right: string): number {
  return Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"))
}

function mutateDirectory(encoded: Uint8Array, mutate: (directory: Buffer) => Buffer): Buffer {
  const result = Buffer.from(encoded)
  const directory = result.subarray(HEADER_LENGTH, HEADER_LENGTH + DIRECTORY_LENGTH)
  mutate(directory)
  writeHash128(result, 48, hashSection(directory))
  return result
}

function mutateSection(encoded: Uint8Array, type: number, mutate: (section: Buffer) => Buffer): Buffer {
  const result = Buffer.from(encoded)
  const entryOffset = HEADER_LENGTH + (type - 1) * DIRECTORY_ENTRY_LENGTH
  const offset = Number(result.readBigUInt64LE(entryOffset + 16))
  const length = Number(result.readBigUInt64LE(entryOffset + 24))
  const section = result.subarray(offset, offset + length)
  mutate(section)
  writeHash128(result, entryOffset + 48, hashSection(section))
  const directory = result.subarray(HEADER_LENGTH, HEADER_LENGTH + DIRECTORY_LENGTH)
  writeHash128(result, 48, hashSection(directory))
  return result
}

function sectionOffset(buffer: Buffer, type: number): number {
  return Number(buffer.readBigUInt64LE(HEADER_LENGTH + (type - 1) * DIRECTORY_ENTRY_LENGTH + 16))
}

function findStringRecord(section: Buffer, expected: string): number {
  let offset = 0
  while (offset < section.length) {
    const byteLength = section.readUInt32LE(offset)
    if (section.subarray(offset + 4, offset + 4 + byteLength).toString("utf8") === expected) return offset
    offset = align8(offset + 4 + byteLength)
  }
  throw new Error(`Строка не найдена: ${expected}`)
}

function align8(value: number): number {
  return Math.ceil(value / 8) * 8
}

function expectCorruption(buffer: Uint8Array): void {
  expect(() => decodeConfigurationIndex(buffer)).toThrow("Некорректный файл индекса конфигурации")
}

function expectCorruptionMessage(buffer: Uint8Array, message: string): void {
  expect(() => decodeConfigurationIndex(buffer)).toThrow(message)
}

function flipByte(buffer: Buffer, offset: number): Buffer {
  buffer[offset] = buffer[offset]! ^ 1
  return buffer
}

function writeAscii(buffer: Buffer, value: string, offset: number): Buffer {
  buffer.write(value, offset, "ascii")
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
