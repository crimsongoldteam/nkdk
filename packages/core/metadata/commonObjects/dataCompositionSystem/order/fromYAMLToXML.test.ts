import { describe, expect, it } from "vitest"
import { PropertyRule } from "../../../orchestration"
import { testExportPropertyModelThroughYAMLToXML } from "../../../../tests/property/exportPropertyModelThroughYAMLToXML"
import { autoOrderFixture, orderFixture, autoOrderFixtureYAML } from "./__fixtures__/data"

const rule: PropertyRule = {
  type: "Order",
}

describe("export Order to XML", () => {
  it("exports full to XML", () => {
    const { result, expectedResult } = testExportPropertyModelThroughYAMLToXML({
      rule,
      value: orderFixture,
      xmlRootTag: "dcsset:order",
      path: "full.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })

  it("exports auto item to XML", () => {
    const { result, expectedResult } = testExportPropertyModelThroughYAMLToXML({
      rule,
      value: autoOrderFixture,
      yaml: autoOrderFixtureYAML,
      xmlRootTag: "dcsset:order",
      path: "auto.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })
})
