import { ConfigurationContext } from "../../context/types"
import { Color, ColorPreview } from "./types"

export const exportColorToPreview = (
  _context: ConfigurationContext,
  color: Color | undefined
): ColorPreview | undefined => {
  if (!color) return undefined
  return {
    type: color.type,
    value: color.value,
  }
}
