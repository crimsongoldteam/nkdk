import { describe, expect, it, vi } from "vitest"
import { full, minimal } from "~/tests/fixtures/configuration/data"
import { mockContext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importConfigurationFromXML } from "./fromXML"
import { exportConfigurationToXML } from "./toXML"

vi.mock("uuid", () => ({
  v4: vi.fn(() => "11111111-1111-4111-8111-111111111111"),
}))

describe("exportConfigurationToXML", () => {
  it("should round-trip full configuration", () => {
    const xmlData = exportConfigurationToXML(mockContext, full)
    expect(xmlData).toBeDefined()
    expect(xmlData?.Configuration?.Properties?.Name).toBe("Конфигурация")
    expect(xmlData?.Configuration?._uuid).toBe("11111111-1111-4111-8111-111111111111")

    const roundTripped = importConfigurationFromXML(mockContext, xmlData!)
    expect(roundTripped.name).toBe(full.name)
    expect(roundTripped.itemType).toBe("Configuration")
    expect(roundTripped.synonym).toEqual(full.synonym)
    expect(roundTripped.comment).toBe(full.comment)
    expect(roundTripped.compatibilityMode).toBe(full.compatibilityMode)
  })

  it("should round-trip minimal configuration", () => {
    const xmlData = exportConfigurationToXML(mockContext, minimal)
    expect(xmlData).toBeDefined()
    expect(xmlData?.Configuration?.Properties?.Name).toBe("Конфигурация")

    const roundTripped = importConfigurationFromXML(mockContext, xmlData!)
    expect(roundTripped).toEqual(minimal)
  })

  it("should return undefined when data is undefined", () => {
    const result = exportConfigurationToXML(mockContext, undefined)
    expect(result).toBeUndefined()
  })
})
