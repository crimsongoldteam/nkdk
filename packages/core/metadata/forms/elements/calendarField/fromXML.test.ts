import { describe, expect, it } from "vitest"
import { ElementXML, importElementFromXML } from "~/metadata/orchestration"
import { fullCalendarField, minimalCalendarField } from "~/metadata/forms/elements/calendarField/__fixtures__/data"
import { mockContextFromXML } from "~/tests/mockContext"

describe("importCalendarFieldFromXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "CalendarField",
      xml: undefined,
    })

    expect(result).toBeUndefined()
  })

  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFixture<{ CalendarField: ElementXML }>(import.meta.url, "full.xml")

    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "CalendarField",
      xml: xmlData.CalendarField,
    })

    expect(result).toEqual(fullCalendarField)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFixture<{ CalendarField: ElementXML }>(import.meta.url, "minimal.xml")

    const result = importElementFromXML({
      context: mockContextFromXML(),
      itemType: "CalendarField",
      xml: xmlData.CalendarField,
    })

    expect(result).toEqual(minimalCalendarField)
  })
})
