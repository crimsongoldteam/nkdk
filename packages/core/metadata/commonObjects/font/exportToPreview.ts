import { ConfigurationContext } from "../../context/types"
import { Font, FontPreview } from "./types"

export const exportFontToPreview = (
  _context: ConfigurationContext,
  font: Font | undefined
): FontPreview | undefined => {
  if (!font) return undefined

  const result: FontPreview = {
    type: "Font",
  }

  if (font.faceName !== undefined) result.name = font.faceName
  if (font.scale !== undefined) result.scale = font.scale
  if (font.height !== undefined) result.height = font.height
  if (font.bold !== undefined) result.bold = font.bold
  if (font.italic !== undefined) result.italic = font.italic
  if (font.underline !== undefined) result.underline = font.underline
  if (font.strikeout !== undefined) result.strikeout = font.strikeout

  return result
}
