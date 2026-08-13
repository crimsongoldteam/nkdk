import { taggedYAMLScalar, xmlScalarTagValue } from "@nkdk/runtime"
import type { ExportToYAMLFunctionNew } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { formatMinMaxXMLPayload, type MinMaxValueModel } from "./types"

const exportMinMaxValueToYAML: ExportToYAMLFunctionNew = ({ value }) => {
  const minMaxValue = value as MinMaxValueModel | undefined
  if (minMaxValue === undefined || typeof minMaxValue === "number") return minMaxValue
  return taggedYAMLScalar("xml", xmlScalarTagValue(formatMinMaxXMLPayload(minMaxValue)))
}

export const metadataPropertyRule000 = definePropertyTypeRule("MinMaxValue", "exportToYAML", exportMinMaxValueToYAML)
