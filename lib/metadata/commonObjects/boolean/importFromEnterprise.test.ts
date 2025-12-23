import { describe, expect, it } from "vitest"
import { mockСontext } from "~/lib/tests/mockContext"
import { parseBoolean } from "./importFromEnterprise"

describe("parseBoolean", () => {
  it("should return undefined when value is undefined", () => {
    const result = parseBoolean(undefined, mockСontext)

    expect(result).toBeUndefined()
  })

  it("should return true when value is 'Истина'", () => {
    const result = parseBoolean("Истина", mockСontext)

    expect(result).toBe(true)
  })

  it("should return false when value is 'Ложь'", () => {
    const result = parseBoolean("Ложь", mockСontext)

    expect(result).toBe(false)
  })
})
