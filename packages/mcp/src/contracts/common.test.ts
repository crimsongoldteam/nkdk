import { describe, expect, it } from "vitest"
import { jsonToolResult, toolError, toolSuccess } from "./common"

describe("common MCP contracts", () => {
  it("serializes success payloads to structuredContent and JSON text", () => {
    const payload = toolSuccess({ value: 42 })

    const result = jsonToolResult(payload)

    expect(result.structuredContent).toEqual({ ok: true, value: 42 })
    expect(result.content).toEqual([{ type: "text", text: JSON.stringify({ ok: true, value: 42 }) }])
    expect(result.isError).toBeUndefined()
  })

  it("marks business errors as tool errors with the same JSON body", () => {
    const payload = toolError("confirmation_required", "Нужно подтвердить запись", { path: "/tmp/out" })

    const result = jsonToolResult(payload)

    expect(result.structuredContent).toEqual({
      ok: false,
      code: "confirmation_required",
      message: "Нужно подтвердить запись",
      details: { path: "/tmp/out" },
    })
    expect(result.content).toEqual([{ type: "text", text: JSON.stringify(result.structuredContent) }])
    expect(result.isError).toBe(true)
  })
})
