import { describe, expect, it } from "vitest"
import { exportPropertyToYAML } from "~/metadata/metadataFactory"
import { PropertyRule } from "~/metadata/metadataFactory/elementRulesFactory"
import { fullExtendedTooltip, fullExtendedTooltipEnterprise } from "~/tests/fixtures/forms/extendedTooltip/data"
import { mockContext } from "~/tests/mockContext"
import { Table } from "../table/types"

const rule: PropertyRule<Table> = {
  type: "ExtendedTooltip",
  yaml: "РасширеннаяПодсказка",
}

describe("exportExtendedTooltipToEnterprise", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportPropertyToYAML({
      context: mockContext,
      rule: rule,
      value: undefined,
    })

    expect(result).toBeUndefined()
  })

  it("should export all fields to Enterprise", () => {
    const result = exportPropertyToYAML({
      context: mockContext,
      rule: rule,
      value: fullExtendedTooltip,
    })

    expect(result).toHaveProperty("РасширеннаяПодсказка", fullExtendedTooltipEnterprise)
  })
})
