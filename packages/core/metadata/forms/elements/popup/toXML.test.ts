import { describe, expect, it } from "vitest"
import { testExportElementToXML } from "~/tests/exportElementToXML"
import { fullPopup, minimalPopup } from "~/tests/fixtures/forms/popup/data"

describe("exportPopupToXML", () => {
  it("should export all fields to XML", () => {
    const resultData = testExportElementToXML({
      element: fullPopup,
      path: "forms/popup/full.xml",
    })

    expect(resultData.result).toEqual(resultData.expectedResult)
  })

  it("should export minimal", () => {
    const resultData = testExportElementToXML({
      element: minimalPopup,
      path: "forms/popup/minimal.xml",
    })

    expect(resultData.result).toEqual(resultData.expectedResult)
  })
})
