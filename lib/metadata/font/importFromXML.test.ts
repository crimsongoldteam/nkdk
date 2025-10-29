import { expect, it } from "vitest"
import importFontFromXML from "./importFromXML"
import { TFont, TFontXML } from "./types"

it("should import font from XML with all properties", () => {
  const mockXml: TFontXML = {
    _ref: "ref123",
    _faceName: "Arial",
    _scale: 1.2,
    _height: 12,
    _bold: true,
    _italic: false,
    _underline: true,
    _strikeout: false,
    _kind: "Font",
  }

  const mockResult: TFont = {
    ref: "ref123",
    faceName: "Arial",
    scale: 1.2,
    height: 12,
    bold: true,
    italic: false,
    underline: true,
    strikeout: false,
    kind: "Font",
  }

  const result = importFontFromXML(mockXml)

  expect(result).toEqual(mockResult)
})

it("should import font from XML with minimal properties", () => {
  const mockXml: TFontXML = {
    _kind: "Font",
  }

  const mockResult: TFont = {
    kind: "Font",
  }

  const result = importFontFromXML(mockXml)

  expect(result).toEqual(mockResult)
})
