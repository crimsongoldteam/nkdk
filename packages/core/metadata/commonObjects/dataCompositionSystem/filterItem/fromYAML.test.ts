import { describe, expect, it } from "vitest"
import { importMetadataItemFromYAML } from "~/metadata/orchestration/metadataItem/fromYAML"
import { mockContext } from "~/tests/mockContext"
import { fullFilterItemComparison, fullFilterItemComparisonYAML } from "./__fixtures__/data"
import { FilterItemComparisonRules } from "./rules"

describe("import FilterItemComparison from YAML", () => {
  it("should import full from YAML", () => {
    const result = importMetadataItemFromYAML({
      context: mockContext,
      rule: FilterItemComparisonRules,
      yaml: fullFilterItemComparisonYAML,
    })
    expect(result).toEqual(fullFilterItemComparison)
  })
})
