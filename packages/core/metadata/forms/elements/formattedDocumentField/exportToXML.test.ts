import { describe, expect, it } from "vitest"
import {
  fullFormattedDocumentField,
  minimalFormattedDocumentField,
} from "~/tests/fixtures/forms/formattedDocumentField/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportFormattedDocumentFieldToXML } from "./exportToXML"

describe("exportFormattedDocumentFieldToXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportFormattedDocumentFieldToXML(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/formattedDocumentField/full.xml")
    const xmlData = exportFormattedDocumentFieldToXML(mockContext, mockRule, fullFormattedDocumentField)

    const result = xmlExport({ FormattedDocumentField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/formattedDocumentField/minimal.xml")
    const xmlData = exportFormattedDocumentFieldToXML(mockContext, mockRule, minimalFormattedDocumentField)

    const result = xmlExport({ FormattedDocumentField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
