import { PropertyRule } from "~/metadata/orchestration/property/types"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
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
    result._ref = exportFontRefToXML(font)
  }

  if (font.faceName !== undefined) result._faceName = font.faceName
  if (font.height !== undefined) result._height = font.height
  if (font.bold !== undefined) result._bold = font.bold
  if (font.italic !== undefined) result._italic = font.italic
  if (font.underline !== undefined) result._underline = font.underline
  if (font.strikeout !== undefined) result._strikeout = font.strikeout
  result._kind = font.kind
  if (font.scale !== undefined) result._scale = font.scale

  return result as FontXML
}

function exportFontRefToXML(font: Font): string {
  const ref = font.ref
  if (ref === undefined) return ""
  const prefixedRef = PrefixedFontsToXML[ref as keyof typeof PrefixedFontsToXML]
  if (prefixedRef !== undefined) return prefixedRef
  if (font.kind === "StyleItem") return `style:${ref}`
  if (font.kind === "WindowsFont") return `sys:${ref}`
  return ref
}

registerTypeRule("Font", "exportToXML", exportFontToXML)
