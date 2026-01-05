import { describe, expect, it } from "vitest"
import { multipleEvents, singleEvent } from "~/tests/fixtures/forms/events/data"
import { mockСontext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importEventsFromXML } from "./importFromXML"
import { EventsXML } from "./types"

describe("importEventsFromXML", () => {
  it("should return undefined for undefined input", () => {
    const result = importEventsFromXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should import single event", () => {
    const xml = readAndParseXMLFile<{ Events: EventsXML }>("forms/events/single.xml")

    const result = importEventsFromXML(mockСontext, xml.Events)

    expect(result).toEqual(singleEvent)
  })

  it("should import multiple events", () => {
    const xml = readAndParseXMLFile<{ Events: EventsXML }>("forms/events/multiple.xml")

    const result = importEventsFromXML(mockСontext, xml.Events)

    expect(result).toEqual(multipleEvents)
  })
})
