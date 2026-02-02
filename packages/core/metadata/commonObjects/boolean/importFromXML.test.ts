import { describe, expect, it } from "vitest"
import { mockContext, mockRule } from "../../../tests/mockContext"
import { _importBooleanFromXML } from "./_importFromXML"

describe("importBooleanFromXML", () => {
  it("should return undefined when xml is undefined", () => {
    const result = _importBooleanFromXML(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should return true when xml is 'true'", () => {
    const result = _importBooleanFromXML(mockContext, mockRule, "true")

    expect(result).toBe(true)
  })

  it("should return false when xml is 'false'", () => {
    const result = _importBooleanFromXML(mockContext, mockRule, "false")

    expect(result).toBe(false)
  })

  it("should return true when xml is boolean true", () => {
    const result = _importBooleanFromXML(mockContext, mockRule, true)

    expect(result).toBe(true)
  })

  it("should return false when xml is boolean false", () => {
    const result = _importBooleanFromXML(mockContext, mockRule, false)

    expect(result).toBe(false)
  })
})
