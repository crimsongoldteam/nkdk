import { describe, expect, it } from "vitest"
import "~/metadata/commonObjects/exportToXML"
import "~/metadata/forms/elements/calendarField/rules"
import "~/metadata/forms/elements/exportToXML"
import { fullCalendarField, minimalCalendarField } from "~/tests/fixtures/forms/calendarField/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportCalendarFieldToXML } from "./exportToXML"

describe("exportCalendarFieldToXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportCalendarFieldToXML(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/calendarField/full.xml")
    const xmlData = exportCalendarFieldToXML(mockContext, mockRule, fullCalendarField)

    const result = xmlExport({ CalendarField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/calendarField/minimal.xml")
    const xmlData = exportCalendarFieldToXML(mockContext, mockRule, minimalCalendarField)

    const result = xmlExport({ CalendarField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
