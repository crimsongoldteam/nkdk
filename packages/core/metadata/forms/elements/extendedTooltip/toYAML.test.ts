import { describe, expect, it } from "vitest"
import { exportPropertyToYAML } from "~/metadata/orchestration"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { fullExtendedTooltip, fullExtendedTooltipYAML } from "~/metadata/forms/elements/extendedTooltip/__fixtures__/data"
import { mockContext } from "~/tests/mockContext"

const rule: PropertyRule = {
  type: "ExtendedTooltip",
  yaml: "РасширеннаяПодсказка",
}

describe("exportExtendedTooltipToYAML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportPropertyToYAML({
      context: mockContext,
      rule: rule,
      value: undefined,
    })

    expect(result).toBeUndefined()
  })

  it("should export all fields to YAML", () => {
    const result = exportPropertyToYAML({
      context: mockContext,
      rule: rule,
      value: fullExtendedTooltip,
    })

    expect(result).toHaveProperty("РасширеннаяПодсказка", fullExtendedTooltipYAML)
  })
})
