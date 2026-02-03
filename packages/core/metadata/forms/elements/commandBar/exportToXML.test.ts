import { describe, expect, it } from "vitest"
import "~/metadata/forms/elements/exportToXML"
import { fullCommandBar, minimalCommandBar } from "~/tests/fixtures/forms/commandBar/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportCommandBarToXML } from "./exportToXML"

describe("exportCommandBarToXML", () => {
  it("should return undefined when data is undefined", () => {
    const result = exportCommandBarToXML(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/commandBar/full.xml")
    const xmlData = exportCommandBarToXML(mockContext, mockRule, fullCommandBar)

    const result = xmlExport({ CommandBar: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/commandBar/minimal.xml")
    const xmlData = exportCommandBarToXML(mockContext, mockRule, minimalCommandBar)

    const result = xmlExport({ CommandBar: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
