import { describe, expect, it } from "vitest"
import { fontYAMLFixtures } from "~/tests/fixtures/font/data"
import { mockContext, mockRule } from "~/tests/mockContext"
import { importContentFromXML } from "~/xml/import/importer"
import { importFontFromXML } from "./fromXML"
import { FontXML } from "./types"

describe("importFontFromXML", () => {
  it("should return undefined for undefined input", () => {
    const result = importFontFromXML(mockContext, mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it.each(fontYAMLFixtures)("should import $name font from XML", ({ font, xml }) => {
    const xmlData = importContentFromXML<{ Font: FontXML }>(xml)
    const result = importFontFromXML(mockContext, mockRule, xmlData.Font)

    expect(result).toEqual(font)
  })
})
