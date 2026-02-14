import { describe, expect, it } from "vitest"
import { ElementXML, FormElementType, importElementFromXML } from "~/metadata/metadataFactory"
import { fullCalendarField, minimalCalendarField } from "~/tests/fixtures/forms/calendarField/data"
import { mockContext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"

describe("importCalendarFieldFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importElementFromXML({
      context: mockContext,
      itemType: FormElementType.CalendarField,
      xml: undefined,
    })

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ CalendarField: ElementXML }>("forms/calendarField/full.xml")

    const result = importElementFromXML({
      context: mockContext,
      itemType: FormElementType.CalendarField,
      xml: xmlData.CalendarField,
    })

    expect(result).toEqual(fullCalendarField)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ CalendarField: ElementXML }>("forms/calendarField/minimal.xml")

    const result = importElementFromXML({
      context: mockContext,
      itemType: FormElementType.CalendarField,
      xml: xmlData.CalendarField,
    })

    expect(result).toEqual(minimalCalendarField)
  })
})
