import type { ExportToYAMLFunctionNew } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import type { MinMaxValueModel } from "./types"

const exportMinMaxValueToYAML: ExportToYAMLFunctionNew = ({ value }) => {
  const minMaxValue = value as MinMaxValueModel | undefined
  if (minMaxValue === undefined || typeof minMaxValue === "number") return minMaxValue
  const parsed = Number(minMaxValue.text.replace(",", "."))
  return Number.isFinite(parsed) ? parsed : minMaxValue.text
}

export const metadataPropertyRule000 = definePropertyTypeRule("MinMaxValue", "exportToYAML", exportMinMaxValueToYAML)
