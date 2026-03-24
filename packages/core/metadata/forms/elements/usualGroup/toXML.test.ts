import { describe, expect, it } from "vitest"
import { testExportElementToXML } from "~/tests/element/exportElementToXML"
import { fullUsualGroup, minimalUsualGroup } from "~/tests/fixtures/forms/usualGroup/data"

describe("exportUsualGroupToXML", () => {
  it("should export all fields to XML", () => {
    const resultData = testExportElementToXML({
      element: fullUsualGroup,
      path: "forms/usualGroup/full.xml",
    })

    expect(resultData.result).toEqual(resultData.expectedResult)
  })

  it("should export minimal", () => {
    const resultData = testExportElementToXML({
      element: minimalUsualGroup,
      path: "forms/usualGroup/minimal.xml",
    })

    expect(resultData.result).toEqual(resultData.expectedResult)
  })
})
