import { describe, expect, it } from "vitest"
import { mockContext, mockRule } from "../../../tests/mockContext"
import { importUsePurposesFromYAML } from "./importFromYAML"

describe("importUsePurposesFromYAML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importUsePurposesFromYAML(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should import ПлатформаИМобильноеПриложение", () => {
    const result = importUsePurposesFromYAML(mockContext, mockRule, "ПлатформаИМобильноеПриложение")

    expect(result).toEqual(["PlatformApplication", "MobilePlatformApplication"])
  })

  it("should import МобильноеПриложение", () => {
    const result = importUsePurposesFromYAML(mockContext, mockRule, "МобильноеПриложение")

    expect(result).toEqual(["MobilePlatformApplication"])
  })
})
