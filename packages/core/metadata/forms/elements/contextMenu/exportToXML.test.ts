import { describe, expect, it } from "vitest"
import "~/metadata/forms/elements/exportToXML"
import { exportElementToXML } from "~/metadata/metadataFactory"
import { fullContextMenu, minimalContextMenu, parentElement } from "~/tests/fixtures/forms/contextMenu/data"
import { mockContext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"

describe("exportContextMenuToXML", () => {
  it("should return all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/contextMenu/full.xml")

    const xmlData = exportElementToXML({ context: mockContext, data: fullContextMenu })

    const result = xmlExport({ ContextMenu: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should return default when data is undefined", () => {
    const expectedResult = readXMLFileAsString("forms/contextMenu/minimal.xml")

    const xmlData = exportElementToXML({ context: mockContext, data: undefined })

    const result = xmlExport({ ContextMenu: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/contextMenu/minimal.xml")
    const xmlData = exportElementToXML({ context: mockContext, data: minimalContextMenu })

    const result = xmlExport({ ContextMenu: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
