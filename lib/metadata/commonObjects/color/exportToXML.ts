import { TColor, TColorXML } from "./types"

export const exportColorToXML = (color: TColor | undefined): TColorXML | undefined => {
  if (!color) return undefined
  return color
}
