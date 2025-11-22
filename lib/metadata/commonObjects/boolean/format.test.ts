import { describe, expect, it } from "vitest"
import { formatBoolean } from "./format"

describe("formatBoolean", () => {
  it("should return undefined when value is undefined", () => {
    const result = formatBoolean(undefined)

    expect(result).toBeUndefined()
  })

  it("should return 'Истина' when value is true", () => {
    const result = formatBoolean(true)

    expect(result).toBe("Истина")
  })

  it("should return 'Ложь' when value is false", () => {
    const result = formatBoolean(false)

    expect(result).toBe("Ложь")
  })
})
