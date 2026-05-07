import { describe, expect, it } from "vitest"
import { mockContext, mockRule } from "~/tests/mockContext"
import { fullMobileDeviceCommandBarContent, fullMobileDeviceCommandBarContentYAML } from "./__fixtures__/data"
import { exportMobileDeviceCommandBarContentToYAML } from "./toYAML"
import { MobileDeviceCommandBarContent, MobileDeviceCommandBarContentYAML } from "./types"

describe("exportMobileDeviceCommandBarContentToYAML", () => {
  it("returns undefined for undefined input", () => {
    const result = exportMobileDeviceCommandBarContentToYAML(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("returns undefined for empty input", () => {
    const result = exportMobileDeviceCommandBarContentToYAML(mockContext, mockRule, [])
    expect(result).toBeUndefined()
  })

  it("exports full YAML", () => {
    const result = exportMobileDeviceCommandBarContentToYAML(mockContext, mockRule, fullMobileDeviceCommandBarContent)

    expect(result).toEqual(fullMobileDeviceCommandBarContentYAML)
  })

  it("exports non-string values through MetadataValue YAML helpers", () => {
    const mixed: MobileDeviceCommandBarContent = [
      { type: "decimal", value: 5 },
      { type: "boolean", value: true },
      { type: "ref", value: "Catalog.Пользователи.EmptyRef" },
      {
        type: "formChoiceListDesTimeValue",
        value: { type: "string", value: "A" },
        presentation: { items: { ru: "А" } },
      },
    ]
    const expected: MobileDeviceCommandBarContentYAML = [
      5,
      "Истина",
      "Справочник.Пользователи.ПустаяСсылка",
      '"A"(А)',
    ]

    const result = exportMobileDeviceCommandBarContentToYAML(mockContext, mockRule, mixed)

    expect(result).toEqual(expected)
  })
})
