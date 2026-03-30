import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"
import { filterFixture } from "./__fixtures__/data"

const rule: PropertyRule = {
  type: "Filter",
}

describe("export Filter to XML", () => {
  it("exports full to XML", () => {
    const { result, expectedResult } = testExportPropertyToXML({
      rule,
      value: filterFixture,
      xmlRootTag: "dcsset:filter",
      path: "full.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })
})
