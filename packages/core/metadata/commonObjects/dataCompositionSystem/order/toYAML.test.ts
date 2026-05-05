import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testExportPropertyToYAML } from "~/tests/property/exportPropertyToYAML"
import { fullOrderFixtureYAML, orderFixture } from "./__fixtures__/data"

const rule: PropertyRule = {
  type: "Order",
  yaml: "Порядок",
}

describe("export Order to YAML", () => {
  it("exports full to YAML", () => {
    const result = testExportPropertyToYAML({
      rule,
      value: orderFixture,
    })

    expect(result).toEqual({ Порядок: fullOrderFixtureYAML })
  })
})
