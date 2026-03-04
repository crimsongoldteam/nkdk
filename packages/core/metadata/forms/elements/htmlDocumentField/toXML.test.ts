import { describe, expect, it } from "vitest"
import { exportElementToXML } from "~/metadata/orchestration"
import { fullHtmlDocumentField, minimalHtmlDocumentField } from "~/tests/fixtures/forms/htmlDocumentField/data"
import { mockContext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"

describe("exportHTMLDocumentFieldToXML", () => {
  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/htmlDocumentField/full.xml")
    const xmlData = exportElementToXML({ context: mockContext, element: fullHtmlDocumentField })

    const result = xmlExport({ HtmlDocumentField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/htmlDocumentField/minimal.xml")
    const xmlData = exportElementToXML({ context: mockContext, element: minimalHtmlDocumentField })

    const result = xmlExport({ HtmlDocumentField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
