import { describe, expect, it } from "vitest"
import "~/metadata/forms/elements/exportToXML"
import { fullContextMenu, minimalContextMenu, parentElement } from "~/tests/fixtures/forms/contextMenu/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"
import { exportContextMenuToXML } from "./exportToXML"

describe("exportContextMenuToXML", () => {
  it("should return all fields to XML", () => {
    const expectedResult = readXMLFileAsString("forms/contextMenu/full.xml")

    const xmlData = exportContextMenuToXML(mockContext, mockRule, fullContextMenu, parentElement)

    const result = xmlExport({ ContextMenu: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should return default when data is undefined", () => {
    const expectedResult = readXMLFileAsString("forms/contextMenu/minimal.xml")

    const xmlData = exportContextMenuToXML(mockContext, mockRule, undefined, parentElement)

    const result = xmlExport({ ContextMenu: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should export minimal", () => {
    const expectedResult = readXMLFileAsString("forms/contextMenu/minimal.xml")
    const xmlData = exportContextMenuToXML(mockContext, mockRule, minimalContextMenu, parentElement)

    const result = xmlExport({ ContextMenu: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
