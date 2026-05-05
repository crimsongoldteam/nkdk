import { describe, expect, it } from "vitest"
import { testExportElementToXML } from "~/tests/exportElementToXML"
import { fullPictureField, minimalPictureField } from "~/tests/fixtures/forms/pictureField/data"

describe("exportPictureFieldToXML", () => {
  it("should export all fields to XML", () => {
    const resultData = testExportElementToXML({
      element: fullPictureField,
      path: "forms/pictureField/full.xml",
    })

    expect(resultData.result).toEqual(resultData.expectedResult)
  })

  it("should export minimal", () => {
    const resultData = testExportElementToXML({
      element: minimalPictureField,
      path: "forms/pictureField/minimal.xml",
    })

    expect(resultData.result).toEqual(resultData.expectedResult)
  })
})
