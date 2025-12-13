import { describe, expect, it } from "vitest"
import { TConfigurationSettings } from "../configurationSettings/types"
import { formatSystemEnumeration } from "./format"

const configurationSettings: TConfigurationSettings = {
  defaultLanguage: "ru",
}

describe("formatSystemEnumeration", () => {
  it("should format to enterprise", () => {
    const mockValue = "Vertical"
    const expectedResult = "Вертикальная"

    const result = formatSystemEnumeration(mockValue, configurationSettings)

    expect(result).toBe(expectedResult)
  })
})
