import { describe, expect, it } from "vitest"
import { exportElementToXML } from "~/metadata/metadataFactory"
import { fullCalendarField, minimalCalendarField } from "~/tests/fixtures/forms/calendarField/data"
import { mockContext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"

describe("exportCalendarFieldToXML", () => {
  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/calendarField/full.xml")
    const xmlData = exportElementToXML({ context: mockContext, data: fullCalendarField })

    const result = xmlExport({ CalendarField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/calendarField/minimal.xml")
    const xmlData = exportElementToXML({ context: mockContext, data: minimalCalendarField })

    const result = xmlExport({ CalendarField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
