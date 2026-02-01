import { ConfigurationContext } from "../../context/types"
import { Color, ColorPreview } from "./types"

export const exportColorToPreview = (
  _context: ConfigurationContext,
  color: Color | undefined
): ColorPreview | undefined => {
  if (!color) return undefined

  const prefix = color.type === "WebColor" 
    ? "WebColors" 
    : color.type === "WindowsColor" 
      ? "WindowsColors" 
      : "StyleItems"

  return {
    Type: "Color",
    Value: `${prefix}.${color.value}`,
  }
}
