import { importSystemEnumerationFromYAML } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { ConfigurationContext } from "../../context/types"
import { importBooleanFromEnterprise } from "../boolean/importFromEnterprise"
import { Font, FontEnterprise, FontFullEnterprise } from "./types"

export const importFontFromEnterprise = (
  _context: ConfigurationContext,
  data: FontEnterprise | undefined
): Font | undefined => {
  if (!data) return undefined

  // Если данные - строка (компактный формат)
  if (typeof data === "string") {
    // Проверяем, является ли это Enterprise значением ref
    const styleFontRef = importSystemEnumerationFromYAML<SE.StyleFonts>(_context, data, SE.StyleFontsFromEnterprise)
    if (styleFontRef) {
      return {
        ref: styleFontRef,
        kind: "StyleItem",
      }
    }

    const windowsFontRef = importSystemEnumerationFromYAML<SE.WindowsFonts>(
      _context,
      data,
      SE.WindowsFontsFromEnterprise
    )
    if (windowsFontRef) {
      return {
        ref: windowsFontRef,
        kind: "WindowsFont",
      }
    }

    // Если не нашли в ref, значит это faceName
    return {
      faceName: data,
      kind: "Absolute",
    }
  }

  // Если данные - объект (полный формат)
  const fullData = data as FontFullEnterprise
  const result: any = {}

  // Конвертируем Вид в ref и kind
  if (fullData.Вид !== undefined) {
    const styleFontRef = importSystemEnumerationFromYAML<SE.StyleFonts>(
      _context,
      fullData.Вид,
      SE.StyleFontsFromEnterprise
    )
    if (styleFontRef) {
      result.ref = styleFontRef
      result.kind = "StyleItem"
    } else {
      const windowsFontRef = importSystemEnumerationFromYAML<SE.WindowsFonts>(
        _context,
        fullData.Вид,
        SE.WindowsFontsFromEnterprise
      )
      if (windowsFontRef) {
        result.ref = windowsFontRef
        result.kind = "WindowsFont"
      }
    }
  } else {
    result.kind = "Absolute"
  }

  if (fullData.Имя !== undefined) result.faceName = fullData.Имя
  if (fullData.Размер !== undefined) result.height = fullData.Размер
  if (fullData.Полужирный !== undefined) result.bold = importBooleanFromEnterprise(_context, fullData.Полужирный)
  if (fullData.Наклонный !== undefined) result.italic = importBooleanFromEnterprise(_context, fullData.Наклонный)
  if (fullData.Подчеркивание !== undefined)
    result.underline = importBooleanFromEnterprise(_context, fullData.Подчеркивание)
  if (fullData.Зачеркивание !== undefined)
    result.strikeout = importBooleanFromEnterprise(_context, fullData.Зачеркивание)
  if (fullData.Масштаб !== undefined) result.scale = fullData.Масштаб

  return result as Font
}
