import { TFont, TFontXML } from "./types"

export const importFontFromXML = (xml: TFontXML | undefined): TFont | undefined => {
  if (!xml) return undefined
  const result: TFont = {
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
