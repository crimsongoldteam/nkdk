import { describe, expect, it } from "vitest"
import { fullGraphicalSchemaField, minimalGraphicalSchemaField } from "~/tests/fixtures/forms/graphicalSchemaField/data"
import { mockСontext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportGraphicalSchemaFieldToXML } from "./exportToXML"

describe("exportGraphicalSchemaFieldToXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportGraphicalSchemaFieldToXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/graphicalSchemaField/full.xml")
    const xmlData = exportGraphicalSchemaFieldToXML(mockСontext, fullGraphicalSchemaField)

    const result = xmlExport({ GraphicalSchemaField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/graphicalSchemaField/minimal.xml")
    const xmlData = exportGraphicalSchemaFieldToXML(mockСontext, minimalGraphicalSchemaField)

    const result = xmlExport({ GraphicalSchemaField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})

