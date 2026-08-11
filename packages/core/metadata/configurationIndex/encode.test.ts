import { describe, expect, it } from "vitest"
import { encodeConfigurationIndex } from "./encode"
import { hashSection } from "./hash"
import { reverseInputOrder, sampleSnapshot, TEST_UUID } from "./testData"
import type { ConfigurationSnapshot } from "./types"

const HEADER_LENGTH = 64
const DIRECTORY_ENTRY_LENGTH = 64
const SECTION_COUNT = 4
const DIRECTORY_LENGTH = DIRECTORY_ENTRY_LENGTH * SECTION_COUNT

describe("encodeConfigurationIndex", () => {
  it("пишет строгий контейнер 1.4 с четырьмя секциями", () => {
    const encoded = encodeConfigurationIndex(sampleSnapshot())

    expect(encoded.subarray(0, 8).toString("ascii")).toBe("NKDK1CIX")
    expect(encoded.readUInt16LE(8)).toBe(1)
    expect(encoded.readUInt16LE(10)).toBe(4)
    expect(encoded.readUInt32LE(12)).toBe(HEADER_LENGTH)
    expect([...encoded.subarray(16, 20)]).toEqual([1, 1, 1, 1])
    expect(encoded.readUInt32LE(20)).toBe(DIRECTORY_ENTRY_LENGTH)
    expect(encoded.readUInt32LE(24)).toBe(SECTION_COUNT)
    expectZero(encoded.subarray(28, 32))
    expect(encoded.readBigUInt64LE(32)).toBe(BigInt(HEADER_LENGTH))
    expect(encoded.readBigUInt64LE(40)).toBe(BigInt(encoded.length))

    const directory = encoded.subarray(HEADER_LENGTH, HEADER_LENGTH + DIRECTORY_LENGTH)
    const directoryHash = hashSection(directory)
    expect(encoded.readBigUInt64LE(48)).toBe(directoryHash.low)
    expect(encoded.readBigUInt64LE(56)).toBe(directoryHash.high)
  })

  it("нормализует порядок файлов и entity до построения пула строк", () => {
    const snapshot = sampleSnapshot()

    expect(encodeConfigurationIndex(snapshot)).toEqual(encodeConfigurationIndex(reverseInputOrder(snapshot)))
  })

  it("отклоняет одиночный суррогат до сортировки при любом top-level порядке", () => {
    const snapshot = sampleSnapshot()
    const invalid: ConfigurationSnapshot = {
      ...snapshot,
      entities: [{ ...snapshot.entities[0]!, logicalAddress: "\uD800" }, snapshot.entities[1]!],
    }

    expect(() => encodeConfigurationIndex(invalid)).toThrow("Некорректная Unicode-строка")
    expect(() => encodeConfigurationIndex(reverseInputOrder(invalid))).toThrow("Некорректная Unicode-строка")
  })

  it("проверяет двоичный UUID тем же Unicode-валидатором", () => {
    const snapshot = sampleSnapshot()
    const invalid: ConfigurationSnapshot = {
      ...snapshot,
      entities: [{ ...snapshot.entities[0]!, identities: { uuid: "\uD800" } }, snapshot.entities[1]!],
    }

    expect(() => encodeConfigurationIndex(invalid)).toThrow("Некорректная Unicode-строка")
  })

  it("пишет точную физическую раскладку SNAPSHOT, STRINGS, FILES и ENTITIES", () => {
    const encoded = encodeConfigurationIndex(sampleSnapshot())
    const entries = readDirectory(encoded)
    expect(entries.map((entry) => entry.count)).toEqual([1, 15, 2, 2])

    const strings = readStrings(entries[1]!.section, entries[1]!.count)
    expect(strings).toEqual([
      "cf",
      "Configuration.yaml",
      "Документы/Заказ.yaml",
      "Документ.Заказ",
      "Order",
      "",
      "Форма",
      "Макет",
      "xs:string",
      "текст",
      "xs",
      "Конфигурация",
      "Configuration",
      "Attribute",
      "Код",
    ])
    expect(strings).not.toContain(TEST_UUID)
    const stringId = (value: string): number => strings.indexOf(value) + 1

    const snapshot = entries[0]!.section
    expect(snapshot).toHaveLength(16)
    expect(snapshot.readBigUInt64LE(0)).toBe(7n)
    expect(snapshot.readUInt32LE(8)).toBe(stringId("cf"))
    expectZero(snapshot.subarray(12))

    const files = entries[2]!.section
    expect(files).toHaveLength(32)
    expect(files.readUInt32LE(0)).toBe(stringId("Configuration.yaml"))
    expect(files.readUInt32LE(4)).toBe(0)
    expect(files.readBigUInt64LE(8)).toBe(1n)
    expect(files.readUInt32LE(16)).toBe(stringId("Документы/Заказ.yaml"))
    expect(files.readUInt32LE(20)).toBe(0)
    expect(files.readBigUInt64LE(24)).toBe(2n)

    const entities = entries[3]!.section
    const firstLength = entities.readUInt32LE(0)
    expect(firstLength).toBe(64)
    expect(entities.readUInt32LE(4)).toBe(stringId("Документ.Заказ"))
    expect(entities.readUInt32LE(8)).toBe(stringId("Документы/Заказ.yaml"))
    expect(entities.readUInt32LE(12)).toBe(0x7ef)
    expect(entities.subarray(16, 32)).toEqual(Buffer.from(TEST_UUID.replaceAll("-", ""), "hex"))
    expect(entities.readUInt32LE(32)).toBe(stringId("Order"))
    expect(entities.readUInt32LE(36)).toBe(stringId(""))
    expect(entities.readUInt32LE(40)).toBe(2)
    expect(entities.readUInt32LE(44)).toBe(0)
    expect(entities.readUInt32LE(48)).toBe(stringId("Форма"))
    expect(entities.readUInt32LE(52)).toBe(stringId("Макет"))
    expect(entities.readUInt32LE(56)).toBe(stringId("xs:string"))
    expect(entities.readUInt32LE(60)).toBe(stringId("текст"))
    expect(entities.readUInt32LE(64)).toBe(stringId("xs"))
    expectZero(entities.subarray(68, 72))

    const secondOffset = 72
    expect(entities.readUInt32LE(secondOffset)).toBe(32)
    expect(entities.readUInt32LE(secondOffset + 4)).toBe(stringId("Конфигурация"))
    expect(entities.readUInt32LE(secondOffset + 8)).toBe(stringId("Configuration.yaml"))
    expect(entities.readUInt32LE(secondOffset + 12)).toBe((1 << 2) | (1 << 4))
    expect(entities.readUInt32LE(secondOffset + 16)).toBe(stringId("Configuration"))
    expect(entities.readUInt32LE(secondOffset + 20)).toBe(1)
    expect(entities.readUInt32LE(secondOffset + 24)).toBe(0)
    expect(entities.readUInt32LE(secondOffset + 28)).toBe(stringId("Attribute"))
    expect(entities.readUInt32LE(secondOffset + 32)).toBe(stringId("Код"))
    expectZero(entities.subarray(secondOffset + 36, secondOffset + 40))
    expect(entities).toHaveLength(112)
  })

  it.each([
    [
      "повторный projectPath",
      (snapshot: ConfigurationSnapshot) => ({ ...snapshot, files: [snapshot.files[0]!, snapshot.files[0]!] }),
      "Повторный projectPath",
    ],
    [
      "повторный logicalAddress",
      (snapshot: ConfigurationSnapshot) => ({
        ...snapshot,
        entities: [snapshot.entities[0]!, snapshot.entities[0]!],
      }),
      "Повторный logicalAddress",
    ],
    [
      "пустую entity",
      (snapshot: ConfigurationSnapshot) => ({
        ...snapshot,
        entities: [{ logicalAddress: "Пустая", sourceProjectPath: "Configuration.yaml" }],
      }),
      "Пустая entity",
    ],
    [
      "sourceProjectPath без файла",
      (snapshot: ConfigurationSnapshot) => ({
        ...snapshot,
        entities: [{ ...snapshot.entities[0]!, sourceProjectPath: "Нет.yaml" }],
      }),
      "отсутствует в FILES",
    ],
    [
      "недопустимый UUID",
      (snapshot: ConfigurationSnapshot) => ({
        ...snapshot,
        entities: [{ ...snapshot.entities[0]!, identities: { uuid: "not-a-uuid" } }],
      }),
      "Некорректный UUID",
    ],
    [
      "пустой omittedChildren names",
      (snapshot: ConfigurationSnapshot) => ({
        ...snapshot,
        entities: [{ ...snapshot.entities[0]!, omittedChildren: { kind: "names" as const, names: [] } }],
      }),
      "Пустой список omittedChildren",
    ],
    [
      "пустой omittedChildren typedNames",
      (snapshot: ConfigurationSnapshot) => ({
        ...snapshot,
        entities: [{ ...snapshot.entities[0]!, omittedChildren: { kind: "typedNames" as const, items: [] } }],
      }),
      "Пустой список omittedChildren",
    ],
  ] as const)("отклоняет %s", (_name, corrupt, message) => {
    expect(() => encodeConfigurationIndex(corrupt(sampleSnapshot()))).toThrow(message)
  })

  it.each(["/absolute.yaml", "../up.yaml", "dir/../../up.yaml", "C:/absolute.yaml"])(
    "отклоняет недопустимый projectPath %s",
    (projectPath) => {
      const snapshot = sampleSnapshot()
      expect(() =>
        encodeConfigurationIndex({
          ...snapshot,
          files: [{ projectPath, contentHash: 1n }],
          entities: [{ ...snapshot.entities[0]!, sourceProjectPath: projectPath }],
        })
      ).toThrow("Недопустимый projectPath")
    }
  )
})

