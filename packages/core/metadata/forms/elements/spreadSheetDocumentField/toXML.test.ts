import { describe, expect, it } from "vitest"
import { testExportElementToXML } from "~/tests/exportElementToXML"
import {
  fullSpreadSheetDocumentField,
  minimalSpreadSheetDocumentField,
} from "~/tests/fixtures/forms/spreadSheetDocumentField/data"

describe("exportSpreadSheetDocumentFieldToXML", () => {
  it("should export all fields to XML", () => {
    const resultData = testExportElementToXML({
      element: fullSpreadSheetDocumentField,
      path: "forms/spreadSheetDocumentField/full.xml",
    })

    expect(resultData.result).toEqual(resultData.expectedResult)
  })

  it("should export minimal", () => {
    const resultData = testExportElementToXML({
      element: minimalSpreadSheetDocumentField,
      path: "forms/spreadSheetDocumentField/minimal.xml",
    })

    expect(resultData.result).toEqual(resultData.expectedResult)
  })
})
