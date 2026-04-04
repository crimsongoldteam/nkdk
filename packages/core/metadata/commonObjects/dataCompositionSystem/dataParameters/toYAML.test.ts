import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testExportPropertyToYAML } from "~/tests/property/exportPropertyToYAML"
import { dataParametersFixture, dataParametersFixtureYAML } from "./__fixtures__/data"

const rule: PropertyRule = {
  type: "DataParameters",
  yaml: "ПараметрыДанных",
}

describe("export DataParameters to YAML", () => {
  it("exports undefined", () => {
    const result = testExportPropertyToYAML({ rule, value: undefined })
    expect(result).toBeUndefined()
  })

  it("exports fixture", () => {
    const result = testExportPropertyToYAML({
      rule,
      value: dataParametersFixture,
    })

    expect(result).toEqual({ ПараметрыДанных: dataParametersFixtureYAML })
  })
})
