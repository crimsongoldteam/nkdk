import { describe, expect, it } from "vitest"
import { PropertyRule } from "../../../orchestration"
import { testImportPropertyFromYAML } from "../../../../tests/property/importPropertyFromYAML"
import { autoOrderFixture, autoOrderFixtureYAML, fullOrderFixtureYAML, orderFixture } from "./__fixtures__/data"

const rule: PropertyRule = {
  type: "Order",
}

describe("import Order from YAML", () => {
  it("imports full from YAML", () => {
    const result = testImportPropertyFromYAML({
      rule,
      value: fullOrderFixtureYAML,
    })

    expect(result).toEqual(orderFixture)
  })

  it("imports auto item from YAML", () => {
    const result = testImportPropertyFromYAML({
      rule,
      value: autoOrderFixtureYAML,
    })

    expect(result).toEqual(autoOrderFixture)
  })
})
