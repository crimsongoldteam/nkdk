import { expect, it } from "vitest"
import exportFontToXML from "./exportToXML"
import { TFont } from "./types"
import { xmlExport } from "~/lib"

it("should export font to XML", () => {
  const expectedResult = `<Font ref="sys:ANSIVariableFont" height="12" bold="true" italic="true" underline="true" strikeout="true" kind="WindowsFont"/>`

  const mockFont: TFont = {
    ref: "sys:ANSIVariableFont",
    height: 12,
    bold: true,
    italic: true,
    underline: true,
    strikeout: true,
    kind: "WindowsFont",
  }

  const result = exportFontToXML(mockFont)
  const xmlString = xmlExport(result, false)

  expect(xmlString).toEqual(expectedResult)
})
