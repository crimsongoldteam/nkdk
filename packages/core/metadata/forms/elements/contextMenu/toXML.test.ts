import { describe, expect, it } from "vitest"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportPropertyToXML, PropertyRule } from "~/metadata/orchestration"
import { fullContextMenu } from "~/tests/fixtures/forms/contextMenu/data"
import { mockContext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlExport } from "~/xml/export/exporter"

const rule: PropertyRule = {
  type: "ContextMenu",
}
describe("exportContextMenuToXML", () => {
  it("should return default when data is undefined", () => {
    const context: ConfigurationContext = {
      ...mockContext,
      elementsTree: [{ name: "КакойТоЭлемент", itemType: "Table" }],
    }
    const expectedResult = readXMLFileAsString("forms/contextMenu/minimal.xml")

    const xmlData = exportPropertyToXML({
      context: context,
      rule: rule,
      value: undefined,
    })

    const result = xmlExport({ ContextMenu: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })

  it("should return all fields to XML", () => {
    const context: ConfigurationContext = {
      ...mockContext,
      elementsTree: [{ name: "КакойТоЭлемент", itemType: "Table" }],
    }
    const expectedResult = readXMLFileAsString("forms/contextMenu/full.xml").trimEnd()

    const xmlData = exportPropertyToXML({ context: context, rule: rule, value: fullContextMenu })

    const result = xmlExport({ ContextMenu: xmlData }, false)

    expect(result).toEqual(expectedResult)
  })
})
