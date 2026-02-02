import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import * as SE from "~/metadata/systemEnumerations/types"
import { ConfigurationContext } from "../../context/types"
import { importBooleanFromXML } from "../boolean/importFromXML"
import { Font, FontXML, PrefixedFontsFromXML } from "./types"

export const _importFontFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule,
  xml: FontXML | undefined
): Font | undefined => {
  if (!xml) return undefined

  const result: any = {}

  if (xml._ref !== undefined) {
    result.ref = PrefixedFontsFromXML[xml._ref]
  }

  if (xml._faceName) result.faceName = xml._faceName
  result.kind = xml._kind as SE.FontType
  if (xml._height !== undefined) result.height = Number(xml._height)
  if (xml._bold !== undefined) result.bold = importBooleanFromXML(_context, xml._bold)
  if (xml._italic !== undefined) result.italic = importBooleanFromXML(_context, xml._italic)
  if (xml._underline !== undefined) result.underline = importBooleanFromXML(_context, xml._underline)
  if (xml._strikeout !== undefined) result.strikeout = importBooleanFromXML(_context, xml._strikeout)
  if (xml._scale !== undefined) result.scale = Number(xml._scale)

  return result as Font
}
