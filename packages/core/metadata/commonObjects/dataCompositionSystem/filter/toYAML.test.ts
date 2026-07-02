import { describe, expect, it } from "vitest"
import { PropertyRule } from "../../../orchestration"
import { testExportPropertyToYAML } from "../../../../tests/property/exportPropertyToYAML"
import { filterFixture, fullFilterFixtureYAML } from "./__fixtures__/data"

const rule: PropertyRule = {
  type: "Filter",
  yaml: "Отбор",
}

describe("export Filter to YAML", () => {
  it("exports full to YAML", () => {
    const result = testExportPropertyToYAML({
      rule,
      value: filterFixture,
    })

    expect(result).toEqual({ Отбор: fullFilterFixtureYAML })
  })
})
