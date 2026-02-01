import { describe, expect, it } from "vitest"
import { mockContext } from "../../../tests/mockContext"
import { importUsePurposesFromEnterprise } from "./importFromEnterprise"

describe("importUsePurposesFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importUsePurposesFromEnterprise(mockContext, undefined)

    expect(result).toBeUndefined()
  })

  it("should import ПлатформаИМобильноеПриложение", () => {
    const result = importUsePurposesFromEnterprise(mockContext, "ПлатформаИМобильноеПриложение")

    expect(result).toEqual(["PlatformApplication", "MobilePlatformApplication"])
  })

  it("should import МобильноеПриложение", () => {
    const result = importUsePurposesFromEnterprise(mockContext, "МобильноеПриложение")

    expect(result).toEqual(["MobilePlatformApplication"])
  })
})
