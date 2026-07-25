import { describe, expect, it } from "vitest"
import { encodeConfigurationIndex } from "./encode"
import { hashSection } from "./hash"
import { sampleIndex } from "./testData"
import type { ConfigurationIndexData } from "./types"

const baseline = sampleIndex()
const sample: ConfigurationIndexData = {
  ...baseline,
  binding: {
    ...baseline.binding,
    producerVersion: "0.0.3",
  },
  projectFiles: [...baseline.projectFiles, { projectPath: "A.yaml", contentHash: 2n }],
  identities: [
    ...baseline.identities,
    {
      logicalAddress: "Документ.Заказ",
      kind: "xmlId",
      value: "Order",
    },
  ],
  xmlNodes: [
    ...baseline.xmlNodes,
    {
      logicalAddress: "Документ.Заказ",
      order: ["name"],
      present: ["name"],
    },
  ],
  xmlValues: [
    ...baseline.xmlValues,
    {
      logicalAddress: "Документ.Заказ.name",
      xsiNil: true,
      xsiType: "v8:Null",
    },
  ],
}

describe("encodeConfigurationIndex", () => {
  it("пишет Extended в свободный бит XML_VALUES без изменения размера записи", () => {
    const encoded = encodeConfigurationIndex({
      ...baseline,
      xmlValues: [{ logicalAddress: "Справочник.Товары.form", extended: true }],
    })
    const directoryEntryOffset = 64 + 6 * 64
    const sectionOffset = Number(encoded.readBigUInt64LE(directoryEntryOffset + 16))
    const sectionLength = Number(encoded.readBigUInt64LE(directoryEntryOffset + 24))
    const values = encoded.subarray(sectionOffset, sectionOffset + sectionLength)

    expect(values).toHaveLength(32)
    expect(values.readUInt32LE(4)).toBe(1 << 6)
  })

  it("writes incompatible 2.0 container with eleven mandatory sections", () => {
    const first = encodeConfigurationIndex(sample)

    expect(first.subarray(0, 8).toString("ascii")).toBe("NKDK1CIX")
    expect(first.readUInt16LE(8)).toBe(2)
    expect(first.readUInt16LE(10)).toBe(0)
    expect(first.readUInt32LE(24)).toBe(11)
    expect(first.readBigUInt64LE(40)).toBe(BigInt(first.length))
  })

  it("writes exact layouts and checksums for all eleven sections", () => {
    const encoded = encodeConfigurationIndex(sample)
    const directory = encoded.subarray(64, 768)
    const directoryHash = hashSection(directory)

    expect(encoded.readUInt32LE(12)).toBe(64)
    expect([...encoded.subarray(16, 20)]).toEqual([1, 1, 1, 1])
    expect(encoded.readUInt32LE(20)).toBe(64)
    expectZero(encoded.subarray(28, 32))
    expect(encoded.readBigUInt64LE(32)).toBe(64n)
    expect(encoded.readBigUInt64LE(48)).toBe(directoryHash.low)
    expect(encoded.readBigUInt64LE(56)).toBe(directoryHash.high)

    const entries = Array.from({ length: 11 }, (_, index) => {
      const offset = index * 64
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

      return {
        offset: sectionOffset,
        length: storedLength,
        count: Number(directory.readBigUInt64LE(offset + 40)),
        section,
      }
    })

    let previousEnd = 768
    for (const entry of entries) {
      expect(entry.offset).toBeGreaterThanOrEqual(previousEnd)
      expectZero(encoded.subarray(previousEnd, entry.offset))
      previousEnd = entry.offset + entry.length
    }
    expect(previousEnd).toBe(encoded.length)

    const strings = readStrings(entries[1].section, entries[1].count)
    const expectedStrings = [
      "0.0.3",
      "cf",
      "Конфигурация.yaml",
      "A.yaml",
      "Справочник.Товары",
      "Документ.Заказ",
      "Order",
      "name",
      "synonym",
      "Synonym",
      "Справочник.Товары.synonym",
      "",
      "Документ.Заказ.name",
      "v8:Null",
    ]
    expect(strings).toEqual(expectedStrings)
    const stringIds = new Map(strings.map((value, index) => [value, index + 1]))
    const stringId = (value: string): number => {
      const id = stringIds.get(value)
      if (id === undefined) throw new Error(`Нет строки в тестовом пуле: ${value}`)
      return id
    }

    expect(entries.map((entry) => entry.count)).toEqual([1, strings.length, 2, 2, 2, 2, 2, 1, 1, 1, 1])

    const binding = entries[0].section
    expect(binding.length).toBe(64)
    expect(binding.readBigUInt64LE(0)).toBe(1n)
    expect(binding.readUInt32LE(8)).toBe(stringId("0.0.3"))
    expect(binding.readUInt32LE(12)).toBe(stringId("cf"))
    expect(binding.readUInt32LE(16)).toBe(0)
    expect(binding.readUInt32LE(20)).toBe(0)
    expectZero(binding.subarray(24))

    const projectFiles = entries[2].section
    expect(projectFiles.length).toBe(32)
    expect(projectFiles.readUInt32LE(0)).toBe(stringId("Конфигурация.yaml"))
    expect(projectFiles.readUInt32LE(4)).toBe(0)
    expect(projectFiles.readBigUInt64LE(8)).toBe(1n)
    expect(projectFiles.readUInt32LE(16)).toBe(stringId("A.yaml"))
    expect(projectFiles.readUInt32LE(20)).toBe(0)
    expect(projectFiles.readBigUInt64LE(24)).toBe(2n)

    const identities = entries[3].section
    expect(identities.length).toBe(64)
    expect(identities.readUInt32LE(0)).toBe(stringId("Справочник.Товары"))
    expect(identities.readUInt16LE(4)).toBe(1)
    expectZero(identities.subarray(6, 16))
    expect(identities.subarray(16, 32)).toEqual(Buffer.from("00000000000040008000000000000001", "hex"))
    expect(identities.readUInt32LE(32)).toBe(stringId("Документ.Заказ"))
    expect(identities.readUInt16LE(36)).toBe(2)
    expect(identities.readUInt16LE(38)).toBe(0)
    expect(identities.readUInt32LE(40)).toBe(stringId("Order"))
    expectZero(identities.subarray(44, 64))

    const orders = entries[4].section
    expect(orders.length).toBe(32)
    expect(orders.readUInt32LE(0)).toBe(2)
    expect(orders.readUInt32LE(4)).toBe(0)
    expect(orders.readUInt32LE(8)).toBe(stringId("name"))
    expect(orders.readUInt32LE(12)).toBe(stringId("synonym"))
    expect(orders.readUInt32LE(16)).toBe(1)
    expect(orders.readUInt32LE(20)).toBe(0)
    expect(orders.readUInt32LE(24)).toBe(stringId("name"))
    expectZero(orders.subarray(28, 32))

    const nodes = entries[5].section
    expect(nodes.length).toBe(56)
    expect(nodes.readUInt32LE(0)).toBe(stringId("Справочник.Товары"))
    expect(nodes.readUInt32LE(4)).toBe(1)
    expect(nodes.readUInt32LE(8)).toBe(1)
    expect(nodes.readUInt32LE(12)).toBe(1)
    expect(nodes.readUInt32LE(16)).toBe(stringId("synonym"))
    expect(nodes.readUInt32LE(20)).toBe(stringId("Synonym"))
    expect(nodes.readUInt32LE(24)).toBe(stringId("name"))
    expectZero(nodes.subarray(28, 32))
    expect(nodes.readUInt32LE(32)).toBe(stringId("Документ.Заказ"))
    expect(nodes.readUInt32LE(36)).toBe(2)
    expect(nodes.readUInt32LE(40)).toBe(0)
    expect(nodes.readUInt32LE(44)).toBe(1)
    expect(nodes.readUInt32LE(48)).toBe(stringId("name"))
    expectZero(nodes.subarray(52, 56))

    const values = entries[6].section
    expect(values.length).toBe(64)
    expect(values.readUInt32LE(0)).toBe(stringId("Справочник.Товары.synonym"))
    expect(values.readUInt32LE(4)).toBe((1 << 1) | (1 << 3))
    expect(values.readUInt32LE(12)).toBe(stringId(""))
    expectZero(values.subarray(8, 12))
    expectZero(values.subarray(16, 32))
    expect(values.readUInt32LE(32)).toBe(stringId("Документ.Заказ.name"))
    expect(values.readUInt32LE(36)).toBe((1 << 0) | (1 << 2))
    expect(values.readUInt32LE(40)).toBe(stringId("v8:Null"))
    expectZero(values.subarray(48, 64))

    expect(entries[7].section).toEqual(Buffer.from(sample.localIndexes.metadata.reference))
    expect(entries[8].section).toEqual(Buffer.from(sample.localIndexes.metadata.ownerStrings))
    expect(entries[9].section).toEqual(Buffer.from(sample.localIndexes.metadata.ownerTable))
    expect(JSON.parse(entries[10].section.subarray(4, 4 + entries[10].section.readUInt32LE(0)).toString("utf8"))).toEqual(
      sample.localIndexes.dependencies[0]
    )
  })

  it("rejects half-filled binding and duplicate records", () => {
    expect(() =>
      encodeConfigurationIndex({
        ...sample,
        binding: { ...sample.binding, baseFingerprint: Uint8Array.of(1) },
      })
    ).toThrow("baseFingerprint и configurationVersion")

    expect(() =>
      encodeConfigurationIndex({
        ...sample,
        projectFiles: [sample.projectFiles[0], sample.projectFiles[0]],
      })
    ).toThrow("Повторный путь PROJECT_FILES")
  })

  it("rejects invalid logical records", () => {
    expect(() =>
      encodeConfigurationIndex({
        ...sample,
        identities: [sample.identities[0], sample.identities[0]],
      })
    ).toThrow("logicalAddress + identityKind")
    expect(() =>
      encodeConfigurationIndex({
        ...sample,
        xmlNodes: [sample.xmlNodes[0], sample.xmlNodes[0]],
      })
    ).toThrow("Повторный logicalAddress в XML_NODES")
    expect(() =>
      encodeConfigurationIndex({
        ...sample,
        xmlValues: [sample.xmlValues[0], sample.xmlValues[0]],
      })
    ).toThrow("Повторный logicalAddress в XML_VALUES")
    expect(() =>
      encodeConfigurationIndex({
        ...sample,
        xmlNodes: [{ logicalAddress: "Документ.Заказ", order: [] }],
      })
    ).toThrow("Пустой порядок XML_ORDERS")
    expect(() =>
      encodeConfigurationIndex({
        ...sample,
        xmlNodes: [{ logicalAddress: "Документ.Заказ", order: ["name", "name"] }],
      })
    ).toThrow("Повторный ключ в XML_ORDERS")
    expect(() =>
      encodeConfigurationIndex({
        ...sample,
        identities: [
          {
            logicalAddress: "Справочник.Товары",
            kind: "uuid",
            value: "invalid",
          },
        ],
      })
    ).toThrow("Некорректный UUID")
    expect(() =>
      encodeConfigurationIndex({
        ...sample,
        identities: [{ logicalAddress: "Документ.Заказ", kind: "xmlId", value: "" }],
      })
    ).toThrow("Пустая строка в IDENTITIES")
    expect(() =>
      encodeConfigurationIndex({
        ...sample,
        xmlNodes: [{ logicalAddress: "Документ.Заказ" }],
      })
    ).toThrow("Пустая запись XML_NODES")
    expect(() =>
      encodeConfigurationIndex({
        ...sample,
        xmlValues: [{ logicalAddress: "Документ.Заказ.name" }],
      })
    ).toThrow("Запись XML_VALUES без флагов")
  })

  it("rejects absolute local dependency paths", () => {
    expect(() =>
      encodeConfigurationIndex({
        ...sample,
        localIndexes: {
          ...sample.localIndexes,
          dependencies: [
            {
              ...sample.localIndexes.dependencies[0]!,
              sourceProjectPath: "/tmp/Свойства.yaml",
            },
          ],
        },
      })
    ).toThrow("Недопустимый sourceProjectPath LOCAL_DEPENDENCIES")
  })

  it("sorts local dependencies deterministically and rejects duplicates", () => {
    const first = sample.localIndexes.dependencies[0]!
    const second = {
      ...first,
      sourceProjectPath: "A.yaml",
      canonical: "Document.Заказ",
    }

    expect(
      encodeConfigurationIndex({
        ...sample,
        localIndexes: { ...sample.localIndexes, dependencies: [first, second] },
      })
    ).toEqual(
      encodeConfigurationIndex({
        ...sample,
        localIndexes: { ...sample.localIndexes, dependencies: [second, first] },
      })
    )
    expect(() =>
      encodeConfigurationIndex({
        ...sample,
        localIndexes: { ...sample.localIndexes, dependencies: [first, first] },
      })
    ).toThrow("Повторная локальная зависимость")
  })

  it("rejects a local dependency from outside PROJECT_FILES", () => {
    expect(() =>
      encodeConfigurationIndex({
        ...sample,
        localIndexes: {
          ...sample.localIndexes,
          dependencies: [
            {
              ...sample.localIndexes.dependencies[0]!,
              sourceProjectPath: "Чужой/Свойства.yaml",
            },
          ],
        },
      })
    ).toThrow("sourceProjectPath LOCAL_DEPENDENCIES отсутствует в PROJECT_FILES")
  })
})

function readStrings(section: Buffer, count: number): string[] {
  const result: string[] = []
  let offset = 0
  for (let index = 0; index < count; index += 1) {
    const recordStart = offset
    const byteLength = section.readUInt32LE(recordStart)
    const valueEnd = recordStart + 4 + byteLength
    result.push(section.subarray(recordStart + 4, valueEnd).toString("utf8"))
    offset = Math.ceil(valueEnd / 8) * 8
    expectZero(section.subarray(valueEnd, offset))
  }
  expect(offset).toBe(section.length)
  return result
}

function expectZero(bytes: Uint8Array): void {
  expect(bytes.every((byte) => byte === 0)).toBe(true)
}
