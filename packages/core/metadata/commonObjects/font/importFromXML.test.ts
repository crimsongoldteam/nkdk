import { describe, expect, it } from "vitest"
import { fontEnterpriseFixtures } from "~/tests/fixtures/font/data"
import { mockСontext } from "~/tests/mockContext"
import { importContentFromXML } from "~/xml/import/importer"
import { importFontFromXML } from "./importFromXML"
import { FontXML } from "./types"

describe("importFontFromXML", () => {
  it("should return undefined for undefined input", () => {
    const result = importFontFromXML(mockСontext, undefined)

    expect(result).toBeUndefined()
  })

  it.each(fontEnterpriseFixtures)("should import $name font from XML", ({ font, xml }) => {
    const xmlData = importContentFromXML<{ Font: FontXML }>(xml)
    const result = importFontFromXML(mockСontext, xmlData.Font)

    expect(result).toEqual(font)
  })
})
