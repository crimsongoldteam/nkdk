import { Context } from "../../context/types"
import { Color, ColorXML } from "./types"

export const importColorFromXML = (_context: Context, xml: ColorXML | undefined): Color | undefined => {
  if (!xml) return undefined
  return xml
}
