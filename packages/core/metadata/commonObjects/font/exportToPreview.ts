import { ConfigurationContext } from "../../context/types"
import { Font, FontPreview } from "./types"

export const exportFontToPreview = (
  _context: ConfigurationContext,
  font: Font | undefined
): FontPreview | undefined => {
  if (!font) return undefined
  return {
    type: "Font",
    name: font.faceName,
    scale: font.scale,
    height: font.height,
    bold: font.bold,
    italic: font.italic,
    underline: font.underline,
    strikeout: font.strikeout,
  }
}
