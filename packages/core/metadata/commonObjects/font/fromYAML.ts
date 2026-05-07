import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { importSystemEnumerationFromYAMLDeprecated } from "~/metadata/systemEnumerations/fromYAML"
import * as SE from "~/metadata/systemEnumerations/types"
import { ConfigurationContext } from "../../context/types"
import { importBooleanFromYAML } from "../boolean/fromYAML"
import { Font, FontFullYAML, FontYAML, isRawPrefixedFontRef } from "./types"

export const importFontFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  yaml: FontYAML | undefined
): Font | undefined => {
  if (yaml === undefined) return undefined

  // Если данные - строка (компактный формат)
  if (typeof yaml === "string") {
    const importedRef = importRefFromYAML(context, yaml)
    if (importedRef) return importedRef

    // Если не нашли в ref, значит это faceName
    return {
      faceName: yaml,
      kind: "Absolute",
    }
  }

  // Если данные - объект (полный формат)
  const fullData = yaml as FontFullYAML
  const result: any = {}

  // Конвертируем Вид в ref и kind
  if (fullData.Вид !== undefined) {
    const importedRef = importRefFromYAML(context, fullData.Вид)
    if (importedRef) {
      result.ref = importedRef.ref
      result.kind = importedRef.kind
    }
  } else {
    result.kind = "Absolute"
  }

  if (fullData.Имя !== undefined) result.faceName = fullData.Имя
  if (fullData.Размер !== undefined) result.height = fullData.Размер
  if (fullData.Полужирный !== undefined) result.bold = importBooleanFromYAML(context, undefined, fullData.Полужирный)
  if (fullData.Наклонный !== undefined) result.italic = importBooleanFromYAML(context, undefined, fullData.Наклонный)
  if (fullData.Подчеркивание !== undefined)
    result.underline = importBooleanFromYAML(context, undefined, fullData.Подчеркивание)
  if (fullData.Зачеркивание !== undefined)
    result.strikeout = importBooleanFromYAML(context, undefined, fullData.Зачеркивание)
  if (fullData.Масштаб !== undefined) result.scale = fullData.Масштаб

  return result as Font
}

const importRefFromYAML = (context: ConfigurationContext, value: string): Pick<Font, "ref" | "kind"> | undefined => {
  if (isRawPrefixedFontRef(value)) {
    return {
      ref: value,
      kind: value.startsWith("style:") ? "StyleItem" : "WindowsFont",
    }
  }

  const styleFontRef = importSystemEnumerationFromYAMLDeprecated<SE.StyleFonts>(
    context,
    { type: "SystemEnumeration", typeSE: "StyleFonts" },
    value
  )
  if (styleFontRef) {
    return {
      ref: styleFontRef,
      kind: "StyleItem",
    }
  }

  const windowsFontRef = importSystemEnumerationFromYAMLDeprecated<SE.WindowsFonts>(
    context,
    { type: "SystemEnumeration", typeSE: "WindowsFonts" },
    value
  )
  if (windowsFontRef) {
    return {
      ref: windowsFontRef,
      kind: "WindowsFont",
    }
  }

  return undefined
}

registerTypeRule("Font", "importFromYAML", importFontFromYAML)
