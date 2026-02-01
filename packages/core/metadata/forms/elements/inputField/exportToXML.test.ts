import { describe, expect, it } from "vitest"
import { fullInputField, minimalInputField } from "~/tests/fixtures/forms/inputField/data"
import { mockContext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportInputFieldToXML } from "./exportToXML"

describe("exportInputFieldToXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportInputFieldToXML(mockContext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/inputField/full.xml")
    const xmlData = exportInputFieldToXML(mockContext, fullInputField)

    const result = xmlExport({ InputField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/inputField/minimal.xml")
    const xmlData = exportInputFieldToXML(mockContext, minimalInputField)

    const result = xmlExport({ InputField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
