import { describe, expect, it } from "vitest"
import { fontYAMLFixtures } from "./__fixtures__/data"
import { mockContextFromXML, mockRule } from "../../../tests/mockContext"
import { parseXmlDocumentWithSaxes } from "@nkdk/runtime"
import { parseStructuralXMLWithoutCompatibility } from "../../../tests/structuralXML"
import { importFontFromXML } from "./fromXML"

describe("importFontFromXML", () => {
  it("does not treat a processing instruction as an absent font", () => {
    const xml = "<Font><?keep value?></Font>"
    expect(importFontFromXML(mockContextFromXML(), mockRule, parseXmlDocumentWithSaxes(xml).roots[0])).toStrictEqual({ kind: undefined })
  })

  it.each(["<Font/>", "<Font><![CDATA[]]></Font>"])("keeps an empty structural font absent: %s", (xml) => {
    expect(importFontFromXML(mockContextFromXML(), mockRule, parseXmlDocumentWithSaxes(xml).roots[0])).toBeUndefined()
  })

  it("should return undefined for undefined input", () => {
    const result = importFontFromXML(mockContextFromXML(), mockRule, undefined)

    expect(result).toBeUndefined()
  })

  it.each(fontYAMLFixtures)("imports $name directly from a structural XML node", ({ font, xml }) => {
    const node = parseXmlDocumentWithSaxes(xml).roots[0]!
    Object.defineProperty(node, "compatibilityValue", { get() { throw new Error("Compatibility XML must not be read") } })

    expect(importFontFromXML(mockContextFromXML(), mockRule, node)).toEqual(font)
  })

  it("imports raw non-prefixed style item ref", () => {
    const xmlData = parseStructuralXMLWithoutCompatibility('<Font ref="0" height="10" kind="StyleItem"/>')
    const result = importFontFromXML(mockContextFromXML(), mockRule, xmlData)

    expect(result).toEqual({
      ref: "0",
      kind: "StyleItem",
      height: 10,
      rawRef: true,
    })
  })
})
