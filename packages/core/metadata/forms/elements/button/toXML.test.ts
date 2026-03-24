import { describe, expect, it } from "vitest"
import { testExportElementToXML } from "~/tests/element/exportElementToXML"
import { fullButton, minimalButton } from "~/tests/fixtures/forms/button/data"

describe("exportButtonToXML", () => {
  it("should export all fields to XML", () => {
    const resultData = testExportElementToXML({
      element: fullButton,
      path: "forms/button/full.xml",
    })

    expect(resultData.result).toEqual(resultData.expectedResult)
  })

  it("should export minimal", () => {
    const resultData = testExportElementToXML({
      element: minimalButton,
      path: "forms/button/minimal.xml",
    })

    expect(resultData.result).toEqual(resultData.expectedResult)
  })
})
