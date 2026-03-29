import { describe, expect, it } from "vitest"
import { testExportElementToXML } from "~/tests/element/exportElementToXML"
import { fullPlannerField, minimalPlannerField } from "~/metadata/forms/elements/plannerField/__fixtures__/data"
import { testFixturesDir } from "~/tests/testFixturesDir"

describe("exportPlannerFieldToXML", () => {
  it("should export all fields to XML", () => {
    const resultData = testExportElementToXML({
      element: fullPlannerField,
      path: "full.xml", baseDir: testFixturesDir(import.meta.url),
    })

    expect(resultData.result).toEqual(resultData.expectedResult)
  })

  it("should export minimal", () => {
    const resultData = testExportElementToXML({
      element: minimalPlannerField,
      path: "minimal.xml", baseDir: testFixturesDir(import.meta.url),
    })

    expect(resultData.result).toEqual(resultData.expectedResult)
  })
})
