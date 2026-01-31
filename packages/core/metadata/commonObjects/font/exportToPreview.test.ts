import { describe, it, expect } from "vitest"
import { exportFontToPreview } from "./exportToPreview"
import { Font } from "./types"
import { ConfigurationContext } from "../../context/types"

const mockContext: ConfigurationContext = {
  defaultLanguage: "ru",
}

describe("exportFontToPreview", () => {
  it("should return undefined when font is undefined", () => {
    const result = exportFontToPreview(mockContext, undefined)
    expect(result).toBeUndefined()
  })

  it("should export font with all properties to preview", () => {
    const font: Font = {
      kind: "StyleItem",
      faceName: "Arial",
      scale: 100,
      height: 12,
      bold: true,
      italic: true,
      underline: true,
      strikeout: true,
    }

    const result = exportFontToPreview(mockContext, font)

    expect(result).toEqual({
      type: "Font",
      name: "Arial",
      scale: 100,
      height: 12,
      bold: true,
      italic: true,
      underline: true,
      strikeout: true,
    })
  })

  it("should export font with only faceName", () => {
    const font: Font = {
      kind: "StyleItem",
      faceName: "Times New Roman",
    }

    const result = exportFontToPreview(mockContext, font)

    expect(result).toEqual({
      type: "Font",
      name: "Times New Roman",
    })
  })

  it("should export font with only kind", () => {
    const font: Font = {
      kind: "StyleItem",
    }

    const result = exportFontToPreview(mockContext, font)

    expect(result).toEqual({
      type: "Font",
    })
  })

  it("should export font with partial properties", () => {
    const font: Font = {
      kind: "WindowsFont",
      faceName: "Courier New",
      bold: false,
      italic: true,
    }

    const result = exportFontToPreview(mockContext, font)

    expect(result).toEqual({
      type: "Font",
      name: "Courier New",
      bold: false,
      italic: true,
    })
  })
})
