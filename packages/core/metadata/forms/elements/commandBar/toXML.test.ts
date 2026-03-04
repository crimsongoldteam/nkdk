import { describe, expect, it } from "vitest"
import { exportElementToXML } from "~/metadata/orchestration"
import { fullCommandBar, minimalCommandBar } from "~/tests/fixtures/forms/commandBar/data"
import { mockContext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"

describe("exportCommandBarToXML", () => {
  it("should export all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/commandBar/full.xml")
    const xmlData = exportElementToXML({ context: mockContext, element: fullCommandBar })

    const result = xmlExport({ CommandBar: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/commandBar/minimal.xml")
    const xmlData = exportElementToXML({ context: mockContext, element: minimalCommandBar })

    const result = xmlExport({ CommandBar: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
