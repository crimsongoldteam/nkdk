import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { exportSystemEnumerationToYAML } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { ConfigurationContext } from "../../context/types"
import { exportBooleanToYAML } from "../boolean/exportToYAML"
import { Font, FontEnterprise, FontFullEnterprise } from "./types"

export const exportFontToYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule,
  font: Font | undefined
): FontEnterprise | undefined => {
  if (!font) return undefined

  const hasFullFormat =
    font.height !== undefined ||
    font.bold !== undefined ||
    font.italic !== undefined ||
    font.underline !== undefined ||
    font.strikeout !== undefined

  if (hasFullFormat) {
    const kind = convertRefToYAML(_context, font.ref, font.kind)!

    const result: FontFullEnterprise = {
      Вид: kind,
    }

    if (font.faceName) result.Имя = font.faceName

    if (font.height !== undefined) result.Размер = font.height

    if (font.scale !== undefined) result.Масштаб = font.scale

    const italicValue = exportBooleanToYAML(_context, _rule, font.italic)
    if (italicValue !== undefined) result.Наклонный = italicValue

    const underlineValue = exportBooleanToYAML(_context, _rule, font.underline)
    if (underlineValue !== undefined) result.Подчеркивание = underlineValue

    const boldValue = exportBooleanToYAML(_context, _rule, font.bold)
    if (boldValue !== undefined) result.Полужирный = boldValue

    const strikeoutValue = exportBooleanToYAML(_context, _rule, font.strikeout)
    if (strikeoutValue !== undefined) result.Зачеркивание = strikeoutValue

    return result
  }

  return font.faceName || convertRefToYAML(_context, font.ref, font.kind)
}

const convertRefToYAML = (
  context: ConfigurationContext,
  ref: SE.StyleFonts | SE.WindowsFonts | undefined,
  kind: SE.FontType
): SE.StyleFontsEnterprise | SE.WindowsFontsEnterprise | undefined => {
  if (ref === undefined) return undefined

  if (kind === "StyleItem") {
    return exportSystemEnumerationToYAML(context, ref, SE.StyleFontsToEnterprise)
  }

  return exportSystemEnumerationToYAML(context, ref, SE.WindowsFontsToEnterprise)
}
