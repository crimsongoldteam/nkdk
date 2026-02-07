import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/typeRulesFactory"
import { importSystemEnumerationFromEnterprise } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { ConfigurationContext } from "../../context/types"
import { importBooleanFromEnterprise } from "../boolean/importFromEnterprise"
import { Font, FontEnterprise, FontFullEnterprise } from "./types"

export const importFontFromEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  yaml: FontEnterprise | undefined
): Font | undefined => {
  if (!yaml) return undefined

  // Если данные - строка (компактный формат)
  if (typeof yaml === "string") {
    // Проверяем, является ли это Enterprise значением ref
    const styleFontRef = importSystemEnumerationFromEnterprise(context, undefined, yaml, SE.StyleFontsFromEnterprise)
    if (styleFontRef) {
      return {
        ref: styleFontRef,
        kind: "StyleItem",
      }
    }

    const windowsFontRef = importSystemEnumerationFromEnterprise(
      context,
      undefined,
      yaml,
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
      faceName: yaml,
      kind: "Absolute",
    }
  }

  // Если данные - объект (полный формат)
  const fullData = yaml as FontFullEnterprise
  const result: any = {}

  // Конвертируем Вид в ref и kind
  if (fullData.Вид !== undefined) {
    const styleFontRef = importSystemEnumerationFromEnterprise(
      context,
      undefined,
      fullData.Вид,
      SE.StyleFontsFromEnterprise
    )
    if (styleFontRef) {
      result.ref = styleFontRef
      result.kind = "StyleItem"
    } else {
      const windowsFontRef = importSystemEnumerationFromEnterprise(
        context,
        undefined,
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
  if (fullData.Полужирный !== undefined)
    result.bold = importBooleanFromEnterprise(context, undefined, fullData.Полужирный)
  if (fullData.Наклонный !== undefined)
    result.italic = importBooleanFromEnterprise(context, undefined, fullData.Наклонный)
  if (fullData.Подчеркивание !== undefined)
    result.underline = importBooleanFromEnterprise(context, undefined, fullData.Подчеркивание)
  if (fullData.Зачеркивание !== undefined)
    result.strikeout = importBooleanFromEnterprise(context, undefined, fullData.Зачеркивание)
  if (fullData.Масштаб !== undefined) result.scale = fullData.Масштаб

  return result as Font
}

registerTypeRule("Font", "importFromEnterprise", importFontFromEnterprise)
