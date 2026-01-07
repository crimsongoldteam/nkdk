import { describe, expect, it } from "vitest"
import { fullCalendarField, minimalCalendarField } from "~/tests/fixtures/forms/calendarField/data"
import { mockСontext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importCalendarFieldFromXML } from "./importFromXML"
import { CalendarFieldXML } from "./types"

describe("importCalendarFieldFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importCalendarFieldFromXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ CalendarField: CalendarFieldXML }>("forms/calendarField/full.xml")

    const result = importCalendarFieldFromXML(mockСontext, xmlData.CalendarField)

    expect(result).toEqual(fullCalendarField)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ CalendarField: CalendarFieldXML }>("forms/calendarField/minimal.xml")

    const result = importCalendarFieldFromXML(mockСontext, xmlData.CalendarField)

    expect(result).toEqual(minimalCalendarField)
  })
})

