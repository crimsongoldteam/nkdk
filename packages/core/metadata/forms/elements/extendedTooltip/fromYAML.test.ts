import { describe, expect, it } from "vitest"
import { importPropertyFromYAML, PropertyRule } from "~/metadata/metadataFactory"
import {
  fullExtendedTooltip,
  fullExtendedTooltipEnterprise,
  minimalExtendedTooltip,
  minimalExtendedTooltipEnterprise,
} from "~/tests/fixtures/forms/extendedTooltip/data"
import { mockContext } from "~/tests/mockContext"

const rule: PropertyRule<any> = { type: "ExtendedTooltip" }

describe("importExtendedTooltipFromEnterprise", () => {
  it("should import all fields from Enterprise", () => {
    const result = importPropertyFromYAML({
      context: mockContext,
      rule: rule,
      value: fullExtendedTooltipEnterprise,
      sourceValue: fullExtendedTooltip,
    })

    expect(result).toEqual(fullExtendedTooltip)
  })

  it("should import minimal", () => {
    const result = importPropertyFromYAML({
      context: mockContext,
      rule: rule,
      value: minimalExtendedTooltipEnterprise,
      sourceValue: minimalExtendedTooltip,
    })

    expect(result).toEqual(minimalExtendedTooltip)
  })
})
