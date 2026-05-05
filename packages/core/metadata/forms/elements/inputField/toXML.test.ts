import { describe, expect, it } from "vitest"
import { testExportElementToXML } from "~/tests/exportElementToXML"
import { fullInputField, minimalInputField } from "~/tests/fixtures/forms/inputField/data"

describe("exportInputFieldToXML", () => {
  it("should export all fields to XML", () => {
    const resultData = testExportElementToXML({
      element: fullInputField,
      path: "forms/inputField/full.xml",
    })

    expect(resultData.result).toEqual(resultData.expectedResult)
  })

  it("should export minimal", () => {
    const resultData = testExportElementToXML({
      element: minimalInputField,
      path: "forms/inputField/minimal.xml",
    })

    expect(resultData.result).toEqual(resultData.expectedResult)
  })
})
