import * as SE from "~/metadata/systemEnumerations/types"
import { Context } from "../../context/types"
import { Font, FontXML, PrefixedFontsFromXML } from "./types"

export const importFontFromXML = (_context: Context, xml: FontXML | undefined): Font | undefined => {
  if (!xml) return undefined

  const result: Font = {
    kind: xml._kind as SE.FontType,
  }

  if (xml._ref !== undefined) {
    result.ref = PrefixedFontsFromXML[xml._ref]
  }

  if (xml._faceName !== undefined) result.faceName = xml._faceName
  if (xml._scale !== undefined) result.scale = xml._scale
  if (xml._height !== undefined) result.height = xml._height
  if (xml._bold !== undefined) result.bold = xml._bold
  if (xml._italic !== undefined) result.italic = xml._italic
  if (xml._underline !== undefined) result.underline = xml._underline
  if (xml._strikeout !== undefined) result.strikeout = xml._strikeout

  return result
}
