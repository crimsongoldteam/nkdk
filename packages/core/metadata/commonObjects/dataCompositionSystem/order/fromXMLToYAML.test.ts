import { describe, expect, it } from "vitest"
import { PropertyRule } from "../../../orchestration"
import { testExportPropertyModelThroughXMLToYAML } from "../../../../tests/property/exportPropertyModelThroughXMLToYAML"
import { autoOrderFixture, autoOrderFixtureYAML, fullOrderFixtureYAML, orderFixture } from "./__fixtures__/data"

const rule: PropertyRule = {
  type: "Order",
  yaml: "Порядок",
}

describe("export Order to YAML", () => {
  it("exports full to YAML", () => {
    const result = testExportPropertyModelThroughXMLToYAML({
      rule,
      value: orderFixture,
      path: "full.xml",
      xmlRootTag: "dcsset:order",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual({ Порядок: fullOrderFixtureYAML })
  })

  it("exports auto item to YAML", () => {
    const result = testExportPropertyModelThroughXMLToYAML({
      rule,
      value: autoOrderFixture,
      path: "auto.xml",
      xmlRootTag: "dcsset:order",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual({ Порядок: autoOrderFixtureYAML })
  })
})
