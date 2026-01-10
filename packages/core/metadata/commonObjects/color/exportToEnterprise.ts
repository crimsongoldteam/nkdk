import { ImportExportReturn } from "~/metadata/forms/elements/types"
import { ConfigurationContext } from "../../context/types"
import { exportSystemEnumerationToEnterprise } from "../../systemEnumerations/exportToEnterprise"
import * as SE from "../../systemEnumerations/types"
import { Color } from "./types"

export const exportColorToEnterprise = <T extends Color | undefined>(
  _context: ConfigurationContext,
  color: T
): ImportExportReturn<T, string> => {
  if (!color) return undefined as ImportExportReturn<T, string>

  if (color.type === "StyleItem") {
    const standardColor = exportSystemEnumerationToEnterprise(_context, color.value, SE.StyleColorsToEnterprise)
    if (standardColor) {
      return standardColor as ImportExportReturn<T, string>
    }
    // Для custom style colors возвращаем с префиксом "ЭлементСтиля."
    return `ЭлементСтиля.${color.value}` as ImportExportReturn<T, string>
  }

  if (color.type === "WindowsColor") {
    return exportSystemEnumerationToEnterprise(
      _context,
      color.value,
      SE.WindowsColorsToEnterprise
    ) as ImportExportReturn<T, string>
  }

  if (color.type === "WebColor") {
    return exportSystemEnumerationToEnterprise(_context, color.value, SE.WebColorsToEnterprise) as ImportExportReturn<
      T,
      string
    >
  }

  return color.value as ImportExportReturn<T, string>
}
