import { describe, expect, it } from "vitest"
import { testExportElementToXML } from "~/tests/element/exportElementToXML"
import { fullButton, minimalButton } from "~/metadata/forms/elements/button/__fixtures__/data"
import { testFixturesDir } from "~/tests/testFixturesDir"

describe("exportButtonToXML", () => {
  it("should export all fields to XML", () => {
    const resultData = testExportElementToXML({
      element: fullButton,
      path: "full.xml", baseDir: testFixturesDir(import.meta.url),
    })

    expect(resultData.result).toEqual(resultData.expectedResult)
  })

  it("should export minimal", () => {
    const resultData = testExportElementToXML({
      element: minimalButton,
      path: "minimal.xml", baseDir: testFixturesDir(import.meta.url),
    })

    expect(resultData.result).toEqual(resultData.expectedResult)
  })
})
