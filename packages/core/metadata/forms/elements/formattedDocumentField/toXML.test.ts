import { describe, expect, it } from "vitest"
import { exportElementToXML } from "~/metadata/orchestration"
import {
  fullFormattedDocumentField,
  minimalFormattedDocumentField,
} from "~/tests/fixtures/forms/formattedDocumentField/data"
import { mockContextToXML } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"

describe("exportFormattedDocumentFieldToXML", () => {
  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/formattedDocumentField/full.xml")
    const xmlData = exportElementToXML({ context: mockContextToXML(), element: fullFormattedDocumentField })

    const result = xmlExport({ FormattedDocumentField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/formattedDocumentField/minimal.xml")
    const xmlData = exportElementToXML({ context: mockContextToXML(), element: minimalFormattedDocumentField })

    const result = xmlExport({ FormattedDocumentField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
