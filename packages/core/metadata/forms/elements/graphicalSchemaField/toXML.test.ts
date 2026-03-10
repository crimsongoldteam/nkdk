import { describe, expect, it } from "vitest"
import { testExportElementToXML } from "~/tests/exportElementToXML"
import { fullGraphicalSchemaField, minimalGraphicalSchemaField } from "~/tests/fixtures/forms/graphicalSchemaField/data"

describe("exportGraphicalSchemaFieldToXML", () => {
  it("should export all fields to XML", () => {
    const resultData = testExportElementToXML({
      element: fullGraphicalSchemaField,
      path: "forms/graphicalSchemaField/full.xml",
    })

    expect(resultData.result).toEqual(resultData.expectedResult)
  })

  it("should export minimal", () => {
    const resultData = testExportElementToXML({
      element: minimalGraphicalSchemaField,
      path: "forms/graphicalSchemaField/minimal.xml",
    })

    expect(resultData.result).toEqual(resultData.expectedResult)
  })
})
