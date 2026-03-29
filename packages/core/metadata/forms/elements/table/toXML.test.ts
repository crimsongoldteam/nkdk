import { describe, expect, it } from "vitest"
import { testExportElementToXML } from "~/tests/element/exportElementToXML"
import { fullTable, minimalTable } from "~/metadata/forms/elements/table/__fixtures__/data"
import { testFixturesDir } from "~/tests/testFixturesDir"

describe("exportTableToXML", () => {
  it("should export all fields to XML", () => {
    const resultData = testExportElementToXML({
      element: fullTable,
      path: "full.xml", baseDir: testFixturesDir(import.meta.url),
    })

    expect(resultData.result).toEqual(resultData.expectedResult)
  })

  it("should export minimal", () => {
    const resultData = testExportElementToXML({
      element: minimalTable,
      path: "minimal.xml", baseDir: testFixturesDir(import.meta.url),
    })

    expect(resultData.result.trimEnd()).toEqual(resultData.expectedResult.trimEnd())
  })
})
