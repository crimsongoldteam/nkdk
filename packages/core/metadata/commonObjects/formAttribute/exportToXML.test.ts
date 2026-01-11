import { describe, expect, it } from "vitest"
import { fullFormAttributes, minimalFormAttributes, multipleFormAttributes } from "~/tests/fixtures/formAttributes/data"
import { mockСontext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportFormAttributesToXML } from "./exportToXML"

describe("exportFormAttributesToXML", () => {
  it("should export undefined when data is undefined", () => {
    const result = exportFormAttributesToXML(mockСontext, undefined)
    expect(result).toBeUndefined()
  })

  it("should export full", () => {
    const expectedResult = readXMLFileAsString("formAttributes/full.xml")

    const xmlData = exportFormAttributesToXML(mockСontext, fullFormAttributes)

    const result = xmlExport({ Attribute: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export defaults", () => {
    const expectedResult = readXMLFileAsString("formAttributes/minimal.xml")

    const xmlData = exportFormAttributesToXML(mockСontext, minimalFormAttributes)

    const result = xmlExport({ Attribute: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export multiple attributes", () => {
    const expectedResult = readXMLFileAsString("formAttributes/multiple.xml")

    const xmlData = exportFormAttributesToXML(mockСontext, multipleFormAttributes)

    const result = xmlExport({ Attribute: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
