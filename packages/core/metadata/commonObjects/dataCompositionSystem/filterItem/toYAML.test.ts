import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testExportPropertyToYAML } from "~/tests/property/exportPropertyToYAML"
import { fullFilterItemComparison, fullFilterItemComparisonYAML, fullFilterItemGroup, fullFilterItemGroupYAML } from "./__fixtures__/data"
import "./types"

const rule: PropertyRule = {
  type: "FilterItem",
  yaml: "Элементы",
}

describe("export FilterItem to YAML", () => {
  it("exports FilterItemComparison to YAML", () => {
    const result = testExportPropertyToYAML({
      rule,
      value: [fullFilterItemComparison],
    })

    expect(result).toEqual({ Элементы: [fullFilterItemComparisonYAML] })
  })

  it("exports FilterItemGroup to YAML", () => {
    const result = testExportPropertyToYAML({
      rule,
      value: [fullFilterItemGroup],
    })

    expect(result).toEqual({ Элементы: [fullFilterItemGroupYAML] })
  })
})
