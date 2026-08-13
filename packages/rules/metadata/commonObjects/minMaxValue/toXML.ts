import type { ConfigurationContextWithExportToXML } from "@nkdk/runtime"
import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { formatCanonicalMinMaxValueText, getRuleMinMaxValueXsiType } from "./fromXML"
import type { MinMaxValueModel } from "./types"

export const exportMinMaxValueToXML = (
  _context: ConfigurationContextWithExportToXML,
  rule: PropertyRule | undefined,
  value: MinMaxValueModel | undefined,
): { "_xsi:type"?: string; "#text": string } | undefined => {
  if (value === undefined) return undefined
  if (typeof value !== "number") {
    return { ...(value.xsiType === undefined ? {} : { "_xsi:type": value.xsiType }), "#text": value.text }
  }

  const xsiType = getRuleMinMaxValueXsiType(rule) ?? "xs:decimal"
  return { "_xsi:type": xsiType, "#text": formatCanonicalMinMaxValueText(value, xsiType) }
}

export const metadataPropertyRule000 = definePropertyTypeRule("MinMaxValue", "exportToXML", exportMinMaxValueToXML)
