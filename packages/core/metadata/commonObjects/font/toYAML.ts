import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { exportSystemEnumerationToYAMLDeprecated } from "~/metadata/systemEnumerations/toYAML"
import * as SE from "~/metadata/systemEnumerations/types"
import { ConfigurationContext } from "../../context/types"
import { exportBooleanToYAML } from "../boolean/toYAML"
import { Font, FontFullYAML, FontRef, FontYAML, RawPrefixedFontRef, isRawPrefixedFontRef } from "./types"

export const exportFontToYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  font: Font | undefined
): FontYAML | undefined => {
  if (!font) return undefined

  const ref = convertRefToYAML(_context, font.ref, font.kind)
  const result: FontFullYAML = {}

  if (ref !== undefined) {
    result.Вид = ref
  } else {
    result.ВидXML = font.kind
  }

  if (font.faceName !== undefined) result.Имя = font.faceName
  if (font.height !== undefined) result.Размер = font.height
  if (font.scale !== undefined) result.Масштаб = font.scale

  const italicValue = exportBooleanToYAML(_context, undefined, font.italic)
  if (italicValue !== undefined) result.Наклонный = italicValue

  const underlineValue = exportBooleanToYAML(_context, undefined, font.underline)
  if (underlineValue !== undefined) result.Подчеркивание = underlineValue

  const boldValue = exportBooleanToYAML(_context, undefined, font.bold)
  if (boldValue !== undefined) result.Полужирный = boldValue

  const strikeoutValue = exportBooleanToYAML(_context, undefined, font.strikeout)
  if (strikeoutValue !== undefined) result.Зачеркивание = strikeoutValue

  return result
}

const convertRefToYAML = (
  context: ConfigurationContext,
  ref: FontRef | undefined,
  kind: SE.FontType
): SE.StyleFontsYAML | SE.WindowsFontsYAML | RawPrefixedFontRef | undefined => {
  if (ref === undefined) return undefined

  if (isRawPrefixedFontRef(ref)) return ref

  if (kind === "StyleItem") {
    return exportSystemEnumerationToYAMLDeprecated(context, { type: "SystemEnumeration", typeSE: "StyleFonts" }, ref)
  }

  return exportSystemEnumerationToYAMLDeprecated(context, { type: "SystemEnumeration", typeSE: "WindowsFonts" }, ref)
}

registerTypeRule("Font", "exportToYAML", exportFontToYAML)
