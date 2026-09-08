import { describe, expect, it } from "vitest"
import { borderTestCases } from "./__fixtures__/data"
import { mockContextFromXML, mockRule } from "../../../tests/mockContext"
import { importBorderFromXML } from "./fromXML"
import { Border } from "./types"
import { parseStructuralXMLWithoutCompatibility } from "../../../tests/structuralXML"

describe("importBorderFromXML", () => {
  it.each(borderTestCases.filter(test => test.xml !== undefined))("imports structural $name", ({ xml, border }) => {
    expect(importBorderFromXML(mockContextFromXML(), mockRule, parseStructuralXMLWithoutCompatibility(xml!))).toEqual(border)
  })

  it.each([
    ["<Border/>", undefined],
    ["<Border><?keep value?></Border>", {}],
    ['<Border xsi:type="v8ui:Border"/>', {}],
    ['<Root><Border width="2"><v8ui:style>Indented</v8ui:style></Border></Root>', { width: 2, controlBorderType: "Indented" }],
  ])("preserves structural border presence: %s", (xml, expected) => {
    expect(importBorderFromXML(mockContextFromXML(), mockRule, parseStructuralXMLWithoutCompatibility(xml))).toEqual(expected)
  })

  it("should import Border by ref", () => {
    const fixture = borderTestCases.find((testCase) => testCase.name === "border by style ref")
    expect(fixture?.xml).toBeDefined()

    const xml = parseStructuralXMLWithoutCompatibility(fixture!.xml!)
    const result = importBorderFromXML(mockContextFromXML(), mockRule, xml)

    expect(result).toEqual(fixture!.border)
  })

  it("should import Border with width and style", () => {
    const mockXml = `<Border width="1">
    <v8ui:style xsi:type="v8ui:ControlBorderType">Indented</v8ui:style>
  </Border>`

    const expected: Border = {
      width: 1,
      controlBorderType: "Indented",
    }

    const xml = parseStructuralXMLWithoutCompatibility(mockXml)

    const result = importBorderFromXML(mockContextFromXML(), mockRule, xml)

    expect(result).toEqual(expected)
  })
})
