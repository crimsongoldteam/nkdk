import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/typeRulesFactory"
import { ConfigurationContext } from "../../context/types"
import { Font, FontPreview } from "./types"

export const exportFontToPreview = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  font: Font | undefined
): FontPreview | undefined => {
  if (!font) return undefined

  const result: FontPreview = {
    Type: "Font",
  }

  if (font.kind === "WindowsFont" && font.ref) {
    result.Value = `WindowsFonts.${font.ref}`
  } else if (font.kind === "StyleItem" && font.ref) {
    result.Value = `StyleFonts.${font.ref}`
  }

  if (font.faceName !== undefined) result.Name = font.faceName
  if (font.scale !== undefined) result.Scale = font.scale
  if (font.height !== undefined) result.Height = font.height
  if (font.bold !== undefined) result.Bold = font.bold
  if (font.italic !== undefined) result.Italic = font.italic
  if (font.underline !== undefined) result.Underline = font.underline
  if (font.strikeout !== undefined) result.Strikeout = font.strikeout

  return result
}

registerTypeRule("Font", "exportToPreview", exportFontToPreview)
