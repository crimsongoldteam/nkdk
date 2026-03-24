import { describe, expect, it } from "vitest"
import { testExportElementToXML } from "~/tests/element/exportElementToXML"
import { fullChartField, minimalChartField } from "~/tests/fixtures/forms/chartField/data"

describe("exportChartFieldToXML", () => {
  it("should export all fields to XML", () => {
    const resultData = testExportElementToXML({
      element: fullChartField,
      path: "forms/chartField/full.xml",
    })

    expect(resultData.result).toEqual(resultData.expectedResult)
  })

  it("should export minimal", () => {
    const resultData = testExportElementToXML({
      element: minimalChartField,
      path: "forms/chartField/minimal.xml",
    })

    expect(resultData.result).toEqual(resultData.expectedResult)
  })
})
