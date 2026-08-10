import { describe, expect, it } from "vitest"
import { mockContextFromXML, mockRule } from "../../../tests/mockContext"
import { importBooleanFromXML } from "./fromXML"

describe("importBooleanFromXML", () => {
  it("should return undefined when xml is undefined", () => {
    const result = importBooleanFromXML(mockContextFromXML(), mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should return true when xml is 'true'", () => {
    const result = importBooleanFromXML(mockContextFromXML(), mockRule, "true")

    expect(result).toBe(true)
  })

  it("should return false when xml is 'false'", () => {
    const result = importBooleanFromXML(mockContextFromXML(), mockRule, "false")

    expect(result).toBe(false)
  })

  it("should return true when xml is boolean true", () => {
    const result = importBooleanFromXML(mockContextFromXML(), mockRule, true)

    expect(result).toBe(true)
  })

  it("should return false when xml is boolean false", () => {
    const result = importBooleanFromXML(mockContextFromXML(), mockRule, false)

    expect(result).toBe(false)
  })
})
