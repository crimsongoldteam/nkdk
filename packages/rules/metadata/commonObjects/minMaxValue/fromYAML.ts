import { xmlScalarTagPayload, yamlScalarTagAt } from "@nkdk/runtime"
import type { ImportFromYAMLFunctionNew } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { parseMinMaxXMLPayload } from "./types"

const importMinMaxValueFromYAML: ImportFromYAMLFunctionNew = ({ rule, value, yaml }) => {
  if (yamlScalarTagAt(yaml, rule.yaml!) === "xml") {
    if (typeof value !== "string") throw new Error(`${rule.yaml}: после !xml ожидается строка`)
    return parseMinMaxXMLPayload(xmlScalarTagPayload(value))
  }
  if (value === undefined) return undefined
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${rule.yaml}: ожидается конечное число`)
  }
  return value
}

export const metadataPropertyRule000 = definePropertyTypeRule("MinMaxValue", "importFromYAML", importMinMaxValueFromYAML)
