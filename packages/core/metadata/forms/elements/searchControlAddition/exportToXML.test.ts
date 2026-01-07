import { describe, expect, it } from "vitest"
import { fullSearchControlAddition, minimalSearchControlAddition } from "~/tests/fixtures/forms/searchControlAddition/data"
import { mockСontext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportSearchControlAdditionToXML } from "./exportToXML"

describe("exportSearchControlAdditionToXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportSearchControlAdditionToXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/searchControlAddition/full.xml")
    const xmlData = exportSearchControlAdditionToXML(mockСontext, fullSearchControlAddition)

    const result = xmlExport({ SearchControlAddition: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/searchControlAddition/minimal.xml")
    const xmlData = exportSearchControlAdditionToXML(mockСontext, minimalSearchControlAddition)

    const result = xmlExport({ SearchControlAddition: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})

