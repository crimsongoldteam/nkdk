import { describe, expect, it } from "vitest"
import { ElementXML, FormElementType, importElementFromXML } from "~/metadata/metadataFactory"
import { fullContextMenu } from "~/tests/fixtures/forms/contextMenu/data"
import { mockContext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"

describe("importContextMenuFromXML", () => {
  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ ContextMenu: ElementXML }>("forms/contextMenu/full.xml")

    const result = importElementFromXML({
      context: mockContext,
      elementType: FormElementType.CommandBar,
      xml: xmlData.ContextMenu,
    })

    expect(result).toEqual(fullContextMenu)
  })

  it("should return undefined for minimal", () => {
    const xmlData = readAndParseXMLFile<{ ContextMenu: ElementXML }>("forms/contextMenu/minimal.xml")

    const result = importElementFromXML({
      context: mockContext,
      elementType: FormElementType.CommandBar,
      xml: xmlData.ContextMenu,
    })

    expect(result).toBeUndefined()
  })
})
