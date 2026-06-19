import { describe, expect, it } from "vitest"
import { mockContextToYAML } from "~/tests/mockContext"
import { exportWebSocketClientHeadersToYAML } from "./toYAML"

const rule = { type: "WebSocketClientHeaders", yaml: "Заголовки" } as const

describe("exportWebSocketClientHeadersToYAML", () => {
  it("preserves order and duplicate keys", () => {
    const result = exportWebSocketClientHeadersToYAML(mockContextToYAML, rule, [
      { Ключ: "X-Test", Значение: "1" },
      { Ключ: "X-Test", Значение: "2" },
    ])

    expect(result).toEqual([
      { Ключ: "X-Test", Значение: "1" },
      { Ключ: "X-Test", Значение: "2" },
    ])
  })
})
