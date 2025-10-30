import { expect, it } from "vitest"
import xmlImport from "~/lib/xml/import/importer"
import importBorderFromXML from "./importFromXML"
import type { TBorder, TBorderXML } from "./types"
import * as SE from "~/lib/metadata/systemEnumerations/types"

it("should import Border by ref", () => {
  const mockXml = `<Border ref="style:ControlBorder"/>`

  const expected: TBorder = {
    ref: "style:ControlBorder",
  }

  const xml = xmlImport<{ Border: TBorderXML }>(mockXml)

  const result = importBorderFromXML(xml)

  expect(result).toEqual(expected)
})

it("should import Border with width and style", () => {
  const mockXml = `<Border width="1">
    <v8ui:style xsi:type="v8ui:ControlBorderType">Indented</v8ui:style>
  </Border>`

  const expected: TBorder = {
    width: 1,
    controlBorderType: SE.ZControlBorderType.enum.Indented,
  }

  const xml = xmlImport<{ Border: TBorderXML }>(mockXml)

  const result = importBorderFromXML(xml)

  expect(result).toEqual(expected)
})