interface TestDirectoryEntry {
  count: number
  section: Buffer
}

function readDirectory(encoded: Buffer): TestDirectoryEntry[] {
  const directory = encoded.subarray(HEADER_LENGTH, HEADER_LENGTH + DIRECTORY_LENGTH)
  return Array.from({ length: SECTION_COUNT }, (_, index) => {
    const offset = index * DIRECTORY_ENTRY_LENGTH
    const sectionOffset = Number(directory.readBigUInt64LE(offset + 16))
    const storedLength = Number(directory.readBigUInt64LE(offset + 24))
    const section = encoded.subarray(sectionOffset, sectionOffset + storedLength)
    const checksum = hashSection(section)

    expect(directory.readUInt32LE(offset)).toBe(index + 1)
    expect(directory.readUInt16LE(offset + 4)).toBe(1)
    expect(directory.readUInt16LE(offset + 6)).toBe(0)
    expect(directory.readUInt32LE(offset + 8)).toBe(1)
    expect(directory.readUInt32LE(offset + 12)).toBe(0)
    expect(sectionOffset % 8).toBe(0)
    expect(directory.readBigUInt64LE(offset + 32)).toBe(BigInt(storedLength))
    expect(directory.readBigUInt64LE(offset + 48)).toBe(checksum.low)
    expect(directory.readBigUInt64LE(offset + 56)).toBe(checksum.high)
    return { count: Number(directory.readBigUInt64LE(offset + 40)), section }
  })
}

function readStrings(section: Buffer, count: number): string[] {
  const result: string[] = []
  let offset = 0
  for (let index = 0; index < count; index += 1) {
    const byteLength = section.readUInt32LE(offset)
    result.push(section.subarray(offset + 4, offset + 4 + byteLength).toString("utf8"))
    offset = align8(offset + 4 + byteLength)
  }
  expect(offset).toBe(section.length)
  return result
}

function align8(value: number): number {
  return Math.ceil(value / 8) * 8
}

function expectZero(bytes: Uint8Array): void {
  expect([...bytes]).toEqual([...bytes].map(() => 0))
}
