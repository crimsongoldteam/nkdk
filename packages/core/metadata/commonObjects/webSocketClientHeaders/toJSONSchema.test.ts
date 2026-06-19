import { TypeCompiler } from "@sinclair/typebox/compiler"
import { describe, expect, it } from "vitest"
import { exportWebSocketClientHeadersToJSONSchema } from "./toJSONSchema"

const schema = TypeCompiler.Compile(
  exportWebSocketClientHeadersToJSONSchema({
    context: {} as never,
    rule: { type: "WebSocketClientHeaders" },
    value: undefined,
  }) ?? (() => {
    throw new Error("WebSocketClientHeaders JSON schema export returned undefined")
  })()
)

describe("exportWebSocketClientHeadersToJSONSchema", () => {
  it("accepts YAML header keys", () => {
    expect(
      schema.Check([
        { Ключ: "Заголовок 1", Значение: "Значение 1" },
        { Ключ: "Заголовок 2", Значение: "Значение 2" },
      ])
    ).toBe(true)
  })

  it("rejects internal header keys", () => {
    expect(schema.Check([{ key: "Header", value: "Value" }])).toBe(false)
  })
})
