import { describe, expect, it } from "vitest"
import { testExportElementToXML } from "~/tests/exportElementToXML"
import {
  fullFormattedDocumentField,
  minimalFormattedDocumentField,
} from "~/tests/fixtures/forms/formattedDocumentField/data"

describe("exportFormattedDocumentFieldToXML", () => {
  it("should export all fields to XML", () => {
    const resultData = testExportElementToXML({
      element: fullFormattedDocumentField,
      path: "forms/formattedDocumentField/full.xml",
    })

    expect(resultData.result).toEqual(resultData.expectedResult)
  })

  it("should export minimal", () => {
    const resultData = testExportElementToXML({
      element: minimalFormattedDocumentField,
      path: "forms/formattedDocumentField/minimal.xml",
    })

    expect(resultData.result).toEqual(resultData.expectedResult)
  })
})
