import { describe, expect, it } from "vitest"
import { testExportElementToXML } from "~/tests/exportElementToXML"
import { fullPage, minimalPage } from "~/tests/fixtures/forms/page/data"

describe("exportPageToXML", () => {
  it("should export all fields to XML", () => {
    const resultData = testExportElementToXML({
      element: fullPage,
      path: "forms/page/full.xml",
    })

    expect(resultData.result).toEqual(resultData.expectedResult)
  })

  it("should export minimal", () => {
    const resultData = testExportElementToXML({
      element: minimalPage,
      path: "forms/page/minimal.xml",
    })

    expect(resultData.result).toEqual(resultData.expectedResult)
  })
})
