import { describe, expect, it } from "vitest"
import { mockСontext } from "../../../tests/mockContext"
import { importUsePurposesFromEnterprise } from "./importFromEnterprise"

describe("importUsePurposesFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importUsePurposesFromEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should import ПлатформаИМобильноеПриложение", () => {
    const result = importUsePurposesFromEnterprise(mockСontext, "ПлатформаИМобильноеПриложение")

    expect(result).toEqual(["PlatformApplication", "MobilePlatformApplication"])
  })

  it("should import МобильноеПриложение", () => {
    const result = importUsePurposesFromEnterprise(mockСontext, "МобильноеПриложение")

    expect(result).toEqual(["MobilePlatformApplication"])
  })
})
