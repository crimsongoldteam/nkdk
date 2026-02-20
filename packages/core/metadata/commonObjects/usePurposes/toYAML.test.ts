import { describe, expect, it } from "vitest"
import { mockContext, mockRule } from "../../../tests/mockContext"
import { exportUsePurposesToYAML } from "./toYAML"

describe("exportUsePurposesToYAML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportUsePurposesToYAML(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should return undefined when data is empty array", () => {
    const result = exportUsePurposesToYAML(mockContext, mockRule, [])

    expect(result).toBeUndefined()
  })

  it("should export both values as ПлатформаИМобильноеПриложение", () => {
    const result = exportUsePurposesToYAML(mockContext, mockRule, ["PlatformApplication", "MobilePlatformApplication"])

    expect(result).toBe("ПлатформаИМобильноеПриложение")
  })

  it("should export only MobilePlatformApplication as МобильноеПриложение", () => {
    const result = exportUsePurposesToYAML(mockContext, mockRule, ["MobilePlatformApplication"])

    expect(result).toBe("МобильноеПриложение")
  })

  it("should return undefined when only PlatformApplication", () => {
    const result = exportUsePurposesToYAML(mockContext, mockRule, ["PlatformApplication"])

    expect(result).toBeUndefined()
  })
})
