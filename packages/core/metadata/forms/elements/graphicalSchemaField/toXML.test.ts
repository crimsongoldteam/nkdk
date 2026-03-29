import { describe, expect, it } from "vitest"
import { testExportElementToXML } from "~/tests/element/exportElementToXML"
import { fullGraphicalSchemaField, minimalGraphicalSchemaField } from "~/metadata/forms/elements/graphicalSchemaField/__fixtures__/data"
import { testFixturesDir } from "~/tests/testFixturesDir"

describe("exportGraphicalSchemaFieldToXML", () => {
  it("should export all fields to XML", () => {
    const resultData = testExportElementToXML({
      element: fullGraphicalSchemaField,
      path: "full.xml", baseDir: testFixturesDir(import.meta.url),
    })

    expect(resultData.result).toEqual(resultData.expectedResult)
  })

  it("should export minimal", () => {
    const resultData = testExportElementToXML({
      element: minimalGraphicalSchemaField,
      path: "minimal.xml", baseDir: testFixturesDir(import.meta.url),
    })

    expect(resultData.result).toEqual(resultData.expectedResult)
  })
})
