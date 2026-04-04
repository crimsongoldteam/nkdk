import { describe, expect, it } from "vitest"
import { PropertyRule } from "~/metadata/orchestration"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"
import { dataParametersFixture } from "./__fixtures__/data"

const rule: PropertyRule = {
  type: "DataParameters",
}

describe("export DataParameters to XML", () => {
  it("exports full fixture", () => {
    const { result, expectedResult } = testExportPropertyToXML({
      rule,
      value: dataParametersFixture,
      path: "full.xml",
      importMetaUrl: import.meta.url,
      exportXmlDataAsRoot: true,
    })

    expect(result).toEqual(expectedResult)
  })
})
