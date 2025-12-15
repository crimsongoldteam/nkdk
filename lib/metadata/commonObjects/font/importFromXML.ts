import { Font, FontXML } from "./types"

export const importFontFromXML = (xml: FontXML | undefined): Font | undefined => {
  if (!xml) return undefined
  const result: Font = {
    ref: xml._ref,
    faceName: xml._faceName,
    scale: xml._scale,
    height: xml._height,
    bold: xml._bold,
    italic: xml._italic,
    underline: xml._underline,
    strikeout: xml._strikeout,
    kind: xml._kind,
  }
  return result
}
