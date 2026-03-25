import { describe, expect, it } from "vitest"
import { exportMetadataItemToYAML } from "~/metadata/orchestration/metadataItem/toYAML"
import { mockContext } from "~/tests/mockContext"
import { fullFilterItemComparison, fullFilterItemComparisonYAML } from "./__fixtures__/data"
import { FilterItemComparisonRules } from "./rules"

describe("export FilterItemComparison to YAML", () => {
  it("should export full to YAML", () => {
    expect(
      exportMetadataItemToYAML({
        context: mockContext,
        data: fullFilterItemComparison,
        rule: FilterItemComparisonRules,
      })
    ).toEqual(fullFilterItemComparisonYAML)
  })
})
