import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "../../context/types"
import { Font, FontXML, PrefixedFontsToXML } from "./types"

export const exportFontToXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  font: Font | undefined
): FontXML | undefined => {
  if (!font) return undefined

  const result: any = {}

  if (font.ref !== undefined) {
    const prefixedRef = PrefixedFontsToXML[font.ref]
    result._ref = prefixedRef
  }

  if (font.faceName) result._faceName = font.faceName
  if (font.height !== undefined) result._height = font.height
  if (font.bold !== undefined) result._bold = font.bold
  if (font.italic !== undefined) result._italic = font.italic
  if (font.underline !== undefined) result._underline = font.underline
  if (font.strikeout !== undefined) result._strikeout = font.strikeout
  result._kind = font.kind
  if (font.scale !== undefined) result._scale = font.scale

  return result as FontXML
}
