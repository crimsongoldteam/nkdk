import * as SE from "~/metadata/systemEnumerations/types"
import { ConfigurationContext } from "../../context/types"
import { importOldBooleanFromXML } from "../boolean/_importFromXML"
import { Font, FontXML, PrefixedFontsFromXML } from "./types"

export const importFontFromXML = (_context: ConfigurationContext, xml: FontXML | undefined): Font | undefined => {
  if (!xml) return undefined

  const result: any = {}

  if (xml._ref !== undefined) {
    result.ref = PrefixedFontsFromXML[xml._ref]
  }

  if (xml._faceName) result.faceName = xml._faceName
  result.kind = xml._kind as SE.FontType
  if (xml._height !== undefined) result.height = Number(xml._height)
  if (xml._bold !== undefined) result.bold = importOldBooleanFromXML(_context, xml._bold)
  if (xml._italic !== undefined) result.italic = importOldBooleanFromXML(_context, xml._italic)
  if (xml._underline !== undefined) result.underline = importOldBooleanFromXML(_context, xml._underline)
  if (xml._strikeout !== undefined) result.strikeout = importOldBooleanFromXML(_context, xml._strikeout)
  if (xml._scale !== undefined) result.scale = Number(xml._scale)

  return result as Font
}
