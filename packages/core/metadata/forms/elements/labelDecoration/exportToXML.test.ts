import { describe, expect, it } from "vitest"
import { fullLabelDecoration, minimalLabelDecoration } from "~/tests/fixtures/forms/labelDecoration/data"
import { mockСontext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportLabelDecorationToXML } from "./exportToXML"

describe("exportLabelDecorationToXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportLabelDecorationToXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/labelDecoration/full.xml")
    const xmlData = exportLabelDecorationToXML(mockСontext, fullLabelDecoration)

    const result = xmlExport({ LabelDecoration: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/labelDecoration/minimal.xml")
    const xmlData = exportLabelDecorationToXML(mockСontext, minimalLabelDecoration)

    const result = xmlExport({ LabelDecoration: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
