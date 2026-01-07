import { describe, expect, it } from "vitest"
import { fullFormDecoration, minimalFormDecoration } from "~/tests/fixtures/forms/formDecoration/data"
import { mockСontext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportFormDecorationToXML } from "./exportToXML"

describe("exportFormDecorationToXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportFormDecorationToXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/formDecoration/full.xml")
    const xmlData = exportFormDecorationToXML(mockСontext, fullFormDecoration)

    const result = xmlExport({ FormDecoration: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/formDecoration/minimal.xml")
    const xmlData = exportFormDecorationToXML(mockСontext, minimalFormDecoration)

    const result = xmlExport({ FormDecoration: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})

