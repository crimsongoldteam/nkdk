import { xmlScalarTagPayload, yamlScalarTagAt } from "@nkdk/runtime"
import type { ImportFromYAMLFunctionNew } from "@nkdk/runtime/rule-kit"
import { importI8nTextFromYAML } from "../../i8nText/fromYAML"
import { definePropertyTypeRule } from "../../../ruleRuntime"

const importDcsLocalStringTypeFromYAML: ImportFromYAMLFunctionNew = (params) => {
  if (yamlScalarTagAt(params.yaml, params.rule.yaml!) !== "xml") {
    return importI8nTextFromYAML(params)
  }
  if (typeof params.value !== "string") throw new Error(`${params.rule.yaml}: после !xml ожидается String`)
  const payload = xmlScalarTagPayload(params.value)
  if (payload === "String") return { kind: "xmlString", text: "" }
  if (payload.startsWith("String ")) return { kind: "xmlString", text: payload.slice("String ".length) }
  throw new Error(`${params.rule.yaml}: допустим только !xml String`)
}

export const metadataPropertyRule000 = definePropertyTypeRule(
  "DcsLocalStringType",
  "importFromYAML",
  importDcsLocalStringTypeFromYAML,
)
