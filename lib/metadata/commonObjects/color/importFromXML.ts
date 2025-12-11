import { Color, ColorXML } from "./types"

export const importColorFromXML = (xml: ColorXML | undefined): Color | undefined => {
  if (!xml) return undefined
  return xml
}
