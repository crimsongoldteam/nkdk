import { describe, expect, it } from "vitest"
import { testExportElementToXML } from "~/tests/element/exportElementToXML"
import { fullCommandBar, minimalCommandBar } from "~/metadata/forms/elements/commandBar/__fixtures__/data"
import { testFixturesDir } from "~/tests/testFixturesDir"

describe("exportCommandBarToXML", () => {
  it("should export all fields to XML", () => {
    const resultData = testExportElementToXML({
      element: fullCommandBar,
      path: "full.xml", baseDir: testFixturesDir(import.meta.url),
    })

    expect(resultData.result).toEqual(resultData.expectedResult)
  })

  it("should export minimal", () => {
    const resultData = testExportElementToXML({
      element: minimalCommandBar,
      path: "minimal.xml", baseDir: testFixturesDir(import.meta.url),
    })

    expect(resultData.result).toEqual(resultData.expectedResult)
  })
})
