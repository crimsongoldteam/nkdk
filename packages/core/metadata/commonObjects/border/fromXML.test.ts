import { describe, expect, it } from "vitest"
import { mockContextFromXML, mockRule } from "~/tests/mockContext"
import importContentFromXML from "~/xml/import/importer"
import { importBorderFromXML } from "./fromXML"
import { Border, BorderXML } from "./types"

describe("importBorderFromXML", () => {
  it("should import Border by ref", () => {
    const mockXml = `<Border ref="style:ControlBorder"/>`

    const expected: Border = {
      ref: "style:ControlBorder",
    }

    const xml = importContentFromXML<{ Border: BorderXML }>(mockXml)

    const result = importBorderFromXML(mockContextFromXML(), mockRule, xml.Border)

    expect(result).toEqual(expected)
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
