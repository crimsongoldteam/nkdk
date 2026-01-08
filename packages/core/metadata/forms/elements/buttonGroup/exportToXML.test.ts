import { describe, expect, it } from "vitest"
import "~/metadata/forms/elements/button/exportToXML"
import { fullButtonGroup, minimalButtonGroup } from "~/tests/fixtures/forms/buttonGroup/data"
import { mockСontext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportButtonGroupToXML } from "./exportToXML"

describe("exportButtonGroupToXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportButtonGroupToXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/buttonGroup/full.xml")
    const xmlData = exportButtonGroupToXML(mockСontext, fullButtonGroup)

    const result = xmlExport({ ButtonGroup: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/buttonGroup/minimal.xml")
    const xmlData = exportButtonGroupToXML(mockСontext, minimalButtonGroup)

    const result = xmlExport({ ButtonGroup: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})

