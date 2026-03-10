import { describe, expect, it } from "vitest"
import { testExportElementToXML } from "~/tests/exportElementToXML"
import { fullLabelDecoration, minimalLabelDecoration } from "~/tests/fixtures/forms/labelDecoration/data"

describe("exportLabelDecorationToXML", () => {
  it("should export all fields to XML", () => {
    const resultData = testExportElementToXML({
      element: fullLabelDecoration,
      path: "forms/labelDecoration/full.xml",
    })

    expect(resultData.result).toEqual(resultData.expectedResult)
  })

  it("should export minimal", () => {
    const resultData = testExportElementToXML({
      element: minimalLabelDecoration,
      path: "forms/labelDecoration/minimal.xml",
    })

    expect(resultData.result).toEqual(resultData.expectedResult)
  })
})
