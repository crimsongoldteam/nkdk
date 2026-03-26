import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testExportPropertyToYAML } from "~/tests/property/exportPropertyToYAML"
import { fullFilterForExport, fullFilterYAML } from "./__fixtures__/data"

const rule: PropertyRule = {
  type: "Filter",
  yaml: "Отбор",
}

describe("export Filter to YAML", () => {
  it("exports full to YAML", () => {
    const result = testExportPropertyToYAML({
      rule,
      value: fullFilterForExport,
    })

    expect(result).toEqual({ Отбор: fullFilterYAML })
  })
})
