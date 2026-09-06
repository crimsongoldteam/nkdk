import { describe, expect, it } from "vitest"
import { fontYAMLFixtures } from "./__fixtures__/data"
import { mockContextFromXML, mockRule } from "../../../tests/mockContext"
import { importContentFromXML, parseXmlDocumentWithSaxes } from "@nkdk/runtime"
import { importFontFromXML } from "./fromXML"
import { FontXML } from "./types"

describe("importFontFromXML", () => {
  it("does not treat a processing instruction as an absent font", () => {
    const xml = "<Font><?keep value?></Font>"
    expect(importFontFromXML(mockContextFromXML(), mockRule, importContentFromXML<{ Font: FontXML }>(xml).Font)).toStrictEqual({ kind: undefined })
    expect(importFontFromXML(mockContextFromXML(), mockRule, parseXmlDocumentWithSaxes(xml).roots[0])).toStrictEqual({ kind: undefined })
  })

  it.each(["<Font/>", "<Font><![CDATA[]]></Font>"])("keeps an empty structural font absent: %s", (xml) => {
    expect(importFontFromXML(mockContextFromXML(), mockRule, importContentFromXML<{ Font?: FontXML }>(xml).Font)).toBeUndefined()
    expect(importFontFromXML(mockContextFromXML(), mockRule, parseXmlDocumentWithSaxes(xml).roots[0])).toBeUndefined()
  })

  it("should return undefined for undefined input", () => {
    const result = importFontFromXML(mockContextFromXML(), mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it.each(fontYAMLFixtures)("should import $name font from XML", ({ font, xml }) => {
    const xmlData = importContentFromXML<{ Font: FontXML }>(xml)
    const result = importFontFromXML(mockContextFromXML(), mockRule, xmlData.Font)

    expect(result).toEqual(font)
  })

  it.each(fontYAMLFixtures)("imports $name directly from a structural XML node", ({ font, xml }) => {
    const node = parseXmlDocumentWithSaxes(xml).roots[0]!
    Object.defineProperty(node, "compatibilityValue", { get() { throw new Error("Compatibility XML must not be read") } })

    expect(importFontFromXML(mockContextFromXML(), mockRule, node)).toEqual(font)
  })

  it("imports raw non-prefixed style item ref", () => {
    const xmlData = importContentFromXML<{ Font: FontXML }>('<Font ref="0" height="10" kind="StyleItem"/>')
    const result = importFontFromXML(mockContextFromXML(), mockRule, xmlData.Font)

    expect(result).toEqual({
      ref: "0",
      kind: "StyleItem",
      height: 10,
      rawRef: true,
    })
  })
})
