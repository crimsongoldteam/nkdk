import { Context } from "../../context/types"
import { exportSystemEnumerationToEnterprise } from "../../systemEnumerations/exportToEnterprise"
import * as SE from "../../systemEnumerations/types"
import { Color } from "./types"

export const exportColorToEnterprise = (_context: Context, color: Color | undefined): string | undefined => {
  if (!color) return undefined

  if (color.type === "StyleItem") {
    return exportSystemEnumerationToEnterprise(_context, color.value, SE.StyleColorsToEnterprise)
  }

  if (color.type === "WindowsColor") {
    return exportSystemEnumerationToEnterprise(_context, color.value, SE.WindowsColorsToEnterprise)
  }

  if (color.type === "WebColor") {
    return exportSystemEnumerationToEnterprise(_context, color.value, SE.WebColorsToEnterprise)
  }

  return color.value
}
