import { describe, expect, it } from "vitest"
import { fullSearchStringAddition, minimalSearchStringAddition } from "~/tests/fixtures/forms/searchStringAddition/data"
import { mockСontext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportSearchStringAdditionToXML } from "./exportToXML"

describe("exportSearchStringAdditionToXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportSearchStringAdditionToXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/searchStringAddition/full.xml")
    const xmlData = exportSearchStringAdditionToXML(mockСontext, fullSearchStringAddition)

    const result = xmlExport({ SearchStringAddition: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/searchStringAddition/minimal.xml")
    const xmlData = exportSearchStringAdditionToXML(mockСontext, minimalSearchStringAddition)

    const result = xmlExport({ SearchStringAddition: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})

