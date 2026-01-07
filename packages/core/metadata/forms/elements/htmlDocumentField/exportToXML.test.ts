import { describe, expect, it } from "vitest"
import { fullHtmlDocumentField, minimalHtmlDocumentField } from "~/tests/fixtures/forms/htmlDocumentField/data"
import { mockСontext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportHtmlDocumentFieldToXML } from "./exportToXML"

describe("exportHtmlDocumentFieldToXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportHtmlDocumentFieldToXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/htmlDocumentField/full.xml")
    const xmlData = exportHtmlDocumentFieldToXML(mockСontext, fullHtmlDocumentField)

    const result = xmlExport({ HtmlDocumentField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/htmlDocumentField/minimal.xml")
    const xmlData = exportHtmlDocumentFieldToXML(mockСontext, minimalHtmlDocumentField)

    const result = xmlExport({ HtmlDocumentField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})

