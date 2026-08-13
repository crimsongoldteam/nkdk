import { taggedYAMLScalar, xmlScalarTagValue } from "@nkdk/runtime"
import type { ExportToYAMLFunctionNew } from "@nkdk/runtime/rule-kit"
import { exportI8nTextToYAML } from "../../i8nText/toYAML"
import { definePropertyTypeRule } from "../../../ruleRuntime"
import type { DcsLocalStringValue } from "./types"

const exportDcsLocalStringTypeToYAML: ExportToYAMLFunctionNew = (params) => {
  const value = params.value as DcsLocalStringValue | undefined
  if (value !== undefined && "kind" in value) {
    const payload = value.text.length === 0 ? "String" : `String ${value.text}`
    return taggedYAMLScalar("xml", xmlScalarTagValue(payload))
  }
  return exportI8nTextToYAML(params)
}

export const metadataPropertyRule000 = definePropertyTypeRule(
  "DcsLocalStringType",
  "exportToYAML",
  exportDcsLocalStringTypeToYAML,
)
