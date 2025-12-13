import { describe, expect, it } from "vitest"
import * as SE from "~/lib/metadata/systemEnumerations/types"
import xmlImport from "~/lib/xml/import/importer"
import { importBorderFromXML } from "./importFromXML"
import { Border, BorderXML } from "./types"

describe("importBorderFromXML", () => {
  it("should import Border by ref", () => {
    const mockXml = `<Border ref="style:ControlBorder"/>`

    const expected: Border = {
      ref: "style:ControlBorder",
    }

    const xml = xmlImport<{ Border: BorderXML }>(mockXml)

    const result = importBorderFromXML(xml.Border)

    expect(result).toEqual(expected)
  })

  it("should import Border with width and style", () => {
    const mockXml = `<Border width="1">
    <v8ui:style xsi:type="v8ui:ControlBorderType">Indented</v8ui:style>
  </Border>`

    const expected: Border = {
      width: 1,
      controlBorderType: SE.ControlBorderType.Indented,
    }

    const xml = xmlImport<{ Border: BorderXML }>(mockXml)

    const result = importBorderFromXML(xml.Border)

    expect(result).toEqual(expected)
  })
})
