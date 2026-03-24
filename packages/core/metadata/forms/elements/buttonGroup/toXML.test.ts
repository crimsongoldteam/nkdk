import { describe, expect, it } from "vitest"
import { testExportElementToXML } from "~/tests/element/exportElementToXML"
import { fullButtonGroup, minimalButtonGroup } from "~/tests/fixtures/forms/buttonGroup/data"

describe("exportButtonGroupToXML", () => {
  it("should export all fields to XML", () => {
    const resultData = testExportElementToXML({
      element: fullButtonGroup,
      path: "forms/buttonGroup/full.xml",
    })

    expect(resultData.result).toEqual(resultData.expectedResult)
  })

  it("should export minimal", () => {
    const resultData = testExportElementToXML({
      element: minimalButtonGroup,
      path: "forms/buttonGroup/minimal.xml",
    })

    expect(resultData.result).toEqual(resultData.expectedResult)
  })
})
