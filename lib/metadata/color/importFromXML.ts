import { TColor, TColorXML } from "./types"

export const importColorFromXML = (xml: TColorXML | undefined): TColor | undefined => {
  if (!xml) return undefined
  return xml
}
