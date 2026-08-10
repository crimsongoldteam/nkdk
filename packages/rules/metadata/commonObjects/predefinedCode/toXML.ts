import { ConfigurationContextWithExportToXML } from "@nkdk/runtime"
import { PropertyRule, definePropertyTypeRule } from "../../ruleRuntime"
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

export const metadataPropertyRule000 = definePropertyTypeRule("PredefinedCode", "exportToXML", exportPredefinedCodeToXML)
