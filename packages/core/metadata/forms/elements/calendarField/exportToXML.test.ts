import { describe, expect, it } from "vitest"
import { fullCalendarField, minimalCalendarField } from "~/tests/fixtures/forms/calendarField/data"
import { mockСontext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportCalendarFieldToXML } from "./exportToXML"

describe("exportCalendarFieldToXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportCalendarFieldToXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/calendarField/full.xml")
    const xmlData = exportCalendarFieldToXML(mockСontext, fullCalendarField)

    const result = xmlExport({ CalendarField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/calendarField/minimal.xml")
    const xmlData = exportCalendarFieldToXML(mockСontext, minimalCalendarField)

    const result = xmlExport({ CalendarField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})

