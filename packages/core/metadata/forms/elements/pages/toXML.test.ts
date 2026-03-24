import { describe, expect, it } from "vitest"
import { testExportElementToXML } from "~/tests/element/exportElementToXML"
import { fullPages, minimalPages } from "~/tests/fixtures/forms/pages/data"

describe("exportPagesToXML", () => {
  it("should export all fields to XML", () => {
    const resultData = testExportElementToXML({
      element: fullPages,
      path: "forms/pages/full.xml",
    })

    expect(resultData.result).toEqual(resultData.expectedResult)
  })

  it("should export minimal", () => {
    const resultData = testExportElementToXML({
      element: minimalPages,
      path: "forms/pages/minimal.xml",
    })

    expect(resultData.result).toEqual(resultData.expectedResult)
  })
})
