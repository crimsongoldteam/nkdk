import { describe, expect, it } from "vitest"
import { mockConfigurationSettings } from "~/lib/tests/mockConfigurationSettings"
import { parseBoolean } from "./parse"

describe("parseBoolean", () => {
  it("should return undefined when value is undefined", () => {
    const result = parseBoolean(undefined, mockConfigurationSettings)

    expect(result).toBeUndefined()
  })

  it("should return true when value is 'Истина'", () => {
    const result = parseBoolean("Истина", mockConfigurationSettings)

    expect(result).toBe(true)
  })

  it("should return false when value is 'Ложь'", () => {
    const result = parseBoolean("Ложь", mockConfigurationSettings)

    expect(result).toBe(false)
  })
})
