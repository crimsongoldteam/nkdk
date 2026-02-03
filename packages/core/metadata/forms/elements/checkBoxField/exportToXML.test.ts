import { describe, expect, it } from "vitest"
import { fullCheckBoxField, minimalCheckBoxField } from "~/tests/fixtures/forms/checkBoxField/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportCheckBoxFieldToXML } from "./exportToXML"

describe("exportCheckBoxFieldToXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportCheckBoxFieldToXML(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/checkBoxField/full.xml")
    const xmlData = exportCheckBoxFieldToXML(mockContext, mockRule, fullCheckBoxField)

    const result = xmlExport({ CheckBoxField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/checkBoxField/minimal.xml")
    const xmlData = exportCheckBoxFieldToXML(mockContext, mockRule, minimalCheckBoxField)

    const result = xmlExport({ CheckBoxField: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
