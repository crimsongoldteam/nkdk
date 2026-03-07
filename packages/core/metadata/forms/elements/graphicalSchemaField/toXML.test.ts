import { describe, expect, it } from "vitest"
import { exportElementToXML } from "~/metadata/orchestration"
import { fullGraphicalSchemaField, minimalGraphicalSchemaField } from "~/tests/fixtures/forms/graphicalSchemaField/data"
import { mockContextToXML } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"

describe("exportGraphicalSchemaFieldToXML", () => {
  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/graphicalSchemaField/full.xml")
    const xmlData = exportElementToXML({ context: mockContextToXML(), element: fullGraphicalSchemaField })

    const result = xmlExport({ GraphicalSchemaField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/graphicalSchemaField/minimal.xml")
    const xmlData = exportElementToXML({ context: mockContextToXML(), element: minimalGraphicalSchemaField })

    const result = xmlExport({ GraphicalSchemaField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
