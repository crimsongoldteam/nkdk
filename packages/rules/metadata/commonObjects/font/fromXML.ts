import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import * as SE from "../../systemEnumerations/types"
import { ConfigurationContext, isEmptyXmlElement, isXmlElementNode, xmlAttributeValue, type XmlElementNode } from "@nkdk/runtime"
import { importBooleanFromXML } from "../boolean/fromXML"
import { PrefixedFontsFromXML, type Font, type FontXML, type PrefixedFontsXML } from "./types"

export const importFontFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  xml: FontXML | XmlElementNode | undefined
): Font | undefined => {
  if (!xml) return undefined
  if (isXmlElementNode(xml) && isEmptyXmlElement(xml)) return undefined

  const attribute = <K extends keyof FontXML>(key: K): FontXML[K] | string | undefined =>
    isXmlElementNode(xml) ? xmlAttributeValue(xml, key.slice(1)) : xml[key]
  const result: Font = { kind: attribute("_kind") as SE.FontType }

  const xmlRef = attribute("_ref")
  if (xmlRef !== undefined) {
    result.ref = normalizeFontRefFromXML(result.kind, PrefixedFontsFromXML[xmlRef as PrefixedFontsXML] ?? xmlRef)
    if (isRawFontRefFromXML(result.kind, xmlRef)) result.rawRef = true
  }

  const faceName = attribute("_faceName")
  if (faceName !== undefined) result.faceName = faceName
  for (const key of ["height", "scale"] as const) {
    const value = attribute(`_${key}`)
    if (value !== undefined) result[key] = Number(value)
  }
  for (const key of ["bold", "italic", "underline", "strikeout"] as const) {
    const value = attribute(`_${key}`)
    if (value !== undefined) result[key] = importBooleanFromXML(_context, undefined,
      typeof value === "boolean" || value === "true" || value === "false" ? value : undefined)
  }

  return result
}

function normalizeFontRefFromXML(kind: SE.FontType, ref: string): string {
  if (kind === "StyleItem" && ref.startsWith("style:")) return ref.slice("style:".length)
  if (kind === "WindowsFont" && ref.startsWith("sys:")) return ref.slice("sys:".length)
  return ref
}

function isRawFontRefFromXML(kind: SE.FontType, ref: string): boolean {
  if (kind === "StyleItem") return !ref.startsWith("style:")
  if (kind === "WindowsFont") return !ref.startsWith("sys:")
  return false
}

export const metadataPropertyRule000 = definePropertyTypeRule("Font", "importFromXML", importFontFromXML)
