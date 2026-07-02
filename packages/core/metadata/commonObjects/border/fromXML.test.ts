import { describe, expect, it } from "vitest"
import { borderTestCases } from "./__fixtures__/data"
import { mockContextFromXML, mockRule } from "../../../tests/mockContext"
import importContentFromXML from "../../../xml/import/importer"
import { importBorderFromXML } from "./fromXML"
import { Border, BorderXML } from "./types"

describe("importBorderFromXML", () => {
  it("should import Border by ref", () => {
    const fixture = borderTestCases.find((testCase) => testCase.name === "border by style ref")
    expect(fixture?.xml).toBeDefined()

    const xml = importContentFromXML<{ Border: BorderXML }>(fixture!.xml!)
    const result = importBorderFromXML(mockContextFromXML(), mockRule, xml.Border)

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

    const xml = importContentFromXML<{ Border: BorderXML }>(mockXml)

    const result = importBorderFromXML(mockContextFromXML(), mockRule, xml.Border)

    expect(result).toEqual(expected)
  })
})
