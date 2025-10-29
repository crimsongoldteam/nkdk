import { expect, it } from "vitest"
import importFontFromXML from "./importFromXML"
import { TFont, ZFontXML } from "./types"
import { xmlImport } from "~/lib"

it("should import font from XML with all properties", () => {
  const mockXml = `<Font ref="sys:ANSIVariableFont" height="12" bold="true" italic="true" underline="true" strikeout="true" kind="WindowsFont"/>`

  const mockResult: TFont = {
    ref: "sys:ANSIVariableFont",
    height: 12,
    bold: true,
    italic: true,
    underline: true,
    strikeout: true,
    kind: "WindowsFont",
  }

  const xml = xmlImport<any>(mockXml)
  const value = xml[Object.keys(xml)[0]]

  const valueParsed = ZFontXML.parse(value)

  const result = importFontFromXML(valueParsed)

  expect(result).toEqual(mockResult)
})
