import { describe, expect, it } from "vitest"
import "~/metadata/forms/elements/exportToXML"
import { fullAutoCommandBar, minimalAutoCommandBar, parentElement } from "~/tests/fixtures/forms/autoCommandBar/data"
import { mockСontext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportAutoCommandBarToXML } from "./exportToXML"

describe("exportAutoCommandBarToXML", () => {
  it("should return all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/autoCommandBar/full.xml")

    const xmlData = exportAutoCommandBarToXML(mockСontext, fullAutoCommandBar, parentElement)

    const result = xmlExport({ AutoCommandBar: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should return default when data is undefined", () => {
    const expectedResult = readXMLFileAsString("forms/autoCommandBar/minimal.xml")

    const xmlData = exportAutoCommandBarToXML(mockСontext, undefined, parentElement)

    const result = xmlExport({ AutoCommandBar: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should return name 'КоманднаяПанель' when parentElement is form", () => {
    const expectedResult = readXMLFileAsString("forms/autoCommandBar/minimal.xml")

    const xmlData = exportAutoCommandBarToXML(mockСontext, undefined, parentElement)

    const result = xmlExport({ AutoCommandBar: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/autoCommandBar/minimal.xml")
    const xmlData = exportAutoCommandBarToXML(mockСontext, minimalAutoCommandBar, parentElement)

    const result = xmlExport({ AutoCommandBar: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
