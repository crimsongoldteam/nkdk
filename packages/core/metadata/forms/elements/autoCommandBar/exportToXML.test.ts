import { describe, expect, it } from "vitest"
import { fullAutoCommandBar, minimalAutoCommandBar } from "~/tests/fixtures/forms/autoCommandBar/data"
import { mockСontext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportAutoCommandBarToXML } from "./exportToXML"

describe("exportAutoCommandBarToXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportAutoCommandBarToXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/commandBar/full.xml")
    const xmlData = exportAutoCommandBarToXML(mockСontext, fullAutoCommandBar)

    const result = xmlExport({ AutoCommandBar: xmlData }, false)

    expect(result).toEqual(expectedResult.replace(/<CommandBar/g, "<AutoCommandBar").replace(/<\/CommandBar>/g, "</AutoCommandBar>"))
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/commandBar/minimal.xml")
    const xmlData = exportAutoCommandBarToXML(mockСontext, minimalAutoCommandBar)

    const result = xmlExport({ AutoCommandBar: xmlData }, false)

    expect(result).toEqual(expectedResult.replace(/<CommandBar/g, "<AutoCommandBar").replace(/<\/CommandBar>/g, "</AutoCommandBar>"))
  })
})
