import { xmlAnomalyTagPayload, yamlScalarTagAt } from "@nkdk/runtime"
import type { ImportFromYAMLFunctionNew } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { parseMinMaxXMLTypePayload } from "./types"
import { getRuleMinMaxValueXsiType } from "./fromXML"

const importMinMaxValueFromYAML: ImportFromYAMLFunctionNew = ({ rule, value, yaml }) => {
  const tag = yamlScalarTagAt(yaml, rule.yaml!)
  if (tag === "xml/type" || tag === "xml/value") {
    if (typeof value !== "string") throw new Error(`${rule.yaml}: после !${tag} ожидается строка`)
    const payload = xmlAnomalyTagPayload(tag, value)
    if (tag === "xml/type") return parseMinMaxXMLTypePayload(payload)
    if (payload.length === 0) throw new Error(`${rule.yaml}: после !xml/value ожидается значение`)
    return {
      kind: "xml",
      xsiType: getRuleMinMaxValueXsiType(rule) ?? "xs:decimal",
      text: payload,
    }
  }
  if (value === undefined) return undefined
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${rule.yaml}: ожидается конечное число`)
  }
  return value
}

export const metadataPropertyRule000 = definePropertyTypeRule("MinMaxValue", "importFromYAML", importMinMaxValueFromYAML)
