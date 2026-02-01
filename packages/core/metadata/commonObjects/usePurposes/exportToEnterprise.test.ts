import { describe, expect, it } from "vitest"
import { mockContext } from "../../../tests/mockContext"
import { exportUsePurposesToEnterprise } from "./exportToEnterprise"

describe("exportUsePurposesToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportUsePurposesToEnterprise(mockContext, undefined)

    expect(result).toBeUndefined()
  })

  it("should return undefined when data is empty array", () => {
    const result = exportUsePurposesToEnterprise(mockContext, [])

    expect(result).toBeUndefined()
  })

  it("should export both values as ПлатформаИМобильноеПриложение", () => {
    const result = exportUsePurposesToEnterprise(mockContext, ["PlatformApplication", "MobilePlatformApplication"])

    expect(result).toBe("ПлатформаИМобильноеПриложение")
  })

  it("should export only MobilePlatformApplication as МобильноеПриложение", () => {
    const result = exportUsePurposesToEnterprise(mockContext, ["MobilePlatformApplication"])

    expect(result).toBe("МобильноеПриложение")
  })

  it("should return undefined when only PlatformApplication", () => {
    const result = exportUsePurposesToEnterprise(mockContext, ["PlatformApplication"])

    expect(result).toBeUndefined()
  })
})
