import { describe, expect, it } from "vitest"
import "~/metadata/forms/elements/importFromXML"
import { fullContextMenu } from "~/tests/fixtures/forms/contextMenu/data"
import { mockContext } from "~/tests/mockContext"
import { readAndParseXMLFile } from "~/tests/readAndParseXMLFile"
import { importContextMenuFromXML } from "./importFromXML"
import { ContextMenuXML } from "./types"

describe("importContextMenuFromXML", () => {
  it("should import all fields from XML", () => {
    const xmlData = readAndParseXMLFile<{ ContextMenu: ContextMenuXML }>("forms/contextMenu/full.xml")

    const result = importContextMenuFromXML(mockContext, xmlData.ContextMenu)

    expect(result).toEqual(fullContextMenu)
  })

  it("should import minimal", () => {
    const xmlData = readAndParseXMLFile<{ ContextMenu: ContextMenuXML }>("forms/contextMenu/minimal.xml")

    const result = importContextMenuFromXML(mockContext, xmlData.ContextMenu)

    expect(result).toBeUndefined()
  })
})
