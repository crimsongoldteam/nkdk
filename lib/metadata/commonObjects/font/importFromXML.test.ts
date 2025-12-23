import { describe, expect, it } from "vitest"
import { xmlImport } from "~/lib"
import { mockConfigurationSettings } from "~/lib/tests/mockConfigurationSettings"
import { importFontFromXML } from "./importFromXML"
import { Font, FontXML } from "./types"

describe("importFontFromXML", () => {
  it("should import font from XML with all properties", () => {
    const mockXml = `<Font bold="true" height="12" italic="true" kind="WindowsFont" ref="sys:ANSIVariableFont" strikeout="true" underline="true"/>`

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

    const result = importFontFromXML(mockConfigurationSettings, value)

    expect(result).toEqual(mockResult)
  })
})
