import { describe, expect, it } from "vitest"
import { testExportElementToXML } from "~/tests/element/exportElementToXML"
import { fullColumnGroup, minimalColumnGroup } from "~/tests/fixtures/forms/columnGroup/data"

describe("exportColumnGroupToXML", () => {
  it("should export all fields to XML", () => {
    const resultData = testExportElementToXML({
      element: fullColumnGroup,
      path: "forms/columnGroup/full.xml",
    })

    expect(resultData.result).toEqual(resultData.expectedResult)
  })

  it("should export minimal", () => {
    const resultData = testExportElementToXML({
      element: minimalColumnGroup,
      path: "forms/columnGroup/minimal.xml",
    })

    expect(resultData.result).toEqual(resultData.expectedResult)
  })
})
