import { ConfigurationContext } from "../../context/types"
import { ColorPreview } from "./types"

export const exportColorToPreview = (
  _context: ConfigurationContext,
  value: string | undefined,
  colorType: string
): ColorPreview | undefined => {
  if (!value) return undefined
  return {
    type: colorType,
    value: value,
  }
}
