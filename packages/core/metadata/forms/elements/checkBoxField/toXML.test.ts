import { describe, expect, it } from "vitest"
import { testExportElementToXML } from "~/tests/exportElementToXML"
import { fullCheckBoxField, minimalCheckBoxField } from "~/tests/fixtures/forms/checkBoxField/data"

describe("exportCheckBoxFieldToXML", () => {
  it("should export all fields to XML", () => {
    const resultData = testExportElementToXML({
      element: fullCheckBoxField,
      path: "forms/checkBoxField/full.xml",
    })

    expect(resultData.result).toEqual(resultData.expectedResult)
  })

  it("should export minimal", () => {
    const resultData = testExportElementToXML({
      element: minimalCheckBoxField,
      path: "forms/checkBoxField/minimal.xml",
    })

    expect(resultData.result).toEqual(resultData.expectedResult)
  })
})
