import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"
import { fullFilterForExport } from "./__fixtures__/data"

const rule: PropertyRule = {
  type: "Filter",
}

describe("export Filter to XML", () => {
  it("exports full to XML", () => {
    const { result, expectedResult } = testExportPropertyToXML({
      rule,
      value: fullFilterForExport,
      xmlRootTag: "dcsset:filter",
    })

    expect(result).toEqual(expectedResult)
  })
})
