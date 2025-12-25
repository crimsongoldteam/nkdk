import { describe, expect, it } from "vitest"
import { xmlImport } from "~/lib"
import { system } from "~/lib/tests/fixtures/font/system"
import { mockСontext } from "~/lib/tests/mockContext"
import { readXMLFileAsString } from "~/lib/tests/readAndParseXMLFile"
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
