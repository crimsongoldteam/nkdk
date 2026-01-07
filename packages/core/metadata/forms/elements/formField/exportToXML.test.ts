import { describe, expect, it } from "vitest"
import { fullFormField, minimalFormField } from "~/tests/fixtures/forms/formField/data"
import { mockСontext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportFormFieldToXML } from "./exportToXML"

describe("exportFormFieldToXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportFormFieldToXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/formField/full.xml")
    const xmlData = exportFormFieldToXML(mockСontext, fullFormField)

    const result = xmlExport({ FormField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/formField/minimal.xml")
    const xmlData = exportFormFieldToXML(mockСontext, minimalFormField)

    const result = xmlExport({ FormField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})

