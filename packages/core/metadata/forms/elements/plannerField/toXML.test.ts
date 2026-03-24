import { describe, expect, it } from "vitest"
import { testExportElementToXML } from "~/tests/element/exportElementToXML"
import { fullPlannerField, minimalPlannerField } from "~/tests/fixtures/forms/plannerField/data"

describe("exportPlannerFieldToXML", () => {
  it("should export all fields to XML", () => {
    const resultData = testExportElementToXML({
      element: fullPlannerField,
      path: "forms/plannerField/full.xml",
    })

    expect(resultData.result).toEqual(resultData.expectedResult)
  })

  it("should export minimal", () => {
    const resultData = testExportElementToXML({
      element: minimalPlannerField,
      path: "forms/plannerField/minimal.xml",
    })

    expect(resultData.result).toEqual(resultData.expectedResult)
  })
})
