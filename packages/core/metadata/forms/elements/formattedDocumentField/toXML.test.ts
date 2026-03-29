import { describe, expect, it } from "vitest"
import { testExportElementToXML } from "~/tests/element/exportElementToXML"
import {
import { testFixturesDir } from "~/tests/testFixturesDir"
  fullFormattedDocumentField,
  minimalFormattedDocumentField,
} from "~/metadata/forms/elements/formattedDocumentField/__fixtures__/data"

describe("exportFormattedDocumentFieldToXML", () => {
  it("should export all fields to XML", () => {
    const resultData = testExportElementToXML({
      element: fullFormattedDocumentField,
      path: "full.xml", baseDir: testFixturesDir(import.meta.url),
    })

    expect(resultData.result).toEqual(resultData.expectedResult)
  })

  it("should export minimal", () => {
    const resultData = testExportElementToXML({
      element: minimalFormattedDocumentField,
      path: "minimal.xml", baseDir: testFixturesDir(import.meta.url),
    })

    expect(resultData.result).toEqual(resultData.expectedResult)
  })
})
