import { isXMLAnomalyTag, xmlAnomalyTagPayload, yamlScalarTagAt } from "@nkdk/runtime"
import type { ImportFromYAMLFunctionNew } from "@nkdk/runtime/rule-kit"
import { importI8nTextFromYAML } from "../../i8nText/fromYAML"
import { definePropertyTypeRule } from "../../../ruleRuntime"

const importDcsLocalStringTypeFromYAML: ImportFromYAMLFunctionNew = (params) => {
  const tag = yamlScalarTagAt(params.yaml, params.rule.yaml!)
  if (tag !== "xml/type") {
    if (isXMLAnomalyTag(tag)) throw new Error(`${params.rule.yaml}: допустим только !xml/type String`)
    return importI8nTextFromYAML(params)
  }
  if (typeof params.value !== "string") throw new Error(`${params.rule.yaml}: после !xml/type ожидается String`)
  const payload = xmlAnomalyTagPayload("xml/type", params.value)
  if (payload === "String") return { kind: "xmlString", text: "" }
  if (payload.startsWith("String ")) return { kind: "xmlString", text: payload.slice("String ".length) }
  throw new Error(`${params.rule.yaml}: допустим только !xml/type String`)
}

export const metadataPropertyRule000 = definePropertyTypeRule(
  "DcsLocalStringType",
  "importFromYAML",
  importDcsLocalStringTypeFromYAML,
)
