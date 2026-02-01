import { describe, expect, it } from "vitest"
import { fullTextDocumentField, minimalTextDocumentField } from "~/tests/fixtures/forms/textDocumentField/data"
import { mockContext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportTextDocumentFieldToXML } from "./exportToXML"

describe("exportTextDocumentFieldToXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportTextDocumentFieldToXML(mockContext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/textDocumentField/full.xml")
    const xmlData = exportTextDocumentFieldToXML(mockContext, fullTextDocumentField)

    const result = xmlExport({ TextDocumentField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/textDocumentField/minimal.xml")
    const xmlData = exportTextDocumentFieldToXML(mockContext, minimalTextDocumentField)

    const result = xmlExport({ TextDocumentField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
