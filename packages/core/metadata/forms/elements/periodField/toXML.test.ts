import { describe, expect, it } from "vitest"
import { testExportElementToXML } from "~/tests/exportElementToXML"
import { fullPeriodField, minimalPeriodField } from "~/tests/fixtures/forms/periodField/data"

describe("exportPeriodFieldToXML", () => {
  it("should export all fields to XML", () => {
    const resultData = testExportElementToXML({
      element: fullPeriodField,
      path: "forms/periodField/full.xml",
    })

    expect(resultData.result).toEqual(resultData.expectedResult)
  })

  it("should export minimal", () => {
    const resultData = testExportElementToXML({
      element: minimalPeriodField,
      path: "forms/periodField/minimal.xml",
    })

    expect(resultData.result).toEqual(resultData.expectedResult)
  })
})
