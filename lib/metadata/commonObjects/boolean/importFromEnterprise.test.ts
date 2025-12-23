import { describe, expect, it } from "vitest"
import { mockcontext } from "~/lib/tests/mockContext"
import { parseBoolean } from "./importFromEnterprise"

describe("parseBoolean", () => {
  it("should return undefined when value is undefined", () => {
    const result = parseBoolean(undefined, mockcontext)

    expect(result).toBeUndefined()
  })

  it("should return true when value is 'Истина'", () => {
    const result = parseBoolean("Истина", mockcontext)

    expect(result).toBe(true)
  })

  it("should return false when value is 'Ложь'", () => {
    const result = parseBoolean("Ложь", mockcontext)

    expect(result).toBe(false)
  })
})
