import { describe, expect, it } from "vitest"
import { testExportElementToXML } from "~/tests/exportElementToXML"
import { fullProgressBarField, minimalProgressBarField } from "~/tests/fixtures/forms/progressBarField/data"

describe("exportProgressBarFieldToXML", () => {
  it("should export all fields to XML", () => {
    const resultData = testExportElementToXML({
      element: fullProgressBarField,
      path: "forms/progressBarField/full.xml",
    })

    expect(resultData.result).toEqual(resultData.expectedResult)
  })

  it("should export minimal", () => {
    const resultData = testExportElementToXML({
      element: minimalProgressBarField,
      path: "forms/progressBarField/minimal.xml",
    })

    expect(resultData.result).toEqual(resultData.expectedResult)
  })
})
