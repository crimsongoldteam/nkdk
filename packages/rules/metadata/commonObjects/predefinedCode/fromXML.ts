import { ConfigurationContextFromXML, isXmlElementNode, xmlAttributeValue, xmlTextValue, type XmlElementNode } from "@nkdk/runtime"
import { PropertyRule, definePropertyTypeRule } from "../../ruleRuntime"
import { PredefinedCode } from "./types"

const TYPED_NUMERIC_XSI = new Set(["xs:decimal", "xs:integer", "xs:double", "xs:float"])

type PredefinedCodeXML = number | string | { "#text"?: number | string; "_xsi:type"?: string } | XmlElementNode | undefined

export const importPredefinedCodeFromXML = (
  _context: ConfigurationContextFromXML,
  _rule: PropertyRule,
  value: PredefinedCodeXML
): PredefinedCode | undefined => {
  if (value === undefined) return undefined

  if (typeof value === "object" && value !== null) {
    const text = isXmlElementNode(value) ? xmlTextValue(value) || undefined : value["#text"]
    const xsiType = isXmlElementNode(value) ? xmlAttributeValue(value, "xsi:type") : value["_xsi:type"]

    if (xsiType !== undefined && TYPED_NUMERIC_XSI.has(xsiType)) {
      if (text === undefined || text === "") return undefined
      return typeof text === "number" ? text : Number(text)
    }

    return text === undefined ? undefined : String(text)
  }

  return typeof value === "number" ? value : String(value)
}

export const metadataPropertyRule000 = definePropertyTypeRule("PredefinedCode", "importFromXML", importPredefinedCodeFromXML)
