import { describe, expect, it } from "vitest"
import { importPropertyFromYAML, PropertyRule } from "~/metadata/metadataFactory"
import {
    fullExtendedTooltip,
    fullExtendedTooltipYAML,
    minimalExtendedTooltip,
    minimalExtendedTooltipYAML,
} from "~/tests/fixtures/forms/extendedTooltip/data"
import { mockContext } from "~/tests/mockContext"

const rule: PropertyRule = { type: "ExtendedTooltip" }

describe("importExtendedTooltipFromYAML", () => {
  it("should import all fields from YAML", () => {
    const result = importPropertyFromYAML({
      context: mockContext,
      rule: rule,
      value: fullExtendedTooltipYAML,
      sourceValue: fullExtendedTooltip,
    })

    expect(result).toEqual(fullExtendedTooltip)
  })

  it("should import minimal", () => {
    const result = importPropertyFromYAML({
      context: mockContext,
      rule: rule,
      value: minimalExtendedTooltipYAML,
      sourceValue: minimalExtendedTooltip,
    })

    expect(result).toEqual(minimalExtendedTooltip)
  })
})
