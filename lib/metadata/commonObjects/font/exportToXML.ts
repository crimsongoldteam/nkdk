import { Context } from "../../context/types"
import { Font, FontXML } from "./types"

export const exportFontToXML = (_configurationSettings: Context, font: Font | undefined): FontXML | undefined => {
  if (!font) return undefined
  const result: FontXML = {
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
