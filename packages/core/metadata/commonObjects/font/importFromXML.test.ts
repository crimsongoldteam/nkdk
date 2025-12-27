import { describe, expect, it } from "vitest"
import { xmlImport } from "~/packages/core"
import { system } from "~/packages/core/tests/fixtures/font/system"
import { mockСontext } from "~/packages/core/tests/mockContext"
import { readXMLFileAsString } from "~/packages/core/tests/readAndParseXMLFile"
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
