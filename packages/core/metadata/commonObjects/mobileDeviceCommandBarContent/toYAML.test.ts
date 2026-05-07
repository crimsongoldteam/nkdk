import { describe, expect, it } from "vitest"
import { mockContext, mockRule } from "~/tests/mockContext"
import { fullMobileDeviceCommandBarContent, fullMobileDeviceCommandBarContentYAML } from "./__fixtures__/data"
import { exportMobileDeviceCommandBarContentToYAML } from "./toYAML"

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
})
