import type { ImportFromYAMLFunctionNew } from "@nkdk/runtime/rule-kit"
import { yamlScalarTagAt } from "@nkdk/runtime"
import { importI8nTextFromYAML } from "../../i8nText/fromYAML"
import { definePropertyTypeRule } from "../../../ruleRuntime"

const importDcsLocalStringTypeFromYAML: ImportFromYAMLFunctionNew = (params) => {
  const tag = typeof params.rule.yaml === "string"
    ? yamlScalarTagAt(params.yaml, params.rule.yaml)
    : undefined
  if (tag === "xml/string") {
    if (typeof params.value !== "string") {
      throw new TypeError("!xml/string поддерживает только строку")
    }
    return { kind: "xmlString", text: params.value }
  }
  return importI8nTextFromYAML(params)
}

export const metadataPropertyRule000 = definePropertyTypeRule(
  "DcsLocalStringType",
  "importFromYAML",
  importDcsLocalStringTypeFromYAML,
)
