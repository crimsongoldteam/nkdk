import { describe, expect, it } from "vitest"
import { xmlImport } from "~/lib"
import { importFontFromXML } from "./importFromXML"
import { Font, FontXML } from "./types"

describe("importFontFromXML", () => {
  it("should import font from XML with all properties", () => {
    const mockXml = `<Font ref="sys:ANSIVariableFont" height="12" bold="true" italic="true" underline="true" strikeout="true" kind="WindowsFont"/>`

    const mockResult: Font = {
      ref: "sys:ANSIVariableFont",
      height: 12,
      bold: true,
      italic: true,
      underline: true,
      strikeout: true,
      kind: "WindowsFont",
    }

    const xml = xmlImport<{ Font: FontXML }>(mockXml)
    const value = xml.Font

    const result = importFontFromXML(value)

    expect(result).toEqual(mockResult)
  })
})
