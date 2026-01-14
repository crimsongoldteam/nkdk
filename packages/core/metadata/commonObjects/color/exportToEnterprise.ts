import { ConfigurationContext } from "../../context/types"
import { exportSystemEnumerationToEnterprise } from "../../systemEnumerations/exportToEnterprise"
import * as SE from "../../systemEnumerations/types"
import { Color } from "./types"

export const exportColorToEnterprise = <T extends Color | undefined>(
  _context: ConfigurationContext,
  color: T
): string | undefined => {
  if (!color) return undefined

  if (color.type === "StyleItem") {
    const standardColor = exportSystemEnumerationToEnterprise(_context, color.value, SE.StyleColorsToEnterprise)
    if (standardColor) {
      return standardColor
    }
    // Для custom style colors возвращаем с префиксом "ЭлементСтиля."
    return `ЭлементСтиля.${color.value}`
  }

  if (color.type === "WindowsColor") {
    return exportSystemEnumerationToEnterprise(_context, color.value, SE.WindowsColorsToEnterprise)
  }

  if (color.type === "WebColor") {
    return exportSystemEnumerationToEnterprise(_context, color.value, SE.WebColorsToEnterprise)
  }

  return color.value
}
