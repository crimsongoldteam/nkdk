import { describe, expect, it } from "vitest"
import { errorCodeSchema, jsonToolResult, toolError, toolSuccess } from "./common"
import { parseTypeBox } from "./mcpSchema"

describe("common MCP contracts", () => {
  it.each([
    "platform_not_found",
    "platform_component_missing",
    "unsupported_connection",
    "invalid_project_settings",
    "authentication_failed",
    "session_start_failed",
    "session_timeout",
    "platform_command_failed",
    "operation_cancelled",
  ])("accepts the stable platform error code %s", (code) => {
    expect(parseTypeBox(errorCodeSchema, code)).toBe(code)
  })

  it("возвращает structuredContent без дублирования всего payload в тексте", () => {
    const payload = toolSuccess({ value: 42 })

    const result = jsonToolResult(payload)

    expect(result.structuredContent).toEqual({ ok: true, value: 42 })
    expect(result.content).toEqual([{ type: "text", text: "Операция выполнена." }])
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
    expect(result.content).toEqual([{ type: "text", text: "Нужно подтвердить запись" }])
    expect(result.isError).toBe(true)
  })

  it("не помечает обычный провал validation как ошибку протокола MCP", () => {
    const payload = {
      ok: false,
      code: "validation_failed",
      message: "Проект содержит ошибки",
      diagnostics: [],
    } as never

    const result = jsonToolResult(payload)

    expect(result.isError).toBeUndefined()
  })
})
