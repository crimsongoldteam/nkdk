import { describe, expect, it } from "vitest"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportEventsToXML } from "./exportToXML"

import { multipleEvents, singleEvent } from "~/tests/fixtures/forms/events/data"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"

describe("exportEventsToXML", () => {
  it("should return undefined for undefined input", () => {
    const result = exportEventsToXML(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should export single event", () => {
    const expectedResult = readXMLFileAsString("forms/events/single.xml")

    const xmlResult = exportEventsToXML(mockContext, mockRule, singleEvent)

    const result = xmlExport({ Events: xmlResult }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export multiple events", () => {
    const expectedResult = readXMLFileAsString("forms/events/multiple.xml")

    const xmlResult = exportEventsToXML(mockContext, mockRule, multipleEvents)

    const result = xmlExport({ Events: xmlResult }, false)

    expect(result).toEqual(expectedResult)
  })
})
