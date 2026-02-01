import { describe, expect, it } from "vitest"
import {
  fullGeographicalSchemaField,
  minimalGeographicalSchemaField,
} from "~/tests/fixtures/forms/geographicalSchemaField/data"
import { mockContext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportGeographicalSchemaFieldToXML } from "./exportToXML"

describe("exportGeographicalSchemaFieldToXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportGeographicalSchemaFieldToXML(mockContext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/geographicalSchemaField/full.xml")
    const xmlData = exportGeographicalSchemaFieldToXML(mockContext, fullGeographicalSchemaField)

    const result = xmlExport({ GeographicalSchemaField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/geographicalSchemaField/minimal.xml")
    const xmlData = exportGeographicalSchemaFieldToXML(mockContext, minimalGeographicalSchemaField)

    const result = xmlExport({ GeographicalSchemaField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
