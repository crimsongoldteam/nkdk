import { describe, expect, it } from "vitest"
import {
  createConfigurationIndexFragmentBuilder,
  decodeConfigurationIndexFragments,
  encodeConfigurationIndexFragments,
  mergeConfigurationIndexFragments,
} from "./fragment"
import { encodeConfigurationIndex } from "./encode"
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

    expect(mergeConfigurationIndexFragments([encoded])).toEqual({
      sourceProjectPaths: ["Пустой.yaml"],
      entities: [],
    })
  })

  it("инкрементально хранит только уникальное конечное состояние без входных fragments", () => {
    const builder = createConfigurationIndexFragmentBuilder()
    for (let index = 0; index < 100; index += 1) {
      builder.add(fragment("А.yaml", { ...entity("Объект", "А.yaml"), xml: { explicitEmpty: true } }))
      expect(builder.metrics()).toEqual({ sourceProjectPaths: 1, entities: 1, retainedInputFragments: 0 })
    }

    expect(builder.finish()).toEqual({
      sourceProjectPaths: ["А.yaml"],
      entities: [{ ...entity("Объект", "А.yaml"), xml: { explicitEmpty: true } }],
    })
    expect(builder.metrics()).toEqual({ sourceProjectPaths: 0, entities: 0, retainedInputFragments: 0 })
  })

  it("сохраняет cross-assignment parent и form в одном корректном configuration index", () => {
    const builder = createConfigurationIndexFragmentBuilder()
    builder.add(fragment("Справочник/Товары/Свойства.yaml", entity(
      "Catalog.Товары",
      "Справочник/Товары/Свойства.yaml",
    )))
    builder.add(fragment("Справочник/Товары/Формы/Форма/Форма.yaml", entity(
      "Catalog.Товары.Form.Форма",
      "Справочник/Товары/Формы/Форма/Форма.yaml",
    )))
    const merged = builder.finish()

    expect(() => encodeConfigurationIndex({
      specificationVersion: "1.3",
      indexGeneration: 1n,
      componentPath: "cf",
      files: merged.sourceProjectPaths.map((projectPath) => ({ projectPath, contentHash: 1n })),
      entities: merged.entities,
    })).not.toThrow()
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

  it("отклоняет пустые uuid и xmlId из пула строк", () => {
    for (const kind of ["uuid", "xmlId"] as const) {
      const encoded = encodeConfigurationIndexFragments([
        fragment("А.yaml", { ...entity("Объект", "А.yaml"), identities: { [kind]: "value" } }),
      ])
      const envelope = JSON.parse(new TextDecoder().decode(encoded)) as {
        strings: string[]
        fragments: Array<{
          entities: Array<{ identities: { uuidStringId?: number; xmlIdStringId?: number } }>
        }>
      }
      const identities = envelope.fragments[0]!.entities[0]!.identities
      envelope.strings[identities[`${kind}StringId`]!] = ""

      expect(() => decodeConfigurationIndexFragments(encodeEnvelope(envelope))).toThrow(`Пустой ${kind}`)
    }
  })

  it("отклоняет UUID неправильного синтаксиса из пула строк", () => {
    const encoded = encodeConfigurationIndexFragments([
      fragment("А.yaml", { ...entity("Объект", "А.yaml"), identities: { uuid: "not-a-uuid" } }),
    ])

    expect(() => decodeConfigurationIndexFragments(encoded)).toThrow("Некорректный UUID")
  })
})

function encodeEnvelope(envelope: unknown): ArrayBuffer {
  const bytes = new TextEncoder().encode(JSON.stringify(envelope))
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
}
