import { describe, expect, it } from "vitest"
import { exportPropertyToYAML } from "~/metadata/metadataFactory"
import { PropertyRule } from "~/metadata/metadataFactory/properties/types"
import { fullExtendedTooltip, fullExtendedTooltipYAML } from "~/tests/fixtures/forms/extendedTooltip/data"
import { mockContext } from "~/tests/mockContext"
import { Table } from "../table/types"

const rule: PropertyRule<Table> = {
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
