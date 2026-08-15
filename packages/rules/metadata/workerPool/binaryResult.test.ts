import { describe, expect, it } from "vitest"
import {
  assertMetadataWorkerBinaryResult,
  createMovableBinaryResult,
  type MetadataWorkerBinaryResult,
} from "./binaryResult"

const transferableSymbol = Symbol.for("Piscina.transferable")
const valueSymbol = Symbol.for("Piscina.valueOf")

describe("двоичный результат универсального worker", () => {
  it("передаёт каждый именованный ArrayBuffer ровно один раз", () => {
    const first = new ArrayBuffer(8)
    const second = new ArrayBuffer(16)
    const result: MetadataWorkerBinaryResult = {
      kind: "binaryResult",
      payloadKind: "validation.refresh",
      counters: { files: 2 },
      buffers: [
        { name: "state.header", buffer: first },
        { name: "state.records", buffer: second },
      ],
    }

    const movable = createMovableBinaryResult(result) as unknown as {
      readonly [transferableSymbol]: readonly ArrayBuffer[]
      readonly [valueSymbol]: MetadataWorkerBinaryResult
    }

    expect(movable[transferableSymbol]).toEqual([first, second])
    expect(movable[valueSymbol]).toBe(result)
  })

  it.each([
    ["повторяющееся имя", (buffer: ArrayBuffer) => ({
      ...validResult(),
      buffers: [{ name: "data", buffer }, { name: "data", buffer: new ArrayBuffer(1) }],
    })],
    ["повторяющийся буфер", (buffer: ArrayBuffer) => ({
      ...validResult(),
      buffers: [{ name: "first", buffer }, { name: "second", buffer }],
    })],
    ["типизированное представление вместо владеющего буфера", () => ({
      ...validResult(),
      buffers: [{ name: "data", buffer: new Uint8Array(1) as unknown as ArrayBuffer }],
    })],
    ["массив вместо числового счётчика", () => ({
      ...validResult(),
      counters: { files: [] as unknown as number },
    })],
    ["скрытый массив предметных данных", () => ({
      ...validResult(),
      diagnostics: [],
    })],
  ])("отклоняет %s", (_name, createResult) => {
    expect(() => assertMetadataWorkerBinaryResult(createResult(new ArrayBuffer(1))))
      .toThrow()
  })
})

function validResult(): MetadataWorkerBinaryResult {
  return {
    kind: "binaryResult",
    payloadKind: "test",
    counters: {},
    buffers: [{ name: "data", buffer: new ArrayBuffer(1) }],
  }
}
