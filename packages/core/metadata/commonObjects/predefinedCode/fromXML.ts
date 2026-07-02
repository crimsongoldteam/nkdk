import { ConfigurationContextFromXML } from "../../context/types"
import { PropertyRule, registerTypeRule } from "../../orchestration"
import { PredefinedCode } from "./types"

const TYPED_NUMERIC_XSI = new Set(["xs:decimal", "xs:integer", "xs:double", "xs:float"])

type PredefinedCodeXML = number | string | { "#text"?: number | string; "_xsi:type"?: string } | undefined

export const importPredefinedCodeFromXML = (
  _context: ConfigurationContextFromXML,
  _rule: PropertyRule,
  value: PredefinedCodeXML
): PredefinedCode | undefined => {
  if (value === undefined) return undefined

  if (typeof value === "object" && value !== null) {
    const text = value["#text"]
    const xsiType = value["_xsi:type"]

    if (xsiType !== undefined && TYPED_NUMERIC_XSI.has(xsiType)) {
      if (text === undefined || text === "") return undefined
      return typeof text === "number" ? text : Number(text)
    }

    return text === undefined ? undefined : String(text)
  }

  return typeof value === "number" ? value : String(value)
}

registerTypeRule("PredefinedCode", "importFromXML", importPredefinedCodeFromXML)
