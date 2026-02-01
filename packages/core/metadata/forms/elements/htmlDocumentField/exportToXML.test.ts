import { describe, expect, it } from "vitest"
import { fullHtmlDocumentField, minimalHtmlDocumentField } from "~/tests/fixtures/forms/htmlDocumentField/data"
import { mockContext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportHTMLDocumentFieldToXML } from "./exportToXML"

describe("exportHTMLDocumentFieldToXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportHTMLDocumentFieldToXML(mockContext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/htmlDocumentField/full.xml")
    const xmlData = exportHTMLDocumentFieldToXML(mockContext, fullHtmlDocumentField)

    const result = xmlExport({ HtmlDocumentField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/htmlDocumentField/minimal.xml")
    const xmlData = exportHTMLDocumentFieldToXML(mockContext, minimalHtmlDocumentField)

    const result = xmlExport({ HtmlDocumentField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
