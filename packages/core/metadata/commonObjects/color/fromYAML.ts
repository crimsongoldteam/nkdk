import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/types/factory"
import { ConfigurationContext } from "../../context/types"
import { importSystemEnumerationFromYAMLDeprecated } from "../../systemEnumerations/fromYAML"
import * as SE from "../../systemEnumerations/types"
import { Color, ColorYAML } from "./types"

export const importColorFromYAML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: ColorYAML | undefined
): Color | undefined => {
  if (!data) return undefined

  // Проверяем, является ли это custom style color (начинается с "ЭлементСтиля.")
  if (data.startsWith("ЭлементСтиля.")) {
    const customValue = data.substring("ЭлементСтиля.".length)
    return {
      type: "StyleItem",
      value: customValue,
    }
  }

  // Проверяем, является ли это стандартным цветом из стиля
  const styleColor = importSystemEnumerationFromYAMLDeprecated<SE.StyleColors>(
    _context,
    { type: "SystemEnumeration", typeSE: "StyleColors" },
    data
  )
  if (styleColor) {
    return {
      type: "StyleItem",
      value: styleColor,
    }
  }

  // Проверяем, является ли это Windows цветом
  const windowsColor = importSystemEnumerationFromYAMLDeprecated<SE.WindowsColors>(
    _context,
    { type: "SystemEnumeration", typeSE: "WindowsColors" },
    data
  )
  if (windowsColor) {
    return {
      type: "WindowsColor",
      value: windowsColor,
    }
  }

  // Проверяем, является ли это Web цветом
  const webColor = importSystemEnumerationFromYAMLDeprecated<SE.WebColors>(
    _context,
    { type: "SystemEnumeration", typeSE: "WebColors" },
    data
  )
  if (webColor) {
    return {
      type: "WebColor",
      value: webColor,
    }
  }

  // Если не распознан, считаем абсолютным цветом
  return {
    type: "Absolute",
    value: data,
  }
}

registerTypeRule("Color", "importFromYAML", importColorFromYAML)
