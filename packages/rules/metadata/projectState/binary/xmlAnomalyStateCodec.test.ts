import { describe, expect, it } from "vitest"
import { decodeXmlAnomalyState, encodeXmlAnomalyState } from "./xmlAnomalyStateCodec"

describe("двоичное состояние XML-границы", () => {
  it.each([
    [undefined, 0],
    ["pending", 1],
    ["accepted", 2],
  ] as const)("восстанавливает %s", (state, encoded) => {
    expect(encodeXmlAnomalyState(state)).toBe(encoded)
    expect(decodeXmlAnomalyState(encoded)).toBe(state)
  })

  it("отклоняет неизвестный код", () => {
    expect(() => decodeXmlAnomalyState(3)).toThrow("Неизвестное состояние XML-границы: 3")
  })
})
