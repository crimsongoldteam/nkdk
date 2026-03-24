import { describe, expect, it } from "vitest"
import { testExportElementToXML } from "~/tests/element/exportElementToXML"
import { fullDendrogramField, minimalDendrogramField } from "~/tests/fixtures/forms/dendrogramField/data"

describe("exportDendrogramFieldToXML", () => {
  it("should export all fields to XML", () => {
    const resultData = testExportElementToXML({
      element: fullDendrogramField,
      path: "forms/dendrogramField/full.xml",
    })

    expect(resultData.result).toEqual(resultData.expectedResult)
  })

  it("should export minimal", () => {
    const resultData = testExportElementToXML({
      element: minimalDendrogramField,
      path: "forms/dendrogramField/minimal.xml",
    })

    expect(resultData.result).toEqual(resultData.expectedResult)
  })
})
