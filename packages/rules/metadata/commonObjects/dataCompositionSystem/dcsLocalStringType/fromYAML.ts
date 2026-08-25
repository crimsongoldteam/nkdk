import type { ImportFromYAMLFunctionNew } from "@nkdk/runtime/rule-kit"
import { importI8nTextFromYAML } from "../../i8nText/fromYAML"
import { definePropertyTypeRule } from "../../../ruleRuntime"

const importDcsLocalStringTypeFromYAML: ImportFromYAMLFunctionNew = (params) => {
  return importI8nTextFromYAML(params)
}

export const metadataPropertyRule000 = definePropertyTypeRule(
  "DcsLocalStringType",
  "importFromYAML",
  importDcsLocalStringTypeFromYAML,
)
