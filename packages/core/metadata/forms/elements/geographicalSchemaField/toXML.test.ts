import { describe, expect, it } from "vitest"
import { testExportElementToXML } from "~/tests/element/exportElementToXML"
import {
import { testFixturesDir } from "~/tests/testFixturesDir"
  fullGeographicalSchemaField,
  minimalGeographicalSchemaField,
} from "~/metadata/forms/elements/geographicalSchemaField/__fixtures__/data"

describe("exportGeographicalSchemaFieldToXML", () => {
  it("should export all fields to XML", () => {
    const resultData = testExportElementToXML({
      element: fullGeographicalSchemaField,
      path: "full.xml", baseDir: testFixturesDir(import.meta.url),
    })

    expect(resultData.result).toEqual(resultData.expectedResult)
  })

  it("should export minimal", () => {
    const resultData = testExportElementToXML({
      element: minimalGeographicalSchemaField,
      path: "minimal.xml", baseDir: testFixturesDir(import.meta.url),
    })

    expect(resultData.result).toEqual(resultData.expectedResult)
  })
})
