import { describe, expect, it } from "vitest"
import {
  decodeBlockV1,
  decodeContentHash,
  decodePendingValue,
  encodeBlockV1,
  encodeContentHash,
  encodePendingDelete,
  encodePendingPut,
} from "./blockCodec"
import type { ConfigurationIndexBlockEntity } from "./types"

const UUID = "6f9619ff-8b86-d011-b42d-00c04fc964ff"

describe("configuration index block codec", () => {
  it.each([
    { name: "uuid", entity: { logicalAddress: "Документ.Заказ", uuid: UUID } },
    { name: "xmlId", entity: { logicalAddress: "Форма.Элемент.Таблица", xmlId: "1" } },
    {
      name: "children",
      entity: {
        logicalAddress: "Конфигурация.Свойство.ДочерниеОбъекты",
        children: [{ xmlName: "Document", name: "Заказ" }],
      },
    },
  ] satisfies readonly { name: string; entity: ConfigurationIndexBlockEntity }[])(
    "round-trips $name",
    ({ entity }) => {
      expect(decodeBlockV1(encodeBlockV1({ entities: [entity] }))).toEqual({
        entities: [entity],
      })
    },
  )

  it("encodes entities deterministically by UTF-8 address", () => {
    const first = { logicalAddress: "Я", xmlId: "2" }
    const second = { logicalAddress: "А", xmlId: "1" }

    expect(encodeBlockV1({ entities: [first, second] })).toEqual(
      encodeBlockV1({ entities: [second, first] }),
    )
  })

  it("stores UUID as exactly 16 bytes", () => {
    const address = "A"
    const bytes = encodeBlockV1({ entities: [{ logicalAddress: address, uuid: UUID }] })

    expect(bytes.byteLength).toBe(4 + 4 + Buffer.byteLength(address) + 1 + 16)
  })

  it("round-trips an unsigned 64-bit hash in little-endian form", () => {
    const bytes = encodeContentHash(0x0102030405060708n)

    expect([...bytes]).toEqual([8, 7, 6, 5, 4, 3, 2, 1])
    expect(decodeContentHash(bytes)).toBe(0x0102030405060708n)
  })

  it.each([
    { name: "empty address", block: { entities: [{ logicalAddress: "", uuid: UUID }] } },
    { name: "empty entity", block: { entities: [{ logicalAddress: "A" }] } },
    { name: "empty xmlId", block: { entities: [{ logicalAddress: "A", xmlId: "" }] } },
    { name: "empty children", block: { entities: [{ logicalAddress: "A", children: [] }] } },
    {
      name: "empty child field",
      block: { entities: [{ logicalAddress: "A", children: [{ xmlName: "", name: "Заказ" }] }] },
    },
    {
      name: "duplicate address",
      block: { entities: [{ logicalAddress: "A", uuid: UUID }, { logicalAddress: "A", xmlId: "1" }] },
    },
  ])("rejects $name", ({ block }) => {
    expect(() => encodeBlockV1(block as never)).toThrow()
  })

  it.each([
    { name: "truncated value", mutate: (bytes: Uint8Array) => bytes.subarray(0, bytes.byteLength - 1) },
    {
      name: "reserved flags",
      mutate: (bytes: Uint8Array) => {
        const copy = bytes.slice()
        copy[9] = 8
        return copy
      },
    },
    {
      name: "trailing byte",
      mutate: (bytes: Uint8Array) => Uint8Array.from([...bytes, 0]),
    },
    {
      name: "invalid UTF-8",
      mutate: (bytes: Uint8Array) => {
        const copy = bytes.slice()
        copy[8] = 0xff
        return copy
      },
    },
  ])("rejects $name while decoding", ({ mutate }) => {
    const encoded = encodeBlockV1({ entities: [{ logicalAddress: "A", xmlId: "1" }] })
    expect(() => decodeBlockV1(mutate(encoded))).toThrow()
  })

  it("encodes pending put and tombstone as distinct values", () => {
    const payload = Uint8Array.of(4, 5)

    expect(decodePendingValue(encodePendingPut(payload))).toEqual({ kind: "put", value: payload })
    expect(decodePendingValue(encodePendingDelete())).toEqual({ kind: "delete" })
    expect(() => decodePendingValue(Uint8Array.of(0, 1))).toThrow()
  })
})
