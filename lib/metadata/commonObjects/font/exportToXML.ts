import { TFont, TFontXML } from "./types"

export const exportFontToXML = (font: TFont | undefined): TFontXML | undefined => {
  if (!font) return undefined
  const result: TFontXML = {
    _ref: font.ref,
    _faceName: font.faceName,
    _scale: font.scale,
    _height: font.height,
    _bold: font.bold,
    _italic: font.italic,
    _underline: font.underline,
    _strikeout: font.strikeout,
    _kind: font.kind,
  }
  return result
}
