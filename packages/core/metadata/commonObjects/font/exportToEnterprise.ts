import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/typeRulesFactory"
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { ConfigurationContext } from "../../context/types"
import { exportBooleanToEnterprise } from "../boolean/exportToEnterprise"
import { Font, FontEnterprise, FontFullEnterprise } from "./types"

export const exportFontToEnterprise = (
  _context: ConfigurationContext,
  _rule: PropertyRule<any>,
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
    const kind = convertRefToEnterprise(_context, font.ref, font.kind)!

    const result: FontFullEnterprise = {
      Вид: kind,
    }

    if (font.faceName) result.Имя = font.faceName

    if (font.height !== undefined) result.Размер = font.height

    if (font.scale !== undefined) result.Масштаб = font.scale

    const italicValue = exportBooleanToEnterprise(_context, undefined, font.italic)
    if (italicValue !== undefined) result.Наклонный = italicValue

    const underlineValue = exportBooleanToEnterprise(_context, undefined, font.underline)
    if (underlineValue !== undefined) result.Подчеркивание = underlineValue

    const boldValue = exportBooleanToEnterprise(_context, undefined, font.bold)
    if (boldValue !== undefined) result.Полужирный = boldValue

    const strikeoutValue = exportBooleanToEnterprise(_context, undefined, font.strikeout)
    if (strikeoutValue !== undefined) result.Зачеркивание = strikeoutValue

    return result
  }

  return font.faceName || convertRefToEnterprise(_context, font.ref, font.kind)
}

const convertRefToEnterprise = (
  context: ConfigurationContext,
  ref: SE.StyleFonts | SE.WindowsFonts | undefined,
  kind: SE.FontType
): SE.StyleFontsEnterprise | SE.WindowsFontsEnterprise | undefined => {
  if (ref === undefined) return undefined

  if (kind === "StyleItem") {
    return exportSystemEnumerationToEnterprise(context, undefined, ref, SE.StyleFontsToEnterprise)
  }

  return exportSystemEnumerationToEnterprise(context, undefined, ref, SE.WindowsFontsToEnterprise)
}

registerTypeRule("Font", "exportToEnterprise", exportFontToEnterprise)
