import { describe, expect, it } from "vitest"
import { exportElementToXML } from "~/metadata/metadataFactory"
import {
  fullGeographicalSchemaField,
  minimalGeographicalSchemaField,
} from "~/tests/fixtures/forms/geographicalSchemaField/data"
import { mockContext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"

describe("exportGeographicalSchemaFieldToXML", () => {
  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/geographicalSchemaField/full.xml")
    const xmlData = exportElementToXML({ context: mockContext, data: fullGeographicalSchemaField })

    const result = xmlExport({ GeographicalSchemaField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/geographicalSchemaField/minimal.xml")
    const xmlData = exportElementToXML({ context: mockContext, data: minimalGeographicalSchemaField })

    const result = xmlExport({ GeographicalSchemaField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
