import { describe, expect, it } from "vitest"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportElementToXML } from "~/metadata/metadataFactory"
import { fullContextMenu, minimalContextMenu } from "~/tests/fixtures/forms/contextMenu/data"
import { mockContext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"

describe("exportContextMenuToXML", () => {
  it("should return default when data is undefined", () => {
    const context: ConfigurationContext = {
      ...mockContext,
      elementContext: { name: "КакойТоЭлемент" },
    }
    const expectedResult = readXMLFileAsString("forms/contextMenu/minimal.xml")

    const xmlData = exportElementToXML({ context: context, element: undefined })

    const result = xmlExport({ ContextMenu: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should return all fields to XML", () => {
    const context: ConfigurationContext = {
      ...mockContext,
      elementContext: { name: "КакойТоЭлемент" },
    }
    const expectedResult = readXMLFileAsString("forms/contextMenu/full.xml").trimEnd()

    const xmlData = exportElementToXML({ context: context, element: fullContextMenu })

    const result = xmlExport({ ContextMenu: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
