import { describe, expect, it } from "vitest"
import { testExportElementToXML } from "~/tests/exportElementToXML"
import { fullTable, minimalTable } from "~/tests/fixtures/forms/table/data"

describe("exportTableToXML", () => {
  it("should export all fields to XML", () => {
    const resultData = testExportElementToXML({
      element: fullTable,
      path: "forms/table/full.xml",
    })

    expect(resultData.result).toEqual(resultData.expectedResult)
  })

  it("should export minimal", () => {
    const resultData = testExportElementToXML({
      element: minimalTable,
      path: "forms/table/minimal.xml",
    })

    expect(resultData.result.trimEnd()).toEqual(resultData.expectedResult.trimEnd())
  })
})
