import { describe, expect, it } from "vitest"
import { testExportElementToXML } from "~/tests/element/exportElementToXML"
import { fullUsualGroup, minimalUsualGroup } from "~/metadata/forms/elements/usualGroup/__fixtures__/data"
import { testFixturesDir } from "~/tests/testFixturesDir"

describe("exportUsualGroupToXML", () => {
  it("should export all fields to XML", () => {
    const resultData = testExportElementToXML({
      element: fullUsualGroup,
      path: "full.xml", baseDir: testFixturesDir(import.meta.url),
    })

    expect(resultData.result).toEqual(resultData.expectedResult)
  })

  it("should export minimal", () => {
    const resultData = testExportElementToXML({
      element: minimalUsualGroup,
      path: "minimal.xml", baseDir: testFixturesDir(import.meta.url),
    })

    expect(resultData.result).toEqual(resultData.expectedResult)
  })
})
