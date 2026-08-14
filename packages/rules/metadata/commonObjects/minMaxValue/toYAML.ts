import { taggedYAMLScalar, xmlAnomalyTagValue } from "@nkdk/runtime"
import type { ExportToYAMLFunctionNew } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { formatMinMaxXMLTypePayload, type MinMaxValueModel } from "./types"
import { getRuleMinMaxValueXsiType } from "./fromXML"

const exportMinMaxValueToYAML: ExportToYAMLFunctionNew = ({ rule, value }) => {
  const minMaxValue = value as MinMaxValueModel | undefined
  if (minMaxValue === undefined || typeof minMaxValue === "number") return minMaxValue
  const canonicalXsiType = getRuleMinMaxValueXsiType(rule) ?? "xs:decimal"
  const tag = minMaxValue.xsiType === canonicalXsiType ? "xml/value" : "xml/type"
  const payload = tag === "xml/value" ? minMaxValue.text : formatMinMaxXMLTypePayload(minMaxValue)
  return taggedYAMLScalar(tag, xmlAnomalyTagValue(tag, payload))
}

export const metadataPropertyRule000 = definePropertyTypeRule("MinMaxValue", "exportToYAML", exportMinMaxValueToYAML)
