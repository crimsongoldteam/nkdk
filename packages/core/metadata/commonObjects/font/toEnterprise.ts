import { registerTypeRule } from "~/metadata/metadataFactory/types/factory"
import { Font, FontEnterprise } from "./types"

export const exportFontToEnterprise = (params: { value: Font | undefined }): FontEnterprise | undefined => {
  const { value: font } = params
  if (!font) return undefined

  const result: FontEnterprise = {
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

registerTypeRule("Font", "exportToEnterprise", exportFontToEnterprise)
