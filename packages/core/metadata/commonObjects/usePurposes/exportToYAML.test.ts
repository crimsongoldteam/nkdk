import { describe, expect, it } from "vitest"
import { mockContext, mockRule } from "../../../tests/mockContext"
import { exportUsePurposesToYAML } from "./exportToYAML"

describe("exportUsePurposesToYAML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportUsePurposesToYAML(mockContext, mockRule, undefined)
    expect(result).toBeUndefined()
  })

  it("should return undefined when data is empty array", () => {
    const result = exportUsePurposesToYAML(mockContext, mockRule, [])
    expect(result).toBeUndefined()
  })

  it("should return ПлатформаИМобильноеПриложение for both values", () => {
    const result = exportUsePurposesToYAML(mockContext, mockRule, ["PlatformApplication", "MobilePlatformApplication"])
    expect(result).toBe("ПлатформаИМобильноеПриложение")
  })

  it("should return МобильноеПриложение for MobilePlatformApplication only", () => {
    const result = exportUsePurposesToYAML(mockContext, mockRule, ["MobilePlatformApplication"])
    expect(result).toBe("МобильноеПриложение")
  })

  it("should return undefined for PlatformApplication only", () => {
    const result = exportUsePurposesToYAML(mockContext, mockRule, ["PlatformApplication"])
    expect(result).toBeUndefined()
  })
})
