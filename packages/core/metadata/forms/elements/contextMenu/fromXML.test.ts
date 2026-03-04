import { describe, expect, it } from "vitest"
import { importPropertyFromXML, PropertyRule } from "~/metadata/metadataFactory"
import { fullContextMenu } from "~/tests/fixtures/forms/contextMenu/data"
import { mockContext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"

const rule: PropertyRule = {
  type: "ContextMenu",
}

describe("importContextMenuFromXML", () => {
  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ ContextMenu: any }>("forms/contextMenu/full.xml")

    const result = importPropertyFromXML({
      context: mockContext,
      rule: rule,
      value: xmlData.ContextMenu,
    })

    expect(result).toEqual(fullContextMenu)
  })

  it("should return undefined for defaults", () => {
    const xmlData = readAndParseXMLFile<{ ContextMenu: any }>("forms/contextMenu/minimal.xml")

    const result = importPropertyFromXML({
      context: mockContext,
      rule: rule,
      value: xmlData.ContextMenu,
    })

    expect(result).toBeUndefined()
  })
})
