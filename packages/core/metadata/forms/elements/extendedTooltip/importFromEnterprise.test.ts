import { describe, expect, it } from "vitest"
import {
  fullExtendedTooltip,
  fullExtendedTooltipEnterprise,
  minimalExtendedTooltip,
  minimalExtendedTooltipEnterprise,
} from "~/tests/fixtures/forms/extendedTooltip/data"
import { mockСontext } from "~/tests/mockContext"
import { importExtendedTooltipFromEnterprise } from "./importFromEnterprise"

describe("importExtendedTooltipFromEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = importExtendedTooltipFromEnterprise(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should import all fields from Enterprise", () => {
    const result = importExtendedTooltipFromEnterprise(mockСontext, fullExtendedTooltipEnterprise)

    expect(result).toEqual(fullExtendedTooltip)
  })

  it("should import minimal", () => {
    const result = importExtendedTooltipFromEnterprise(mockСontext, minimalExtendedTooltipEnterprise)

    expect(result).toEqual(minimalExtendedTooltip)
  })
})
