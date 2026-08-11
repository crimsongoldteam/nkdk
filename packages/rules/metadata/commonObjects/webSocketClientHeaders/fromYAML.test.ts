import { describe, expect, it } from "vitest"
import { mockContext } from "../../../tests/mockContext"
import { importWebSocketClientHeadersFromYAML } from "./fromYAML"

const rule = { type: "WebSocketClientHeaders", yaml: "Заголовки" } as const

describe("importWebSocketClientHeadersFromYAML", () => {
  it("preserves order and duplicate keys", () => {
    const result = importWebSocketClientHeadersFromYAML(mockContext, rule, [
      { Ключ: "X-Test", Значение: "1" },
      { Ключ: "X-Test", Значение: "2" },
    ])

    expect(result).toEqual([
      { Ключ: "X-Test", Значение: "1" },
      { Ключ: "X-Test", Значение: "2" },
    ])
  })
})
