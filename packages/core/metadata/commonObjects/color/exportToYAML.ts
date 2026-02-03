import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "../../context/types"
import { exportSystemEnumerationToYAML } from "../../systemEnumerations/exportToEnterprise"
import * as SE from "../../systemEnumerations/types"
import { Color } from "./types"

export const exportColorToYAML = <T extends Color | undefined>(
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  color: T
): string | undefined => {
  if (!color) return undefined

  if (color.type === "StyleItem") {
    const standardColor = exportSystemEnumerationToYAML(_context, undefined, color.value, SE.StyleColorsToEnterprise)
    if (standardColor) {
      return standardColor
    }
    // Для custom style colors возвращаем с префиксом "ЭлементСтиля."
    return `ЭлементСтиля.${color.value}`
  }

  if (color.type === "WindowsColor") {
    return exportSystemEnumerationToYAML(_context, undefined, color.value, SE.WindowsColorsToEnterprise)
  }

  if (color.type === "WebColor") {
    return exportSystemEnumerationToYAML(_context, undefined, color.value, SE.WebColorsToEnterprise)
  }

  return color.value
}
