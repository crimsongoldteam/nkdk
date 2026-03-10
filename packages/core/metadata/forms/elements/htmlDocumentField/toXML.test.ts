import { describe, expect, it } from "vitest"
import { testExportElementToXML } from "~/tests/exportElementToXML"
import { fullHtmlDocumentField, minimalHtmlDocumentField } from "~/tests/fixtures/forms/htmlDocumentField/data"

describe("exportHTMLDocumentFieldToXML", () => {
  it("should export all fields to XML", () => {
    const resultData = testExportElementToXML({
      element: fullHtmlDocumentField,
      path: "forms/htmlDocumentField/full.xml",
    })

    expect(resultData.result).toEqual(resultData.expectedResult)
  })

  it("should export minimal", () => {
    const resultData = testExportElementToXML({
      element: minimalHtmlDocumentField,
      path: "forms/htmlDocumentField/minimal.xml",
    })

    expect(resultData.result).toEqual(resultData.expectedResult)
  })
})
