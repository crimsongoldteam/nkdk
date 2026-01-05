import { Context } from "../../context/types"
import { Color, ColorTypeToPrefix, ColorXML } from "./types"

export const exportColorToXML = (_context: Context, color: Color | undefined): ColorXML | undefined => {
  if (!color) return undefined

  const prefix = ColorTypeToPrefix[color.type as keyof typeof ColorTypeToPrefix]
  if (prefix) {
    return `${prefix}:${color.value}`
  }

  return color.value
}
