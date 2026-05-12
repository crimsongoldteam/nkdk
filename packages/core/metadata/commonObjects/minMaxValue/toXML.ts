import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { getMinMaxValueXsiType } from "./types"

type MinMaxValueXsiType = "xs:string" | "xs:decimal"
type RuleWithTypedXML = PropertyRule & { typedXML?: unknown }

export const exportMinMaxValueToXML = (
  _context: ConfigurationContextWithExportToXML,
  rule: PropertyRule | undefined,
  value: number | Number | undefined,
  referenceValue?: unknown
): { "_xsi:type": MinMaxValueXsiType; "#text": string } | undefined => {
  if (value === undefined) return undefined

  return {
    "_xsi:type": getMinMaxValueXsiType(referenceValue) ?? getRuleMinMaxValueXsiType(rule) ?? "xs:decimal",
    "#text": String(value),
  }
}

const getRuleMinMaxValueXsiType = (rule: PropertyRule | undefined): MinMaxValueXsiType | undefined => {
  const typedXML = (rule as RuleWithTypedXML | undefined)?.typedXML
  return typedXML === "xs:string" || typedXML === "xs:decimal" ? typedXML : undefined
}

registerTypeRule("MinMaxValue", "exportToXML", exportMinMaxValueToXML)
