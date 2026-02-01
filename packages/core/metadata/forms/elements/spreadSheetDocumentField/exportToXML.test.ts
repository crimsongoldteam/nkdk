import { describe, expect, it } from "vitest"
import {
  fullSpreadSheetDocumentField,
  minimalSpreadSheetDocumentField,
} from "~/tests/fixtures/forms/spreadSheetDocumentField/data"
import { mockContext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportSpreadSheetDocumentFieldToXML } from "./exportToXML"

describe("exportSpreadSheetDocumentFieldToXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportSpreadSheetDocumentFieldToXML(mockContext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/spreadSheetDocumentField/full.xml")
    const xmlData = exportSpreadSheetDocumentFieldToXML(mockContext, fullSpreadSheetDocumentField)

    const result = xmlExport({ SpreadSheetDocumentField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/spreadSheetDocumentField/minimal.xml")
    const xmlData = exportSpreadSheetDocumentFieldToXML(mockContext, minimalSpreadSheetDocumentField)

    const result = xmlExport({ SpreadSheetDocumentField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
