import { describe, expect, it } from "vitest"
import { testExportElementToXML } from "~/tests/exportElementToXML"
import { fullGanttChartField, minimalGanttChartField } from "~/tests/fixtures/forms/ganttChartField/data"

describe("exportGanttChartFieldToXML", () => {
  it("should export all fields to XML", () => {
    const resultData = testExportElementToXML({
      element: fullGanttChartField,
      path: "forms/ganttChartField/full.xml",
    })

    expect(resultData.result).toEqual(resultData.expectedResult)
  })

  it("should export minimal", () => {
    const resultData = testExportElementToXML({
      element: minimalGanttChartField,
      path: "forms/ganttChartField/minimal.xml",
    })

    expect(resultData.result).toEqual(resultData.expectedResult)
  })
})
