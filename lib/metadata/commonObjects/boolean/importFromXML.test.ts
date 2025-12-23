import { describe, expect, it } from "vitest"
import { mockConfigurationSettings } from "../../../tests/mockConfigurationSettings"
import { importBooleanFromXML } from "./importFromXML"

describe("importBooleanFromXML", () => {
  it("should return undefined when xml is undefined", () => {
    const result = importBooleanFromXML(mockConfigurationSettings, undefined)

    expect(result).toBeUndefined()
  })

  it("should return true when xml is 'true'", () => {
    const result = importBooleanFromXML(mockConfigurationSettings, "true")

    expect(result).toBe(true)
  })

  it("should return false when xml is 'false'", () => {
    const result = importBooleanFromXML(mockConfigurationSettings, "false")

    expect(result).toBe(false)
  })

  it("should return true when xml is boolean true", () => {
    const result = importBooleanFromXML(mockConfigurationSettings, true)

    expect(result).toBe(true)
  })

  it("should return false when xml is boolean false", () => {
    const result = importBooleanFromXML(mockConfigurationSettings, false)

    expect(result).toBe(false)
  })
})

