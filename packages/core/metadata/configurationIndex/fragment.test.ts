import { describe, expect, it } from "vitest"
import {
  decodeConfigurationIndexFragments,
  encodeConfigurationIndexFragments,
  mergeConfigurationIndexFragments,
} from "./fragment"
import { entity, fragment } from "./testData"

describe("configuration snapshot worker fragments", () => {
  it("сохраняет целую entity в конверте версии 3", () => {
    const value = fragment("Справочники/Товары.yaml", {
      ...entity("Справочник.Товары", "Справочники/Товары.yaml"),
      identities: { uuid: "00000000-0000-4000-8000-000000000001", xmlName: "" },
      omittedChildren: { kind: "typedNames", items: [{ xmlName: "Attribute", name: "Код" }] },
      xml: { extended: true, xsiType: "xs:string", xmlText: "", xmlPrefix: "xs" },
    })

    expect(decodeConfigurationIndexFragments(encodeConfigurationIndexFragments([value]))).toEqual([value])
  })

  it("объединяет фрагменты независимо от порядка worker", () => {
    const left = encodeConfigurationIndexFragments([fragment("Б.yaml", entity("Б", "Б.yaml"))])
    const right = encodeConfigurationIndexFragments([fragment("А.yaml", entity("А", "А.yaml"))])

    expect(mergeConfigurationIndexFragments([left, right])).toEqual(mergeConfigurationIndexFragments([right, left]))
    expect(mergeConfigurationIndexFragments([left, right]).sourceProjectPaths).toEqual(["А.yaml", "Б.yaml"])
  })

  it("объединяет одинаковые повторные наблюдения", () => {
    const item = fragment("А.yaml", { ...entity("Объект", "А.yaml"), xml: { explicitEmpty: true } })
    const encoded = encodeConfigurationIndexFragments([item])

    expect(mergeConfigurationIndexFragments([encoded, encoded])).toEqual({
      sourceProjectPaths: ["А.yaml"],
      entities: [item.entities[0]],
    })
  })

  it("отклоняет один logicalAddress из разных файлов", () => {
    const left = encodeConfigurationIndexFragments([fragment("А.yaml", entity("Объект", "А.yaml"))])
    const right = encodeConfigurationIndexFragments([fragment("Б.yaml", entity("Объект", "Б.yaml"))])

    expect(() => mergeConfigurationIndexFragments([left, right])).toThrow("разные sourceProjectPath")
  })

  it("отклоняет конфликт содержимого одной entity", () => {
    const left = encodeConfigurationIndexFragments([
      fragment("А.yaml", { ...entity("Объект", "А.yaml"), identities: { xmlId: "one" } }),
    ])
    const right = encodeConfigurationIndexFragments([
      fragment("А.yaml", { ...entity("Объект", "А.yaml"), identities: { xmlId: "two" } }),
    ])

    expect(() => mergeConfigurationIndexFragments([left, right])).toThrow("Конфликт logicalAddress Объект")
  })

  it("обрабатывает пустой фрагмент", () => {
    const encoded = encodeConfigurationIndexFragments([fragment("Пустой.yaml")])

    expect(mergeConfigurationIndexFragments([encoded])).toEqual({ sourceProjectPaths: [], entities: [] })
  })

  it("отклоняет пустые entity, неизвестные поля и несовпадающий путь", () => {
    const encoded = encodeConfigurationIndexFragments([fragment("А.yaml", entity("Объект", "А.yaml"))])
    const envelope = JSON.parse(new TextDecoder().decode(encoded)) as {
      magic: string
      fragments: Array<{ entities: Array<Record<string, unknown>> }>
      strings: string[]
    }
    const item = envelope.fragments[0]!.entities[0]!

    delete item.identities
    expect(() => decodeConfigurationIndexFragments(encodeEnvelope(envelope))).toThrow("пустая entity")

    envelope.fragments[0]!.entities[0] = { ...item, xml: { explicitEmpty: true }, extra: true }
    expect(() => decodeConfigurationIndexFragments(encodeEnvelope(envelope))).toThrow("неизвестное поле")

    const sourceProjectPathStringId = envelope.strings.push("Б.yaml") - 1
    envelope.fragments[0]!.entities[0] = {
      ...item,
      xml: { explicitEmpty: true },
      sourceProjectPathStringId,
    }
    expect(() => decodeConfigurationIndexFragments(encodeEnvelope(envelope))).toThrow("sourceProjectPath")
  })
})

function encodeEnvelope(envelope: unknown): ArrayBuffer {
  const bytes = new TextEncoder().encode(JSON.stringify(envelope))
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
}
