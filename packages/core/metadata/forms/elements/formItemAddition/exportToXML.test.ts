import { describe, expect, it } from "vitest"
import { fullFormItemAddition, minimalFormItemAddition } from "~/tests/fixtures/forms/formItemAddition/data"
import { mockСontext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportFormItemAdditionToXML } from "./exportToXML"

describe("exportFormItemAdditionToXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportFormItemAdditionToXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/formItemAddition/full.xml")
    const xmlData = exportFormItemAdditionToXML(mockСontext, fullFormItemAddition)

    const result = xmlExport({ FormItemAddition: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/formItemAddition/minimal.xml")
    const xmlData = exportFormItemAdditionToXML(mockСontext, minimalFormItemAddition)

    const result = xmlExport({ FormItemAddition: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})

