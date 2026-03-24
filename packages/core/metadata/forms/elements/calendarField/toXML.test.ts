import { describe, expect, it } from "vitest"
import { testExportElementToXML } from "~/tests/element/exportElementToXML"
import { fullCalendarField, minimalCalendarField } from "~/tests/fixtures/forms/calendarField/data"

describe("exportCalendarFieldToXML", () => {
  it("should export all fields to XML", () => {
    const resultData = testExportElementToXML({
      element: fullCalendarField,
      path: "forms/calendarField/full.xml",
    })

    expect(resultData.result).toEqual(resultData.expectedResult)
  })

  it("should export minimal", () => {
    const resultData = testExportElementToXML({
      element: minimalCalendarField,
      path: "forms/calendarField/minimal.xml",
    })

    expect(resultData.result).toEqual(resultData.expectedResult)
  })
})
