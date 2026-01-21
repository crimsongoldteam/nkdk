import { describe, expect, it } from "vitest"
import { mockСontext } from "../../../tests/mockContext"
import { exportUsePurposesToEnterprise } from "./exportToEnterprise"

describe("exportUsePurposesToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportUsePurposesToEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should return undefined when data is empty array", () => {
    const result = exportUsePurposesToEnterprise(mockСontext, [])

    expect(result).toBeUndefined()
  })

  it("should export both values as ПлатформаИМобильноеПриложение", () => {
    const result = exportUsePurposesToEnterprise(mockСontext, [
      "PlatformApplication",
      "MobilePlatformApplication",
    ])

    expect(result).toBe("ПлатформаИМобильноеПриложение")
  })

  it("should export only MobilePlatformApplication as МобильноеПриложение", () => {
    const result = exportUsePurposesToEnterprise(mockСontext, ["MobilePlatformApplication"])

    expect(result).toBe("МобильноеПриложение")
  })

  it("should return undefined when only PlatformApplication", () => {
    const result = exportUsePurposesToEnterprise(mockСontext, ["PlatformApplication"])

    expect(result).toBeUndefined()
  })
})
