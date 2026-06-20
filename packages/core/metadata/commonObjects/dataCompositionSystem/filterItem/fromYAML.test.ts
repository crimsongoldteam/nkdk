import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testImportPropertyFromYAML } from "~/tests/property/importPropertyFromYAML"
import { importFromYAML } from "~/yaml/import"
import {
  fullFilterItemComparison,
  fullFilterItemComparisonYAML,
  fullFilterItemGroup,
  fullFilterItemGroupYAML,
} from "./__fixtures__/data"
import "./types"

const rule: PropertyRule = {
  type: "FilterItem",
}

describe("import FilterItem from YAML scalar styles", () => {
  it("imports double-quoted presentation as typed string", () => {
    const result = testImportPropertyFromYAML({
      rule,
      value: importFromYAML('- Представление: "Английское"'),
    })

    expect(result).toEqual([
      {
        itemType: "FilterItemComparison",
        presentation: { type: "string", value: "Английское" },
      },
    ])
  })
})

describe.skip("import FilterItem from YAML", () => {
  it("imports FilterItemComparison from YAML", () => {
    const result = testImportPropertyFromYAML({
      rule,
      value: [fullFilterItemComparisonYAML],
    })

    expect(result).toEqual([fullFilterItemComparison])
  })

  it("imports FilterItemGroup from YAML", () => {
    const result = testImportPropertyFromYAML({
      rule,
      value: [fullFilterItemGroupYAML],
    })

    expect(result).toEqual([fullFilterItemGroup])
  })
})
