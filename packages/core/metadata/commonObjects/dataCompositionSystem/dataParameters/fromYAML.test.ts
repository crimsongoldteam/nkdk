import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testImportPropertyFromYAML } from "~/tests/property/importPropertyFromYAML"
import { dataParametersFixture, dataParametersFixtureYAML } from "./__fixtures__/data"

const rule: PropertyRule = {
  type: "DataParameters",
}

describe("import DataParameters from YAML", () => {
  it("imports undefined", () => {
    const result = testImportPropertyFromYAML({ rule, value: undefined })
    expect(result).toBeUndefined()
  })

  it("imports fixture", () => {
    const result = testImportPropertyFromYAML({
      rule,
      value: dataParametersFixtureYAML,
    })

    expect(result).toEqual(dataParametersFixture)
  })
})
