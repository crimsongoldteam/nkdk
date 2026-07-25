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

  it("merges buffers in worker result order and rejects address conflicts", () => {
    const left = encodeConfigurationIndexFragments([sampleFragments()[0]!])
    const right = encodeConfigurationIndexFragments([sampleFragments()[1]!])

    expect(mergeConfigurationIndexFragments([right, left])).toEqual({
      identities: sampleFragments()[0]!.identities,
      xmlNodes: [...sampleFragments()[1]!.xmlNodes, ...sampleFragments()[0]!.xmlNodes],
      xmlValues: sampleFragments()[0]!.xmlValues,
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

    envelope.magic = "NKDKCIF1"
    envelope.fragments[0]!.targetProjectPathStringId = envelope.strings.length
    expect(() => decodeConfigurationIndexFragments(encodeEnvelope(envelope))).toThrow("string ID")
  })
})

function encodeEnvelope(envelope: unknown): ArrayBuffer {
  const bytes = new TextEncoder().encode(JSON.stringify(envelope))
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
}
