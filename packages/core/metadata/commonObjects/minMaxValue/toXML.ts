import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { registerTypeRule } from "~/metadata/orchestration/property/typeRuleRegistry"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { getMinMaxValueXMLText, getMinMaxValueXsiType, MinMaxValueXsiType } from "./types"

type RuleWithTypedXML = PropertyRule & { typedXML?: unknown }

export const exportMinMaxValueToXML = (
  _context: ConfigurationContextWithExportToXML,
  rule: PropertyRule | undefined,
  value: number | Number | undefined,
  referenceValue?: unknown
): { "_xsi:type": MinMaxValueXsiType; "#text": string } | undefined => {
  if (value === undefined) return undefined
  const xsiType = getMinMaxValueXsiType(referenceValue) ?? getRuleMinMaxValueXsiType(rule) ?? "xs:decimal"
  const referenceXMLText = getUnchangedReferenceXMLText(value, referenceValue)

  return {
    "_xsi:type": xsiType,
    "#text": referenceXMLText ?? formatMinMaxValueText(value, xsiType),
  }
}

const getUnchangedReferenceXMLText = (
  value: number | Number,
  referenceValue: unknown
): string | undefined => {
  const currentNumber = Number(value)
  const referenceNumber = Number(referenceValue)

  if (currentNumber !== referenceNumber && !Object.is(currentNumber, referenceNumber)) return undefined

  return getMinMaxValueXMLText(referenceValue)
}

const formatMinMaxValueText = (value: number | Number, xsiType: MinMaxValueXsiType): string => {
  const text = String(value)
  return xsiType === "xs:string" && !Number.isInteger(Number(value)) ? text.replace(".", ",") : text
}

const getRuleMinMaxValueXsiType = (rule: PropertyRule | undefined): MinMaxValueXsiType | undefined => {
  const typedXML = (rule as RuleWithTypedXML | undefined)?.typedXML
  return typedXML === "xs:string" || typedXML === "xs:decimal" ? typedXML : undefined
}

registerTypeRule("MinMaxValue", "exportToXML", exportMinMaxValueToXML)
