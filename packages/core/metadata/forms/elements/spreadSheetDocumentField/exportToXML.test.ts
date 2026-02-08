import { describe, expect, it } from "vitest"
import "~/metadata/forms/elements/exportToXML"
import {
  fullSpreadSheetDocumentField,
  minimalSpreadSheetDocumentField,
} from "~/tests/fixtures/forms/spreadSheetDocumentField/data"
import { mockContext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportElementToXML } from "~/metadata/metadataFactory"

describe("exportSpreadSheetDocumentFieldToXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportElementToXML({ context: mockContext, data: undefined })

    expect(result).toBeUndefined()
  })

  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/spreadSheetDocumentField/full.xml")
    const xmlData = exportElementToXML({ context: mockContext, data: fullSpreadSheetDocumentField })

    const result = xmlExport({ SpreadSheetDocumentField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/spreadSheetDocumentField/minimal.xml")
    const xmlData = exportElementToXML({ context: mockContext, data: minimalSpreadSheetDocumentField })

    const result = xmlExport({ SpreadSheetDocumentField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
