import { Context } from "../../context/types"
import { Color, ColorXML } from "./types"

export const exportColorToXML = (_context: Context, color: Color | undefined): ColorXML | undefined => {
  if (!color) return undefined
  return color
}
