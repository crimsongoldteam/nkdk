import { describe, expect, it } from "vitest"
import { testExportElementToXML } from "~/tests/exportElementToXML"
import { fullCommandBar, minimalCommandBar } from "~/tests/fixtures/forms/commandBar/data"

describe("exportCommandBarToXML", () => {
  it("should export all fields to XML", () => {
    const resultData = testExportElementToXML({
      element: fullCommandBar,
      path: "forms/commandBar/full.xml",
    })

    expect(resultData.result).toEqual(resultData.expectedResult)
  })

  it("should export minimal", () => {
    const resultData = testExportElementToXML({
      element: minimalCommandBar,
      path: "forms/commandBar/minimal.xml",
    })

    expect(resultData.result).toEqual(resultData.expectedResult)
  })
})
