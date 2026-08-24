import type { ImportFromYAMLFunctionNew } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"

const importMinMaxValueFromYAML: ImportFromYAMLFunctionNew = ({ rule, value }) => {
  if (value === undefined) return undefined
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${rule.yaml}: ожидается конечное число`)
  }
  return value
}

export const metadataPropertyRule000 = definePropertyTypeRule("MinMaxValue", "importFromYAML", importMinMaxValueFromYAML)
