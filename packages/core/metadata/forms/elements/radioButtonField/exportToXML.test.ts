import { describe, expect, it } from "vitest"
import { fullRadioButtonField, minimalRadioButtonField } from "~/tests/fixtures/forms/radioButtonField/data"
import { mockСontext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportRadioButtonFieldToXML } from "./exportToXML"

describe("exportRadioButtonFieldToXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportRadioButtonFieldToXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/radioButtonField/full.xml")
    const xmlData = exportRadioButtonFieldToXML(mockСontext, fullRadioButtonField)

    const result = xmlExport({ RadioButtonField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/radioButtonField/minimal.xml")
    const xmlData = exportRadioButtonFieldToXML(mockСontext, minimalRadioButtonField)

    const result = xmlExport({ RadioButtonField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})

