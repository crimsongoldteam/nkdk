import type { ConfigurationContextFromXML } from "@nkdk/runtime"
import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import type { MinMaxValueModel, MinMaxValueXsiType } from "./types"

type MinMaxValueXML = number | string | { "#text"?: number | string; "_xsi:type"?: string } | undefined
type RuleWithTypedXML = PropertyRule & { typedXML?: unknown }

export const importMinMaxValueFromXML = (
  _context: ConfigurationContextFromXML,
  rule: PropertyRule | undefined,
  value: MinMaxValueXML,
): MinMaxValueModel | undefined => {
  const rawValue = getMinMaxValueText(value)
  if (rawValue === undefined || rawValue === "") return undefined

  const text = String(rawValue)
  const xsiType = typeof value === "object" && value !== null ? value["_xsi:type"] : undefined
  const number = Number(text.replace(",", "."))
  const canonicalXsiType = getRuleMinMaxValueXsiType(rule) ?? "xs:decimal"

  if (
    Number.isFinite(number) &&
    xsiType === canonicalXsiType &&
    text === formatCanonicalMinMaxValueText(number, canonicalXsiType)
  ) return number

  return { kind: "xml", ...(xsiType === undefined ? {} : { xsiType }), text }
}

function getMinMaxValueText(value: MinMaxValueXML): number | string | undefined {
  if (typeof value === "object" && value !== null) return value["#text"]
  return typeof value === "number" || typeof value === "string" ? value : undefined
}

export function getRuleMinMaxValueXsiType(rule: PropertyRule | undefined): MinMaxValueXsiType | undefined {
  const typedXML = (rule as RuleWithTypedXML | undefined)?.typedXML
  return typedXML === "xs:string" || typedXML === "xs:decimal" ? typedXML : undefined
}

export function formatCanonicalMinMaxValueText(value: number, xsiType: MinMaxValueXsiType): string {
  const text = String(value)
  return xsiType === "xs:string" && !Number.isInteger(value) ? text.replace(".", ",") : text
}

export const metadataPropertyRule000 = definePropertyTypeRule("MinMaxValue", "importFromXML", importMinMaxValueFromXML)
