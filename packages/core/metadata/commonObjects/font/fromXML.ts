import { PropertyRule } from "~/metadata/orchestration/property/types"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import * as SE from "~/metadata/systemEnumerations/types"
import { ConfigurationContext } from "../../context/types"
import { importBooleanFromXML } from "../boolean/fromXML"
import { Font, FontXML, PrefixedFontsFromXML, PrefixedFontsXML } from "./types"

export const importFontFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  xml: FontXML | undefined
): Font | undefined => {
  if (!xml) return undefined

  const result: any = {}
  result.kind = xml._kind as SE.FontType

  if (xml._ref !== undefined) {
    result.ref = normalizeFontRefFromXML(result.kind, PrefixedFontsFromXML[xml._ref as PrefixedFontsXML] ?? xml._ref)
  }

  if (xml._faceName !== undefined) result.faceName = xml._faceName
  if (xml._height !== undefined) result.height = Number(xml._height)
  if (xml._bold !== undefined) result.bold = importBooleanFromXML(_context, undefined, xml._bold)
  if (xml._italic !== undefined) result.italic = importBooleanFromXML(_context, undefined, xml._italic)
  if (xml._underline !== undefined) result.underline = importBooleanFromXML(_context, undefined, xml._underline)
  if (xml._strikeout !== undefined) result.strikeout = importBooleanFromXML(_context, undefined, xml._strikeout)
  if (xml._scale !== undefined) result.scale = Number(xml._scale)

  return result as Font
}

function normalizeFontRefFromXML(kind: SE.FontType, ref: string): string {
  if (kind === "StyleItem" && ref.startsWith("style:")) return ref.slice("style:".length)
  if (kind === "WindowsFont" && ref.startsWith("sys:")) return ref.slice("sys:".length)
  return ref
}

registerTypeRule("Font", "importFromXML", importFontFromXML)
