import { describe, expect, it } from "vitest"
import { fullButton, minimalButton } from "~/tests/fixtures/forms/button/data"
import { mockContext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportButtonToXML } from "./exportToXML"

describe("exportButtonToXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportButtonToXML(mockContext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/button/full.xml")
    const xmlData = exportButtonToXML(mockContext, fullButton)

    const result = xmlExport({ Button: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/button/minimal.xml")
    const xmlData = exportButtonToXML(mockContext, minimalButton)

    const result = xmlExport({ Button: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
