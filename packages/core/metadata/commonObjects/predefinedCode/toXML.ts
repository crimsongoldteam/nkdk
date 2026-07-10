import { ConfigurationContextWithExportToXML } from "../../context/types"
import { PropertyRule, registerTypeRule } from "../../orchestration"
import { PredefinedCode } from "./types"

export const exportPredefinedCodeToXML = (
  _context: ConfigurationContextWithExportToXML,
  _rule: PropertyRule,
  value: PredefinedCode | undefined
): string | { "_xsi:type": "xs:decimal"; "#text": string } | undefined => {
  if (value === undefined) return undefined

  if (typeof value === "number") {
    return { "_xsi:type": "xs:decimal", "#text": String(value) }
  }

  return value
}

registerTypeRule("PredefinedCode", "exportToXML", exportPredefinedCodeToXML)
