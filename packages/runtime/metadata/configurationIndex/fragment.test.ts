import { describe, expect, it } from "vitest"
import {
  createConfigurationIndexFragmentBuilder,
  decodeConfigurationBlockFragments,
  encodeConfigurationBlockFragments,
  mergeConfigurationIndexFragments,
} from "./fragment"
import type { ConfigurationIndexBlockFragment } from "./types"
import { decodeBlockV1 } from "./blockCodec"

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
    expect(decodeConfigurationBlockFragments(encodeConfigurationBlockFragments([value]))).toEqual([value])
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

  it("передаёт блок напрямую в двоичном формате без JSON-конверта", () => {
    const buffer = encoded("А.yaml", { logicalAddress: "Объект", xmlId: "1" })
    expect(new TextDecoder().decode(new Uint8Array(buffer, 0, 8))).toBe("NKDKCIF7")
    const header = new DataView(buffer)
    expect(header.getUint32(8, true)).toBe(1)
    const pathLength = header.getUint32(12, true)
    const blockLength = header.getUint32(16 + pathLength, true)
    expect(decodeBlockV1(new Uint8Array(buffer, 20 + pathLength, blockLength)))
      .toEqual({ entities: [{ logicalAddress: "Объект", xmlId: "1" }] })
  })

  it("отклоняет пустую entity до передачи", () => {
    expect(() => encoded("А.yaml", { logicalAddress: "Объект" })).toThrow("не содержит данных")
  })

  it("не принимает старый текстовый конверт", () => {
    expect(() => decodeConfigurationBlockFragments(encodeEnvelope({
      magic: "NKDKCIF6", version: 6, fragments: [],
    }))).toThrow("Некорректный буфер")
  })

  it("проверяет усечённые и лишние байты", () => {
    const buffer = encoded("А.yaml", { logicalAddress: "Объект", xmlId: "1" })
    for (let length = 0; length < buffer.byteLength; length++) {
      expect(() => decodeConfigurationBlockFragments(buffer.slice(0, length))).toThrow("Некорректный буфер")
    }
    const extra = new Uint8Array(buffer.byteLength + 1)
    extra.set(new Uint8Array(buffer))
    expect(() => decodeConfigurationBlockFragments(extra.buffer)).toThrow("Некорректный буфер")
  })

  it("проверяет длины без выделения памяти по недоверенному числу", () => {
    const buffer = encoded("А.yaml", { logicalAddress: "Объект", xmlId: "1" })
    new DataView(buffer).setUint32(12, 0xffffffff, true)
    expect(() => decodeConfigurationBlockFragments(buffer)).toThrow("Некорректный буфер")
  })

  it("не позволяет завершить builder после повреждённой передачи", () => {
    const builder = createConfigurationIndexFragmentBuilder()
    const valid = encoded("А.yaml", { logicalAddress: "Объект", xmlId: "1" })
    const invalid = new Uint8Array(valid.byteLength + 1)
    invalid.set(new Uint8Array(valid))
    expect(() => builder.addEncoded(invalid.buffer)).toThrow("Некорректный буфер")
    expect(builder.metrics()).toEqual({ projectPaths: 0, entities: 0, retainedInputFragments: 0 })
    expect(() => builder.finish()).toThrow("завершён")
  })

  it("отклоняет неизвестные поля до кодирования", () => {
    const extraEntity = { logicalAddress: "Объект", xmlId: "1", obsolete: true }
    expect(() => encoded("А.yaml", extraEntity)).toThrow("Неизвестное поле")
    const child = { xmlName: "Form", name: "Форма", obsolete: true }
    expect(() => encoded("А.yaml", { logicalAddress: "Объект", children: [child] }))
      .toThrow("Неизвестное поле")
  })

  it("сохраняет Unicode и XML-текст без промежуточного строкового конверта", () => {
    const value = [{ targetProjectPath: "Формы/😀.yaml", entities: [{
      logicalAddress: "Форма.Ёж", xmlValue: '<Text>\ufeffЁж &amp; "😀"</Text>',
    }] }]
    expect(decodeConfigurationBlockFragments(encodeConfigurationBlockFragments(value))).toEqual(value)
  })
})

function encoded(
  targetProjectPath: string,
  entity: ConfigurationIndexBlockFragment["entities"][number],
): ArrayBuffer {
  return encodeConfigurationBlockFragments([{ targetProjectPath, entities: [entity] }])
}

function encodeEnvelope(envelope: unknown): ArrayBuffer {
  const bytes = new TextEncoder().encode(JSON.stringify(envelope))
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
}
