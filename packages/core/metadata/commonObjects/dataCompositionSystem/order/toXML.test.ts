import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"
import { orderFixture } from "./__fixtures__/data"

const rule: PropertyRule = {
  type: "Order",
}

describe("export Order to XML", () => {
  it("exports full to XML", () => {
    const { result, expectedResult } = testExportPropertyToXML({
      rule,
      value: orderFixture,
      xmlRootTag: "dcsset:order",
      path: "full.xml",
      importMetaUrl: import.meta.url,
    })

    expect(result).toEqual(expectedResult)
  })
})
