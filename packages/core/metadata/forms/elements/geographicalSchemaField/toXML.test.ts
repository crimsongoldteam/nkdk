import { describe, expect, it } from "vitest"
import { testExportElementToXML } from "~/tests/exportElementToXML"
import {
  fullGeographicalSchemaField,
  minimalGeographicalSchemaField,
} from "~/tests/fixtures/forms/geographicalSchemaField/data"

describe("exportGeographicalSchemaFieldToXML", () => {
  it("should export all fields to XML", () => {
    const resultData = testExportElementToXML({
      element: fullGeographicalSchemaField,
      path: "forms/geographicalSchemaField/full.xml",
    })

    expect(resultData.result).toEqual(resultData.expectedResult)
  })

  it("should export minimal", () => {
    const resultData = testExportElementToXML({
      element: minimalGeographicalSchemaField,
      path: "forms/geographicalSchemaField/minimal.xml",
    })

    expect(resultData.result).toEqual(resultData.expectedResult)
  })
})
