import { describe, expect, it } from "vitest"
import {
  decodeConfigurationIndexFragments,
  encodeConfigurationIndexFragments,
  mergeConfigurationIndexFragments,
} from "./fragment"
import { sampleFragments } from "./testData"

describe("configuration index worker fragments", () => {
  it("сохраняет Extended при encode фрагмента и merge", () => {
    const fragment = {
      targetProjectPath: "Формы/ФормаЭлемента/Форма.yaml",
      identities: [],
      xmlNodes: [],
      xmlValues: [{ logicalAddress: "Справочник.Товары.Форма.ФормаЭлемента.form", extended: true as const }],
    }
    const buffer = encodeConfigurationIndexFragments([fragment])

    expect(decodeConfigurationIndexFragments(buffer)).toEqual([fragment])
    expect(mergeConfigurationIndexFragments([buffer]).xmlValues).toEqual(fragment.xmlValues)
  })

  it("uses one transferable ArrayBuffer per worker", () => {
    const fragments = sampleFragments()
    const buffer = encodeConfigurationIndexFragments(fragments)

    expect(buffer).toBeInstanceOf(ArrayBuffer)
    expect(decodeConfigurationIndexFragments(buffer)).toEqual(fragments)
  })

  it("сохраняет локальные зависимости first-pass во временном codec и merge", () => {
    const fragment = sampleFragments()[0]!
    const buffer = encodeConfigurationIndexFragments([fragment])

    expect(decodeConfigurationIndexFragments(buffer)[0]!.localDependencies).toEqual(fragment.localDependencies)
    expect(mergeConfigurationIndexFragments([buffer]).localDependencies).toEqual(fragment.localDependencies)
  })

  it("объединяет локальные зависимости уникально и детерминированно", () => {
    const first = sampleFragments()[0]!.localDependencies![0]!
    const second = {
      ...first,
      sourceProjectPath: "Документ/Заказ/Свойства.yaml",
      canonical: "Document.Заказ",
    }
    const left = encodeConfigurationIndexFragments([
      {
        ...sampleFragments()[1]!,
        identities: [],
        xmlNodes: [],
        xmlValues: [],
        localDependencies: [first, second],
      },
    ])
    const right = encodeConfigurationIndexFragments([
      {
        ...sampleFragments()[1]!,
        identities: [],
        xmlNodes: [],
        xmlValues: [],
        localDependencies: [first],
      },
    ])

    expect(mergeConfigurationIndexFragments([right, left]).localDependencies).toEqual([second, first])
  })

  it("merges buffers in worker result order and rejects address conflicts", () => {
    const left = encodeConfigurationIndexFragments([sampleFragments()[0]!])
    const right = encodeConfigurationIndexFragments([sampleFragments()[1]!])

    expect(mergeConfigurationIndexFragments([right, left])).toEqual({
      identities: sampleFragments()[0]!.identities,
      xmlNodes: [...sampleFragments()[1]!.xmlNodes, ...sampleFragments()[0]!.xmlNodes],
      xmlValues: sampleFragments()[0]!.xmlValues,
      localDependencies: sampleFragments()[0]!.localDependencies,
    })
    expect(() => mergeConfigurationIndexFragments([left, left])).toThrow("Конфликт logicalAddress")
  })

  it("rejects invalid transient envelopes", () => {
    const buffer = encodeConfigurationIndexFragments(sampleFragments())
    const envelope = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(buffer)) as {
      magic: string
      strings: string[]
      fragments: Array<{ targetProjectPathStringId: number }>
    }

    envelope.magic = "NKDK1CIX"
    expect(() => decodeConfigurationIndexFragments(encodeEnvelope(envelope))).toThrow("magic")

    envelope.magic = "NKDKCIF2"
    envelope.fragments[0]!.targetProjectPathStringId = envelope.strings.length
    expect(() => decodeConfigurationIndexFragments(encodeEnvelope(envelope))).toThrow("string ID")
  })
})

function encodeEnvelope(envelope: unknown): ArrayBuffer {
  const bytes = new TextEncoder().encode(JSON.stringify(envelope))
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
}
