import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testImportPropertyFromYAML } from "~/tests/property/importPropertyFromYAML"
import { filterFixture, fullFilterFixtureYAML } from "./__fixtures__/data"

const rule: PropertyRule = {
  type: "Filter",
}

describe("import Filter from YAML", () => {
  it("imports full from YAML", () => {
    const result = testImportPropertyFromYAML({
      rule,
      value: fullFilterFixtureYAML,
    })

    expect(result).toEqual(filterFixture)
  })
})
