import { describe, expect, it } from "vitest"
import { fontYAMLFixtures } from "~/metadata/commonObjects/font/__fixtures__/data"
import { mockContextFromXML, mockRule } from "~/tests/mockContext"
import { importContentFromXML } from "~/xml/import/importer"
import { importFontFromXML } from "./fromXML"
import { FontXML } from "./types"

describe("importFontFromXML", () => {
  it("should return undefined for undefined input", () => {
    const result = importFontFromXML(mockContextFromXML(), mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it.each(fontYAMLFixtures)("should import $name font from XML", ({ font, xml }) => {
    const xmlData = importContentFromXML<{ Font: FontXML }>(xml)
    const result = importFontFromXML(mockContextFromXML(), mockRule, xmlData.Font)

    expect(result).toEqual(font)
  })

  it("imports raw non-prefixed style item ref", () => {
    const xmlData = importContentFromXML<{ Font: FontXML }>(
      '<Font ref="0" height="10" kind="StyleItem"/>'
    )
    const result = importFontFromXML(mockContextFromXML(), mockRule, xmlData.Font)

    expect(result).toEqual({
      ref: "0",
      kind: "StyleItem",
      height: 10,
      rawRef: true,
    })
  })
})
