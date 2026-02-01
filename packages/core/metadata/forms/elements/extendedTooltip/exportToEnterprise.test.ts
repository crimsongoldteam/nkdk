import { describe, expect, it } from "vitest"
import { fullExtendedTooltip, fullExtendedTooltipEnterprise } from "~/tests/fixtures/forms/extendedTooltip/data"
import { mockContext } from "~/tests/mockContext"
import { exportExtendedTooltipToEnterprise } from "./exportToEnterprise"

describe("exportExtendedTooltipToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportExtendedTooltipToEnterprise(mockContext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to Enterprise", () => {
    const result = exportExtendedTooltipToEnterprise(mockContext, fullExtendedTooltip)

    expect(result).toEqual(fullExtendedTooltipEnterprise)
  })

  // it("should export minimal", () => {
  //   const result = exportExtendedTooltipToEnterprise(mockContext, minimalExtendedTooltip)

  //   expect(result).toEqual(minimalExtendedTooltipEnterprise)
  // })
})
