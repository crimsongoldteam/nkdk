import { describe, expect, it } from "vitest"
import {
  createConfigurationIndexFragmentBuilder,
  decodeConfigurationIndexFragments,
  encodeConfigurationIndexFragments,
  mergeConfigurationIndexFragments,
} from "./fragment"
import type { ConfigurationIndexBlockFragment } from "./types"

const UUID = "00000000-0000-4000-8000-000000000001"

describe("configuration index worker fragments", () => {
  it("round-trips only thin BlockV1 fields", () => {
    const value: ConfigurationIndexBlockFragment = {
      targetProjectPath: "Справочники/Товары.yaml",
      entities: [{
        logicalAddress: "Справочник.Товары",
        uuid: UUID,
        xmlId: "1",
        children: [{ xmlName: "Form", name: "Форма" }],
      }],
    }
    expect(decodeConfigurationIndexFragments(encodeConfigurationIndexFragments([value]))).toEqual([value])
  })

  it("groups the same address independently by target project path", () => {
    const left = encoded("А.yaml", { logicalAddress: "Объект", uuid: UUID })
    const right = encoded("Б.yaml", { logicalAddress: "Объект", xmlId: "1" })

    expect(mergeConfigurationIndexFragments([left, right])).toEqual({
      fragments: [
        { targetProjectPath: "А.yaml", entities: [{ logicalAddress: "Объект", uuid: UUID }] },
        { targetProjectPath: "Б.yaml", entities: [{ logicalAddress: "Объект", xmlId: "1" }] },
      ],
    })
  })

  it("merges complementary observations only inside one block", () => {
    const builder = createConfigurationIndexFragmentBuilder()
    builder.add({ targetProjectPath: "А.yaml", entities: [{ logicalAddress: "Объект", uuid: UUID }] })
    builder.add({ targetProjectPath: "А.yaml", entities: [{ logicalAddress: "Объект", xmlId: "1" }] })
    expect(builder.finish()).toEqual({
      fragments: [{
        targetProjectPath: "А.yaml",
        entities: [{ logicalAddress: "Объект", uuid: UUID, xmlId: "1" }],
      }],
    })
  })

  it("rejects conflicting observations inside one block", () => {
    const builder = createConfigurationIndexFragmentBuilder()
    builder.add({ targetProjectPath: "А.yaml", entities: [{ logicalAddress: "Объект", xmlId: "1" }] })
    expect(() => builder.add({
      targetProjectPath: "А.yaml",
      entities: [{ logicalAddress: "Объект", xmlId: "2" }],
    })).toThrow("Конфликт logicalAddress Объект")
  })

  it("does not retain input fragments", () => {
    const builder = createConfigurationIndexFragmentBuilder()
    for (let index = 0; index < 100; index += 1) {
      builder.add({ targetProjectPath: "А.yaml", entities: [{ logicalAddress: "Объект", uuid: UUID }] })
    }
    expect(builder.metrics()).toEqual({ projectPaths: 1, entities: 1, retainedInputFragments: 0 })
    builder.finish()
    expect(builder.metrics()).toEqual({ projectPaths: 0, entities: 0, retainedInputFragments: 0 })
  })

  it("rejects unknown and empty entity fields", () => {
    const buffer = encoded("А.yaml", { logicalAddress: "Объект", xmlId: "1" })
    const envelope = JSON.parse(new TextDecoder().decode(buffer)) as {
      fragments: Array<{ entities: Array<Record<string, unknown>> }>
    }
    envelope.fragments[0]!.entities[0] = { logicalAddress: "Объект", xmlName: "Старое" }
    expect(() => decodeConfigurationIndexFragments(encodeEnvelope(envelope))).toThrow("неизвестное поле")
    envelope.fragments[0]!.entities[0] = { logicalAddress: "Объект" }
    expect(() => decodeConfigurationIndexFragments(encodeEnvelope(envelope))).toThrow("не содержит данных")
  })
})

function encoded(
  targetProjectPath: string,
  entity: ConfigurationIndexBlockFragment["entities"][number],
): ArrayBuffer {
  return encodeConfigurationIndexFragments([{ targetProjectPath, entities: [entity] }])
}

function encodeEnvelope(envelope: unknown): ArrayBuffer {
  const bytes = new TextEncoder().encode(JSON.stringify(envelope))
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
}
