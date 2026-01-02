import { describe, expect, it } from "vitest"
import { system } from "~/tests/fixtures/font/system"
import { mockСontext } from "~/tests/mockContext"
import { readXMLFileAsString } from "~/tests/readAndParseXMLFile"
import { xmlImport } from "~/xml/import/importer"
import { importFontFromXML } from "./importFromXML"
import { FontXML } from "./types"

describe("importFontFromXML", () => {
  it("should import system font from XML", () => {
    const mockXml = readXMLFileAsString("font/system.xml")

    const xml = xmlImport<{ Font: FontXML }>(mockXml)
    const value = xml.Font

    const result = importFontFromXML(mockСontext, value)

    expect(result).toEqual(system)
  })
})
