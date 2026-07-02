import type { PropertyRule } from "~/metadata/orchestration/property/types"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import { ConfigurationContext } from "../../context/types"

const TYPED_DECIMAL_XSI = new Set(["xs:decimal", "xs:integer", "xs:double", "xs:float"])

type NumberXML =
  | number
  | string
  | { "#text"?: number | string; "_xsi:type"?: string }
  | undefined

export const importNumberFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: NumberXML
): number | undefined => {
  if (value === undefined) return undefined

  if (typeof value === "object" && value !== null && "_xsi:type" in value) {
    const xsiType = value["_xsi:type"]
    if (xsiType !== undefined && TYPED_DECIMAL_XSI.has(xsiType)) {
      const text = "#text" in value ? value["#text"] : undefined
      if (text === undefined || text === "") return undefined
      return typeof text === "number" ? text : Number(text)
    }
  }

  const rawValue = typeof value === "object" && value !== null && "#text" in value ? value["#text"] : value

  if (rawValue === undefined || rawValue === "") return undefined

  return typeof rawValue === "number" ? rawValue : Number(rawValue)
}

registerTypeRule("number", "importFromXML", importNumberFromXML)
