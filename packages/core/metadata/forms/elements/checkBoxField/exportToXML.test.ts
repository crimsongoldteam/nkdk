import { describe, expect, it } from "vitest"
import { exportElementToXML } from "~/metadata/metadataFactory"
import { fullCheckBoxField, minimalCheckBoxField } from "~/tests/fixtures/forms/checkBoxField/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"

describe("exportCheckBoxFieldToXML", () => {
  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/checkBoxField/full.xml")
    const xmlData = exportElementToXML({ context: mockContext, data: fullCheckBoxField })

    const result = xmlExport({ CheckBoxField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/checkBoxField/minimal.xml")
    const xmlData = exportElementToXML({ context: mockContext, data: minimalCheckBoxField })

    const result = xmlExport({ CheckBoxField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
