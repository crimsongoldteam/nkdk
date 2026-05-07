import { describe, expect, it } from "vitest"
import { mockContext, mockRule } from "~/tests/mockContext"
import { fullMobileDeviceCommandBarContent, fullMobileDeviceCommandBarContentYAML } from "./__fixtures__/data"
import { importMobileDeviceCommandBarContentFromYAML } from "./fromYAML"

describe("importMobileDeviceCommandBarContentFromYAML", () => {
  it("returns undefined for undefined input", () => {
    const result = importMobileDeviceCommandBarContentFromYAML(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("returns undefined for empty input", () => {
    const result = importMobileDeviceCommandBarContentFromYAML(mockContext, mockRule, [])
    expect(result).toBeUndefined()
  })

  it("imports full YAML", () => {
    const result = importMobileDeviceCommandBarContentFromYAML(
      mockContext,
      mockRule,
      fullMobileDeviceCommandBarContentYAML
    )

    expect(result).toEqual(fullMobileDeviceCommandBarContent)
  })
})
