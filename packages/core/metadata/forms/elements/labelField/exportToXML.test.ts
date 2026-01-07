import { describe, expect, it } from "vitest"
import { fullLabelField, minimalLabelField } from "~/tests/fixtures/forms/labelField/data"
import { mockСontext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportLabelFieldToXML } from "./exportToXML"

describe("exportLabelFieldToXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportLabelFieldToXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/labelField/full.xml")
    const xmlData = exportLabelFieldToXML(mockСontext, fullLabelField)

    const result = xmlExport({ LabelField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/labelField/minimal.xml")
    const xmlData = exportLabelFieldToXML(mockСontext, minimalLabelField)

    const result = xmlExport({ LabelField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})

