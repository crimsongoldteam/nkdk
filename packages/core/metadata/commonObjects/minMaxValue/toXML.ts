import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { getMinMaxValueXsiType, MinMaxValueXsiType } from "./types"

type RuleWithTypedXML = PropertyRule & { typedXML?: unknown }

export const exportMinMaxValueToXML = (
  _context: ConfigurationContextWithExportToXML,
  rule: PropertyRule | undefined,
  value: number | Number | undefined,
  referenceValue?: unknown
): { "_xsi:type": MinMaxValueXsiType; "#text": string } | undefined => {
  if (value === undefined) return undefined
  const xsiType = getMinMaxValueXsiType(referenceValue) ?? getRuleMinMaxValueXsiType(rule) ?? "xs:decimal"

  return {
    "_xsi:type": xsiType,
    "#text": formatMinMaxValueText(value, xsiType),
  }
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
