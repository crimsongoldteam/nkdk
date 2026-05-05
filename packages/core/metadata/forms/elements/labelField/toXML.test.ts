import { describe, expect, it } from "vitest"
import { testExportElementToXML } from "~/tests/exportElementToXML"
import { fullLabelField, minimalLabelField } from "~/tests/fixtures/forms/labelField/data"

describe("exportLabelFieldToXML", () => {
  it("should export all fields to XML", () => {
    const resultData = testExportElementToXML({
      element: fullLabelField,
      path: "forms/labelField/full.xml",
    })

    expect(resultData.result).toEqual(resultData.expectedResult)
  })

  it("should export minimal", () => {
    const resultData = testExportElementToXML({
      element: minimalLabelField,
      path: "forms/labelField/minimal.xml",
    })

    expect(resultData.result).toEqual(resultData.expectedResult)
  })
})
