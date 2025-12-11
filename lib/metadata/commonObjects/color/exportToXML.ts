import { Color, ColorXML } from "./types"

export const exportColorToXML = (color: Color | undefined): ColorXML | undefined => {
  if (!color) return undefined
  return color
}
