import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/typeRulesFactory"
import { ConfigurationContext } from "../../context/types"
import { importSystemEnumerationFromEnterprise } from "../../systemEnumerations/importFromEnterprise"
import * as SE from "../../systemEnumerations/types"
import { Color, ColorEnterprise } from "./types"

export const importColorFromEnterprise = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: ColorEnterprise | undefined
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
  const styleColor = importSystemEnumerationFromEnterprise<SE.StyleColors>(
    _context,
    undefined,
    data,
    SE.StyleColorsFromEnterprise
  )
  if (styleColor) {
    return {
      type: "StyleItem",
      value: styleColor,
    }
  }

  // Проверяем, является ли это Windows цветом
  const windowsColor = importSystemEnumerationFromEnterprise<SE.WindowsColors>(
    _context,
    undefined,
    data,
    SE.WindowsColorsFromEnterprise
  )
  if (windowsColor) {
    return {
      type: "WindowsColor",
      value: windowsColor,
    }
  }

  // Проверяем, является ли это Web цветом
  const webColor = importSystemEnumerationFromEnterprise<SE.WebColors>(
    _context,
    undefined,
    data,
    SE.WebColorsFromEnterprise
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

registerTypeRule("Color", "importFromEnterprise", importColorFromEnterprise)
