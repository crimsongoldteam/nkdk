import { describe, expect, it } from "vitest"
import { exportElementToXML } from "~/metadata/orchestration"
import { fullLabelDecoration, minimalLabelDecoration } from "~/tests/fixtures/forms/labelDecoration/data"
import { mockContext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"

describe("exportLabelDecorationToXML", () => {
  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/labelDecoration/full.xml")
    const xmlData = exportElementToXML({ context: mockContext, element: fullLabelDecoration })

    const result = xmlExport({ LabelDecoration: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/labelDecoration/minimal.xml")
    const xmlData = exportElementToXML({ context: mockContext, element: minimalLabelDecoration })

    const result = xmlExport({ LabelDecoration: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
